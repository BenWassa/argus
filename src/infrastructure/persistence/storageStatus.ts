export interface StorageStatus {
  persistence: 'granted' | 'denied' | 'unsupported'
  usage: number | null
  quota: number | null
}

/**
 * Ask the browser to protect Argus's local data from best-effort eviction and
 * collect the approximate origin footprint for diagnostics. Both APIs are
 * optional: lack of support is a capability result, not an application error.
 */
export async function inspectStorage(): Promise<StorageStatus> {
  const storage = navigator.storage
  if (!storage) return { persistence: 'unsupported', usage: null, quota: null }

  let persistence: StorageStatus['persistence'] = 'unsupported'
  if (typeof storage.persisted === 'function') {
    const alreadyPersistent = await storage.persisted().catch(() => false)
    if (alreadyPersistent) {
      persistence = 'granted'
    } else if (typeof storage.persist === 'function') {
      persistence = (await storage.persist().catch(() => false)) ? 'granted' : 'denied'
    }
  }

  const estimate: StorageEstimate = typeof storage.estimate === 'function'
    ? await storage.estimate().catch(() => ({}))
    : {}

  return {
    persistence,
    usage: typeof estimate.usage === 'number' ? estimate.usage : null,
    quota: typeof estimate.quota === 'number' ? estimate.quota : null,
  }
}

export function formatStorageBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
