import { describe, it, expect } from 'vitest'

import { TCXReader, Sample, SampleKind } from './index.js'

describe('index', () => {
  it('should export TCXReader, Sample, and SampleKind', () => {
    // Verify the exports exist
    expect(TCXReader).toBeDefined()
    expect(Sample).toBeDefined()
    expect(SampleKind).toBeDefined()

    // Verify the SampleKind enum values
    expect(SampleKind.HeartRate).toBe('heartRate')
    expect(SampleKind.Distance).toBe('distance')
    expect(SampleKind.Cadence).toBe('cadence')
    expect(SampleKind.Power).toBe('power')
  })
})
