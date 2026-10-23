import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { seedLibrary } from '../src/domain/library/catalogSeed'

const { topicIds } = JSON.parse(readFileSync(fileURLToPath(new URL('../src/domain/library/shippedCatalog.json', import.meta.url)), 'utf8')) as { topicIds: string[] }
const topics = seedLibrary().topics
const at = '2026-01-01T00:00:00.000Z'
const morse = topics.find(topic => topic.id === 'international-morse-letters-printed')!
const nato = topics.find(topic => topic.id === 'nato-phonetic')!

for (const enlarged of [false, true]) {
  test(`Library tracks fill their cards without visible quantities${enlarged ? ' at 200% text' : ''}`, async ({ page }, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.addInitScript(library => {
      localStorage.setItem('argus-splash-seen', 'true')
      localStorage.setItem('argus.library.v5', JSON.stringify(library))
    }, { version: 5, catalogDelivered: topicIds, topics: [
      { ...morse, status: 'learning', learningAt: at, completedAt: null, drilledAt: null, lessonProgress: Object.fromEntries(morse.items.slice(0, 10).map(item => [item.id, 'settled'])), history: [], itemEvidence: {} },
      { ...nato, status: 'completed', completedAt: at },
      { ...nato, id: 'custom-measured', title: 'Custom learned topic', origin: 'user', status: 'completed', completedAt: at },
    ] })
    await page.goto('./')
    if (enlarged) await page.addStyleTag({ content: 'html { font-size: 200% !important; }' })
    await page.getByRole('button', { name: 'Library', exact: true }).click()
    const rows = page.locator('.lib-row')
    await expect(rows).toHaveCount(3)
    await expect(rows.filter({ hasText: 'Morse Code' })).toHaveAccessibleName(/10 of 26 letters/)
    await expect(page.locator('[data-row="nato-phonetic"] .gauge-label')).toHaveText('Learned')
    const numericReading = page.locator('[data-row="international-morse-letters-printed"] .gauge-row .sr-only')
    const hiddenReading = await numericReading.evaluate(element => {
      const rect = element.getBoundingClientRect()
      const style = getComputedStyle(element)
      return { width: rect.width, height: rect.height, position: style.position, overflow: style.overflow }
    })
    expect(hiddenReading).toEqual({ width: 1, height: 1, position: 'absolute', overflow: 'hidden' })
    for (const row of await rows.all()) {
      const geometry = await row.evaluate(element => {
        const style = getComputedStyle(element)
        const card = element.getBoundingClientRect()
        const track = element.querySelector('.gauge-track')!.getBoundingClientRect()
        const numbers = [...element.querySelectorAll('.gauge-row span')].filter(node => /\d/.test(node.textContent ?? '') && !node.classList.contains('sr-only'))
        return {
          left: track.left - card.left - parseFloat(style.borderLeftWidth) - parseFloat(style.paddingLeft),
          right: card.right - track.right - parseFloat(style.borderRightWidth) - parseFloat(style.paddingRight),
          numericCaptions: numbers.length,
        }
      })
      expect(Math.abs(geometry.left)).toBeLessThan(1)
      expect(Math.abs(geometry.right)).toBeLessThan(1)
      expect(geometry.numericCaptions).toBe(0)
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0)
    await page.screenshot({ path: testInfo.outputPath('library.png'), fullPage: true })
  })
}
