import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { describe, it, expect } from 'vitest'

import { Clip } from './clip.js'
import { FCPReader } from './fcp-reader.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const fixturesDir = join(__dirname, '..', '..', 'fixtures', 'fcp')

describe('FCPReader', () => {
  describe('constructor', () => {
    it('should accept a path to an fcpxmld bundle', () => {
      const bundlePath = '/path/to/project.fcpxmld'
      const reader = new FCPReader(bundlePath)
      expect(reader).toBeInstanceOf(FCPReader)
    })
  })

  describe('getClips', () => {
    it('should parse a single clip from no-cuts fixture', async () => {
      const bundlePath = join(fixturesDir, 'no-cuts-1-13.fcpxmld')
      const reader = new FCPReader(bundlePath)
      const clips = await reader.getClips()

      expect(clips).toHaveLength(1)
      expect(clips[0]).toBeInstanceOf(Clip)

      const clip = clips[0]
      // Asset r3 has metadataContentCreated "2025-04-20 13:53:11 -0700"
      // Clip has start="1519326809/30000s" which needs to be added to capture time
      expect(clip.captureStart).toBeInstanceOf(Date)
      expect(clip.captureEnd).toBeInstanceOf(Date)
      expect(clip.duration).toBe(15100) // 453/30s = 15.1s = 15100ms
      expect(clip.offset).toBe(0) // offset="0s"
    })

    it('should parse multiple clips from hard-cuts fixture', async () => {
      const bundlePath = join(fixturesDir, 'hard-cuts-1-13.fcpxmld')
      const reader = new FCPReader(bundlePath)
      const clips = await reader.getClips()

      expect(clips).toHaveLength(5)
      clips.forEach((clip) => {
        expect(clip).toBeInstanceOf(Clip)
        expect(clip.captureStart).toBeInstanceOf(Date)
        expect(clip.captureEnd).toBeInstanceOf(Date)
        expect(clip.duration).toBeGreaterThan(0)
        expect(clip.offset).toBeGreaterThanOrEqual(0)
      })

      // First clip: asset-clip ref="r2" offset="0s" start="63019957/1250s" duration="233/15s"
      const firstClip = clips[0]
      expect(firstClip.offset).toBe(0) // offset="0s"
      expect(firstClip.duration).toBe(15533) // 233/15s ≈ 15.533s = 15533ms

      // Second clip: asset-clip ref="r2" offset="466/30s"
      const secondClip = clips[1]
      expect(secondClip.offset).toBe(15533) // 466/30s ≈ 15.533s = 15533ms

      // Clips should be in chronological order by offset
      for (let i = 1; i < clips.length; i++) {
        expect(clips[i].offset).toBeGreaterThan(clips[i - 1].offset)
      }
    })

    it('should correctly calculate capture times based on asset metadata and clip start times', async () => {
      const bundlePath = join(fixturesDir, 'hard-cuts-1-13.fcpxmld')
      const reader = new FCPReader(bundlePath)
      const clips = await reader.getClips()

      // First clip references asset r2 (GX010163) with metadataContentCreated "2025-04-20 13:53:11 -0700"
      // Asset has start="1499755257/30000s", clip has start="63019957/1250s"
      // Correct calculation: baseTime + (clipStart - assetStart) * 1000
      const firstClip = clips[0]
      const expectedCaptureStart = new Date('2025-04-20 13:53:11 -0700')
      const assetStart = 1499755257 / 30000 // Asset start time in seconds
      const clipStart = 63019957 / 1250 // Clip start time in seconds
      const elapsedSeconds = clipStart - assetStart
      expectedCaptureStart.setTime(expectedCaptureStart.getTime() + elapsedSeconds * 1000)

      expect(firstClip.captureStart.getTime()).toBeCloseTo(
        expectedCaptureStart.getTime(),
        -2
      )

      // captureEnd should be captureStart + duration
      const expectedCaptureEnd = new Date(
        firstClip.captureStart.getTime() + firstClip.duration
      )
      expect(firstClip.captureEnd.getTime()).toBeCloseTo(expectedCaptureEnd.getTime(), -2)
    })

    it('should handle assets with different metadata creation times', async () => {
      const bundlePath = join(fixturesDir, 'hard-cuts-1-13.fcpxmld')
      const reader = new FCPReader(bundlePath)
      const clips = await reader.getClips()

      // Should have clips from both r2 (GX010163) and r4 (GX020163) assets
      // r2: "2025-04-20 13:53:11 -0700"
      // r4: "2025-04-20 14:11:22 -0700" (18 minutes later)
      const captureStartTimes = clips.map((clip) => clip.captureStart.getTime())
      const uniqueBaseTimes = new Set(
        captureStartTimes.map((time) => {
          // Group by 10-minute intervals to see if we have clips from different base times
          return Math.floor(time / (1000 * 60 * 10))
        })
      )

      expect(uniqueBaseTimes.size).toBeGreaterThan(1)
    })

    it('should throw an error when fcpxml file does not exist', async () => {
      const bundlePath = '/nonexistent/path.fcpxmld'
      const reader = new FCPReader(bundlePath)

      await expect(reader.getClips()).rejects.toThrow()
    })

    it('should handle clips with assets missing metadataContentCreated', async () => {
      const bundlePath = join(fixturesDir, 'missing-metadata-1-13.fcpxmld')
      const reader = new FCPReader(bundlePath)
      const clips = await reader.getClips()

      // Should return empty array since both assets lack metadataContentCreated
      expect(clips).toHaveLength(0)
    })

    it('should handle projects with no spine element', async () => {
      const bundlePath = join(fixturesDir, 'no-spine-1-13.fcpxmld')
      const reader = new FCPReader(bundlePath)
      const clips = await reader.getClips()

      // Should return empty array when no spine exists
      expect(clips).toHaveLength(0)
    })

    it('should handle projects with single asset-clip element', async () => {
      const bundlePath = join(fixturesDir, 'single-asset-clip-1-13.fcpxmld')
      const reader = new FCPReader(bundlePath)
      const clips = await reader.getClips()

      // Should parse single asset-clip successfully
      expect(clips).toHaveLength(1)
      expect(clips[0]).toBeInstanceOf(Clip)
      expect(clips[0].duration).toBe(15100) // 453/30s = 15.1s = 15100ms
      expect(clips[0].offset).toBe(0) // offset="0s"
    })

    it('should handle asset-clip elements with missing metadata', async () => {
      const bundlePath = join(fixturesDir, 'missing-metadata-asset-clip-1-13.fcpxmld')
      const reader = new FCPReader(bundlePath)
      const clips = await reader.getClips()

      // Should return empty array since asset-clip lacks metadataContentCreated
      expect(clips).toHaveLength(0)
    })
  })

  describe('time parsing', () => {
    it('should correctly parse FCP time formats', async () => {
      const bundlePath = join(fixturesDir, 'hard-cuts-1-13.fcpxmld')
      const reader = new FCPReader(bundlePath)
      const clips = await reader.getClips()

      // Verify that different time formats are parsed correctly
      // "233/15s" should equal 15.533... seconds
      // "466/30s" should equal 15.533... seconds
      // etc.
      clips.forEach((clip) => {
        expect(clip.duration).toBeGreaterThan(0)
        expect(clip.offset).toBeGreaterThanOrEqual(0)
        expect(Number.isFinite(clip.duration)).toBe(true)
        expect(Number.isFinite(clip.offset)).toBe(true)
      })
    })
  })
})
