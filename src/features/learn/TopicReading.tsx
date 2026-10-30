import { useLayoutEffect, useRef } from 'react'
import type { Topic } from '../../domain/library/topic'
import { ScreenHeader } from '../../shared/ui/ScreenHeader'
import { TopicGlyph } from '../library/TopicGlyph'
import { topicIcon } from '../library/topicIcon'
import { VisualView } from '../visual/VisualView'
import { TopicItems } from '../library/ReferenceItems'
import { LearnSupport } from './LearnSupport'
import { SourcesAndLimits } from './SourcesAndLimits'
import './Reading.css'
import './TopicReading.css'

/**
 * An ordinary topic's Learn screen: its artwork, its lede and its
 * explanatory support, on their own page with Back to the topic. Opening it
 * writes nothing.
 */
export function TopicReading({ topic, onBack }: { topic: Topic; onBack: () => void }) {
  const heading = useRef<HTMLHeadingElement>(null)

  useLayoutEffect(() => {
    heading.current?.focus({ preventScroll: true })
  }, [topic.id])

  // The lede opens the screen. The scope restates it, so it moves to the
  // sources sheet, where it leads. A survival topic's boundary ("not first-aid
  // or clinical training") is a safety statement, and stays in the reading.
  const showScope = topic.track === 'survival' || !topic.learn?.overview

  return (
    <article className={`topic-reading topic-track-${topic.track}`}>
      <ScreenHeader ref={heading} title={topic.title} titleClassName="topic-reading-title" onBack={onBack}
        backLabel="Back to topic"
        glyph={topicIcon(topic.id) ? <TopicGlyph topicId={topic.id} /> : undefined} />
      {topic.hero && <div className="topic-reading-hero"><VisualView key={topic.id} visual={topic.hero} /></div>}
      {showScope && <p className="topic-scope">{topic.scope}</p>}
      {topic.learn && <LearnSupport content={topic.learn} />}
      <TopicItems topic={topic} />
      <SourcesAndLimits content={topic.learn} scope={showScope ? undefined : topic.scope} />
    </article>
  )
}
