import { describe, it, expect } from 'vitest'

import { TCXReader, Sample, SampleMetric, SequentialCueGenerator } from './index.js'

describe('index', () => {
  it('should export TCXReader, Sample, and SampleKind with location support', () => {
    // Verify the exports exist
    expect(TCXReader).toBeDefined()
    expect(Sample).toBeDefined()
    expect(SampleMetric).toBeDefined()
    expect(SequentialCueGenerator).toBeDefined()

    // Verify the SampleKind enum values
    expect(SampleMetric.HeartRate).toBe('heartRate')
    expect(SampleMetric.Distance).toBe('distance')
    expect(SampleMetric.Cadence).toBe('cadence')
    expect(SampleMetric.Power).toBe('power')
    expect(SampleMetric.Location).toBe('location')

    // Create a sample with location data to verify the type works
    const coords = { latitude: 47.6062, longitude: -122.3321 }
    const sample = new Sample(new Date(), SampleMetric.Location, coords)

    expect(sample.metric).toBe(SampleMetric.Location)
    expect(sample.value).toEqual(coords)
  })
})
