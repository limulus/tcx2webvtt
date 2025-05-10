import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it, expect, beforeEach, vi } from 'vitest'

import { main, ProcessLike } from './tcx2webvtt.js'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

describe('tcx2webvtt CLI', () => {
  let mockProcess: ProcessLike
  let stdout: string
  let stderr: string

  beforeEach(async () => {
    // Reset output capture variables
    stdout = ''
    stderr = ''

    // Mock process with string buffers
    mockProcess = {
      argv: ['node', 'tcx2webvtt.js'],
      stdout: {
        write(data: string) {
          stdout += data
        },
      },
      stderr: {
        write(data: string) {
          stderr += data
        },
      },
      exit: vi.fn(),
    }
  })

  it('should display help when --help flag is used', async () => {
    mockProcess.argv.push('--help')

    await main(mockProcess)

    expect(stdout).toContain('Usage:')
    expect(stdout).toContain('Options:')
    expect(stdout).toContain('--help')
    expect(stdout).toContain('--version')
    expect(mockProcess.exit).toHaveBeenCalledWith(0)
  })

  it('should display version when --version flag is used', async () => {
    mockProcess.argv.push('--version')

    await main(mockProcess)

    expect(stdout).toMatch(/\d+\.\d+\.\d+/)
    expect(mockProcess.exit).toHaveBeenCalledWith(0)
  })

  it('should require an input file', async () => {
    await main(mockProcess)

    expect(stderr).toContain('Input file is required')
    expect(mockProcess.exit).toHaveBeenCalledWith(1)
  })

  it('should check if input file exists', async () => {
    mockProcess.argv.push('nonexistent.tcx')

    await main(mockProcess)

    expect(stderr).toContain('Input file does not exist')
    expect(mockProcess.exit).toHaveBeenCalledWith(1)
  })

  it('should convert TCX to WebVTT and output to stdout', async () => {
    const fixtureFile = join(__dirname, '../../fixtures/tcx/concept2.tcx')
    mockProcess.argv.push(fixtureFile)

    await main(mockProcess)

    // Verify the output is WebVTT format
    expect(stdout).toContain('WEBVTT')
    expect(stdout).toContain('-->')
    expect(stdout).toContain('"metric"')
    expect(mockProcess.exit).not.toHaveBeenCalled()
  })

  it('should handle invalid TCX files', async () => {
    const invalidXmlFile = join(__dirname, '../../fixtures/tcx/invalid.tcx')

    mockProcess.argv.push(invalidXmlFile)

    await main(mockProcess)

    expect(stderr).not.toBe('')
    expect(mockProcess.exit).toHaveBeenCalledWith(1)
  })

  it('should handle TCX files with no trackpoints', async () => {
    // Use the fixture with no activities
    const fixtureFile = join(__dirname, '../../fixtures/tcx/no-activities.tcx')

    mockProcess.argv.push(fixtureFile)

    await main(mockProcess)

    // Should still output a valid WebVTT header even with no samples
    expect(stdout).toBe('WEBVTT')
    expect(mockProcess.exit).not.toHaveBeenCalled()
  })
})
