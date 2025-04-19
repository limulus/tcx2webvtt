import { describe, it, expect } from 'vitest'

import { Sample, SampleMetric, Coordinates } from './sample.js'

describe('Sample', () => {
  describe('constructor', () => {
    it('should create a sample for numeric values', () => {
      const time = new Date()
      const sample = new Sample(time, SampleMetric.HeartRate, 150)

      expect(sample.time).toBe(time)
      expect(sample.metric).toBe(SampleMetric.HeartRate)
      expect(sample.value).toBe(150)
    })

    it('should create a sample for location values', () => {
      const time = new Date()
      const coordinates: Coordinates = {
        latitude: 47.6062,
        longitude: -122.3321,
        altitude: 100,
      }
      const sample = new Sample(time, SampleMetric.Location, coordinates)

      expect(sample.time).toBe(time)
      expect(sample.metric).toBe(SampleMetric.Location)
      expect(sample.value).toBe(coordinates)
      expect(sample.value.latitude).toBe(47.6062)
      expect(sample.value.longitude).toBe(-122.3321)
      expect(sample.value.altitude).toBe(100)
    })

    it('should support location sample without altitude', () => {
      const time = new Date()
      const coordinates: Coordinates = {
        latitude: 47.6062,
        longitude: -122.3321,
      }
      const sample = new Sample(time, SampleMetric.Location, coordinates)

      expect(sample.time).toBe(time)
      expect(sample.metric).toBe(SampleMetric.Location)
      expect(sample.value).toBe(coordinates)
      expect(sample.value.latitude).toBe(47.6062)
      expect(sample.value.longitude).toBe(-122.3321)
      expect(sample.value.altitude).toBeUndefined()
    })
  })

  describe('SampleKind', () => {
    it('should have the correct enum values', () => {
      expect(SampleMetric.HeartRate).toBe('heartRate')
      expect(SampleMetric.Distance).toBe('distance')
      expect(SampleMetric.Cadence).toBe('cadence')
      expect(SampleMetric.Power).toBe('power')
      expect(SampleMetric.Location).toBe('location')
    })
  })
})
