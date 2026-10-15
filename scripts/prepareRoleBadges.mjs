/**
 * Stage approved locked/earned badge PNGs from the owner's checked-in ZIP.
 * Dependency-free, deterministic and used by local, demo and production builds.
 */
import { createHash } from 'node:crypto'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'
import { inflateRawSync } from 'node:zlib'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const zipPath = join(root, 'argus_navigator_mariner_diver_locked_unlocked.zip')
const outputDir = join(root, 'public', 'media', 'roles')
const ZIP_SHA256 = 'f9c90c9b5f264d2a5411103fa23404bea33690460777b121a07896ad1512f094'

// Only owner-approved art. The hashes also prevent silently changing a locked master.
const BADGE_HASHES = Object.freeze({
  'navigator_locked.png': 'e2719731209fbb8df820c2076fd5fb66f0e4edde0b3983dc009dc98edee91a0b',
  'navigator_unlocked.png': '9c7000ee93fb68a93bcaeed83ebecf053fa1ba5635298e0c604d4a153385826c',
  'mariner_locked.png': '1ca428afb233ebc8af6b98128f21d2ad058ce68b6af2d264d6b3e0ad42c02626',
  'mariner_unlocked.png': '14f23bce3de62f560deabf8b2767661820118cf7508f41ae964dd8de065b4bca',
  'diver_locked.png': 'b23083b64619a3dac84c28d70c0775dd782642aee2e0610843fb7daad05f90f5',
  'diver_unlocked.png': '9a837cd3a941fc065f62f64498a0573434009e289f89b7aa0013fa53c6e7d998',
})

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex')
}

function readApprovedZip(bytes) {
  // End-of-central-directory signature, allowing for the optional ZIP comment.
  const end = bytes.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]))
  if (end < 0 || end + 22 > bytes.length) throw new Error('Badge ZIP has no central directory')
  const entryCount = bytes.readUInt16LE(end + 10)
  let offset = bytes.readUInt32LE(end + 16)
  const result = new Map()
  const allowed = new Set(Object.keys(BADGE_HASHES))

  for (let i = 0; i < entryCount; i++) {
    if (offset + 46 > bytes.length || bytes.readUInt32LE(offset) !== 0x02014b50) {
      throw new Error('Invalid badge ZIP central directory entry')
    }
    const flags = bytes.readUInt16LE(offset + 8)
    const method = bytes.readUInt16LE(offset + 10)
    const compressedLength = bytes.readUInt32LE(offset + 20)
    const expectedLength = bytes.readUInt32LE(offset + 24)
    const nameLength = bytes.readUInt16LE(offset + 28)
    const extraLength = bytes.readUInt16LE(offset + 30)
    const commentLength = bytes.readUInt16LE(offset + 32)
    const localOffset = bytes.readUInt32LE(offset + 42)
    const name = bytes.toString('utf8', offset + 46, offset + 46 + nameLength)
    offset += 46 + nameLength + extraLength + commentLength
    if (!allowed.has(name)) continue

    if (result.has(name)) throw new Error('Duplicate badge ZIP entry: ' + name)
    if (flags & 1 || (method !== 0 && method !== 8)) {
      throw new Error('Unsupported badge ZIP encoding: ' + name)
    }
    if (localOffset + 30 > bytes.length || bytes.readUInt32LE(localOffset) !== 0x04034b50) {
      throw new Error('Invalid badge ZIP local header: ' + name)
    }
    const start = localOffset + 30 + bytes.readUInt16LE(localOffset + 26) + bytes.readUInt16LE(localOffset + 28)
    if (start + compressedLength > bytes.length) throw new Error('Truncated badge ZIP data: ' + name)
    const packed = bytes.subarray(start, start + compressedLength)
    const png = method === 0 ? packed : inflateRawSync(packed)
    const pngHeader = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
    if (png.length !== expectedLength || !png.subarray(0, 8).equals(pngHeader)
      || png.readUInt32BE(16) !== 512 || png.readUInt32BE(20) !== 512) {
      throw new Error('Invalid 512x512 badge PNG: ' + name)
    }
    if (sha256(png) !== BADGE_HASHES[name]) throw new Error('Badge artwork changed: ' + name)
    result.set(name, png)
  }
  if (result.size !== allowed.size) {
    throw new Error('Expected six approved PNGs; found ' + result.size)
  }
  return result
}

// Idempotent: unchanged output files retain mtimes, preventing Vite reload loops.
export async function prepareRoleBadges() {
  const zip = await readFile(zipPath)
  if (sha256(zip) !== ZIP_SHA256) {
    throw new Error('Approved badge ZIP has changed: artwork requires owner acceptance')
  }
  const badges = readApprovedZip(zip)
  await mkdir(outputDir, { recursive: true })
  for (const [name, png] of badges) {
    const destination = join(outputDir, name)
    let existing
    try {
      existing = await readFile(destination)
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
    }
    if (!existing || sha256(existing) !== BADGE_HASHES[name]) {
      await writeFile(destination, png)
    }
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await prepareRoleBadges()
}
