import { Sample } from './sample.js'

export class Cue {
  constructor(
    public readonly startTime: number,
    public readonly endTime: number,
    public readonly samples: Sample[]
  ) {}
}
