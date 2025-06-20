import { describe, it, expect } from 'vitest'

import { Cue } from './cue.js'
import { Sample, SampleMetric } from './sample.js'
import { WebVTTGenerator } from './webvtt-generator.js'

describe('WebVTTGenerator', () => {
  it('should generate valid WebVTT header with no cues', () => {
    const generator = new WebVTTGenerator()
    const result = generator.generate([])

    expect(result).toBe('WEBVTT')
  })

  it('should generate WebVTT with a single cue containing one heart rate sample', () => {
    const generator = new WebVTTGenerator()
    const samples = [
      new Sample(new Date('2023-01-01T12:00:00Z'), SampleMetric.HeartRate, 120),
    ]
    const cues = [new Cue(0, 1000, samples)]

    const result = generator.generate(cues)

    const expected = `WEBVTT
00:00:00.000 --> 00:00:01.000
[{"metric":"heartRate","value":120}]`

    expect(result).toBe(expected)
  })

  it('should generate WebVTT with a single cue containing one power sample', () => {
    const generator = new WebVTTGenerator()
    const samples = [new Sample(new Date('2023-01-01T12:00:00Z'), SampleMetric.Power, 250)]
    const cues = [new Cue(0, 1000, samples)]

    const result = generator.generate(cues)

    const expected = `WEBVTT
00:00:00.000 --> 00:00:01.000
[{"metric":"power","value":250}]`

    expect(result).toBe(expected)
  })

  it('should generate WebVTT with a single cue containing one cadence sample', () => {
    const generator = new WebVTTGenerator()
    const samples = [new Sample(new Date('2023-01-01T12:00:00Z'), SampleMetric.Cadence, 85)]
    const cues = [new Cue(0, 1000, samples)]

    const result = generator.generate(cues)

    const expected = `WEBVTT
00:00:00.000 --> 00:00:01.000
[{"metric":"cadence","value":85}]`

    expect(result).toBe(expected)
  })

  it('should generate WebVTT with a single cue containing one distance sample', () => {
    const generator = new WebVTTGenerator()
    const samples = [
      new Sample(new Date('2023-01-01T12:00:00Z'), SampleMetric.Distance, 1500),
    ]
    const cues = [new Cue(0, 1000, samples)]

    const result = generator.generate(cues)

    const expected = `WEBVTT
00:00:00.000 --> 00:00:01.000
[{"metric":"distance","value":1500}]`

    expect(result).toBe(expected)
  })

  it('should generate WebVTT with a single cue containing one location sample', () => {
    const generator = new WebVTTGenerator()
    const samples = [
      new Sample(new Date('2023-01-01T12:00:00Z'), SampleMetric.Location, {
        latitude: 37.7749,
        longitude: -122.4194,
      }),
    ]
    const cues = [new Cue(0, 1000, samples)]

    const result = generator.generate(cues)

    const expected = `WEBVTT
00:00:00.000 --> 00:00:01.000
[{"metric":"location","value":{"latitude":37.7749,"longitude":-122.4194}}]`

    expect(result).toBe(expected)
  })

  it('should generate WebVTT with a single cue containing a location sample with altitude', () => {
    const generator = new WebVTTGenerator()
    const samples = [
      new Sample(new Date('2023-01-01T12:00:00Z'), SampleMetric.Location, {
        latitude: 37.7749,
        longitude: -122.4194,
        altitude: 15.5,
      }),
    ]
    const cues = [new Cue(0, 1000, samples)]

    const result = generator.generate(cues)

    const expected = `WEBVTT
00:00:00.000 --> 00:00:01.000
[{"metric":"location","value":{"latitude":37.7749,"longitude":-122.4194,"altitude":15.5}}]`

    expect(result).toBe(expected)
  })

  it('should generate WebVTT with a single cue containing multiple samples', () => {
    const generator = new WebVTTGenerator()
    const samples = [
      new Sample(new Date('2023-01-01T12:00:00Z'), SampleMetric.HeartRate, 120),
      new Sample(new Date('2023-01-01T12:00:00Z'), SampleMetric.Power, 250),
      new Sample(new Date('2023-01-01T12:00:00Z'), SampleMetric.Cadence, 85),
    ]
    const cues = [new Cue(0, 1000, samples)]

    const result = generator.generate(cues)

    const expected = `WEBVTT
00:00:00.000 --> 00:00:01.000
[{"metric":"heartRate","value":120},{"metric":"power","value":250},{"metric":"cadence","value":85}]`

    expect(result).toBe(expected)
  })

  it('should generate WebVTT with multiple cues each containing single samples', () => {
    const generator = new WebVTTGenerator()
    const cues = [
      new Cue(0, 1000, [
        new Sample(new Date('2023-01-01T12:00:00Z'), SampleMetric.HeartRate, 120),
      ]),
      new Cue(1000, 2000, [
        new Sample(new Date('2023-01-01T12:00:01Z'), SampleMetric.Power, 250),
      ]),
      new Cue(2000, 3000, [
        new Sample(new Date('2023-01-01T12:00:02Z'), SampleMetric.Cadence, 85),
      ]),
    ]

    const result = generator.generate(cues)

    const expected = `WEBVTT
00:00:00.000 --> 00:00:01.000
[{"metric":"heartRate","value":120}]

00:00:01.000 --> 00:00:02.000
[{"metric":"power","value":250}]

00:00:02.000 --> 00:00:03.000
[{"metric":"cadence","value":85}]`

    expect(result).toBe(expected)
  })

  it('should generate WebVTT with multiple cues containing multiple samples', () => {
    const generator = new WebVTTGenerator()
    const cues = [
      new Cue(0, 1000, [
        new Sample(new Date('2023-01-01T12:00:00Z'), SampleMetric.HeartRate, 120),
        new Sample(new Date('2023-01-01T12:00:00Z'), SampleMetric.Power, 250),
      ]),
      new Cue(1000, 2000, [
        new Sample(new Date('2023-01-01T12:00:01Z'), SampleMetric.Cadence, 85),
        new Sample(new Date('2023-01-01T12:00:01Z'), SampleMetric.Distance, 1500),
      ]),
    ]

    const result = generator.generate(cues)

    const expected = `WEBVTT
00:00:00.000 --> 00:00:01.000
[{"metric":"heartRate","value":120},{"metric":"power","value":250}]

00:00:01.000 --> 00:00:02.000
[{"metric":"cadence","value":85},{"metric":"distance","value":1500}]`

    expect(result).toBe(expected)
  })

  it('should handle cues with custom timing', () => {
    const generator = new WebVTTGenerator()
    const samples = [
      new Sample(new Date('2023-01-01T12:00:00Z'), SampleMetric.HeartRate, 120),
    ]
    const cues = [new Cue(5000, 7500, samples)]

    const result = generator.generate(cues)

    const expected = `WEBVTT
00:00:05.000 --> 00:00:07.500
[{"metric":"heartRate","value":120}]`

    expect(result).toBe(expected)
  })

  it('should handle cues with fractional milliseconds', () => {
    const generator = new WebVTTGenerator()
    const samples = [
      new Sample(new Date('2023-01-01T12:00:00Z'), SampleMetric.HeartRate, 120),
    ]
    const cues = [new Cue(1234, 5678, samples)]

    const result = generator.generate(cues)

    const expected = `WEBVTT
00:00:01.234 --> 00:00:05.678
[{"metric":"heartRate","value":120}]`

    expect(result).toBe(expected)
  })

  it('should handle cues spanning hours', () => {
    const generator = new WebVTTGenerator()
    const samples = [
      new Sample(new Date('2023-01-01T12:00:00Z'), SampleMetric.HeartRate, 120),
    ]
    const cues = [new Cue(3661000, 3662000, samples)] // 1:01:01.000 - 1:01:02.000

    const result = generator.generate(cues)

    const expected = `WEBVTT
01:01:01.000 --> 01:01:02.000
[{"metric":"heartRate","value":120}]`

    expect(result).toBe(expected)
  })
})
