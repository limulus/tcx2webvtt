import { describe, it, expect } from 'vitest'

import { TCXReader, Sample, SampleKind } from './index.js'

describe('index', () => {
  it('should export TCXReader, Sample, and SampleKind with location support', () => {
    // Verify the exports exist
    expect(TCXReader).toBeDefined()
    expect(Sample).toBeDefined()
    expect(SampleKind).toBeDefined()

    // Verify the SampleKind enum values
    expect(SampleKind.HeartRate).toBe('heartRate')
    expect(SampleKind.Distance).toBe('distance')
    expect(SampleKind.Cadence).toBe('cadence')
    expect(SampleKind.Power).toBe('power')
    expect(SampleKind.Location).toBe('location')

    // Create a sample with location data to verify the type works
    const coords = { latitude: 47.6062, longitude: -122.3321 }
    const sample = new Sample(new Date(), SampleKind.Location, coords)

    expect(sample.kind).toBe(SampleKind.Location)
    expect(sample.value).toEqual(coords)
  })
})
