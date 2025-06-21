import { readFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'

import { Cue } from './cue.js'
import { HLSSegmenter } from './hls-segmenter.js'
import { Sample, SampleMetric } from './sample.js'

describe('HLSSegmenter', () => {
  let testDir: string
  let segmenter: HLSSegmenter

  beforeEach(async () => {
    testDir = join(process.cwd(), 'test-hls-output')
    segmenter = new HLSSegmenter(60000) // 60-second segments
  })

  afterEach(async () => {
    try {
      await rm(testDir, { recursive: true, force: true })
    } catch {
      // Ignore errors if directory doesn't exist
    }
  })

  const createSample = (metric: SampleMetric, value: number): Sample => {
    return new Sample(new Date(), metric, value)
  }

  const createCue = (startTime: number, endTime: number, samples: Sample[]): Cue => {
    return new Cue(startTime, endTime, samples)
  }

  describe('generateHLS', () => {
    it('should create output directory if it does not exist', async () => {
      const cues = [createCue(0, 30000, [createSample(SampleMetric.HeartRate, 120)])]

      await segmenter.generateHLS(cues, testDir)

      // Directory should exist and contain files
      const files = await readFile(join(testDir, 'index.m3u8'), 'utf-8')
      expect(files).toContain('#EXTM3U')
    })

    it('should generate empty segment for empty cue array', async () => {
      await segmenter.generateHLS([], testDir)

      // Should create index.m3u8 and one empty segment
      const playlist = await readFile(join(testDir, 'index.m3u8'), 'utf-8')
      expect(playlist).toContain('#EXTM3U')
      expect(playlist).toContain('fileSequence0.webvtt')

      const segment = await readFile(join(testDir, 'fileSequence0.webvtt'), 'utf-8')
      expect(segment).toBe('WEBVTT\nX-TIMESTAMP-MAP=MPEGTS:900000,LOCAL:00:00:00.000\n')
    })

    it('should generate single segment for short duration cues', async () => {
      const cues = [
        createCue(0, 30000, [createSample(SampleMetric.HeartRate, 120)]),
        createCue(30000, 45000, [createSample(SampleMetric.HeartRate, 125)]),
      ]

      await segmenter.generateHLS(cues, testDir)

      const playlist = await readFile(join(testDir, 'index.m3u8'), 'utf-8')
      expect(playlist).toContain('fileSequence0.webvtt')
      expect(playlist).not.toContain('fileSequence1.webvtt')

      const segment = await readFile(join(testDir, 'fileSequence0.webvtt'), 'utf-8')
      expect(segment).toContain('WEBVTT')
      expect(segment).toContain('X-TIMESTAMP-MAP=MPEGTS:900000,LOCAL:00:00:00.000')
      expect(segment).toContain('00:00:00.000 --> 00:00:30.000')
      expect(segment).toContain('00:00:30.000 --> 00:00:45.000')
      expect(segment).toContain('"metric":"heartRate"')
      expect(segment).toContain('"value":120')
      expect(segment).toContain('"value":125')
    })

    it('should generate multiple segments for long duration cues', async () => {
      const cues = [
        createCue(0, 30000, [createSample(SampleMetric.HeartRate, 120)]),
        createCue(70000, 90000, [createSample(SampleMetric.HeartRate, 125)]),
        createCue(130000, 150000, [createSample(SampleMetric.HeartRate, 130)]),
      ]

      await segmenter.generateHLS(cues, testDir)

      const playlist = await readFile(join(testDir, 'index.m3u8'), 'utf-8')
      expect(playlist).toContain('fileSequence0.webvtt')
      expect(playlist).toContain('fileSequence1.webvtt')
      expect(playlist).toContain('fileSequence2.webvtt')

      // Check first segment (0-60s) contains first cue
      const segment0 = await readFile(join(testDir, 'fileSequence0.webvtt'), 'utf-8')
      expect(segment0).toContain('00:00:00.000 --> 00:00:30.000')
      expect(segment0).toContain('"value":120')

      // Check second segment (60-120s) contains second cue
      const segment1 = await readFile(join(testDir, 'fileSequence1.webvtt'), 'utf-8')
      expect(segment1).toContain('00:01:10.000 --> 00:01:30.000')
      expect(segment1).toContain('"value":125')

      // Check third segment (120-180s) contains third cue
      const segment2 = await readFile(join(testDir, 'fileSequence2.webvtt'), 'utf-8')
      expect(segment2).toContain('00:02:10.000 --> 00:02:30.000')
      expect(segment2).toContain('"value":130')
    })

    it('should handle cues that span multiple segments', async () => {
      // Create a cue that spans from 50s to 70s (crosses segment boundary at 60s)
      const cues = [createCue(50000, 70000, [createSample(SampleMetric.HeartRate, 120)])]

      await segmenter.generateHLS(cues, testDir)

      const playlist = await readFile(join(testDir, 'index.m3u8'), 'utf-8')
      expect(playlist).toContain('fileSequence0.webvtt')
      expect(playlist).toContain('fileSequence1.webvtt')

      // Cue should appear in both segments
      const segment0 = await readFile(join(testDir, 'fileSequence0.webvtt'), 'utf-8')
      expect(segment0).toContain('00:00:50.000 --> 00:01:10.000')
      expect(segment0).toContain('"value":120')

      const segment1 = await readFile(join(testDir, 'fileSequence1.webvtt'), 'utf-8')
      expect(segment1).toContain('00:00:50.000 --> 00:01:10.000')
      expect(segment1).toContain('"value":120')
    })
  })

  describe('playlist generation', () => {
    it('should generate valid M3U8 playlist', async () => {
      const cues = [createCue(0, 30000, [createSample(SampleMetric.HeartRate, 120)])]

      await segmenter.generateHLS(cues, testDir)

      const playlist = await readFile(join(testDir, 'index.m3u8'), 'utf-8')

      // Check M3U8 format
      expect(playlist).toContain('#EXTM3U')
      expect(playlist).toContain('#EXT-X-TARGETDURATION:')
      expect(playlist).toContain('#EXT-X-VERSION:6')
      expect(playlist).toContain('#EXT-X-MEDIA-SEQUENCE:0')
      expect(playlist).toContain('#EXT-X-PLAYLIST-TYPE:VOD')
      expect(playlist).toContain('#EXTINF:30.00000,\t')
      expect(playlist).toContain('fileSequence0.webvtt')
      expect(playlist).toContain('#EXT-X-ENDLIST')
    })

    it('should set correct target duration for segments', async () => {
      // Create cues that would result in different segment durations
      const cues = [
        createCue(0, 45000, [createSample(SampleMetric.HeartRate, 120)]),
        createCue(60000, 150000, [createSample(SampleMetric.HeartRate, 125)]),
      ]

      await segmenter.generateHLS(cues, testDir)

      const playlist = await readFile(join(testDir, 'index.m3u8'), 'utf-8')

      // Target duration should be the maximum segment duration (rounded up)
      // The third segment will be 30 seconds (150-120), so max should be 60
      expect(playlist).toContain('#EXT-X-TARGETDURATION:60')
    })
  })

  describe('segment formatting', () => {
    it('should format timestamps correctly', async () => {
      const cues = [
        createCue(3661500, 3721800, [createSample(SampleMetric.HeartRate, 120)]), // 1:01:01.500 to 1:02:01.800
      ]

      await segmenter.generateHLS(cues, testDir)

      const segment = await readFile(join(testDir, 'fileSequence61.webvtt'), 'utf-8')
      expect(segment).toContain('01:01:01.500 --> 01:02:01.800')
    })

    it('should include proper WebVTT headers', async () => {
      const cues = [createCue(0, 30000, [createSample(SampleMetric.HeartRate, 120)])]

      await segmenter.generateHLS(cues, testDir)

      const segment = await readFile(join(testDir, 'fileSequence0.webvtt'), 'utf-8')
      expect(segment).toMatch(/^WEBVTT\n/)
      expect(segment).toContain('X-TIMESTAMP-MAP=MPEGTS:900000,LOCAL:00:00:00.000')
    })

    it('should serialize sample data as JSON', async () => {
      const samples = [
        createSample(SampleMetric.HeartRate, 120),
        createSample(SampleMetric.Cadence, 80),
        createSample(SampleMetric.Power, 250),
      ]
      const cues = [createCue(0, 30000, samples)]

      await segmenter.generateHLS(cues, testDir)

      const segment = await readFile(join(testDir, 'fileSequence0.webvtt'), 'utf-8')

      // Should contain JSON array with all sample data
      const jsonMatch = segment.match(/\[.*\]/)
      expect(jsonMatch).toBeTruthy()
      if (jsonMatch) {
        const sampleData = JSON.parse(jsonMatch[0])
        expect(sampleData).toHaveLength(3)
        expect(sampleData[0]).toEqual({ metric: 'heartRate', value: 120 })
        expect(sampleData[1]).toEqual({ metric: 'cadence', value: 80 })
        expect(sampleData[2]).toEqual({ metric: 'power', value: 250 })
      }
    })
  })

  describe('custom segment duration', () => {
    it('should respect custom segment duration', async () => {
      const customSegmenter = new HLSSegmenter(30000) // 30-second segments
      const cues = [createCue(0, 45000, [createSample(SampleMetric.HeartRate, 120)])]

      await customSegmenter.generateHLS(cues, testDir)

      const playlist = await readFile(join(testDir, 'index.m3u8'), 'utf-8')

      // Should create two 30-second segments
      expect(playlist).toContain('fileSequence0.webvtt')
      expect(playlist).toContain('fileSequence1.webvtt')
      expect(playlist).toContain('#EXT-X-TARGETDURATION:30')
    })
  })
})
