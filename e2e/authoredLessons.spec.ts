import { readLocalLibrary } from './helpers/readLocalLibrary'
import { expect, test, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { seedLibrary } from '../src/domain/library/catalogSeed'
import { curriculumFor } from '../src/domain/learning/generatedCurriculum'
import type { LessonStage } from '../src/domain/learning/stages'
import type { Topic } from '../src/domain/library/topic'

const SHIPPED_CATALOG_TOPIC_IDS: string[] = JSON.parse(readFileSync(fileURLToPath(new URL('../src/domain/library/shippedCatalog.json', import.meta.url)), 'utf8')).topicIds

test.use({ reducedMotion: 'reduce', viewport: { width: 390, height: 844 } })

/** Seed one topic with the stages before `stageId` already ticked, then open it. */
async function openAt(page: Page, topicId: string, stageId: string): Promise<{ topic: Topic; stage: LessonStage }> {
  const base = seedLibrary().topics.find(topic => topic.id === topicId)!
  const stages = curriculumFor(base)!.stages
  const stage = stages.find(candidate => candidate.id === stageId)!
  const done = Object.fromEntries(stages.slice(0, stages.indexOf(stage)).map(entry => [entry.id, new Date(0).toISOString()]))
  const topic: Topic = { ...base, status: 'learning', completedAt: null, drilledAt: null, history: [], stageProgress: done }
  await page.addInitScript(({ topic, delivered }) => {
    localStorage.setItem('argus-splash-seen', 'true')
    localStorage.setItem('argus.library.v5', JSON.stringify({ version: 5, topics: [topic], catalogDelivered: delivered }))
    history.replaceState({ argusNavigation: 1, index: 0, route: { kind: 'topic', topicId: topic.id } }, '')
  }, { topic, delivered: [...SHIPPED_CATALOG_TOPIC_IDS] })
  await page.goto('./')
  await expect(page.locator('.topic-title')).toHaveText(topic.title)
  await page.getByRole('button', { name: Object.keys(done).length ? 'Continue' : 'Start', exact: true }).click()
  return { topic, stage }
}

/** Play a whole stage by tapping the authored answers; optionally screenshot chosen steps. */
async function play(page: Page, topic: Topic, stage: LessonStage, shots: Record<string, string> = {}) {
  const dir = process.env.ARGUS_SHOT_DIR
  const items = new Map(topic.items.map(item => [item.id!, item]))
  for (const [index, step] of stage.steps.entries()) {
    await expect(page.getByRole('progressbar', { name: `${index + 1} of ${stage.steps.length}` })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight), `${step.id} fits without scrolling`).toBe(true)
    // A picture item always shows its picture whole inside the viewport.
    const pictured = 'itemId' in step && step.itemId !== undefined && items.get(step.itemId)?.stimulus
    if (pictured) {
      const box = await page.locator('.stage-stimulus [role="img"]').first().boundingBox()
      expect(box, `${step.id} shows its picture`).not.toBeNull()
      expect(box!.y).toBeGreaterThanOrEqual(0)
      expect(box!.y + box!.height).toBeLessThanOrEqual(844)
      expect(box!.x).toBeGreaterThanOrEqual(0)
      expect(box!.x + box!.width).toBeLessThanOrEqual(390)
    }
    if (dir && shots[step.id]) await page.screenshot({ path: `${dir}/${shots[step.id]}.png` })
    if (step.kind === 'show' || step.kind === 'summary') {
      await page.getByRole('button', { name: index === stage.steps.length - 1 ? 'Finish lesson' : 'Continue', exact: true }).click()
    } else if (step.kind === 'choose') {
      await page.getByRole('button', { name: step.answer, exact: true }).click()
      await page.getByRole('button', { name: 'Continue', exact: true }).click()
    } else if (step.kind === 'contrast') {
      await page.getByRole('button', { name: items.get(step.answerItemId)!.prompt, exact: true }).click()
      await page.getByRole('button', { name: 'Continue', exact: true }).click()
    } else if (step.kind === 'order') {
      for (const block of step.blocks) await page.locator('.stage-options').getByRole('button', { name: block, exact: true }).click()
      await page.getByRole('button', { name: 'Check order', exact: true }).click()
      await page.getByRole('button', { name: 'Continue', exact: true }).click()
    } else if (step.kind === 'checkpoint') {
      for (const _id of step.itemIds) {
        await page.getByRole('button', { name: 'Reveal', exact: true }).click()
        await page.getByRole('button', { name: 'Got it', exact: true }).click()
      }
      await page.getByRole('button', { name: 'Finish lesson', exact: true }).click()
    }
  }
  await expect(page.getByRole('heading', { name: 'Lesson complete' })).toBeVisible()
}

test('Radio Procedure: the call-order lesson builds each published order and finishes', async ({ page }) => {
  const { topic, stage } = await openAt(page, 'radio-procedure', 'call-order')
  await play(page, topic, stage, { 'radio-show-one-station': 'radio-show', 'radio-order-one-station': 'radio-order', 'radio-call-summary': 'radio-summary' })
  await expect.poll(async () => (await readLocalLibrary(page)).topics.find(entry => entry.id === topic.id)!.stageProgress?.['call-order']).toBeTruthy()
})

test('Radio Procedure: the first lesson plays through, contrast included', async ({ page }) => {
  const { topic, stage } = await openAt(page, 'radio-procedure', 'words-that-agree')
  await play(page, topic, stage, { 'radio-contrast-agree': 'radio-contrast', 'radio-choose-roger': 'radio-choose' })
})
