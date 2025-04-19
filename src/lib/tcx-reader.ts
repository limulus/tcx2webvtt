import { XMLParser } from 'fast-xml-parser'

import { Sample, SampleMetric, Coordinates } from './sample.js'

export class TCXReader {
  private readonly parser: XMLParser
  private readonly xmlData: any

  constructor(tcxContent: string) {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      isArray: (name) => name === 'Trackpoint' || name === 'Activity' || name === 'Lap',
    })
    this.xmlData = this.parser.parse(tcxContent)
  }

  public getSamples(): Sample<SampleMetric>[] {
    const activities = this.xmlData?.TrainingCenterDatabase?.Activities?.Activity
    if (!activities) {
      return []
    }

    const allSamples: Sample<SampleMetric>[] = []
    for (const activity of activities) {
      if (!activity.Lap) continue

      const laps = activity.Lap
      for (const lap of laps) {
        if (!lap?.Track?.Trackpoint) continue

        const trackpoints = lap.Track.Trackpoint
        for (const tp of trackpoints) {
          const time = new Date(tp.Time)

          // Extract coordinates if present
          if (tp.Position?.LatitudeDegrees && tp.Position?.LongitudeDegrees) {
            const latitude = parseFloat(tp.Position.LatitudeDegrees)
            const longitude = parseFloat(tp.Position.LongitudeDegrees)

            if (!isNaN(latitude) && !isNaN(longitude)) {
              const coordinates: Coordinates = {
                latitude,
                longitude,
              }

              // Add altitude if available
              if (tp.AltitudeMeters) {
                const altitude = parseFloat(tp.AltitudeMeters)
                if (!isNaN(altitude)) {
                  coordinates.altitude = altitude
                }
              }

              // Create a location sample with coordinates as the value
              allSamples.push(
                new Sample<SampleMetric.Location>(
                  time,
                  SampleMetric.Location,
                  coordinates
                ) as Sample<SampleMetric>
              )
            }
          }

          // Create individual samples for each metric
          if (tp.DistanceMeters) {
            const distanceValue = parseFloat(tp.DistanceMeters)
            if (!isNaN(distanceValue)) {
              allSamples.push(
                new Sample<SampleMetric.Distance>(
                  time,
                  SampleMetric.Distance,
                  distanceValue
                )
              )
            }
          }

          if (tp.Cadence) {
            const cadenceValue = parseInt(tp.Cadence, 10)
            if (!isNaN(cadenceValue)) {
              allSamples.push(
                new Sample<SampleMetric.Cadence>(time, SampleMetric.Cadence, cadenceValue)
              )
            }
          }

          if (tp.HeartRateBpm?.Value) {
            const hrValue = parseInt(tp.HeartRateBpm.Value, 10)
            if (!isNaN(hrValue)) {
              allSamples.push(
                new Sample<SampleMetric.HeartRate>(time, SampleMetric.HeartRate, hrValue)
              )
            }
          }

          // Parse watts from extensions if available
          if (tp.Extensions?.TPX?.Watts) {
            const wattsValue = tp.Extensions.TPX.Watts
            if (wattsValue !== undefined && wattsValue !== null && wattsValue !== '') {
              const watts = parseInt(String(wattsValue), 10)
              if (!isNaN(watts)) {
                allSamples.push(
                  new Sample<SampleMetric.Power>(time, SampleMetric.Power, watts)
                )
              }
            }
          }
        }
      }
    }

    return allSamples
  }
}
