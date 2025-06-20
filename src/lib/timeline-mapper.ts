import { Clip } from './clip.js'
import { Cue } from './cue.js'
import { SampleIndex } from './sample-index.js'

export interface TimelineMapperOptions {
  defaultCueDurationMs?: number
}

export interface TimelineMapperConstructorArgs {
  sampleIndex: SampleIndex
  clips: Clip[]
  options?: TimelineMapperOptions
}

export class TimelineMapper {
  private readonly sampleIndex: SampleIndex
  private readonly clips: Clip[]
  private readonly defaultCueDurationMs: number

  constructor({ sampleIndex, clips, options }: TimelineMapperConstructorArgs) {
    this.sampleIndex = sampleIndex
    this.clips = clips
    this.defaultCueDurationMs = options?.defaultCueDurationMs ?? 1000
  }

  getCues(): Cue[] {
    const cues: Cue[] = []

    for (const clip of this.clips) {
      // Generate cue intervals within this clip
      let currentVideoTime = clip.offset
      const clipEndTime = clip.offset + clip.duration

      while (currentVideoTime < clipEndTime) {
        // Calculate end time for this cue interval
        const cueEndTime = Math.min(
          currentVideoTime + this.defaultCueDurationMs,
          clipEndTime
        )

        // Calculate corresponding capture time range for this cue interval
        const videoTimeOffsetMs = currentVideoTime - clip.offset
        const cueIntervalDurationMs = cueEndTime - currentVideoTime

        const captureStartTime = new Date(clip.captureStart.getTime() + videoTimeOffsetMs)
        const captureEndTime = new Date(captureStartTime.getTime() + cueIntervalDurationMs)

        // Get samples for this specific cue interval
        const samplesInInterval = this.sampleIndex.getSamplesInRange(
          captureStartTime,
          captureEndTime
        )

        // Only create a cue if there are samples in this interval
        if (samplesInInterval.length > 0) {
          const cue = new Cue(currentVideoTime, cueEndTime, samplesInInterval)
          cues.push(cue)
        }

        // Move to next cue interval
        currentVideoTime += this.defaultCueDurationMs
      }
    }

    return cues
  }
}
