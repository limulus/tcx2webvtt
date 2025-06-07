#!/usr/bin/env node

import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

import { SampleIndex } from '../lib/sample-index.js'
import { TCXReader } from '../lib/tcx-reader.js'
import { WebVTTGenerator } from '../lib/webvtt-generator.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

function displayHelp(stdout: { write: (data: string) => void }) {
  stdout.write(`
Usage: tcx2webvtt [options] <input-file>...

Convert TCX workout files to WebVTT format with embedded JSON metadata.

Options:
  -h, --help                Display this help message
  -v, --version             Display version information

Examples:
  tcx2webvtt workout.tcx > workout.vtt
  tcx2webvtt workout1.tcx workout2.tcx > combined.vtt
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

    // Generate WebVTT
    const webvttGenerator = new WebVTTGenerator()
    const webvttOutput = webvttGenerator.generate(allSamples)

    // Output to stdout
    proc.stdout.write(webvttOutput)
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
