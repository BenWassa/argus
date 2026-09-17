import { journeyFor } from '../../domain/study/journey'
import { morseAcquisitionProfile, type AcquisitionCharacter, type AcquisitionProfile } from '../../domain/morse/testing/acquisitionProfile'
import { isTokenRecallDeck } from './swipeGrade'
import type { Item, Topic } from '../../domain/library/topic'
import type { CueState } from '../../domain/study/evidence'

/**
 * Building the deck a Test run will ask, and the three per-topic decisions that
 * have to be made once and then hold for the whole session.
 *
 * All of it is derived from content and durable state, and none of it is
 * allowed to change part-way through a run: a bankable attempt runs every item
 * in a topic, so an affordance or an opening rung that shifted mid-deck would
 * weaken the boundary rather than just look odd.
 */
export interface Card {
  topicId: string
  topicTitle: string
  item: Item
  /** Present only for a topic the acquisition ladder recognises. */
  character?: AcquisitionCharacter
}

export function shuffle<T>(list: T[]): T[] {
  const out = [...list]
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/**
 * The rung each topic's untested items open at.
 *
 * `free` only for a topic whose guided acquisition has actually finished, and
 * readiness is permanent, so this is stable for the whole session. Every other
 * topic — ordinary, imported, legacy, or still mid-curriculum — gets `rich`,
 * which is exactly the behaviour it has always had.
 */
export function openingBaselines(topics: Topic[]): Map<string, CueState> {
  const found = new Map<string, CueState>()
  for (const topic of topics) {
    found.set(topic.id, journeyFor(topic).acquisition.ready ? 'free' : 'rich')
  }
  return found
}

/**
 * Which topics the acquisition ladder drives. Every other topic keeps the
 * reveal-and-self-score card exactly as it is.
 */
export function acquisitionProfiles(topics: Topic[]): Map<string, AcquisitionProfile> {
  const found = new Map<string, AcquisitionProfile>()
  for (const topic of topics) {
    const profile = morseAcquisitionProfile(topic)
    if (profile) found.set(topic.id, profile)
  }
  return found
}

/**
 * Which self-score topics grade by swipe alone. Decided once, from content, so
 * the affordance can never change part-way through a deck.
 */
export function swipeDecks(topics: Topic[]): Set<string> {
  return new Set(topics.filter((topic) => isTokenRecallDeck(topic.items)).map((topic) => topic.id))
}

export function buildDeck(topics: Topic[], profiles: Map<string, AcquisitionProfile>): Card[] {
  return topics.flatMap((topic) => {
    const profile = profiles.get(topic.id)
    return shuffle(
      topic.items.map((item) => ({
        topicId: topic.id,
        topicTitle: topic.title,
        item,
        ...(profile && item.id ? { character: profile.get(item.id) } : {}),
      })),
    )
  })
}
