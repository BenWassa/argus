import type { Item } from '../../domain/library/topic'
import { AudioStimulusView } from './AudioStimulusView'

/**
 * A heard item as reading (#151): the recording with its transcript shown
 * normally, because in Learn the transcript is content, not a concealed answer.
 * Playing here is reference listening and records nothing.
 */
export function AudioReference({ item }: { item: Item & { audio: NonNullable<Item['audio']> } }) {
  return <AudioStimulusView audio={item.audio} showTranscript label={item.prompt} />
}
