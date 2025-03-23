import fs from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'

import { Sample, SampleKind } from './sample.js'
import { TCXReader } from './tcx-reader.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const fixturesDir = join(__dirname, '..', '..', 'fixtures')

describe('TCXReader', () => {
  it('should be instantiable with TCX content', async () => {
    const tcxContent = await fs.readFile(join(fixturesDir, 'concept2.tcx'), 'utf8')
    const reader = new TCXReader(tcxContent)
    expect(reader).toBeInstanceOf(TCXReader)
  })

  describe('getSamples', () => {
    it('should read samples from TCX content', async () => {
      const tcxContent = await fs.readFile(join(fixturesDir, 'concept2.tcx'), 'utf8')
      const reader = new TCXReader(tcxContent)
      const samples = reader.getSamples()

      expect(samples).toBeInstanceOf(Array)
      expect(samples.length).toBeGreaterThan(0)

      // Check that all elements are Sample instances
      samples.forEach((sample) => {
        expect(sample).toBeInstanceOf(Sample)
        expect(sample.time).toBeInstanceOf(Date)
        expect(Object.values(SampleKind)).toContain(sample.kind)
        expect(typeof sample.value).toBe('number')
      })

      // Check sample data types for each kind
      const heartRateSamples = samples.filter((s) => s.kind === SampleKind.HeartRate)
      expect(heartRateSamples.length).toBeGreaterThan(0)
      expect(heartRateSamples[0].value).toBe(88) // From first trackpoint

      const distanceSamples = samples.filter((s) => s.kind === SampleKind.Distance)
      expect(distanceSamples.length).toBeGreaterThan(0)
      expect(distanceSamples[0].value).toBe(2.7) // From first trackpoint

      const cadenceSamples = samples.filter((s) => s.kind === SampleKind.Cadence)
      expect(cadenceSamples.length).toBeGreaterThan(0)
      expect(cadenceSamples[0].value).toBe(25) // From second trackpoint

      // We know the second trackpoint has a power value of 121
      const powerSamples = samples.filter((s) => s.kind === SampleKind.Power)
      expect(powerSamples.length).toBeGreaterThan(0)
    })

    it('should return empty array for non-TCX XML content', async () => {
      const nonTCXContent = await fs.readFile(join(fixturesDir, 'non-tcx-xml.tcx'), 'utf8')
      const reader = new TCXReader(nonTCXContent)
      const samples = reader.getSamples()
      expect(samples).toEqual([])
    })

    it('should handle no activities in TCX content', async () => {
      const noActivities = await fs.readFile(join(fixturesDir, 'no-activities.tcx'), 'utf8')
      const reader = new TCXReader(noActivities)
      expect(reader.getSamples()).toEqual([])
    })

    it('should handle invalid values for metrics', async () => {
      const invalidMetrics = await fs.readFile(
        join(fixturesDir, 'invalid-metrics.tcx'),
        'utf8'
      )
      const reader = new TCXReader(invalidMetrics)
      const samples = reader.getSamples()

      // Should handle invalid values without creating samples for them
      expect(samples).toEqual([])
    })

    it('should handle activities with no Lap property', async () => {
      const noLap = await fs.readFile(join(fixturesDir, 'no-lap.tcx'), 'utf8')
      const reader = new TCXReader(noLap)
      const samples = reader.getSamples()
      expect(samples).toEqual([])
    })

    it('should handle activities with Lap but no Track property', async () => {
      const emptyLap = await fs.readFile(join(fixturesDir, 'empty-lap.tcx'), 'utf8')
      const reader = new TCXReader(emptyLap)
      const samples = reader.getSamples()
      expect(samples).toEqual([])
    })

    it('should handle triathlon TCX content with multiple sport activities', async () => {
      const triathlonTCX = await fs.readFile(join(fixturesDir, 'triathlon.tcx'), 'utf8')
      const reader = new TCXReader(triathlonTCX)
      const samples = reader.getSamples()

      // Should get multiple samples for each trackpoint
      expect(samples.length).toBeGreaterThan(6) // At least one sample per metric per trackpoint

      // Group samples by time to verify we have the right measurements at each time
      const samplesByTime = samples.reduce(
        (acc, sample) => {
          const timeKey = sample.time.toISOString()
          if (!acc[timeKey]) {
            acc[timeKey] = []
          }
          acc[timeKey].push(sample)
          return acc
        },
        {} as Record<string, Sample<SampleKind>[]>
      )

      // First timestamp should have heart rate and distance samples
      const firstTimeSamples = samplesByTime['2025-01-01T09:00:00.000Z']
      expect(firstTimeSamples).toBeDefined()
      expect(firstTimeSamples.find((s) => s.kind === SampleKind.HeartRate)?.value).toBe(140)
      expect(firstTimeSamples.find((s) => s.kind === SampleKind.Distance)?.value).toBe(100)

      // Bike samples should have power readings
      const bikeSamples = samplesByTime['2025-01-01T10:00:00.000Z']
      expect(bikeSamples).toBeDefined()
      expect(bikeSamples.find((s) => s.kind === SampleKind.Power)?.value).toBe(250)
    })

    it('should handle TCX content with location data', async () => {
      const tcxContent = await fs.readFile(
        join(fixturesDir, 'healthkit-cycling.tcx'),
        'utf8'
      )
      const reader = new TCXReader(tcxContent)
      const samples = reader.getSamples()

      expect(samples).toBeInstanceOf(Array)
      expect(samples.length).toBeGreaterThan(0)

      // Find samples with location data
      const locationSamples = samples.filter((s) => s.kind === SampleKind.Location)
      expect(locationSamples.length).toBeGreaterThan(0)

      // Check first location sample
      const firstLocationSample = locationSamples[0] as Sample<SampleKind.Location>
      expect(firstLocationSample.value).toEqual(
        expect.objectContaining({
          latitude: expect.any(Number),
          longitude: expect.any(Number),
          altitude: expect.any(Number),
        })
      )

      // Check specific location values from the first trackpoint with position
      expect(firstLocationSample.value.latitude).toBeCloseTo(32.36415566566089)
      expect(firstLocationSample.value.longitude).toBeCloseTo(-111.01644143335649)
      expect(firstLocationSample.value.altitude).toBeCloseTo(714.6836803928018)

      // Verify that consecutive location samples have different coordinates
      if (locationSamples.length > 1) {
        const secondLocationSample = locationSamples[1] as Sample<SampleKind.Location>
        expect(secondLocationSample.value.latitude).not.toBe(
          firstLocationSample.value.latitude
        )
        expect(secondLocationSample.value.longitude).not.toBe(
          firstLocationSample.value.longitude
        )
      }
    })
  })
})
