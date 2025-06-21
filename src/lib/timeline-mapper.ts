import { Clip } from './clip.js'
import { Cue } from './cue.js'
import { SampleIndex } from './sample-index.js'

export interface TimelineMapperOptions {
  defaultCueDurationMs?: number
  clipOffsets?: Map<string, number>
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
  private readonly clipOffsets: Map<string, number>

  constructor({ sampleIndex, clips, options }: TimelineMapperConstructorArgs) {
    this.sampleIndex = sampleIndex
    this.clips = clips
    this.defaultCueDurationMs = options?.defaultCueDurationMs ?? 1000
    this.clipOffsets = options?.clipOffsets ?? new Map()
  }

  getCues(): Cue[] {
    const cues: Cue[] = []

    for (const clip of this.clips) {
      // Get offset for this clip (check specific ID first, then wildcard)
      const clipOffsetMs = this.clipOffsets.get(clip.id) ?? this.clipOffsets.get('*') ?? 0

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

        // Apply clip offset to the capture time calculation
        // Positive offset means clip started later, so we look later in capture timeline
        const captureStartTime = new Date(
          clip.captureStart.getTime() + videoTimeOffsetMs + clipOffsetMs
        )
        const captureEndTime = new Date(captureStartTime.getTime() + cueIntervalDurationMs)

        // Get samples for this specific cue interval
        const samplesInInterval = this.sampleIndex.getSamplesInRange(
          captureStartTime,
          captureEndTime
        )

        // Only create a cue if there are samples in this interval
        if (samplesInInterval.length > 0) {
          const cue = new Cue({
            startTime: currentVideoTime,
            endTime: cueEndTime,
            samples: samplesInInterval,
          })
          cues.push(cue)
        }

        // Move to next cue interval
        currentVideoTime += this.defaultCueDurationMs
      }
    }

    return cues
  }
}
