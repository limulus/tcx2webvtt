import { describe, it, expect } from 'vitest'

import { Clip } from './clip.js'

describe('Clip', () => {
  const captureStart = new Date('2023-01-01T10:00:00Z')
  const captureEnd = new Date('2023-01-01T10:01:00Z')
  const duration = 60000 // 60 seconds in ms
  const offset = 5000 // 5 seconds in ms

  it('should create a clip with id and all properties', () => {
    const id = '0'
    const clip = new Clip({ id, captureStart, captureEnd, duration, offset })

    expect(clip.id).toBe('0')
    expect(clip.captureStart).toBe(captureStart)
    expect(clip.captureEnd).toBe(captureEnd)
    expect(clip.duration).toBe(duration)
    expect(clip.offset).toBe(offset)
  })

  it('should create a clip with numeric string id', () => {
    const id = '42'
    const clip = new Clip({ id, captureStart, captureEnd, duration, offset })

    expect(clip.id).toBe('42')
  })

  it('should create a clip with any string id', () => {
    const id = 'custom-clip-id'
    const clip = new Clip({ id, captureStart, captureEnd, duration, offset })

    expect(clip.id).toBe('custom-clip-id')
  })

  it('should have readonly properties', () => {
    const clip = new Clip({ id: 'test', captureStart, captureEnd, duration, offset })

    // TypeScript should prevent assignment, but we can verify the properties exist
    expect(clip).toHaveProperty('id')
    expect(clip).toHaveProperty('captureStart')
    expect(clip).toHaveProperty('captureEnd')
    expect(clip).toHaveProperty('duration')
    expect(clip).toHaveProperty('offset')
  })
})
