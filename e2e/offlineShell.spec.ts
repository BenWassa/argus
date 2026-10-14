import { expect, test } from '@playwright/test'
import { createServer, type Server } from 'node:http'
import { generateServiceWorker } from '../scripts/serviceWorker'

test('installed production shell cold-loads and navigates offline', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('argus-splash-seen', 'true'))
  await page.goto('./')
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
    if (!navigator.serviceWorker.controller) await new Promise<void>((resolve) => navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true }))
  })
  await page.context().setOffline(true)
  await page.goto('./')
  await expect(page.getByRole('button', { name: 'Library', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Library', exact: true }).click()
  await page.getByRole('button', { name: /Compass Bearings/ }).click()
  await expect(page.getByRole('heading', { name: 'Compass Bearings', level: 1 })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Compass Bearings', level: 1 })).toBeVisible()
})

test('failed update keeps the previous shell and successful update preserves its lazy chunks', async ({ page }) => {
  let generation = 'a'
  let missing = false
  let server: Server | undefined
  const bodies: Record<string, string> = {
    a: '<h1>Generation A</h1><script src="/assets/a.js"></script>',
    b: '<h1>Generation B</h1><script src="/assets/b.js"></script>',
    c: '<h1>Generation C</h1><script src="/assets/c.js"></script>',
  }
  try {
    server = createServer((request, response) => {
      response.setHeader('Cache-Control', 'no-store')
      if (request.url === '/sw.js') {
        response.setHeader('Content-Type', 'application/javascript')
        response.end(generateServiceWorker({ buildId: generation, files: ['index.html', `assets/${generation}.js`] }))
      } else if (request.url?.startsWith('/assets/')) {
        response.setHeader('Content-Type', 'application/javascript')
        if (missing && request.url === '/assets/b.js') { response.statusCode = 503; response.end('Unavailable') }
        else response.end('window.shellLoaded = true')
      } else {
        response.setHeader('Content-Type', 'text/html')
        response.end(bodies[generation])
      }
    })
    await new Promise<void>((resolve) => server!.listen(0, '127.0.0.1', resolve))
    const address = server.address()
    if (!address || typeof address === 'string') throw new Error('Missing fixture server address')
    const origin = `http://127.0.0.1:${address.port}`
    await page.goto(origin)
    await page.evaluate(async () => {
      await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready
      if (!navigator.serviceWorker.controller) await new Promise<void>((resolve) => navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true }))
    })
    generation = 'b'
    missing = true
    const failed = await page.evaluate(async () => {
      const reg = (await navigator.serviceWorker.getRegistration())!
      const result = new Promise<string>((resolve) => reg.addEventListener('updatefound', () => {
        const worker = reg.installing!
        worker.addEventListener('statechange', () => { if (worker.state === 'redundant') resolve(worker.state) })
      }, { once: true }))
      await reg.update()
      return result
    })
    expect(failed).toBe('redundant')
    await page.context().setOffline(true)
    await page.goto(origin)
    await expect(page.getByRole('heading', { name: 'Generation A' })).toBeVisible()
    expect(await page.evaluate(() => caches.keys())).toEqual(['argus-app-a'])
    await page.context().setOffline(false)
    missing = false
    await page.evaluate(async () => {
      const changed = new Promise<void>((resolve) => navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true }))
      await (await navigator.serviceWorker.getRegistration())!.update()
      await changed
    })
    await page.context().setOffline(true)
    await page.goto(origin)
    await expect(page.getByRole('heading', { name: 'Generation B' })).toBeVisible()
    expect(await page.evaluate(() => caches.keys())).toEqual(['argus-app-a', 'argus-app-b'])
    expect(await page.evaluate(async () => (await fetch('/assets/a.js')).ok)).toBe(true)
    // A later fully installed update removes only the oldest generation.
    await page.context().setOffline(false)
    generation = 'c'
    await page.evaluate(async () => {
      const changed = new Promise<void>((resolve) => navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true }))
      await (await navigator.serviceWorker.getRegistration())!.update()
      await changed
    })
    // controllerchange may fire before the activation event's lifetime promise
    // settles. Verify completed cleanup rather than racing that event.
    await expect.poll(() => page.evaluate(() => caches.keys())).toEqual(['argus-app-b', 'argus-app-c'])
  } finally {
    await page.context().setOffline(false)
    if (server) await new Promise<void>((resolve, reject) => server!.close((error) => error ? reject(error) : resolve()))
  }
})
