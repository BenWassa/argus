import { useId, useMemo, useState } from 'react'
import { Dialog } from '../../components/ui/Dialog'
import { TRACKS, type Item, type Topic, type Track } from '../../lib/types'

interface TopicFormProps {
  topic: Topic | null
  onSave: (topic: Topic) => void
  onClose: () => void
}

const TRACK_LABELS: Record<Track, string> = {
  learning: 'Learning',
  survival: 'Survival',
  tradecraft: 'Tradecraft',
}

/** One item per line, prompt and answer split on the first pipe. */
function parseItems(raw: string): Item[] {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const at = line.indexOf('|')
      if (at === -1) return { prompt: line, answer: '' }
      return { prompt: line.slice(0, at).trim(), answer: line.slice(at + 1).trim() }
    })
}

function serialiseItems(items: Item[]): string {
  return items.map((i) => `${i.prompt} | ${i.answer}`).join('\n')
}

export function TopicForm({ topic, onSave, onClose }: TopicFormProps) {
  const [title, setTitle] = useState(topic?.title ?? '')
  const [scope, setScope] = useState(topic?.scope ?? '')
  const [track, setTrack] = useState<Track>(topic?.track ?? 'learning')
  const [raw, setRaw] = useState(topic ? serialiseItems(topic.items) : '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [confirmingDiscard, setConfirmingDiscard] = useState(false)

  const ids = { title: useId(), scope: useId(), track: useId(), items: useId() }

  // The count is derived, never typed. The app already knows it.
  const items = useMemo(() => parseItems(raw), [raw])
  const incomplete = items.filter((i) => !i.answer || !i.prompt).length

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const next: Record<string, string> = {}

    if (!title.trim()) next.title = 'Give the topic a name.'
    if (!scope.trim()) {
      next.scope = 'State where this topic ends. A topic without a boundary cannot be finished, so Argus will not hold one.'
    }
    if (items.length === 0) next.items = 'Add at least one item, as "prompt | answer".'
    else if (incomplete > 0) {
      next.items = `${incomplete} ${incomplete === 1 ? 'line is' : 'lines are'} missing a prompt or an answer. Each line needs text on both sides of the pipe.`
    }

    setErrors(next)
    if (Object.keys(next).length > 0) {
      // Send focus to the first field that failed, in form order, so the user
      // is taken to the problem rather than left to hunt for it.
      const order: (keyof typeof ids)[] = ['title', 'scope', 'items']
      const firstBad = order.find((key) => next[key])
      if (firstBad) {
        requestAnimationFrame(() => document.getElementById(ids[firstBad])?.focus())
      }
      return
    }

    const now = new Date().toISOString()
    onSave({
      id: topic?.id ?? `topic-${Date.now()}`,
      title: title.trim(),
      scope: scope.trim(),
      track,
      items,
      status: topic?.status ?? 'unstarted',
      createdAt: topic?.createdAt ?? now,
      drilledAt: topic?.drilledAt ?? null,
      completedAt: topic?.completedAt ?? null,
      lastPracticedAt: topic?.lastPracticedAt ?? null,
      history: topic?.history ?? [],
    })
  }

  const invalid = (key: string, describedBy?: string) => {
    if (!errors[key]) return describedBy ? { 'aria-describedby': describedBy } : {}
    return {
      'aria-invalid': true as const,
      'aria-describedby': [describedBy, `${key}-error`].filter(Boolean).join(' '),
    }
  }

  const dirty =
    title !== (topic?.title ?? '') ||
    scope !== (topic?.scope ?? '') ||
    track !== (topic?.track ?? 'learning') ||
    raw !== (topic ? serialiseItems(topic.items) : '')

  function requestClose() {
    if (dirty) setConfirmingDiscard(true)
    else onClose()
  }

  // Typed work is the hardest thing this product asks for, so an accidental
  // Escape asks before throwing it away. Handled inside the same dialog rather
  // than stacking a second one over it.
  if (confirmingDiscard) {
    return (
      <Dialog title="Discard changes" onClose={() => setConfirmingDiscard(false)}>
        <p>
          This topic has unsaved edits. Closing now loses them, and there is no draft to come back
          to.
        </p>
        <div className="actions">
          <button className="ghost" type="button" onClick={() => setConfirmingDiscard(false)}>
            Keep editing
          </button>
          <button className="danger" type="button" onClick={onClose}>
            Discard changes
          </button>
        </div>
      </Dialog>
    )
  }

  return (
    <Dialog title={topic ? 'Edit topic' : 'New topic'} onClose={requestClose}>
      <form onSubmit={submit} noValidate>
        <div className="field-row">
          <label htmlFor={ids.title}>Title</label>
          <input
            id={ids.title}
            className="field"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            {...invalid('title')}
          />
          {errors.title && (
            <p className="error" id="title-error">
              {errors.title}
            </p>
          )}
        </div>

        <div className="field-row">
          <label htmlFor={ids.scope}>Scope</label>
          <p className="help">Where does this topic end? Argus only holds topics that can be finished.</p>
          <textarea
            id={ids.scope}
            className="field"
            rows={2}
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            {...invalid('scope')}
          />
          {errors.scope && (
            <p className="error" id="scope-error">
              {errors.scope}
            </p>
          )}
        </div>

        <div className="field-row">
          <label htmlFor={ids.track}>Track</label>
          <select
            id={ids.track}
            className="field"
            value={track}
            onChange={(e) => setTrack(e.target.value as Track)}
          >
            {TRACKS.map((t) => (
              <option key={t} value={t}>
                {TRACK_LABELS[t]}
              </option>
            ))}
          </select>
        </div>

        <div className="field-row">
          <label htmlFor={ids.items}>Items</label>
          <p className="help" id={`${ids.items}-help`}>
            One per line, written as <code>prompt | answer</code>.
          </p>
          <textarea
            id={ids.items}
            className="field mono"
            rows={8}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            {...invalid('items', `${ids.items}-help`)}
          />
          <p className="count" aria-live="polite">
            {items.length} {items.length === 1 ? 'item' : 'items'}
            {incomplete > 0 && `, ${incomplete} incomplete`}
          </p>
          {errors.items && (
            <p className="error" id="items-error">
              {errors.items}
            </p>
          )}
        </div>

        <div className="actions">
          <button className="ghost" type="button" onClick={requestClose}>
            Cancel
          </button>
          <button type="submit">{topic ? 'Save changes' : 'Create topic'}</button>
        </div>
      </form>
    </Dialog>
  )
}
