export enum SampleKind {
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

export type SampleValue<T extends SampleKind> = T extends SampleKind.Location
  ? Coordinates
  : number

export class Sample<T extends SampleKind = SampleKind> {
  constructor(
    public readonly time: Date,
    public readonly kind: T,
    public readonly value: SampleValue<T>
  ) {}
}
