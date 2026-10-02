import type { Item, TopicSequence } from '../../domain/library/topic'

/** All scored items occur exactly once; invalid order metadata cannot shrink a Test. */
export function parseSequence(value: unknown, items: Item[], where: string):
  { ok: true; value: TopicSequence | undefined } | { ok: false; error: string } {
  if (value === undefined || value === null) return { ok: true, value: undefined }
  const fail = () => ({ ok: false as const, error: `${where} sequence needs nonempty groups with one letter per item, covering every item exactly once.` })
  if (typeof value !== 'object' || !('groups' in value) || !Array.isArray(value.groups) || !value.groups.length) return fail()
  const live = new Set(items.map(item => item.id))
  const seen = new Set<string>()
  const groups: TopicSequence['groups'] = []
  for (const raw of value.groups) {
    if (!raw || typeof raw !== 'object' || typeof raw.label !== 'string' || !raw.label.trim() || typeof raw.letters !== 'string' || !raw.letters.trim() || !Array.isArray(raw.itemIds)) return fail()
    const letters = raw.letters.trim()
    if (/\s/u.test(letters) || Array.from(letters).length !== raw.itemIds.length) return fail()
    for (const id of raw.itemIds) {
      if (typeof id !== 'string' || !live.has(id) || seen.has(id)) return fail()
      seen.add(id)
    }
    groups.push({ label: raw.label.trim(), letters, itemIds: [...raw.itemIds] })
  }
  if (seen.size !== items.length) return fail()
  return { ok: true, value: { groups } }
}
