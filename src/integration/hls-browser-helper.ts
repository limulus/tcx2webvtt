import { Cue } from '../lib/cue.js'

export interface HLSSegment {
  filename: string
  duration: number
  content: string
}

/**
 * Browser-compatible HLS segmentation logic (without filesystem operations)
 */
export class BrowserHLSSegmenter {
  private readonly segmentDuration: number

  constructor(segmentDuration: number = 60000) {
    this.segmentDuration = segmentDuration // in milliseconds
  }

  /**
   * Segments cues into time-based chunks
   */
  segmentCues(cues: Cue[]): HLSSegment[] {
    /* c8 ignore next 3 */
    if (cues.length === 0) {
      return []
    }

    const segments: HLSSegment[] = []
    const totalDuration = Math.max(...cues.map((cue) => cue.endTime))
    const segmentCount = Math.ceil(totalDuration / this.segmentDuration)

    for (let i = 0; i < segmentCount; i++) {
      const segmentStart = i * this.segmentDuration
      const segmentEnd = Math.min((i + 1) * this.segmentDuration, totalDuration)

      // Find cues that overlap with this segment
      const segmentCues = cues.filter(
        (cue) => cue.startTime < segmentEnd && cue.endTime > segmentStart
      )

      const segment = this.createSegment(i, segmentCues, segmentStart, segmentEnd)
      segments.push(segment)
    }

    return segments
  }

  /**
   * Creates a WebVTT segment from cues
   */
  private createSegment(
    index: number,
    cues: Cue[],
    segmentStart: number,
    segmentEnd: number
  ): HLSSegment {
    const filename = `fileSequence${index}.webvtt`
    const duration = (segmentEnd - segmentStart) / 1000 // Convert to seconds

    let content = 'WEBVTT\n'
    content += 'X-TIMESTAMP-MAP=MPEGTS:900000,LOCAL:00:00:00.000\n'

    if (cues.length > 0) {
      cues.forEach((cue, cueIndex) => {
        // Add blank line before each cue (except the first one)
        if (cueIndex > 0) {
          content += '\n'
        }

        // Format timestamps
        const startTimestamp = this.formatTimestamp(cue.startTime)
        const endTimestamp = this.formatTimestamp(cue.endTime)

        // Add the cue timing
        content += `\n${startTimestamp} --> ${endTimestamp}\n`

        // Add the cue payload as JSON array of samples
        const sampleData = cue.samples.map((sample) => ({
          metric: sample.metric,
          value: sample.value,
        }))
        content += JSON.stringify(sampleData)
      })
    }

    return {
      filename,
      duration,
      content,
    }
  }

  /**
   * Generates M3U8 playlist from segments
   */
  generatePlaylist(segments: HLSSegment[]): string {
    const maxDuration = Math.max(...segments.map((s) => s.duration))

    let playlist = '#EXTM3U\n'
    playlist += '#EXT-X-VERSION:6\n' // Version 6 for subtitle support
    playlist += `#EXT-X-TARGETDURATION:${Math.ceil(maxDuration)}\n`
    playlist += '#EXT-X-MEDIA-SEQUENCE:0\n'
    playlist += '#EXT-X-PLAYLIST-TYPE:VOD\n'

    segments.forEach((segment) => {
      playlist += `#EXTINF:${segment.duration.toFixed(5)},\t\n`
      playlist += `${segment.filename}\n`
    })

    playlist += '#EXT-X-ENDLIST\n'
    return playlist
  }

  /**
   * Generates a master playlist with subtitle track declarations
   */
  generateMasterPlaylist(playlistUrl: string): string {
    let masterPlaylist = '#EXTM3U\n'
    masterPlaylist += '#EXT-X-VERSION:6\n'

    // Declare subtitle track
    masterPlaylist +=
      '#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID="subs",NAME="Metadata",DEFAULT=YES,AUTOSELECT=YES,FORCED=NO,LANGUAGE="en",URI="' +
      playlistUrl +
      '"\n'

    // Declare variant stream (even though we don't have video, this is required for HLS.js)
    masterPlaylist += '#EXT-X-STREAM-INF:BANDWIDTH=1000,SUBTITLES="subs"\n'
    masterPlaylist += 'dummy.m3u8\n' // This won't be loaded since we only care about subtitles

    return masterPlaylist
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
