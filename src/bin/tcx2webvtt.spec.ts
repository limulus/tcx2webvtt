import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it, expect, beforeEach, vi } from 'vitest'

import { main, ProcessLike } from './tcx2webvtt.js'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

describe('tcx2webvtt CLI', { timeout: 10000 }, () => {
  let mockProcess: ProcessLike
  let stdout: string
  let stderr: string

  const resetMockProcess = () => {
    stdout = ''
    stderr = ''
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
  }

  beforeEach(async () => {
    resetMockProcess()
  })

  it('should display help when --help flag is used', async () => {
    mockProcess.argv.push('--help')

    await main(mockProcess)

    expect(stdout).toContain('Usage:')
    expect(stdout).toContain('Options:')
    expect(stdout).toContain('--help')
    expect(stdout).toContain('--version')
    expect(stdout).toContain('--fcp <project>')
    expect(stdout).toContain('Final Cut Pro project export')
    expect(stdout).toContain('<input-file>...')
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

  describe('multiple TCX files', () => {
    it('should process multiple TCX files and combine their samples', async () => {
      const file1 = join(__dirname, '../../fixtures/tcx/honeybee-canyon-cycle.tcx')
      const file2 = join(__dirname, '../../fixtures/tcx/honeybee-canyon-hike.tcx')

      // First verify each file individually doesn't contain the other's data
      // Test cycling file alone doesn't contain hiking data
      resetMockProcess()
      mockProcess.argv.push(file1)
      await main(mockProcess)
      expect(stdout).toContain('"latitude":32.42404016739394')
      expect(stdout).not.toContain('"latitude":32.44296776872435')

      // Test hiking file alone doesn't contain cycling data
      resetMockProcess()
      mockProcess.argv.push(file2)
      await main(mockProcess)
      expect(stdout).toContain('"latitude":32.44296776872435')
      expect(stdout).not.toContain('"latitude":32.42404016739394')

      // Reset for the combined test
      resetMockProcess()

      // Now test combining both files
      mockProcess.argv.push(file1, file2)

      await main(mockProcess)

      // Should output WebVTT format
      expect(stdout).toContain('WEBVTT')
      expect(stdout).toContain('-->')
      expect(stdout).toContain('"metric"')

      // Should contain samples from both files
      // Cycling file has this latitude from the start
      expect(stdout).toContain('"latitude":32.42404016739394')
      // Hiking file has this latitude from the middle
      expect(stdout).toContain('"latitude":32.44296776872435')

      expect(mockProcess.exit).not.toHaveBeenCalled()
    })

    it('should error when processing mix of valid and invalid files', async () => {
      const validFile = join(__dirname, '../../fixtures/tcx/honeybee-canyon-cycle.tcx')
      const invalidFile = join(__dirname, '../../fixtures/tcx/invalid.tcx')

      mockProcess.argv.push(validFile, invalidFile)

      await main(mockProcess)

      expect(stderr).toContain('Error:')
      expect(mockProcess.exit).toHaveBeenCalledWith(1)
    })

    it('should error when processing mix of existing and non-existing files', async () => {
      const validFile = join(__dirname, '../../fixtures/tcx/honeybee-canyon-cycle.tcx')
      const nonExistentFile = 'nonexistent.tcx'

      mockProcess.argv.push(validFile, nonExistentFile)

      await main(mockProcess)

      expect(stderr).toContain('Input file does not exist')
      expect(mockProcess.exit).toHaveBeenCalledWith(1)
    })
  })

  describe('--fcp option', () => {
    it('should process FCP project with TCX file and output filtered WebVTT', async () => {
      const fcpProject = join(__dirname, '../../fixtures/fcp/hard-cuts-1-13.fcpxmld')
      const tcxFile = join(__dirname, '../../fixtures/tcx/honeybee-canyon-cycle.tcx')

      mockProcess.argv.push('--fcp', fcpProject, tcxFile)

      await main(mockProcess)

      // Should output WebVTT format
      expect(stdout).toContain('WEBVTT')

      // Verify that output is filtered based on FCP timeline clips.
      const fcpOutput = stdout

      // Reset and process the same TCX file without FCP filtering
      resetMockProcess()
      mockProcess.argv.push(tcxFile)
      await main(mockProcess)
      const directTcxOutput = stdout

      // FCP-filtered output should be shorter (fewer cues) than direct TCX output
      // This verifies that TimelineMapper is actually filtering based on clip ranges
      const fcpCueCount = (fcpOutput.match(/-->/g) ?? []).length
      const directCueCount = (directTcxOutput.match(/-->/g) ?? []).length
      expect(fcpCueCount).toBeLessThan(directCueCount)
      expect(fcpCueCount).toBeGreaterThan(0) // Should have some cues from overlapping times
      expect(directCueCount).toBeGreaterThan(0) // Direct TCX should have cues

      expect(mockProcess.exit).not.toHaveBeenCalled()
    })

    it('should error when FCP project does not exist', async () => {
      const nonExistentFcp = 'nonexistent.fcpxmld'
      const tcxFile = join(__dirname, '../../fixtures/tcx/honeybee-canyon-cycle.tcx')

      mockProcess.argv.push('--fcp', nonExistentFcp, tcxFile)

      await main(mockProcess)

      expect(stderr).toContain('Input file does not exist')
      expect(mockProcess.exit).toHaveBeenCalledWith(1)
    })

    it('should error when --fcp is used without TCX input file', async () => {
      const fcpProject = join(
        __dirname,
        '../../fixtures/fcp/single-asset-clip-1-13.fcpxmld'
      )

      mockProcess.argv.push('--fcp', fcpProject)

      await main(mockProcess)

      expect(stderr).toContain('Input file is required')
      expect(mockProcess.exit).toHaveBeenCalledWith(1)
    })
  })
})
