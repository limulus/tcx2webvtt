export class Clip {
  public readonly captureStart: Date
  public readonly captureEnd: Date
  public readonly duration: number
  public readonly offset: number

  constructor(captureStart: Date, captureEnd: Date, duration: number, offset: number) {
    this.captureStart = captureStart
    this.captureEnd = captureEnd
    this.duration = duration
    this.offset = offset
  }
}
