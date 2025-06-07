import { Sample } from './sample.js'

export class SampleIndex {
  private readonly samples: Sample[] = []

  addSamples(samples: Sample[]): void {
    this.samples.push(...samples)
    // Sort samples by timestamp to maintain chronological order
    this.samples.sort((a, b) => a.time.getTime() - b.time.getTime())
  }

  getSamplesInRange(start: Date, end: Date): Sample[] {
    const startTime = start.getTime()
    const endTime = end.getTime()

    // Find the first sample at or after startTime using binary search
    const startIndex = this.findFirstSampleAtOrAfter(startTime)

    // Find the first sample at or after endTime using binary search
    const endIndex = this.findFirstSampleAtOrAfter(endTime)

    // Return slice of samples between the indices
    return this.samples.slice(startIndex, endIndex)
  }

  getAllSamples(): Sample[] {
    return this.samples.slice()
  }

  private findFirstSampleAtOrAfter(time: number): number {
    let left = 0
    let right = this.samples.length

    while (left < right) {
      const mid = Math.floor((left + right) / 2)
      if (this.samples[mid].time.getTime() < time) {
        left = mid + 1
      } else {
        right = mid
      }
    }

    return left
  }
}
