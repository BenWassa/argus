const UPDATE_INTERVAL_MS = 60 * 60 * 1000

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return

  window.addEventListener('load', () => {
    const hadControllerAtLoad = Boolean(navigator.serviceWorker.controller)
    let reloading = false

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!hadControllerAtLoad || reloading) return
      reloading = true
      window.location.reload()
    })

    void navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`, {
        scope: import.meta.env.BASE_URL,
        updateViaCache: 'none',
      })
      .then((registration) => {
        const activateWaitingWorker = () => {
          registration.waiting?.postMessage({ type: 'SKIP_WAITING' })
        }
        const checkForUpdate = () => void registration.update().catch(() => undefined)

        activateWaitingWorker()
        registration.addEventListener('updatefound', () => {
          const installing = registration.installing
          installing?.addEventListener('statechange', () => {
            if (installing.state === 'installed') activateWaitingWorker()
          })
        })

        window.addEventListener('online', checkForUpdate)
        window.addEventListener('pageshow', checkForUpdate)
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') checkForUpdate()
        })
        window.setInterval(checkForUpdate, UPDATE_INTERVAL_MS)
        checkForUpdate()
      })
      .catch(() => undefined)
  })
}
