import { describe, it, expect, beforeEach } from 'vitest'

import { Clip } from './clip.js'
import { Cue } from './cue.js'
import { SampleIndex } from './sample-index.js'
import { Sample, SampleMetric } from './sample.js'
import { TimelineMapper } from './timeline-mapper.js'

describe('TimelineMapper', () => {
  let sampleIndex: SampleIndex

  beforeEach(() => {
    sampleIndex = new SampleIndex()
  })

  describe('constructor', () => {
    it('should accept a SampleIndex and array of Clips', () => {
      const clips = [new Clip(new Date(), new Date(), 1000, 0)]
      const mapper = new TimelineMapper({ sampleIndex, clips })
      expect(mapper).toBeInstanceOf(TimelineMapper)
    })

    it('should accept a SampleIndex, array of Clips, and options', () => {
      const clips = [new Clip(new Date(), new Date(), 1000, 0)]
      const options = { defaultCueDurationMs: 1000 }
      const mapper = new TimelineMapper({ sampleIndex, clips, options })
      expect(mapper).toBeInstanceOf(TimelineMapper)
    })

    it('should use default cue duration of 1000ms when no options provided', () => {
      const clips = [new Clip(new Date(), new Date(), 1000, 0)]
      const mapper = new TimelineMapper({ sampleIndex, clips })
      expect(mapper).toBeInstanceOf(TimelineMapper)
      // Default behavior will be tested implicitly by other tests expecting 1s cues
    })
  })

  describe('getCues', () => {
    it('should return empty array when no clips provided', () => {
      const mapper = new TimelineMapper({ sampleIndex, clips: [] })
      const cues = mapper.getCues()
      expect(cues).toEqual([])
    })

    it('should return empty array when SampleIndex has no samples', () => {
      const captureStart = new Date('2025-01-01T10:00:00Z')
      const captureEnd = new Date('2025-01-01T10:00:15Z')
      const clips = [new Clip(captureStart, captureEnd, 15000, 0)]

      const mapper = new TimelineMapper({ sampleIndex, clips })
      const cues = mapper.getCues()
      expect(cues).toEqual([])
    })

    it('should create multiple 1-second cues for a single clip with matching samples', () => {
      // Setup: Create samples across a 3-second clip
      const captureStart = new Date('2025-01-01T10:00:00Z')
      const captureEnd = new Date('2025-01-01T10:00:03Z')

      const samples = [
        new Sample(new Date('2025-01-01T10:00:00.5Z'), SampleMetric.HeartRate, 120),
        new Sample(new Date('2025-01-01T10:00:01.5Z'), SampleMetric.HeartRate, 125),
        new Sample(new Date('2025-01-01T10:00:02.5Z'), SampleMetric.HeartRate, 130),
      ]
      sampleIndex.addSamples(samples)

      const clips = [new Clip(captureStart, captureEnd, 3000, 0)] // 3s clip at offset 0
      const mapper = new TimelineMapper({ sampleIndex, clips })

      const cues = mapper.getCues()

      expect(cues).toHaveLength(3) // 3 one-second cues

      // First cue: 0-1s, contains sample at 0.5s
      expect(cues[0]).toBeInstanceOf(Cue)
      expect(cues[0].startTime).toBe(0)
      expect(cues[0].endTime).toBe(1000)
      expect(cues[0].samples).toHaveLength(1)
      expect(cues[0].samples[0].value).toBe(120)

      // Second cue: 1-2s, contains sample at 1.5s
      expect(cues[1].startTime).toBe(1000)
      expect(cues[1].endTime).toBe(2000)
      expect(cues[1].samples).toHaveLength(1)
      expect(cues[1].samples[0].value).toBe(125)

      // Third cue: 2-3s, contains sample at 2.5s
      expect(cues[2].startTime).toBe(2000)
      expect(cues[2].endTime).toBe(3000)
      expect(cues[2].samples).toHaveLength(1)
      expect(cues[2].samples[0].value).toBe(130)
    })

    it('should create multiple cues for multiple clips', () => {
      // Setup: Create samples across different time ranges
      const samples = [
        // First time range: 10:00:05 (5s into first clip)
        new Sample(new Date('2025-01-01T10:00:05Z'), SampleMetric.HeartRate, 120),
        // Second time range: 10:05:02 (2s into second clip)
        new Sample(new Date('2025-01-01T10:05:02Z'), SampleMetric.HeartRate, 130),
      ]
      sampleIndex.addSamples(samples)

      const clips = [
        new Clip(
          new Date('2025-01-01T10:00:00Z'),
          new Date('2025-01-01T10:00:06Z'), // 6s clip
          6000,
          0
        ),
        new Clip(
          new Date('2025-01-01T10:05:00Z'),
          new Date('2025-01-01T10:05:03Z'), // 3s clip
          3000,
          10000 // starts at 10s on video timeline
        ),
      ]

      const mapper = new TimelineMapper({ sampleIndex, clips })
      const cues = mapper.getCues()

      expect(cues).toHaveLength(2)

      // First cue from first clip (5-6s interval contains sample at 5s)
      expect(cues[0].startTime).toBe(5000)
      expect(cues[0].endTime).toBe(6000)
      expect(cues[0].samples).toHaveLength(1)
      expect(cues[0].samples[0].value).toBe(120)

      // Second cue from second clip (12-13s interval contains sample at 2s into clip)
      expect(cues[1].startTime).toBe(12000) // 10000 + 2000
      expect(cues[1].endTime).toBe(13000)
      expect(cues[1].samples).toHaveLength(1)
      expect(cues[1].samples[0].value).toBe(130)
    })

    it('should skip cue intervals that have no matching samples', () => {
      // Setup: Create samples only in first and third seconds of a 3-second clip
      const captureStart = new Date('2025-01-01T10:00:00Z')
      const captureEnd = new Date('2025-01-01T10:00:03Z')

      const samples = [
        new Sample(new Date('2025-01-01T10:00:00.5Z'), SampleMetric.HeartRate, 120), // First second
        new Sample(new Date('2025-01-01T10:00:02.5Z'), SampleMetric.HeartRate, 130), // Third second
      ]
      sampleIndex.addSamples(samples)

      const clips = [new Clip(captureStart, captureEnd, 3000, 0)]
      const mapper = new TimelineMapper({ sampleIndex, clips })
      const cues = mapper.getCues()

      // Should only create cues for intervals with samples (skip empty second)
      expect(cues).toHaveLength(2)
      expect(cues[0].startTime).toBe(0) // First second
      expect(cues[0].endTime).toBe(1000)
      expect(cues[0].samples).toHaveLength(1)
      expect(cues[0].samples[0].value).toBe(120)

      expect(cues[1].startTime).toBe(2000) // Third second (skip empty second)
      expect(cues[1].endTime).toBe(3000)
      expect(cues[1].samples).toHaveLength(1)
      expect(cues[1].samples[0].value).toBe(130)
    })

    it('should handle clips in non-chronological order', () => {
      const samples = [
        new Sample(new Date('2025-01-01T10:00:05Z'), SampleMetric.HeartRate, 120),
        new Sample(new Date('2025-01-01T10:05:05Z'), SampleMetric.HeartRate, 130),
      ]
      sampleIndex.addSamples(samples)

      // Clips provided in reverse chronological order
      const clips = [
        new Clip(
          new Date('2025-01-01T10:05:00Z'),
          new Date('2025-01-01T10:05:06Z'), // 6s clip
          6000,
          20000
        ), // Later clip
        new Clip(
          new Date('2025-01-01T10:00:00Z'),
          new Date('2025-01-01T10:00:06Z'), // 6s clip
          6000,
          0
        ), // Earlier clip
      ]

      const mapper = new TimelineMapper({ sampleIndex, clips })
      const cues = mapper.getCues()

      expect(cues).toHaveLength(2)

      // Should preserve the order of clips as provided
      expect(cues[0].startTime).toBe(25000) // First clip: 20000 + 5000 (sample at 5s into clip)
      expect(cues[1].startTime).toBe(5000) // Second clip: 0 + 5000 (sample at 5s into clip)
    })

    it('should correctly filter samples using exact time boundaries', () => {
      const captureStart = new Date('2025-01-01T10:00:00Z')
      const captureEnd = new Date('2025-01-01T10:00:10Z')

      const samples = [
        new Sample(new Date('2025-01-01T09:59:59Z'), SampleMetric.HeartRate, 110), // Before range
        new Sample(new Date('2025-01-01T10:00:00Z'), SampleMetric.HeartRate, 120), // At start (inclusive)
        new Sample(new Date('2025-01-01T10:00:05Z'), SampleMetric.HeartRate, 125), // In range
        new Sample(new Date('2025-01-01T10:00:10Z'), SampleMetric.HeartRate, 130), // At end (exclusive)
        new Sample(new Date('2025-01-01T10:00:11Z'), SampleMetric.HeartRate, 135), // After range
      ]
      sampleIndex.addSamples(samples)

      const clips = [new Clip(captureStart, captureEnd, 10000, 0)]
      const mapper = new TimelineMapper({ sampleIndex, clips })
      const cues = mapper.getCues()

      expect(cues).toHaveLength(2) // Two cues: 0-1s and 5-6s

      // First cue: 0-1s, contains sample at start
      expect(cues[0].startTime).toBe(0)
      expect(cues[0].endTime).toBe(1000)
      expect(cues[0].samples).toHaveLength(1)
      expect(cues[0].samples[0].value).toBe(120) // At start

      // Second cue: 5-6s, contains sample at 5s
      expect(cues[1].startTime).toBe(5000)
      expect(cues[1].endTime).toBe(6000)
      expect(cues[1].samples).toHaveLength(1)
      expect(cues[1].samples[0].value).toBe(125) // In range
    })

    it('should handle different sample types', () => {
      const captureStart = new Date('2025-01-01T10:00:00Z')
      const captureEnd = new Date('2025-01-01T10:00:15Z')

      const samples = [
        new Sample(new Date('2025-01-01T10:00:05Z'), SampleMetric.HeartRate, 120),
        new Sample(new Date('2025-01-01T10:00:06Z'), SampleMetric.Distance, 1500),
        new Sample(new Date('2025-01-01T10:00:07Z'), SampleMetric.Cadence, 85),
        new Sample(new Date('2025-01-01T10:00:08Z'), SampleMetric.Power, 250),
        new Sample(new Date('2025-01-01T10:00:09Z'), SampleMetric.Location, {
          latitude: 32.4,
          longitude: -117.2,
        }),
      ]
      sampleIndex.addSamples(samples)

      const clips = [new Clip(captureStart, captureEnd, 15000, 0)]
      const mapper = new TimelineMapper({ sampleIndex, clips })
      const cues = mapper.getCues()

      expect(cues).toHaveLength(5) // One cue for each second that has samples

      // Collect all samples across all cues
      const allSamples = cues.flatMap((cue) => cue.samples)
      expect(allSamples).toHaveLength(5)

      // Verify all different sample types are included
      const metrics = allSamples.map((s: Sample) => s.metric)
      expect(metrics).toContain(SampleMetric.HeartRate)
      expect(metrics).toContain(SampleMetric.Distance)
      expect(metrics).toContain(SampleMetric.Cadence)
      expect(metrics).toContain(SampleMetric.Power)
      expect(metrics).toContain(SampleMetric.Location)
    })

    it('should respect custom cue duration', () => {
      // Setup: Create a 4-second clip with 2-second cue duration
      const captureStart = new Date('2025-01-01T10:00:00Z')
      const captureEnd = new Date('2025-01-01T10:00:04Z')

      const samples = [
        new Sample(new Date('2025-01-01T10:00:01Z'), SampleMetric.HeartRate, 120),
        new Sample(new Date('2025-01-01T10:00:03Z'), SampleMetric.HeartRate, 125),
      ]
      sampleIndex.addSamples(samples)

      const clips = [new Clip(captureStart, captureEnd, 4000, 0)]
      const options = { defaultCueDurationMs: 2000 } // 2-second cues
      const mapper = new TimelineMapper({ sampleIndex, clips, options })
      const cues = mapper.getCues()

      expect(cues).toHaveLength(2) // 2 two-second cues

      // First cue: 0-2s, contains sample at 1s
      expect(cues[0].startTime).toBe(0)
      expect(cues[0].endTime).toBe(2000)
      expect(cues[0].samples).toHaveLength(1)
      expect(cues[0].samples[0].value).toBe(120)

      // Second cue: 2-4s, contains sample at 3s
      expect(cues[1].startTime).toBe(2000)
      expect(cues[1].endTime).toBe(4000)
      expect(cues[1].samples).toHaveLength(1)
      expect(cues[1].samples[0].value).toBe(125)
    })

    it('should handle clips that end mid-cue interval', () => {
      // Setup: Create a 2.5-second clip (should create 2 full cues + 1 partial)
      const captureStart = new Date('2025-01-01T10:00:00Z')
      const captureEnd = new Date('2025-01-01T10:00:02.500Z')

      const samples = [
        new Sample(new Date('2025-01-01T10:00:00.5Z'), SampleMetric.HeartRate, 120),
        new Sample(new Date('2025-01-01T10:00:01.5Z'), SampleMetric.HeartRate, 125),
        new Sample(new Date('2025-01-01T10:00:02.25Z'), SampleMetric.HeartRate, 130),
      ]
      sampleIndex.addSamples(samples)

      const clips = [new Clip(captureStart, captureEnd, 2500, 1000)] // offset at 1s
      const mapper = new TimelineMapper({ sampleIndex, clips })
      const cues = mapper.getCues()

      expect(cues).toHaveLength(3)

      // First cue: 1-2s
      expect(cues[0].startTime).toBe(1000)
      expect(cues[0].endTime).toBe(2000)
      expect(cues[0].samples[0].value).toBe(120)

      // Second cue: 2-3s
      expect(cues[1].startTime).toBe(2000)
      expect(cues[1].endTime).toBe(3000)
      expect(cues[1].samples[0].value).toBe(125)

      // Third cue: 3-3.5s (partial cue, ends with clip)
      expect(cues[2].startTime).toBe(3000)
      expect(cues[2].endTime).toBe(3500) // 1000 + 2500 (clip end)
      expect(cues[2].samples[0].value).toBe(130)
    })

    it('should handle overlapping clips', () => {
      // Note: This tests the current behavior - overlapping clips might be unusual
      // but the TimelineMapper should handle them gracefully
      const samples = [
        new Sample(new Date('2025-01-01T10:00:05Z'), SampleMetric.HeartRate, 120),
        new Sample(new Date('2025-01-01T10:00:10Z'), SampleMetric.HeartRate, 125),
        new Sample(new Date('2025-01-01T10:00:15Z'), SampleMetric.HeartRate, 130),
      ]
      sampleIndex.addSamples(samples)

      const clips = [
        new Clip(
          new Date('2025-01-01T10:00:00Z'),
          new Date('2025-01-01T10:00:12Z'),
          12000,
          0
        ), // 0-12s
        new Clip(
          new Date('2025-01-01T10:00:08Z'),
          new Date('2025-01-01T10:00:16Z'), // 8s duration
          8000,
          15000 // starts at 15s on video timeline
        ),
      ]

      const mapper = new TimelineMapper({ sampleIndex, clips })
      const cues = mapper.getCues()

      expect(cues).toHaveLength(4)

      // First clip: cues at 5s and 10s
      const firstClipCues = cues.filter((cue) => cue.startTime < 15000)
      expect(firstClipCues).toHaveLength(2)
      expect(firstClipCues[0].startTime).toBe(5000) // Sample at 5s
      expect(firstClipCues[1].startTime).toBe(10000) // Sample at 10s

      // Second clip: cues at 17s and 22s (15s + 2s, 15s + 7s)
      const secondClipCues = cues.filter((cue) => cue.startTime >= 15000)
      expect(secondClipCues).toHaveLength(2)
      expect(secondClipCues[0].startTime).toBe(17000) // 15000 + 2000 (10s sample mapped to 2s into clip)
      expect(secondClipCues[1].startTime).toBe(22000) // 15000 + 7000 (15s sample mapped to 7s into clip)
    })
  })
})
