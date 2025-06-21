#!/usr/bin/env node

import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

import {
  Cue,
  FCPReader,
  HLSSegmenter,
  SampleIndex,
  SequentialCueGenerator,
  TCXReader,
  TimelineMapper,
  WebVTTGenerator,
} from '../index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

function displayHelp(stdout: { write: (data: string) => void }) {
  stdout.write(`
Usage: tcx2webvtt [options] <input-file>...

Convert TCX workout files to WebVTT format with embedded JSON metadata.

Options:
  -h, --help                Display this help message
  -v, --version             Display version information
      --fcp <project>       Final Cut Pro project export for filtering
      --hls <directory>     Generate HLS-compatible segmented output
      --clip-offset <id,seconds>  Offset specific clip from real-world time

Examples:
  tcx2webvtt workout.tcx > workout.vtt
  tcx2webvtt workout1.tcx workout2.tcx > combined.vtt
  tcx2webvtt --fcp project.fcpxmld workout.tcx > filtered.vtt
  tcx2webvtt --fcp project.fcpxmld --clip-offset GX010163,2.5 workout.tcx
  tcx2webvtt --fcp project.fcpxmld --clip-offset '*,-1.0' workout.tcx
  tcx2webvtt --fcp project.fcpxmld --clip-offset GX010163,2.5 --clip-offset GX020163,-1.0 workout.tcx
  tcx2webvtt --hls ./hls-output workout.tcx
  `)
}

export interface ProcessLike {
  argv: string[]
  stdout: {
    write: (data: string) => void
  }
  stderr: {
    write: (data: string) => void
  }
  exit: (code: number) => void
}

export async function main(proc: ProcessLike) {
  try {
    // Parse command line arguments
    const { values, positionals } = parseArgs({
      args: proc.argv.slice(2),
      options: {
        help: { type: 'boolean', short: 'h' },
        version: { type: 'boolean', short: 'v' },
        fcp: { type: 'string' },
        hls: { type: 'string' },
        'clip-offset': { type: 'string', multiple: true },
      },
      allowPositionals: true,
    })

    // Display help
    if (values.help) {
      displayHelp(proc.stdout)
      proc.exit(0)
    }

    // Display version
    if (values.version) {
      const packagePath = join(__dirname, '../..', 'package.json')
      const packageData = JSON.parse(await readFile(packagePath, 'utf-8'))
      proc.stdout.write(packageData.version)
      proc.exit(0)
    }

    // Check if input files are provided
    if (positionals.length === 0) {
      proc.stderr.write('Error: Input file is required\n')
      displayHelp(proc.stdout)
      proc.exit(1)
    }

    // Check if FCP project exists (when --fcp is used)
    if (values.fcp && !existsSync(values.fcp)) {
      proc.stderr.write(`Error: Input file does not exist: ${values.fcp}\n`)
      proc.exit(1)
    }

    // Validate HLS directory argument
    if (values.hls !== undefined && values.hls === '') {
      proc.stderr.write('Error: HLS directory path cannot be empty\n')
      proc.exit(1)
    }

    // Validate clip-offset arguments
    if (values['clip-offset']) {
      if (!values.fcp) {
        proc.stderr.write('Error: --clip-offset can only be used with --fcp\n')
        proc.exit(1)
      }

      const clipOffsets = values['clip-offset']

      for (const clipOffset of clipOffsets) {
        const clipOffsetParts = clipOffset.split(',')
        if (
          clipOffsetParts.length !== 2 ||
          !clipOffsetParts[0].trim() ||
          !clipOffsetParts[1].trim()
        ) {
          proc.stderr.write(
            'Error: Invalid clip-offset format. Expected: <clip-id>,<seconds>\n'
          )
          proc.exit(1)
        }

        const [, offsetStr] = clipOffsetParts.map((s) => s.trim())
        const offsetSeconds = parseFloat(offsetStr)
        if (isNaN(offsetSeconds)) {
          proc.stderr.write('Error: Invalid clip-offset format. Offset must be a number\n')
          proc.exit(1)
        }
      }
    }

    const inputFiles = positionals

    // Check if all input files exist
    for (const inputFile of inputFiles) {
      if (!existsSync(inputFile)) {
        proc.stderr.write(`Error: Input file does not exist: ${inputFile}\n`)
        proc.exit(1)
      }
    }

    // Create SampleIndex to combine samples from all files
    const sampleIndex = new SampleIndex()

    // Process each TCX file
    for (const inputFile of inputFiles) {
      const tcxContent = await readFile(inputFile, 'utf-8')
      const tcxReader = new TCXReader(tcxContent)
      const samples = tcxReader.getSamples()
      sampleIndex.addSamples(samples)
    }

    // Get all combined samples
    const allSamples = sampleIndex.getAllSamples()

    let cues: Cue[]
    if (values.fcp) {
      const fcpReader = new FCPReader(values.fcp)
      const clips = await fcpReader.getClips()

      // Parse clip offsets if provided
      let clipOffsets: Map<string, number> | undefined
      if (values['clip-offset']) {
        const clipOffsetStrings = values['clip-offset']

        clipOffsets = new Map()
        for (const clipOffsetString of clipOffsetStrings) {
          const [clipId, offsetStr] = clipOffsetString.split(',').map((s) => s.trim())
          const offsetMs = parseFloat(offsetStr) * 1000 // Convert seconds to milliseconds
          clipOffsets.set(clipId, offsetMs)
        }
      }

      const timelineMapper = new TimelineMapper({
        sampleIndex,
        clips,
        options: clipOffsets ? { clipOffsets } : undefined,
      })
      cues = timelineMapper.getCues()
    } else {
      // Generate sequential cues from samples
      const cueGenerator = new SequentialCueGenerator()
      cues = cueGenerator.generateCues(allSamples)
    }

    // Generate output
    if (values.hls) {
      // Generate HLS segmented output
      const hlsSegmenter = new HLSSegmenter()
      await hlsSegmenter.generateHLS(cues, values.hls)
    } else {
      // Generate WebVTT and output to stdout
      const webvttGenerator = new WebVTTGenerator()
      const webvttOutput = webvttGenerator.generate(cues)
      proc.stdout.write(webvttOutput)
    }
  } catch (error) {
    proc.stderr.write(`Error: ${error}\n`)
    proc.exit(1)
  }
}

/* c8 ignore start */
if (fileURLToPath(import.meta.url) === process.argv[1]) {
  await main(process)
}
/* c8 ignore stop */
