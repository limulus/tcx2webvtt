import { describe, it, expect } from 'vitest'

import { Sample, SampleMetric } from './sample.js'
import { SequentialCueGenerator } from './sequential-cue-generator.js'

describe('SequentialCueGenerator', () => {
  describe('generateCues', () => {
    it('should return empty array when no samples provided', () => {
      const generator = new SequentialCueGenerator()
      const cues = generator.generateCues([])
      expect(cues).toEqual([])
    })

    it('should generate sequential cues with default 1-second duration', () => {
      const samples = [
        new Sample(new Date('2025-01-01T10:00:00Z'), SampleMetric.HeartRate, 120),
        new Sample(new Date('2025-01-01T10:00:01Z'), SampleMetric.HeartRate, 125),
        new Sample(new Date('2025-01-01T10:00:02Z'), SampleMetric.HeartRate, 130),
      ]

      const generator = new SequentialCueGenerator()
      const cues = generator.generateCues(samples)

      expect(cues).toHaveLength(3)

      // First cue: 0-1s
      expect(cues[0].startTime).toBe(0)
      expect(cues[0].endTime).toBe(1000)
      expect(cues[0].samples).toHaveLength(1)
      expect(cues[0].samples[0].value).toBe(120)

      // Second cue: 1-2s
      expect(cues[1].startTime).toBe(1000)
      expect(cues[1].endTime).toBe(2000)
      expect(cues[1].samples).toHaveLength(1)
      expect(cues[1].samples[0].value).toBe(125)

      // Third cue: 2-3s
      expect(cues[2].startTime).toBe(2000)
      expect(cues[2].endTime).toBe(3000)
      expect(cues[2].samples).toHaveLength(1)
      expect(cues[2].samples[0].value).toBe(130)
    })

    it('should generate sequential cues with custom duration', () => {
      const samples = [
        new Sample(new Date('2025-01-01T10:00:00Z'), SampleMetric.HeartRate, 120),
        new Sample(new Date('2025-01-01T10:00:01Z'), SampleMetric.HeartRate, 125),
      ]

      const generator = new SequentialCueGenerator()
      const cues = generator.generateCues(samples, 2500) // 2.5 second duration

      expect(cues).toHaveLength(2)

      // First cue: 0-2.5s
      expect(cues[0].startTime).toBe(0)
      expect(cues[0].endTime).toBe(2500)

      // Second cue: 2.5-5s
      expect(cues[1].startTime).toBe(2500)
      expect(cues[1].endTime).toBe(5000)
    })

    it('should handle negative duration by using absolute value', () => {
      const samples = [
        new Sample(new Date('2025-01-01T10:00:00Z'), SampleMetric.HeartRate, 120),
      ]

      const generator = new SequentialCueGenerator()
      const cues = generator.generateCues(samples, -1500) // negative duration

      expect(cues).toHaveLength(1)
      expect(cues[0].startTime).toBe(0)
      expect(cues[0].endTime).toBe(1500) // Should use absolute value
    })

    it('should handle single sample', () => {
      const samples = [
        new Sample(new Date('2025-01-01T10:00:00Z'), SampleMetric.Power, 250),
      ]

      const generator = new SequentialCueGenerator()
      const cues = generator.generateCues(samples)

      expect(cues).toHaveLength(1)
      expect(cues[0].startTime).toBe(0)
      expect(cues[0].endTime).toBe(1000)
      expect(cues[0].samples).toHaveLength(1)
      expect(cues[0].samples[0].metric).toBe(SampleMetric.Power)
      expect(cues[0].samples[0].value).toBe(250)
    })
  })
})
