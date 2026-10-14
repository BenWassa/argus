import type { CurrentLibrary } from '../library/library'
import { AVAILABLE_ROLES, type RoleDefinition } from './definitions'
import { roleProgress } from './roles'

export interface RoleAward {
  roleId: string
  roleVersion: number
  earnedAt: string
  topicIds: string[]
}

/** Unknown role/version receipts survive import and sync for newer builds. */
export function parseRoleAwards(value: unknown): RoleAward[] | null {
  if (value === undefined) return []
  if (!Array.isArray(value) || value.length > 1000) return null
  const awards: RoleAward[] = []
  const keys = new Set<string>()
  for (const raw of value) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
    const entry = raw as Record<string, unknown>
    if (Object.keys(entry).some((key) => !['roleId', 'roleVersion', 'earnedAt', 'topicIds'].includes(key))) return null
    const { roleId, roleVersion, earnedAt, topicIds } = entry
    if (typeof roleId !== 'string' || !/^[a-z][a-z0-9-]{0,99}$/.test(roleId)
      || !Number.isSafeInteger(roleVersion) || (roleVersion as number) < 1
      || typeof earnedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(earnedAt) || !Number.isFinite(Date.parse(earnedAt))
      || !Array.isArray(topicIds) || topicIds.length === 0 || topicIds.length > 100
      || !topicIds.every((id) => typeof id === 'string' && id.length > 0 && id.length <= 200)
      || new Set(topicIds).size !== topicIds.length) return null
    const key = `${roleId}:${roleVersion}`
    if (keys.has(key)) return null
    keys.add(key)
    awards.push({ roleId, roleVersion: roleVersion as number, earnedAt: new Date(earnedAt).toISOString(), topicIds: [...topicIds].sort() })
  }
  return awards
}

/** Set union: deterministic, earliest observed receipt retained per version. */
export function mergeRoleAwards(...lists: readonly (readonly RoleAward[])[]): RoleAward[] {
  const byKey = new Map<string, RoleAward>()
  for (const award of lists.flat()) {
    const normalized = { ...award, topicIds: [...award.topicIds].sort() }
    const key = `${award.roleId}:${award.roleVersion}`
    const prior = byKey.get(key)
    if (!prior || JSON.stringify(normalized) < JSON.stringify(prior)) byKey.set(key, normalized)
  }
  return [...byKey.values()].sort((a, b) => a.roleId.localeCompare(b.roleId) || a.roleVersion - b.roleVersion)
}

/** First observed completion, committed with the learner record, never a render effect. */
export function captureRoleAwards(
  library: CurrentLibrary,
  now: Date = new Date(),
  definitions: readonly RoleDefinition[] = AVAILABLE_ROLES,
): CurrentLibrary {
  const awards = [...(library.roleAwards ?? [])]
  for (const role of definitions) {
    if (awards.some((award) => award.roleId === role.id && award.roleVersion >= role.version)) continue
    if (roleProgress(role, library.topics, awards).earnedVersion !== role.version) continue
    awards.push({ roleId: role.id, roleVersion: role.version, earnedAt: now.toISOString(), topicIds: role.pathways.flatMap((path) => [...path.topicIds]).sort() })
  }
  return awards.length === (library.roleAwards?.length ?? 0) ? library : { ...library, roleAwards: mergeRoleAwards(awards) }
}
