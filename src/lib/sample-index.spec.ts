import { describe, it, expect } from 'vitest'

import { SampleIndex } from './sample-index.js'
import { Sample, SampleMetric } from './sample.js'

describe('SampleIndex', () => {
  describe('getSamplesInRange', () => {
    it('should return only samples within the specified time range in chronological order', () => {
      const index = new SampleIndex()

      // Create samples at different times
      const samples = [
        new Sample(new Date('2023-01-01T10:00:00Z'), SampleMetric.HeartRate, 120),
        new Sample(new Date('2023-01-01T10:01:00Z'), SampleMetric.HeartRate, 125),
        new Sample(new Date('2023-01-01T10:02:00Z'), SampleMetric.Distance, 100),
        new Sample(new Date('2023-01-01T10:03:00Z'), SampleMetric.HeartRate, 130),
        new Sample(new Date('2023-01-01T10:04:00Z'), SampleMetric.Cadence, 90),
        new Sample(new Date('2023-01-01T10:05:00Z'), SampleMetric.HeartRate, 135),
      ]

      // Add samples to index
      index.addSamples(samples)

      // Query for samples between 10:01:30 and 10:04:30
      const startTime = new Date('2023-01-01T10:01:30Z')
      const endTime = new Date('2023-01-01T10:04:30Z')
      const result = index.getSamplesInRange(startTime, endTime)

      // Should return samples at 10:02, 10:03, and 10:04 (3 samples)
      expect(result).toHaveLength(3)

      // Verify correct samples are returned
      expect(result[0].time).toEqual(new Date('2023-01-01T10:02:00Z'))
      expect(result[0].metric).toBe(SampleMetric.Distance)
      expect(result[0].value).toBe(100)

      expect(result[1].time).toEqual(new Date('2023-01-01T10:03:00Z'))
      expect(result[1].metric).toBe(SampleMetric.HeartRate)
      expect(result[1].value).toBe(130)

      expect(result[2].time).toEqual(new Date('2023-01-01T10:04:00Z'))
      expect(result[2].metric).toBe(SampleMetric.Cadence)
      expect(result[2].value).toBe(90)

      // Verify samples are in chronological order
      for (let i = 1; i < result.length; i++) {
        expect(result[i].time.getTime()).toBeGreaterThan(result[i - 1].time.getTime())
      }
    })

    it('should return empty array when no samples exist in the range', () => {
      const index = new SampleIndex()

      const samples = [
        new Sample(new Date('2023-01-01T10:00:00Z'), SampleMetric.HeartRate, 120),
        new Sample(new Date('2023-01-01T10:05:00Z'), SampleMetric.HeartRate, 135),
      ]

      index.addSamples(samples)

      // Query for range with no samples
      const startTime = new Date('2023-01-01T10:02:00Z')
      const endTime = new Date('2023-01-01T10:04:00Z')
      const result = index.getSamplesInRange(startTime, endTime)

      expect(result).toHaveLength(0)
    })

    it('should handle samples from multiple addSamples calls in chronological order', () => {
      const index = new SampleIndex()

      // Add first batch of samples
      const batch1 = [
        new Sample(new Date('2023-01-01T10:00:00Z'), SampleMetric.HeartRate, 120),
        new Sample(new Date('2023-01-01T10:02:00Z'), SampleMetric.HeartRate, 130),
      ]
      index.addSamples(batch1)

      // Add second batch of samples (with overlapping times)
      const batch2 = [
        new Sample(new Date('2023-01-01T10:01:00Z'), SampleMetric.Distance, 50),
        new Sample(new Date('2023-01-01T10:03:00Z'), SampleMetric.Distance, 150),
      ]
      index.addSamples(batch2)

      // Query for all samples
      const startTime = new Date('2023-01-01T09:59:00Z')
      const endTime = new Date('2023-01-01T10:04:00Z')
      const result = index.getSamplesInRange(startTime, endTime)

      // Should return all 4 samples in chronological order
      expect(result).toHaveLength(4)
      expect(result[0].time).toEqual(new Date('2023-01-01T10:00:00Z'))
      expect(result[1].time).toEqual(new Date('2023-01-01T10:01:00Z'))
      expect(result[2].time).toEqual(new Date('2023-01-01T10:02:00Z'))
      expect(result[3].time).toEqual(new Date('2023-01-01T10:03:00Z'))
    })
  })

  describe('getAllSamples', () => {
    it('should return all samples in chronological order', () => {
      const index = new SampleIndex()

      const samples = [
        new Sample(new Date('2023-01-01T10:02:00Z'), SampleMetric.Distance, 100),
        new Sample(new Date('2023-01-01T10:00:00Z'), SampleMetric.HeartRate, 120),
        new Sample(new Date('2023-01-01T10:04:00Z'), SampleMetric.Cadence, 90),
        new Sample(new Date('2023-01-01T10:01:00Z'), SampleMetric.HeartRate, 125),
      ]

      index.addSamples(samples)

      const result = index.getAllSamples()

      expect(result).toHaveLength(4)

      // Verify samples are in chronological order
      expect(result[0].time).toEqual(new Date('2023-01-01T10:00:00Z'))
      expect(result[0].metric).toBe(SampleMetric.HeartRate)
      expect(result[0].value).toBe(120)

      expect(result[1].time).toEqual(new Date('2023-01-01T10:01:00Z'))
      expect(result[1].metric).toBe(SampleMetric.HeartRate)
      expect(result[1].value).toBe(125)

      expect(result[2].time).toEqual(new Date('2023-01-01T10:02:00Z'))
      expect(result[2].metric).toBe(SampleMetric.Distance)
      expect(result[2].value).toBe(100)

      expect(result[3].time).toEqual(new Date('2023-01-01T10:04:00Z'))
      expect(result[3].metric).toBe(SampleMetric.Cadence)
      expect(result[3].value).toBe(90)
    })

    it('should return empty array when no samples have been added', () => {
      const index = new SampleIndex()

      const result = index.getAllSamples()

      expect(result).toHaveLength(0)
    })
  })
})
