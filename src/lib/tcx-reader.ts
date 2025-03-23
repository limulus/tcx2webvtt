import { XMLParser } from 'fast-xml-parser'

import { Sample, SampleKind, Coordinates } from './sample.js'

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

  public getSamples(): Sample<SampleKind>[] {
    const activities = this.xmlData?.TrainingCenterDatabase?.Activities?.Activity
    if (!activities) {
      return []
    }

    const allSamples: Sample<SampleKind>[] = []
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
                new Sample<SampleKind.Location>(
                  time,
                  SampleKind.Location,
                  coordinates
                ) as Sample<SampleKind>
              )
            }
          }

          // Create individual samples for each metric
          if (tp.DistanceMeters) {
            const distanceValue = parseFloat(tp.DistanceMeters)
            if (!isNaN(distanceValue)) {
              allSamples.push(
                new Sample<SampleKind.Distance>(time, SampleKind.Distance, distanceValue)
              )
            }
          }

          if (tp.Cadence) {
            const cadenceValue = parseInt(tp.Cadence, 10)
            if (!isNaN(cadenceValue)) {
              allSamples.push(
                new Sample<SampleKind.Cadence>(time, SampleKind.Cadence, cadenceValue)
              )
            }
          }

          if (tp.HeartRateBpm?.Value) {
            const hrValue = parseInt(tp.HeartRateBpm.Value, 10)
            if (!isNaN(hrValue)) {
              allSamples.push(
                new Sample<SampleKind.HeartRate>(time, SampleKind.HeartRate, hrValue)
              )
            }
          }

          // Parse watts from extensions if available
          if (tp.Extensions?.TPX?.Watts) {
            const wattsValue = tp.Extensions.TPX.Watts
            if (wattsValue !== undefined && wattsValue !== null && wattsValue !== '') {
              const watts = parseInt(String(wattsValue), 10)
              if (!isNaN(watts)) {
                allSamples.push(new Sample<SampleKind.Power>(time, SampleKind.Power, watts))
              }
            }
          }
        }
      }
    }

    return allSamples
  }
}
