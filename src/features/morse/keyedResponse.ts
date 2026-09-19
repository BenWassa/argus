/**
 * The keyed Morse answer, as `features/morse` offers it to another feature.
 *
 * Learn, the word checkpoints and the Test ladder all ask for a Morse pattern
 * the same way — one key, and one lifecycle deciding when an answer is
 * finished with — and Test reached past this feature's root for both halves to
 * get it. They are the same pair or they are not shared at all, so this is the
 * root surface that says so: a sibling feature takes the control and the
 * lifecycle together from here, and `input/` stays private to Morse.
 */
export { MorseKeyInput } from './input/MorseKeyInput'
export { useKeyedResponse } from './input/useKeyedResponse'
