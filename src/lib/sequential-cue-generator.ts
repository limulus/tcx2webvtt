import { Cue } from './cue.js'
import { Sample } from './sample.js'

/**
 * Generates sequential cues for workout data visualization.
 * Each sample gets its own cue with a configurable duration.
 * This is designed for the CLI use case where samples are displayed
 * sequentially over time, not synchronized with video timing.
 */
export class SequentialCueGenerator {
  /**
   * Generates sequential cues from an array of samples
   * @param samples Array of samples to convert to cues
   * @param cueDurationMs Duration of each cue in milliseconds (default: 1000ms)
   * @returns Array of Cue objects with sequential timing
   */
  generateCues(samples: Sample[], cueDurationMs: number = 1000): Cue[] {
    if (samples.length === 0) {
      return []
    }

    // Use absolute value to handle negative durations
    const duration = Math.abs(cueDurationMs)

    return samples.map((sample, index) => {
      const startTime = index * duration
      const endTime = startTime + duration
      return new Cue(startTime, endTime, [sample])
    })
  }
}
