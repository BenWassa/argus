# Morse lessons

**Status:** Maintained module guide

**Authority:** Describes implementation ownership; the contracts below govern behaviour.

`LessonRun.tsx` resolves the topic and route target, handles placement, and mounts
`MorseLesson` or `MorseCheckpoint`. `MorsePath.tsx` renders the derived curriculum
and checkpoint choices without writing progress.

`MorseLesson.tsx` composes the lesson screens with `LessonBar.tsx` and the
introduction, visual and listening presentations in `LessonSteps.tsx`.
`useLessonProgression.ts` owns answers, sitting state, listening selection,
audio, focus and next-lesson progression. It delegates ephemeral checkpoint
invitations and resume runs to `useCheckpointHandoff.ts`, and all durable writes
to `useLessonRecord.ts`. Replay uses the same screens with no-op record writes.

`MorseCheckpoint.tsx` runs transient letter warm-ups and words through the shared
keyed inputs and response lifecycle. It writes no learner progress.
`MorseLesson.css` stays imported by `MorseLesson.tsx`; the existing stylesheet
order and shared step classes remain together.

Contract: [Morse lesson](../../../../docs/open/MORSE_LESSON.md)

Contract: [Word checkpoints](../../../../docs/open/MORSE_WORD_CHECKPOINTS.md)

Contract: [Audio runtime](../../../../docs/open/MORSE_AUDIO_RUNTIME.md)
