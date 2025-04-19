import { describe, it, expect } from 'vitest'

import { Sample, SampleMetric } from './sample.js'
import { WebVTTGenerator } from './webvtt-generator.js'

describe('WebVTTGenerator', () => {
  it('should generate valid WebVTT header', () => {
    const generator = new WebVTTGenerator()
    const result = generator.generate([])

    expect(result).toBe('WEBVTT')
  })

  it('should generate WebVTT with a single heart rate cue', () => {
    const generator = new WebVTTGenerator()
    const samples = [
      new Sample(new Date('2023-01-01T12:00:00Z'), SampleMetric.HeartRate, 120),
    ]

    const result = generator.generate(samples)

    const expected = `WEBVTT
00:00:00.000 --> 00:00:01.000
{"metric":"heartRate","value":120}`

    expect(result).toBe(expected)
  })

  it('should generate WebVTT with a single power cue', () => {
    const generator = new WebVTTGenerator()
    const samples = [new Sample(new Date('2023-01-01T12:00:00Z'), SampleMetric.Power, 250)]

    const result = generator.generate(samples)

    const expected = `WEBVTT
00:00:00.000 --> 00:00:01.000
{"metric":"power","value":250}`

    expect(result).toBe(expected)
  })

  it('should generate WebVTT with a single cadence cue', () => {
    const generator = new WebVTTGenerator()
    const samples = [new Sample(new Date('2023-01-01T12:00:00Z'), SampleMetric.Cadence, 85)]

    const result = generator.generate(samples)

    const expected = `WEBVTT
00:00:00.000 --> 00:00:01.000
{"metric":"cadence","value":85}`

    expect(result).toBe(expected)
  })

  it('should generate WebVTT with a single distance cue', () => {
    const generator = new WebVTTGenerator()
    const samples = [
      new Sample(new Date('2023-01-01T12:00:00Z'), SampleMetric.Distance, 1500),
    ]

    const result = generator.generate(samples)

    const expected = `WEBVTT
00:00:00.000 --> 00:00:01.000
{"metric":"distance","value":1500}`

    expect(result).toBe(expected)
  })

  it('should generate WebVTT with a single location cue', () => {
    const generator = new WebVTTGenerator()
    const samples = [
      new Sample(new Date('2023-01-01T12:00:00Z'), SampleMetric.Location, {
        latitude: 37.7749,
        longitude: -122.4194,
      }),
    ]

    const result = generator.generate(samples)

    const expected = `WEBVTT
00:00:00.000 --> 00:00:01.000
{"metric":"location","value":{"latitude":37.7749,"longitude":-122.4194}}`

    expect(result).toBe(expected)
  })

  it('should generate WebVTT with a location cue including altitude', () => {
    const generator = new WebVTTGenerator()
    const samples = [
      new Sample(new Date('2023-01-01T12:00:00Z'), SampleMetric.Location, {
        latitude: 37.7749,
        longitude: -122.4194,
        altitude: 15.5,
      }),
    ]

    const result = generator.generate(samples)

    const expected = `WEBVTT
00:00:00.000 --> 00:00:01.000
{"metric":"location","value":{"latitude":37.7749,"longitude":-122.4194,"altitude":15.5}}`

    expect(result).toBe(expected)
  })

  it('should generate WebVTT with multiple cues of different types', () => {
    const generator = new WebVTTGenerator()
    const samples = [
      new Sample(new Date('2023-01-01T12:00:00Z'), SampleMetric.HeartRate, 120),
      new Sample(new Date('2023-01-01T12:00:01Z'), SampleMetric.Power, 250),
      new Sample(new Date('2023-01-01T12:00:02Z'), SampleMetric.Cadence, 85),
      new Sample(new Date('2023-01-01T12:00:03Z'), SampleMetric.Distance, 1500),
      new Sample(new Date('2023-01-01T12:00:04Z'), SampleMetric.Location, {
        latitude: 37.7749,
        longitude: -122.4194,
      }),
    ]

    const result = generator.generate(samples)

    const expected = `WEBVTT
00:00:00.000 --> 00:00:01.000
{"metric":"heartRate","value":120}

00:00:01.000 --> 00:00:02.000
{"metric":"power","value":250}

00:00:02.000 --> 00:00:03.000
{"metric":"cadence","value":85}

00:00:03.000 --> 00:00:04.000
{"metric":"distance","value":1500}

00:00:04.000 --> 00:00:05.000
{"metric":"location","value":{"latitude":37.7749,"longitude":-122.4194}}`

    expect(result).toBe(expected)
  })

  it('should respect custom cueDuration option', () => {
    const generator = new WebVTTGenerator({ cueDuration: 2000 })
    const samples = [
      new Sample(new Date('2023-01-01T12:00:00Z'), SampleMetric.HeartRate, 120),
    ]

    const result = generator.generate(samples)

    const expected = `WEBVTT
00:00:00.000 --> 00:00:02.000
{"metric":"heartRate","value":120}`

    expect(result).toBe(expected)
  })

  it('should respect custom startTime option', () => {
    const generator = new WebVTTGenerator({ startTime: 5000 })
    const samples = [
      new Sample(new Date('2023-01-01T12:00:00Z'), SampleMetric.HeartRate, 120),
    ]

    const result = generator.generate(samples)

    const expected = `WEBVTT
00:00:05.000 --> 00:00:06.000
{"metric":"heartRate","value":120}`

    expect(result).toBe(expected)
  })
})
