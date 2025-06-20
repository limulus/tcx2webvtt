import { Cue } from './cue.js'

/**
 * Generates WebVTT files from Cue objects
 */
export class WebVTTGenerator {
  /**
   * Generates a WebVTT string from an array of Cue objects
   */
  generate(cues: Cue[]): string {
    if (cues.length === 0) {
      return this.generateHeader()
    }

    const lines: string[] = [this.generateHeader()]

    cues.forEach((cue, index) => {
      // Add a blank line before each cue (except the first one)
      if (index > 0) {
        lines.push('')
      }

      // Format timestamps
      const startTimestamp = this.formatTimestamp(cue.startTime)
      const endTimestamp = this.formatTimestamp(cue.endTime)

      // Add the cue timing
      lines.push(`${startTimestamp} --> ${endTimestamp}`)

      // Add the cue payload as JSON array of samples
      const sampleData = cue.samples.map((sample) => ({
        metric: sample.metric,
        value: sample.value,
      }))
      lines.push(JSON.stringify(sampleData))
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
