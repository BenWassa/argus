import { readLocalLibrary } from './helpers/readLocalLibrary'
import { expect, test, type Page } from '@playwright/test'
import { seedLibrary } from '../src/domain/library/catalogSeed'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { generatedCurriculum, lessonForItem } from '../src/domain/learning/generatedCurriculum'
import { NATO_ITEMS, currentPrompt } from './support'
import type { Topic } from '../src/domain/library/topic'

const SHIPPED_CATALOG_TOPIC_IDS: string[] = JSON.parse(readFileSync(fileURLToPath(new URL('../src/domain/library/shippedCatalog.json', import.meta.url)), 'utf8')).topicIds

const nato: Topic = { ...seedLibrary().topics.find(topic => topic.id === 'nato-phonetic')!,
  status: 'learning', completedAt: null, drilledAt: null, history: [], stageProgress: undefined }
const topicRoute = { kind: 'topic', topicId: nato.id } as const

async function openTopic(page: Page, oldPractice = false) {
  await page.addInitScript(({ topic, delivered, oldPractice }) => {
    localStorage.setItem('argus-splash-seen', 'true')
    localStorage.setItem('argus.library.v5', JSON.stringify({ version: 5, topics: [topic], catalogDelivered: delivered }))
    const topicRoute = { kind: 'topic', topicId: topic.id }
    history.replaceState({ argusNavigation: 1, index: 0, route: oldPractice
      ? { kind: 'run', mode: 'learn', topicIds: [topic.id], origin: { kind: 'section', view: 'today' }, target: { kind: 'practice', itemIds: [topic.items[0].id] } }
      : topicRoute }, '')
  }, { topic: nato, delivered: [...SHIPPED_CATALOG_TOPIC_IDS], oldPractice })
  await page.goto('./')
  await expect(page.locator('.topic-title')).toHaveText(nato.title)
}
const stored = async (page: Page) => (await readLocalLibrary(page)).topics.find(topic => topic.id === nato.id)!

test.use({ reducedMotion: 'reduce', viewport: { width: 390, height: 844 } })

test('ordinary topic shows a scannable lesson list, one action, and optional Final Test', async ({ page }) => {
  await openTopic(page)
  const curriculum = generatedCurriculum(nato)
  await expect(page.getByRole('list', { name: 'Lessons' }).getByRole('listitem')).toHaveCount(curriculum.stages.length + 1)
  await expect(page.getByRole('navigation', { name: 'Study' }).getByRole('button')).toHaveCount(1)
  await expect(page.getByRole('button', { name: 'Start', exact: true })).toBeVisible()
  await expect(page.locator('.topic-lessons .spine-node-square')).toHaveCount(1)
  await expect(page.getByRole('button', { name: 'Final Test', exact: true })).toBeEnabled()
  await expect(page.locator('.topic-items')).toHaveCount(0)
  await page.getByRole('button', { name: 'Reference', exact: true }).click()
  await expect(page.locator('.topic-reading .topic-item')).toHaveCount(nato.items.length)
  await expect(page.locator('.nav-btn')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Back to topic' })).toBeVisible()
})

test('completes NATO lesson 1 with formative ticks, focused steps and no scrolling', async ({ page }) => {
  await openTopic(page)
  const before = await stored(page)
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  const stage = generatedCurriculum(nato).stages[0]
  for (const [index, step] of stage.steps.entries()) {
    await expect(page.getByRole('progressbar', { name: `${index + 1} of ${stage.steps.length}` })).toBeVisible()
    await expect(page.locator('.stage-stimulus h2')).toBeFocused()
    expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight)).toBe(true)
    if (step.kind === 'show') await page.getByRole('button', { name: 'Continue', exact: true }).click()
    else if (step.kind === 'choose') {
      await page.getByRole('button', { name: step.answer, exact: true }).click()
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
  await expect.poll(async () => (await stored(page)).stageProgress?.['lesson-1']).toBeTruthy()
  const after = await stored(page)
  expect(after.history).toEqual(before.history)
  expect(after.itemEvidence).toEqual(before.itemEvidence)
  expect(after.completedAt).toBeNull()
  await page.getByRole('button', { name: 'Done', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Lesson 1, done', exact: true })).toBeVisible()
  await expect(page.locator('.screen-header-readout')).toHaveText(`Lesson 2 of ${generatedCurriculum(nato).stages.length}`)
})

test('restores an old Practice entry to its topic in place with no learner writes', async ({ page }) => {
  await openTopic(page, true)
  expect(await page.evaluate(() => history.state)).toMatchObject({ index: 0, route: topicRoute })
  const topic = await stored(page)
  expect(topic.history).toEqual([])
  expect(topic.stageProgress).toBeUndefined()
  expect(topic.completedAt).toBeNull()
  await expect(page.locator('.stage-runner, .practice-run')).toHaveCount(0)
})

test('Test result Review lesson replaces the Test with the lesson containing its first miss', async ({ page }) => {
  await openTopic(page)
  const missedItem = NATO_ITEMS[9]
  await page.getByRole('button', { name: 'Final Test', exact: true }).click()
  for (let index = 0; index < nato.items.length; index++) {
    await expect(page.locator('.flip-card')).toBeVisible()
    const prompt = await currentPrompt(page)
    await page.keyboard.press(' ')
    await page.keyboard.press(prompt === missedItem.prompt ? 'ArrowLeft' : 'ArrowRight')
    await page.waitForFunction(previous => document.querySelector('.test-done') || document.querySelector('#prompt-heading')?.textContent !== previous, prompt)
  }
  await expect(page.getByRole('button', { name: 'Review lesson', exact: true })).toBeVisible()
  const before = await stored(page)
  const index = await page.evaluate(() => history.state.index)
  await page.getByRole('button', { name: 'Review lesson', exact: true }).click()
  expect(await page.evaluate(() => history.state)).toMatchObject({ index,
    route: { kind: 'run', mode: 'learn', target: { kind: 'stage', stageId: lessonForItem(nato, missedItem.id!)!.id } } })
  await expect(page.locator('.stage-runner')).toBeVisible()
  expect((await stored(page)).history).toEqual(before.history)
})
