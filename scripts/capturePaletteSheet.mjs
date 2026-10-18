import { chromium } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const origin = process.env.ARGUS_PALETTE_ORIGIN ?? 'http://127.0.0.1:5391'
const output = resolve('test-results/palette-sheet')
const candidates = ['current', 'signal', 'peacock', 'families']
const visions = ['none', 'deuteranopia', 'protanopia']
await mkdir(output, { recursive: true })
const browser = await chromium.launch(process.env.ARGUS_CHROMIUM ? { executablePath: process.env.ARGUS_CHROMIUM } : {})
const captures = []
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, reducedMotion: 'reduce' })
  const page = await context.newPage()
  for (const candidate of candidates) {
    const url = new URL('/', origin)
    url.searchParams.set('palette', 'sheet')
    url.searchParams.set('candidate', candidate)
    await page.goto(url.href)
    await page.locator(`.palette-sheet[data-candidate="${candidate}"]`).waitFor()
    await page.evaluate(() => document.fonts.ready)
    for (const vision of visions) {
      const label = { none: 'None', deuteranopia: 'Deuteranopia', protanopia: 'Protanopia' }[vision]
      await page.getByRole('group', { name: 'Colour vision simulation' }).getByRole('button', { name: label, exact: true }).click()
      await page.locator(`.palette-sheet[data-vision="${vision}"]`).waitFor()
      await page.evaluate(() => window.scrollTo(0, 0))
      const file = `${candidate}-${vision}.png`
      await page.screenshot({ path: resolve(output, file), fullPage: true, animations: 'disabled' })
      captures.push({ candidate, vision, file })
    }
  }
  await context.close()
  await writeFile(resolve(output, 'manifest.json'), JSON.stringify({ origin, viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', captures }, null, 2))
  await writeFile(resolve(output, 'comparison.html'), `<!doctype html><meta charset="utf-8"><title>Argus palette sheet</title><style>body{background:#101215;color:#e6eaf0;font:16px system-ui;margin:24px}section{display:flex;gap:24px;align-items:start}figure{margin:0}img{width:390px;display:block}h2{margin-top:40px}</style><h1>Argus palette candidates</h1>${visions.map(vision => `<h2>${vision}</h2><section>${captures.filter(capture => capture.vision === vision).map(capture => `<figure><figcaption>${capture.candidate}</figcaption><img src="${capture.file}" alt="${capture.candidate}, ${vision}"></figure>`).join('')}</section>`).join('')}`)
} finally {
  await browser.close()
}
console.log(output)
