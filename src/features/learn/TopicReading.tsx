import { useLayoutEffect, useRef } from 'react'
import type { Topic } from '../../domain/library/topic'
import { ScreenHeader } from '../../shared/ui/ScreenHeader'
import { TopicGlyph } from '../library/TopicGlyph'
import { topicIcon } from '../library/topicIcon'
import { VisualView } from '../visual/VisualView'
import { LearnSupport } from './LearnSupport'
import { SourcesAndLimits } from './SourcesAndLimits'
import './Reading.css'
import './TopicReading.css'

/** Whether an ordinary topic carries anything to read beyond its items. */
export function hasReading(topic: Topic): boolean {
  return Boolean(topic.learn || topic.hero)
}

/**
 * An ordinary topic's Learn screen: its artwork, its boundary and its
 * explanatory support, on their own page with Back to the topic. Opening it
 * writes nothing.
 */
export function TopicReading({ topic, onBack }: { topic: Topic; onBack: () => void }) {
  const heading = useRef<HTMLHeadingElement>(null)

  useLayoutEffect(() => {
    heading.current?.focus({ preventScroll: true })
  }, [topic.id])

  return (
    <article className={`topic-reading topic-track-${topic.track}`}>
      <ScreenHeader ref={heading} title={topic.title} titleClassName="topic-reading-title" onBack={onBack}
        backLabel="Back to topic"
        glyph={topicIcon(topic.id) ? <TopicGlyph topicId={topic.id} /> : undefined} />
      {topic.hero && <div className="topic-reading-hero"><VisualView key={topic.id} visual={topic.hero} /></div>}
      <p className="topic-scope">{topic.scope}</p>
      {topic.learn && <LearnSupport content={topic.learn} />}
      <SourcesAndLimits content={topic.learn} />
    </article>
  )
}
