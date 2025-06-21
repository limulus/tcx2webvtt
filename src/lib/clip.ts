export class Clip {
  public readonly id: string
  public readonly captureStart: Date
  public readonly captureEnd: Date
  public readonly duration: number
  public readonly offset: number

  constructor(
    id: string,
    captureStart: Date,
    captureEnd: Date,
    duration: number,
    offset: number
  ) {
    this.id = id
    this.captureStart = captureStart
    this.captureEnd = captureEnd
    this.duration = duration
    this.offset = offset
  }
}
