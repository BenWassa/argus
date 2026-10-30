import type { Topic } from '../../domain/library/topic'
import { ProgressSpine, type SpineRow, type SpineState } from '../../shared/ui/ProgressSpine'
import { topicItemGroups, type ItemStanding, type TopicItemEntry } from './topicItems'
import { VisualView } from '../visual/VisualView'
import { AudioReference } from '../audio/AudioReference'
import './TopicPage.css'

const SPINE_STATE: Record<ItemStanding, SpineState> = {
  settled: 'done',
  missed: 'reached',
  seen: 'reached',
  unseen: 'reached',
}

const STANDING_WORDS: Record<ItemStanding, string> = {
  settled: 'settled',
  missed: 'missed last time',
  seen: 'tested',
  unseen: 'not tested yet',
}

/** A group's node takes the weakest standing among its items. */
function groupState(entries: TopicItemEntry[]): SpineState {
  return entries.length > 0 && entries.every(entry => entry.standing === 'settled') ? 'done' : 'reached'
}

/**
 * The complete scored set as reading, one row per item on the shared spine.
 * There is no forced path, so no row is the position; rows are not controls.
 */
export function TopicItems({ topic }: { topic: Topic }) {
  const groups = topicItemGroups(topic)
  const rows: SpineRow[] = groups.flatMap((group, groupIndex) => {
    const heading: SpineRow[] = group.label ? [{
      id: `group-${groupIndex}`,
      shape: 'square',
      state: groupState(group.entries),
      label: group.label,
      accessibleLabel: `${group.label}, ${group.entries.length} ${group.entries.length === 1 ? 'rule' : 'rules'}`,
      group: true,
      plate: true,
      className: `topic-item-group${group.entries.every(entry => entry.standing === 'unseen') ? ' is-unseen' : ''}`,
    }] : []
    return [...heading, ...group.entries.map(({ item, marker, standing }, index): SpineRow => {
      const visual = Boolean(item.stimulus || item.audio)
      return {
        id: item.id ?? `${groupIndex}-${index}`,
        shape: 'round',
        mark: standing === 'settled' && !group.label ? '✓' : marker,
        state: SPINE_STATE[standing],
        // A pictured item's picture is its prompt; the authored question
        // wording is for the Test card, so the row names the answer.
        label: item.stimulus ? item.answer : item.prompt,
        detail: item.stimulus ? undefined : item.answer,
        accessibleLabel: `${item.prompt}: ${item.answer}, ${STANDING_WORDS[standing]}`,
        group: true,
        className: `topic-item is-${standing}${visual ? ' has-visual' : ''}`,
        after: visual ? <div className="topic-item-visual">
          {item.stimulus && <VisualView visual={item.stimulus} compact />}
          {item.audio && <AudioReference item={item as typeof item & { audio: NonNullable<typeof item.audio> }} />}
        </div> : undefined,
      }
    })]
  })
  return <ProgressSpine rows={rows} label="Items" className="topic-items" />
}

