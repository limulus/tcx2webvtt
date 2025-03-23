import { describe, it, expect } from 'vitest'

import { Sample, SampleKind, Coordinates } from './sample.js'

describe('Sample', () => {
  describe('constructor', () => {
    it('should create a sample for numeric values', () => {
      const time = new Date()
      const sample = new Sample(time, SampleKind.HeartRate, 150)

      expect(sample.time).toBe(time)
      expect(sample.kind).toBe(SampleKind.HeartRate)
      expect(sample.value).toBe(150)
    })

    it('should create a sample for location values', () => {
      const time = new Date()
      const coordinates: Coordinates = {
        latitude: 47.6062,
        longitude: -122.3321,
        altitude: 100,
      }
      const sample = new Sample(time, SampleKind.Location, coordinates)

      expect(sample.time).toBe(time)
      expect(sample.kind).toBe(SampleKind.Location)
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
      const sample = new Sample(time, SampleKind.Location, coordinates)

      expect(sample.time).toBe(time)
      expect(sample.kind).toBe(SampleKind.Location)
      expect(sample.value).toBe(coordinates)
      expect(sample.value.latitude).toBe(47.6062)
      expect(sample.value.longitude).toBe(-122.3321)
      expect(sample.value.altitude).toBeUndefined()
    })
  })

  describe('SampleKind', () => {
    it('should have the correct enum values', () => {
      expect(SampleKind.HeartRate).toBe('heartRate')
      expect(SampleKind.Distance).toBe('distance')
      expect(SampleKind.Cadence).toBe('cadence')
      expect(SampleKind.Power).toBe('power')
      expect(SampleKind.Location).toBe('location')
    })
  })
})
