import { XMLParser } from 'fast-xml-parser'
import { readFile } from 'fs/promises'
import { strict as assert } from 'node:assert'
import { join } from 'path'

import { Clip } from './clip.js'

interface AssetData {
  id: string
  name: string
  start: string
  contentCreatedTimestamp: string
}

export class FCPReader {
  private readonly bundlePath: string
  private readonly assets: Map<string, AssetData> = new Map()

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

    // Initialize assets from resources section
    this.initializeAssets(xmlData)

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
        const clip = this.createClipFromSpineElement(assetClip)
        if (clip) {
          clips.push(clip)
        }
      }
    }

    // Handle regular clip elements (for no-cuts fixture)
    if (spine.clip) {
      const regularClips = Array.isArray(spine.clip) ? spine.clip : [spine.clip]

      for (const regularClip of regularClips) {
        const clip = this.createClipFromSpineElement(regularClip)
        if (clip) {
          clips.push(clip)
        }
      }
    }

    // Sort clips by offset and return
    return clips.sort((a, b) => a.offset - b.offset)
  }

  private initializeAssets(xmlData: unknown): void {
    this.assets.clear()

    const fcpxml = (xmlData as { fcpxml?: unknown }).fcpxml
    assert(
      fcpxml && typeof fcpxml === 'object' && fcpxml !== null,
      'fcpxml should be a valid object'
    )

    const resources = (fcpxml as { resources?: unknown }).resources
    assert(
      resources && typeof resources === 'object' && resources !== null,
      'resources should be a valid object'
    )

    const assetData = (resources as { asset?: unknown }).asset
    assert(assetData, 'resources.asset should be present')

    const assetArray = Array.isArray(assetData) ? assetData : [assetData]

    for (const asset of assetArray) {
      assert(
        asset && typeof asset === 'object' && asset !== null,
        'Asset should be a valid object'
      )

      const assetObj = asset as Record<string, unknown>
      const id = assetObj['@_id']
      const name = assetObj['@_name']
      const start = assetObj['@_start']

      assert(
        typeof id === 'string' && typeof name === 'string' && typeof start === 'string',
        `Asset should have valid string attributes: id=${typeof id}, name=${typeof name}, start=${typeof start}`
      )

      // Extract content created timestamp from metadata
      let contentCreatedTimestamp = ''
      const metadata = assetObj.metadata
      if (metadata && typeof metadata === 'object' && metadata !== null) {
        const md = (metadata as { md?: unknown }).md
        if (md && typeof md === 'object' && md !== null) {
          const mdObj = md as Record<string, unknown>
          if (mdObj['@_key'] === 'com.apple.proapps.studio.metadataContentCreated') {
            const value = mdObj['@_value']
            if (typeof value === 'string') {
              contentCreatedTimestamp = value
            }
          }
        }
      }

      if (contentCreatedTimestamp) {
        this.assets.set(id, {
          id,
          name,
          start,
          contentCreatedTimestamp,
        })
      }
    }
  }

  private getAssetReference(spineElement: unknown): string {
    assert(
      spineElement && typeof spineElement === 'object' && spineElement !== null,
      'Spine element should be a valid object'
    )

    const element = spineElement as Record<string, unknown>

    // For asset-clip elements, the reference is directly in @_ref
    const directRef = element['@_ref']
    if (typeof directRef === 'string') {
      return directRef
    }

    // For regular clip elements, the reference is in video.@_ref
    const video = element.video
    assert(
      video && typeof video === 'object' && video !== null,
      'Spine element video should be a valid object'
    )
    const videoRef = (video as Record<string, unknown>)['@_ref']
    assert(typeof videoRef === 'string', 'video.@_ref should be a string')
    return videoRef
  }

  private createClipFromSpineElement(spineElement: unknown): Clip | null {
    assert(
      spineElement && typeof spineElement === 'object' && spineElement !== null,
      'Spine element should be a valid object'
    )

    const element = spineElement as Record<string, unknown>

    // Get asset reference
    const assetRef = this.getAssetReference(spineElement)

    // Get asset data
    const assetData = this.assets.get(assetRef)
    assert(assetData, `Asset not found for reference: ${assetRef}`)

    // Extract spine element properties
    const clipStartStr = element['@_start']
    const durationStr = element['@_duration']
    const offsetStr = element['@_offset']
    const clipName = element['@_name']

    assert(
      typeof clipStartStr === 'string' &&
        typeof durationStr === 'string' &&
        typeof offsetStr === 'string',
      `Spine element should have valid timing attributes: start=${typeof clipStartStr}, duration=${typeof durationStr}, offset=${typeof offsetStr}`
    )

    const name = typeof clipName === 'string' ? clipName : assetData.name

    // Parse time values
    const clipStartSeconds = this.parseTimeString(clipStartStr)
    const assetStartSeconds = this.parseTimeString(assetData.start)
    const durationMs = Math.round(this.parseTimeString(durationStr) * 1000)
    const offsetMs = Math.round(this.parseTimeString(offsetStr) * 1000)

    // Calculate actual capture time: when media started + time elapsed to this clip
    const baseTime = new Date(assetData.contentCreatedTimestamp)
    const elapsedSeconds = clipStartSeconds - assetStartSeconds
    const captureStart = new Date(baseTime.getTime() + elapsedSeconds * 1000)
    const captureEnd = new Date(captureStart.getTime() + durationMs)

    return new Clip({
      id: name,
      captureStart,
      captureEnd,
      duration: durationMs,
      offset: offsetMs,
    })
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
