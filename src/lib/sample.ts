export enum SampleMetric {
  HeartRate = 'heartRate',
  Distance = 'distance',
  Cadence = 'cadence',
  Power = 'power',
  Location = 'location',
}

export interface Coordinates {
  latitude: number
  longitude: number
  altitude?: number
}

export type SampleValue<T extends SampleMetric> = T extends SampleMetric.Location
  ? Coordinates
  : number

export class Sample<T extends SampleMetric = SampleMetric> {
  constructor(
    public readonly time: Date,
    public readonly metric: T,
    public readonly value: SampleValue<T>
  ) {}
}
