import { Sample } from './sample.js'

export interface WebVTTOptions {
  /**
   * Duration in milliseconds for each cue
   * Default: 1000 (1 second)
   */
  cueDuration?: number

  /**
   * Start time of the first cue in milliseconds
   * Default: 0
   */
  startTime?: number
}

/**
 * Generates WebVTT files from TCX sample data
 */
export class WebVTTGenerator {
  private readonly options: Required<WebVTTOptions>

  constructor(options?: WebVTTOptions) {
    this.options = {
      cueDuration: options?.cueDuration ?? 1000,
      startTime: options?.startTime ?? 0,
    }
  }

  /**
   * Generates a WebVTT string from an array of Sample objects
   */
  generate(samples: Sample[]): string {
    if (samples.length === 0) {
      return this.generateHeader()
    }

    const lines: string[] = [this.generateHeader()]

    // Process each sample and create a cue
    samples.forEach((sample, index) => {
      // Calculate cue start time (in milliseconds from start)
      const startOffsetMs = this.options.startTime + index * this.options.cueDuration
      const endOffsetMs = startOffsetMs + this.options.cueDuration

      // Format timestamps
      const startTimestamp = this.formatTimestamp(startOffsetMs)
      const endTimestamp = this.formatTimestamp(endOffsetMs)

      // Add a blank line before each cue (except the first one)
      if (index > 0) {
        lines.push('')
      }

      // Add the cue timing
      lines.push(`${startTimestamp} --> ${endTimestamp}`)

      // Add the cue payload using the Sample's toJSON method
      const { metric, value } = sample
      lines.push(JSON.stringify({ metric, value }))
    })

    return lines.join('\n')
  }

  /**
   * Generates the WebVTT header
   */
  private generateHeader(): string {
    return 'WEBVTT'
  }

  /**
   * Formats a timestamp for WebVTT in the format HH:MM:SS.mmm
   */
  private formatTimestamp(milliseconds: number): string {
    const totalSeconds = Math.floor(milliseconds / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    const ms = milliseconds % 1000

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`
  }
}
