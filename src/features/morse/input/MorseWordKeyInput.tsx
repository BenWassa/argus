import { useState } from 'react'
import { MORSE_LETTERS, type MorseLetter } from '../../../domain/morse/code'
import { MorseKeyInput } from './MorseKeyInput'

interface MorseWordKeyInputProps {
  word: string
  locked?: boolean
  onSubmit: (patterns: readonly string[]) => void
}

/**
 * Keeps a word as one learner-facing response while preserving the shared
 * one-key dit/dah control. Character boundaries are mechanical only: there is
 * no per-character verdict, pause button, or confirmation step.
 */
export function MorseWordKeyInput({ word, locked = false, onSubmit }: MorseWordKeyInputProps) {
  const letters = Array.from(word) as MorseLetter[]
  const [characterIndex, setCharacterIndex] = useState(0)
  const [patterns, setPatterns] = useState<string[]>([])
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
        key={`${word}-${characterIndex}`}
        expectedLength={MORSE_LETTERS[letter].length}
        locked={locked}
        onSubmit={submitCharacter}
      />
    </div>
  )
}
