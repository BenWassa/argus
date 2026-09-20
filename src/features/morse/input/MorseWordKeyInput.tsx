import { useEffect, useState } from 'react'
import { MORSE_LETTERS, type MorseLetter } from '../../../domain/morse/code'
import { MorseKeyInput } from './MorseKeyInput'

interface MorseWordKeyInputProps {
  word: string
  locked?: boolean
  /**
   * Changing this starts a fresh word on the same mounted key. See
   * `MorseKeyInput`'s own `advanceToken`: one mounted control, one AudioContext,
   * however many words a run asks for.
   */
  advanceToken?: string | number
  /** How far through the word the learner is, for the caller's own display. */
  onProgress?: (characterIndex: number) => void
  onSubmit: (patterns: readonly string[]) => void
}

/**
 * A word as one response, on one key.
 *
 * This used to mount a fresh `MorseKeyInput` per character, keyed by the
 * character index. Two things followed from that, and both were felt rather
 * than theorised: every letter tore down and rebuilt the control along with
 * its AudioContext, and the learner's experience of "key the word GARDEN" was
 * six separate letter drills that happened to share a heading.
 *
 * Now one key stays mounted for the whole word and is advanced in place. There
 * is still no per-character verdict, no pause and no confirmation step — the
 * word is answered, then judged — but the control under the finger is now
 * continuous, which is what makes it feel like keying a word rather than
 * being asked six questions.
 */
export function MorseWordKeyInput({
  word,
  locked = false,
  advanceToken,
  onProgress,
  onSubmit,
}: MorseWordKeyInputProps) {
  const letters = Array.from(word) as MorseLetter[]
  const [characterIndex, setCharacterIndex] = useState(0)
  const [patterns, setPatterns] = useState<string[]>([])

  // A new word on the same mounted control resets the word-level bookkeeping;
  // the key below resets itself from the same token.
  useEffect(() => {
    setCharacterIndex(0)
    setPatterns([])
  }, [advanceToken, word])

  useEffect(() => {
    onProgress?.(characterIndex)
  }, [characterIndex, onProgress])

  const letter = letters[characterIndex]
  if (!letter) return null

  function submitCharacter(pattern: string) {
    const next = [...patterns, pattern]
    if (next.length === letters.length) {
      onSubmit(next)
      return
    }
    setPatterns(next)
    setCharacterIndex((index) => index + 1)
  }

  return (
    <div aria-label={`Key the word ${word}`}>
      <MorseKeyInput
        expectedLength={MORSE_LETTERS[letter].length}
        locked={locked}
        // The key clears in place between letters and between words. The
        // word itself is part of the token so a same-length letter at the
        // same index in a different word still re-arms the control.
        advanceToken={`${advanceToken ?? ''}-${word}-${characterIndex}`}
        onSubmit={submitCharacter}
      />
    </div>
  )
}
