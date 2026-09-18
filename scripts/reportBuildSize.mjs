import { readdir, readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const dist = path.join(root, 'dist')

async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  return (await Promise.all(entries.map(async (entry) => {
    const absolute = path.join(directory, entry.name)
    return entry.isDirectory() ? files(absolute) : [absolute]
  }))).flat()
}

async function bytes(paths) {
  const sizes = await Promise.all(paths.map(async (file) => (await stat(file)).size))
  return sizes.reduce((total, size) => total + size, 0)
}

const builtFiles = (await files(dist)).filter((file) => path.basename(file) !== 'build-size-report.json')
const relative = (file) => path.relative(dist, file).split(path.sep).join('/')
const mediaFiles = builtFiles.filter((file) => relative(file).startsWith('media/'))
const shellFiles = builtFiles.filter((file) => !mediaFiles.includes(file) && relative(file) !== 'sw.js')
const curriculumFiles = [
  path.join(root, 'src/domain/library/shippedCatalog.json'),
  path.join(root, 'src/domain/library/catalogSeed.ts'),
]

const report = {
  generatedAt: new Date().toISOString(),
  bytes: {
    productionBuild: await bytes(builtFiles),
    appShellPrecache: await bytes([...shellFiles, ...mediaFiles]),
    curriculumSource: await bytes(curriculumFiles),
    staticMedia: await bytes(mediaFiles),
    optionalPacks: 0,
  },
  files: {
    appShell: [...shellFiles, ...mediaFiles].map(relative),
    staticMedia: mediaFiles.map(relative),
    optionalPacks: [],
  },
}

await writeFile(
  path.join(dist, 'build-size-report.json'),
  `${JSON.stringify(report, null, 2)}\n`,
)

const mib = (value) => `${(value / 1024 / 1024).toFixed(2)} MiB`
console.log('Argus offline footprint')
console.log(`  production build: ${mib(report.bytes.productionBuild)}`)
console.log(`  app-shell precache: ${mib(report.bytes.appShellPrecache)}`)
console.log(`  curriculum source: ${mib(report.bytes.curriculumSource)}`)
console.log(`  static media: ${mib(report.bytes.staticMedia)}`)
console.log(`  optional packs: ${mib(report.bytes.optionalPacks)}`)

const budget = Number(process.env.ARGUS_APP_SHELL_BUDGET_BYTES ?? 5 * 1024 * 1024)
if (!Number.isFinite(budget) || budget <= 0) {
  throw new Error('ARGUS_APP_SHELL_BUDGET_BYTES must be a positive number.')
}
if (report.bytes.appShellPrecache > budget) {
  throw new Error(
    `App-shell precache is ${report.bytes.appShellPrecache} bytes; budget is ${budget} bytes.`,
  )
}
