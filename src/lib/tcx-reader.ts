import { XMLParser } from 'fast-xml-parser'

export enum SampleKind {
  HeartRate = 'heartRate',
  Distance = 'distance',
  Cadence = 'cadence',
  Power = 'power',
}

export class Sample {
  constructor(
    public readonly time: Date,
    public readonly kind: SampleKind,
    public readonly value: number
  ) {}
}

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

  public getSamples(): Sample[] {
    const activities = this.xmlData?.TrainingCenterDatabase?.Activities?.Activity
    if (!activities) {
      return []
    }

    const allSamples: Sample[] = []
    for (const activity of activities) {
      if (!activity.Lap) continue

      const laps = activity.Lap
      for (const lap of laps) {
        if (!lap?.Track?.Trackpoint) continue

        const trackpoints = lap.Track.Trackpoint
        for (const tp of trackpoints) {
          const time = new Date(tp.Time)

          // Create individual samples for each metric
          if (tp.DistanceMeters) {
            const distanceValue = parseFloat(tp.DistanceMeters)
            if (!isNaN(distanceValue)) {
              allSamples.push(new Sample(time, SampleKind.Distance, distanceValue))
            }
          }

          if (tp.Cadence) {
            const cadenceValue = parseInt(tp.Cadence, 10)
            if (!isNaN(cadenceValue)) {
              allSamples.push(new Sample(time, SampleKind.Cadence, cadenceValue))
            }
          }

          if (tp.HeartRateBpm?.Value) {
            const hrValue = parseInt(tp.HeartRateBpm.Value, 10)
            if (!isNaN(hrValue)) {
              allSamples.push(new Sample(time, SampleKind.HeartRate, hrValue))
            }
          }

          // Parse watts from extensions if available
          if (tp.Extensions?.TPX?.Watts) {
            const wattsValue = tp.Extensions.TPX.Watts
            if (wattsValue !== undefined && wattsValue !== null && wattsValue !== '') {
              const watts = parseInt(String(wattsValue), 10)
              if (!isNaN(watts)) {
                allSamples.push(new Sample(time, SampleKind.Power, watts))
              }
            }
          }
        }
      }
    }

    return allSamples
  }
}
