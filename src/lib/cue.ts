import { Sample } from './sample.js'

export interface CueOptions {
  startTime: number
  endTime: number
  samples: Sample[]
}

export class Cue {
  public readonly startTime: number
  public readonly endTime: number
  public readonly samples: Sample[]

  constructor({ startTime, endTime, samples }: CueOptions) {
    this.startTime = startTime
    this.endTime = endTime
    this.samples = samples
  }
}
