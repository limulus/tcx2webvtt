import { XMLParser } from 'fast-xml-parser'
import { readFile } from 'fs/promises'
import { join } from 'path'

import { Clip } from './clip.js'

export class FCPReader {
  private readonly bundlePath: string

  constructor(bundlePath: string) {
    this.bundlePath = bundlePath
  }

  public async getClips(): Promise<Clip[]> {
    const fcpxmlPath = join(this.bundlePath, 'Info.fcpxml')
    const xmlContent = await readFile(fcpxmlPath, 'utf-8')

    const parser = new XMLParser({
      ignoreAttributes: false,
    })

    const xmlData = parser.parse(xmlContent)

    // Extract assets for metadata lookup
    const assets = new Map<string, any>()
    if (xmlData.fcpxml?.resources?.asset) {
      const assetArray = Array.isArray(xmlData.fcpxml.resources.asset)
        ? xmlData.fcpxml.resources.asset
        : [xmlData.fcpxml.resources.asset]

      for (const asset of assetArray) {
        if (asset['@_id']) {
          assets.set(asset['@_id'], asset)
        }
      }
    }

    // Find spine and extract clips
    const spine = xmlData.fcpxml?.library?.event?.project?.sequence?.spine
    if (!spine) {
      return []
    }

    const clips: Clip[] = []

    // Handle asset-clip elements
    if (spine['asset-clip']) {
      const assetClips = Array.isArray(spine['asset-clip'])
        ? spine['asset-clip']
        : [spine['asset-clip']]

      for (const assetClip of assetClips) {
        const clip = this.parseAssetClip(assetClip, assets)
        if (clip) {
          clips.push(clip)
        }
      }
    }

    // Handle regular clip elements (for no-cuts fixture)
    if (spine.clip) {
      const regularClips = Array.isArray(spine.clip) ? spine.clip : [spine.clip]

      for (const regularClip of regularClips) {
        const clip = this.parseRegularClip(regularClip, assets)
        if (clip) {
          clips.push(clip)
        }
      }
    }

    // Sort clips by offset and return
    return clips.sort((a, b) => a.offset - b.offset)
  }

  private parseAssetClip(assetClip: any, assets: Map<string, any>): Clip | null {
    const assetRef = assetClip['@_ref']
    const asset = assets.get(assetRef)!

    const metadataContentCreated =
      asset.metadata?.md?.['@_key'] === 'com.apple.proapps.studio.metadataContentCreated'
        ? asset.metadata?.md?.['@_value']
        : undefined
    if (!metadataContentCreated) {
      return null
    }

    const baseTime = new Date(metadataContentCreated)
    const clipStartStr = assetClip['@_start']
    const assetStartStr = asset['@_start']
    const durationStr = assetClip['@_duration']
    const offsetStr = assetClip['@_offset']
    const clipName = assetClip['@_name'] ?? asset['@_name'] ?? 'unnamed'

    const clipStartSeconds = this.parseTimeString(clipStartStr)
    const assetStartSeconds = this.parseTimeString(assetStartStr)
    const durationMs = Math.round(this.parseTimeString(durationStr) * 1000)
    const offsetMs = Math.round(this.parseTimeString(offsetStr) * 1000)

    // Calculate actual capture time: when media started + time elapsed to this clip
    const elapsedSeconds = clipStartSeconds - assetStartSeconds
    const captureStart = new Date(baseTime.getTime() + elapsedSeconds * 1000)
    const captureEnd = new Date(captureStart.getTime() + durationMs)

    return new Clip(clipName, captureStart, captureEnd, durationMs, offsetMs)
  }

  private parseRegularClip(clip: any, assets: Map<string, any>): Clip | null {
    // For regular clip elements, we need to look at the video ref
    const videoRef = clip.video?.['@_ref']
    const asset = assets.get(videoRef)!

    const metadataContentCreated =
      asset.metadata?.md?.['@_key'] === 'com.apple.proapps.studio.metadataContentCreated'
        ? asset.metadata?.md?.['@_value']
        : undefined
    if (!metadataContentCreated) {
      return null
    }

    const baseTime = new Date(metadataContentCreated)
    const clipStartStr = clip['@_start']
    const assetStartStr = asset['@_start']
    const durationStr = clip['@_duration']
    const offsetStr = clip['@_offset']
    const clipName = clip['@_name'] ?? asset['@_name'] ?? 'unnamed'

    const clipStartSeconds = this.parseTimeString(clipStartStr)
    const assetStartSeconds = this.parseTimeString(assetStartStr)
    const durationMs = Math.round(this.parseTimeString(durationStr) * 1000)
    const offsetMs = Math.round(this.parseTimeString(offsetStr) * 1000)

    // Calculate actual capture time: when media started + time elapsed to this clip
    const elapsedSeconds = clipStartSeconds - assetStartSeconds
    const captureStart = new Date(baseTime.getTime() + elapsedSeconds * 1000)
    const captureEnd = new Date(captureStart.getTime() + durationMs)

    return new Clip(clipName, captureStart, captureEnd, durationMs, offsetMs)
  }

  private parseTimeString(timeStr: string): number {
    // Handle formats like "453/30s", "0s", "1499755257/30000s"
    const timeValue = timeStr.slice(0, -1)

    if (timeValue.includes('/')) {
      const [numerator, denominator] = timeValue.split('/')
      return parseFloat(numerator) / parseFloat(denominator)
    }

    return parseFloat(timeValue)
  }
}
