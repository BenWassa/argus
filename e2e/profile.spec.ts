import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { expect, test, type Page } from '@playwright/test'
import { seedLibrary } from '../src/domain/library/catalogSeed'
import type { Topic } from '../src/domain/library/topic'

const STORE_KEY = 'argus.library.v5'
const SPLASH_KEY = 'argus-splash-seen'

const shippedCatalog = JSON.parse(
  readFileSync(fileURLToPath(new URL('../src/domain/library/shippedCatalog.json', import.meta.url)), 'utf8'),
) as { topicIds: string[] }

const { version: appVersion } = JSON.parse(
  readFileSync(fileURLToPath(new URL('../package.json', import.meta.url)), 'utf8'),
) as { version: string }

const USER_TOPIC: Topic = {
  id: 'profile-reset-user-topic',
  title: 'Personal reset fixture',
  scope: 'Content that must be removed by a reset.',
  track: 'learning',
  items: [{ id: 'personal-item', kind: 'forward', prompt: 'Prompt', answer: 'Answer' }],
  status: 'learning',
  createdAt: '2026-09-17T12:00:00.000Z',
  drilledAt: null,
  learningAt: '2026-09-17T12:00:00.000Z',
  completedAt: null,
  lastTestedAt: null,
  spotCheckedAt: null,
  history: [],
  origin: 'user',
}

const WORKED_LIBRARY = JSON.stringify({
  version: 5,
  topics: [...seedLibrary().topics, USER_TOPIC],
  catalogDelivered: [...shippedCatalog.topicIds].sort(),
})

async function openApp(page: Page, initialState: unknown = null) {
  await page.addInitScript(
    ([library, storeKey, splashKey, state]) => {
      window.localStorage.setItem(splashKey, 'true')
      window.localStorage.setItem(storeKey, library)
      if (state !== null) window.history.replaceState(state, '')
    },
    [WORKED_LIBRARY, STORE_KEY, SPLASH_KEY, initialState] as const,
  )
  await page.goto('./')
}

test('a legacy Data history entry restores Profile under Today navigation', async ({ page }) => {
  await openApp(page, {
    argusNavigation: 1,
    index: 4,
    route: { kind: 'section', view: 'data' },
  })

  await expect(page.getByRole('heading', { name: 'Profile', level: 1 })).toBeVisible()
  await expect(page.getByText(new RegExp(`^App version ${appVersion} · build (?:[0-9a-f]{7}|unknown)$`))).toBeVisible()
  await expect(page.getByRole('button', { name: 'Today', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  )
  await expect(page.getByRole('button', { name: 'Library', exact: true })).not.toHaveAttribute(
    'aria-current',
    'page',
  )
})

test('confirming Profile reset restores only fresh shipped topics', async ({ page }) => {
  await openApp(page)
  await page.getByRole('button', { name: 'Open profile' }).click()
  await expect(page.getByRole('heading', { name: 'Profile', level: 1 })).toBeVisible()

  await page.getByRole('button', { name: 'Reset learning data' }).click()
  const confirmation = page.getByRole('dialog', { name: 'Reset learning data' })
  await expect(confirmation).toBeVisible()
  await confirmation.getByRole('button', { name: 'Reset data', exact: true }).click()

  await expect(page.getByRole('status')).toHaveText(
    'Learning data reset. Shipped topics restored.',
  )

  await expect
    .poll(async () =>
      page.evaluate(([storeKey, expectedIds]) => {
        const stored = JSON.parse(window.localStorage.getItem(storeKey) ?? '{}') as {
          topics?: Topic[]
        }
        const topics = stored.topics ?? []
        return (
          topics.map((topic) => topic.id).sort().join('|') === [...expectedIds].sort().join('|') &&
          topics.every(
            (topic) =>
              topic.origin === 'catalog' &&
              topic.status === 'unstarted' &&
              topic.history.length === 0 &&
              topic.learningAt === null &&
              topic.drilledAt === null &&
              topic.completedAt === null &&
              topic.lastTestedAt === null &&
              topic.spotCheckedAt === null,
          )
        )
      }, [STORE_KEY, shippedCatalog.topicIds] as const),
    )
    .toBe(true)
})
