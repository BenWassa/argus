// Pure ingestion logic: Firestore REST encoding, the pending hand-off report,
// and the rules that decide whether a request may be marked `added`.
//
// Everything here is deliberately free of I/O so the parts that matter —
// especially "a request is only marked added once its topics have actually
// shipped" — can be tested without a network or a credential.

export const REQUEST_FIELDS = ['text', 'status', 'trackHint', 'createdAt', 'topicIds', 'addedAt']

export function decodeValue(value) {
  if (value === null || typeof value !== 'object') return null
  if ('nullValue' in value) return null
  if ('stringValue' in value) return value.stringValue
  if ('booleanValue' in value) return value.booleanValue
  if ('integerValue' in value) return Number(value.integerValue)
  if ('doubleValue' in value) return value.doubleValue
  if ('timestampValue' in value) return value.timestampValue
  if ('arrayValue' in value) return (value.arrayValue.values ?? []).map(decodeValue)
  if ('mapValue' in value) return decodeFields(value.mapValue.fields ?? {})
  return null
}

export function decodeFields(fields) {
  const out = {}
  for (const [key, value] of Object.entries(fields ?? {})) out[key] = decodeValue(value)
  return out
}

export function encodeValue(value) {
  if (value === null || value === undefined) return { nullValue: null }
  if (typeof value === 'string') return { stringValue: value }
  if (typeof value === 'boolean') return { booleanValue: value }
  if (Array.isArray(value)) return { arrayValue: { values: value.map(encodeValue) } }
  if (typeof value === 'number') {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value }
  }
  throw new Error(`Cannot encode ${typeof value} for Firestore.`)
}

export function documentId(name) {
  if (typeof name !== 'string' || !name) return ''
  return name.slice(name.lastIndexOf('/') + 1)
}

/** One Firestore REST document as the ingestion tooling reads it. */
export function toContentRequest(document) {
  const data = decodeFields(document?.fields)
  return {
    id: documentId(document?.name),
    name: document?.name ?? '',
    text: typeof data.text === 'string' ? data.text : '',
    status: data.status === 'added' ? 'added' : 'pending',
    trackHint: typeof data.trackHint === 'string' ? data.trackHint : null,
    createdAt: typeof data.createdAt === 'string' ? data.createdAt : null,
    topicIds: Array.isArray(data.topicIds) ? data.topicIds.filter((id) => typeof id === 'string') : [],
    addedAt: typeof data.addedAt === 'string' ? data.addedAt : null,
  }
}

/** Oldest first: the backlog is worked in the order it grew. */
export function pendingRequests(requests) {
  return requests
    .filter((request) => request.status === 'pending')
    .sort((a, b) => (a.createdAt ?? '').localeCompare(b.createdAt ?? '') || a.id.localeCompare(b.id))
}

function sameIds(a, b) {
  return a.length === b.length && [...a].sort().every((id, i) => id === [...b].sort()[i])
}

/**
 * Whether a request may be marked `added`, and what should happen.
 *
 * Two guarantees live here. A request is only ever marked for topic ids that
 * are already in the shipped catalog, so a generated draft or an unmerged
 * branch cannot mark anything. And re-running the same command is safe: an
 * identical mark is a no-op rather than a second write, and a *different* mark
 * on an already-added request is refused rather than allowed to rewrite the
 * provenance of work that has shipped.
 */
export function planMarkAdded(request, topicIds, shippedIds) {
  if (!request) {
    return { action: 'error', reason: 'No such request in the inbox.' }
  }
  if (!Array.isArray(topicIds) || topicIds.length === 0) {
    return { action: 'error', reason: 'Marking a request added needs at least one shipped topic id.' }
  }

  const seen = new Set()
  for (const id of topicIds) {
    if (typeof id !== 'string' || !id.trim()) {
      return { action: 'error', reason: 'Topic ids must be non-empty strings.' }
    }
    if (seen.has(id)) return { action: 'error', reason: `Repeated topic id "${id}".` }
    seen.add(id)
    if (!shippedIds.includes(id)) {
      return {
        action: 'error',
        reason: `"${id}" is not in the shipped catalog. A request is marked added only after its topics have actually shipped.`,
      }
    }
  }

  if (request.status === 'added') {
    if (sameIds(request.topicIds, topicIds)) {
      return { action: 'skip', reason: 'Already marked added with exactly these topics.' }
    }
    return {
      action: 'error',
      reason: `Already marked added with ${request.topicIds.join(', ') || 'no topics'}. Ingestion provenance is not rewritten.`,
    }
  }

  return { action: 'write', topicIds: [...topicIds] }
}

/**
 * The Firestore commit that performs the mark. `addedAt` is a server-side
 * transform rather than a client clock, which is also what Security Rules
 * require of the equivalent browser write.
 */
export function addedCommit(documentName, topicIds) {
  return {
    writes: [
      {
        update: {
          name: documentName,
          fields: {
            status: encodeValue('added'),
            topicIds: encodeValue(topicIds),
          },
        },
        updateMask: { fieldPaths: ['status', 'topicIds'] },
        updateTransforms: [{ fieldPath: 'addedAt', setToServerValue: 'REQUEST_TIME' }],
        currentDocument: { exists: true },
      },
    ],
  }
}

/**
 * The hand-off an ingestion run starts from.
 *
 * It is a reading list, not a specification. Every line is something the user
 * wondered about; none of it is researched, bounded or verified, and none of it
 * may be turned into scored material without doing that work first.
 */
export function formatHandoff(requests, now = new Date()) {
  const pending = pendingRequests(requests)
  const lines = [
    '# Argus content inbox — pending requests',
    '',
    `Read at ${now.toISOString()}. ${pending.length} pending ${pending.length === 1 ? 'request' : 'requests'}.`,
    '',
    'Each entry is *intent*, not content. Before any of it becomes an Argus topic:',
    '',
    '1. research the subject against authoritative or primary sources;',
    '2. decide whether it can carry one honest finite completion boundary, needs',
    '   splitting, belongs in an existing topic, or should be deferred;',
    '3. write the completion claim before authoring any scored item;',
    '4. author deliberate stable topic and item ids — never a Firestore id;',
    '5. open an ordinary pull request and let it be reviewed.',
    '',
    'Nothing here may be published without that review, and no request is marked',
    'added until its topics have actually shipped.',
    '',
  ]

  if (pending.length === 0) {
    lines.push('_Nothing pending._')
    return lines.join('\n')
  }

  for (const request of pending) {
    lines.push(`## ${request.id}`)
    lines.push('')
    lines.push(`- captured: ${request.createdAt ?? 'unknown'}`)
    lines.push(`- track hint: ${request.trackHint ?? 'auto'}`)
    lines.push('- request:')
    lines.push('')
    for (const line of request.text.split('\n')) lines.push(`  > ${line}`)
    lines.push('')
  }

  return lines.join('\n')
}
