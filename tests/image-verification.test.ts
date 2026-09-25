import { describe, expect, it } from 'vitest'
import sharp from 'sharp'
import { computePerceptualHash, inspectEvidenceImage, verifyProof } from '@/lib/verify'

describe('image evidence integrity', () => {
  it('decodes bounded images and records a compatible perceptual hash', async () => {
    const image = await sharp({ create: { width: 800, height: 600, channels: 3, background: '#336699' } }).png().toBuffer()
    await expect(inspectEvidenceImage(image)).resolves.toMatchObject({ width: 800, height: 600, format: 'png' })
    const hash = await computePerceptualHash(image)
    expect(hash).toHaveLength(64)

    const result = await verifyProof({ type: 'photo', instructions: 'Photograph the shelf', minPhotos: 1 }, { type: 'photo', submittedAt: new Date().toISOString() }, [image], [hash])
    expect(result.checks.find(check => check.name === 'dedup_0')).toMatchObject({ passed: false, detail: 'duplicate image detected' })
  })

  it('rejects bytes that are not a decodable image', async () => {
    await expect(inspectEvidenceImage(Buffer.from('not-an-image'))).rejects.toThrow()
  })
})
