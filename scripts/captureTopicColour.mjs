import { chromium } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const origin = process.env.ARGUS_COLOUR_ORIGIN ?? 'http://127.0.0.1:4185'
const output = resolve(process.env.ARGUS_COLOUR_OUTPUT ?? 'test-results/topic-colour')
await mkdir(output, { recursive: true })
const browser = await chromium.launch(process.env.ARGUS_CHROMIUM ? { executablePath: process.env.ARGUS_CHROMIUM } : {})
const manifest = []
const contrast = []
try {
  for (const variant of ['current', 'raised']) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, reducedMotion: 'reduce' })
    const page = await context.newPage()
    await page.addInitScript(() => localStorage.setItem('argus-splash-seen', 'true'))
    await page.goto(`${origin}/?colour=${variant}`)
    contrast.push(await page.evaluate((variant) => {
      const rgb = (css) => {
        const canvas = document.createElement('canvas')
        canvas.width = canvas.height = 1
        const drawing = canvas.getContext('2d')
        drawing.fillStyle = css
        drawing.fillRect(0, 0, 1, 1)
        return [...drawing.getImageData(0, 0, 1, 1).data].slice(0, 3)
      }
      const luminance = (css) => rgb(css).map(value => value / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0)
      const ratio = (a, b) => { const values = [luminance(a), luminance(b)].sort((a, b) => b - a); return Number(((values[0] + .05) / (values[1] + .05)).toFixed(2)) }
      const colours = variant === 'raised' ? ['oklch(.76 .13 250)', 'oklch(.77 .12 205)', 'oklch(.75 .13 300)'] : ['oklch(.76 .085 250)', 'oklch(.77 .075 205)', 'oklch(.75 .085 300)']
      return { variant, trackOnSurface2: Object.fromEntries(['learning', 'survival', 'tradecraft'].map((track, index) => [track, ratio(colours[index], '#1d2126')])), actionInkOnState: { steel: ratio('#0b0d10', '#e9edf3'), repair: ratio('#0b0d10', '#d68d5e'), banked: ratio('#0b0d10', '#8c98a5') } }
    }, variant))
    await page.getByRole('button', { name: 'Library', exact: true }).click()
    await page.screenshot({ path: `${output}/${variant}-library.png` })
    await page.getByRole('button', { name: /Firearm Safety/ }).click()
    await page.locator('.topic-hero-fallback').waitFor()
    await page.screenshot({ path: `${output}/${variant}-topic.png` })
    await page.locator('.topic-primary').click()
    await page.locator('.sequence-letter.is-current').waitFor()
    await page.screenshot({ path: `${output}/${variant}-sequence.png` })
    for (const state of ['decayed', 'completed']) {
      const library = await page.evaluate((state) => {
        const stored = JSON.parse(localStorage.getItem('argus.library.v5'))
        const topic = stored.topics.find(topic => topic.title === 'Firearm Safety')
        topic.status = state
        topic.completedAt = '2026-10-01T12:00:00.000Z'
        return stored
      }, state)
      const stateContext = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, reducedMotion: 'reduce' })
      await stateContext.addInitScript(library => {
        localStorage.setItem('argus-splash-seen', 'true')
        localStorage.setItem('argus.library.v5', JSON.stringify(library))
      }, library)
      const statePage = await stateContext.newPage()
      await statePage.goto(`${origin}/?colour=${variant}`)
      await statePage.getByRole('button', { name: 'Library', exact: true }).click()
      await statePage.getByRole('button', { name: /Firearm Safety/ }).click()
      await statePage.locator('.topic-action-bar').waitFor()
      await statePage.screenshot({ path: `${output}/${variant}-${state}.png` })
      await stateContext.close()
    }
    manifest.push({ variant, files: ['library', 'topic', 'sequence', 'decayed', 'completed'].map(screen => `${variant}-${screen}.png`) })
    await context.close()
  }
  await writeFile(`${output}/comparison.html`, `<!doctype html><meta charset="utf-8"><title>Topic colour comparison</title><style>body{background:#101215;color:#e6eaf0;font:16px system-ui;margin:24px}section{display:flex;gap:24px;margin-bottom:48px}img{width:390px;max-width:100%;display:block}h2{font-size:20px}</style><h1>Current and raised chroma</h1>${['library','topic','sequence','decayed','completed'].map(screen => `<h2>${screen}</h2><section>${['current','raised'].map(variant => `<div><p>${variant}</p><img src="${variant}-${screen}.png" alt="${variant} ${screen} at 390 pixels"></div>`).join('')}</section>`).join('')}`)
  await writeFile(`${output}/manifest.json`, JSON.stringify({ viewport: '390×844', origin, variants: manifest, contrast }, null, 2))
} finally {
  await browser.close()
}
console.log(output)
