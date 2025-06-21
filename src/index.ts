import { Clip, type ClipOptions } from './lib/clip.js'
import { Cue, type CueOptions } from './lib/cue.js'
import { FCPReader } from './lib/fcp-reader.js'
import { HLSSegmenter, type HLSSegment } from './lib/hls-segmenter.js'
import { SampleIndex } from './lib/sample-index.js'
import { Sample, SampleMetric, type Coordinates } from './lib/sample.js'
import { SequentialCueGenerator } from './lib/sequential-cue-generator.js'
import { TCXReader } from './lib/tcx-reader.js'
import {
  TimelineMapper,
  type TimelineMapperOptions,
  type TimelineMapperConstructorArgs,
} from './lib/timeline-mapper.js'
import { WebVTTGenerator } from './lib/webvtt-generator.js'

export {
  // Core data classes
  Sample,
  SampleMetric,
  Clip,
  Cue,
  SampleIndex,
  // File readers
  TCXReader,
  FCPReader,
  // Processing and generation
  TimelineMapper,
  SequentialCueGenerator,
  WebVTTGenerator,
  HLSSegmenter,
}

export type {
  ClipOptions,
  Coordinates,
  CueOptions,
  HLSSegment,
  TimelineMapperOptions,
  TimelineMapperConstructorArgs,
}
