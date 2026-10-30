/**
 * The authored shape of a staged lesson (#296), and the checks a curriculum must
 * pass before it ships.
 *
 * Authored curricula may override the generated default (owner decision,
 * 2026-10-29). Generated lessons use only the topic's existing scored content.
 * Curricula live in code, not in the learner's library; only progress is stored
 * (`Topic.stageProgress`), and that is formative: completing a step writes no
 * item evidence, no history and nothing a Test reads.
 *
 * Everything here is pure data and pure checks. The runner that plays a stage,
 * and anything that writes progress, are separate and come later.
 */

/** Ids are deterministic and independent of display order, so progress survives a reordering. */
export const STAGE_ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,63}$/

/** Stage and step ids share a pattern; step ids are unique across a whole curriculum. */
export const MAX_STAGES = 12
export const MAX_STEPS_PER_STAGE = 16

interface StepBase {
  /** Unique across the curriculum. */
  id: string
}

/** Introduce one thing. The learner reads or looks, then continues. */
export interface ShowStep extends StepBase {
  kind: 'show'
  title: string
  body: string
  /** The scored item this introduces, when it introduces one. */
  itemId?: string
  /** Text equivalent for a visual; required whenever `itemId` names a figure item. */
  altText?: string
}

/** Pick the right one of 2-6 tiles for a prompt. */
export interface ChooseStep extends StepBase {
  kind: 'choose'
  itemId: string
  prompt: string
  options: string[]
  answer: string
  /** One line on the distinction, shown after a wrong answer. */
  explain: string
}

/** Choose between 2-3 look-alike or sound-alike items. */
export interface ContrastStep extends StepBase {
  kind: 'contrast'
  itemIds: string[]
  prompt: string
  /** Must be one of `itemIds`. */
  answerItemId: string
  explain: string
}

/** Tap blocks into the correct sequence. `blocks` is the correct order. */
export interface OrderStep extends StepBase {
  kind: 'order'
  itemId: string
  prompt: string
  blocks: string[]
  explain: string
}

/** Pick the missing part of a short, source-bounded exchange. */
export interface CompleteStep extends StepBase {
  kind: 'complete'
  itemId: string
  before: string
  after: string
  options: string[]
  answer: string
  explain: string
}

/** Reveal, then self-check. For items with no objective distractor. */
export interface RecallStep extends StepBase {
  kind: 'recall'
  itemId: string
}

/** A short mix of earlier and current items, weighted to the confusable ones. */
export interface CheckpointStep extends StepBase {
  kind: 'checkpoint'
  itemIds: string[]
}

/** One line on what the stage covered. */
export interface SummaryStep extends StepBase {
  kind: 'summary'
  text: string
}

export type LessonStep =
  | ShowStep
  | ChooseStep
  | ContrastStep
  | OrderStep
  | CompleteStep
  | RecallStep
  | CheckpointStep
  | SummaryStep

export type StepKind = LessonStep['kind']

export interface LessonStage {
  id: string
  /** Short and title-case: it is a row on the path. */
  title: string
  steps: LessonStep[]
}

export interface Curriculum {
  stages: LessonStage[]
}

/** The steps that ask the learner something. Every stage needs at least one. */
const ASKING: ReadonlySet<StepKind> = new Set(['choose', 'contrast', 'order', 'complete', 'recall', 'checkpoint'])

export function isAsking(step: LessonStep): boolean {
  return ASKING.has(step.kind)
}

/** The scored items a step asks about (not merely shows). */
export function askedItemIds(step: LessonStep): string[] {
  switch (step.kind) {
    case 'choose':
    case 'order':
    case 'complete':
    case 'recall':
      return [step.itemId]
    case 'contrast':
    case 'checkpoint':
      return step.itemIds
    default:
      return []
  }
}

export interface CurriculumCheckOptions {
  /** Item ids that carry a figure and so need a text equivalent when shown. */
  figureItemIds?: ReadonlySet<string>
  /**
   * Every scored item must be asked about somewhere, so finishing the lessons
   * covers the whole boundary a Test would. On by default.
   */
  requireFullCoverage?: boolean
}

function blank(value: string | undefined): boolean {
  return typeof value !== 'string' || value.trim().length === 0
}

function distinct(values: readonly string[]): boolean {
  return new Set(values).size === values.length
}

/**
 * Everything wrong with a curriculum, as readable messages; empty means it can
 * ship. `itemIds` are the topic's scored item ids, the answer key a step may refer to.
 */
export function checkCurriculum(
  curriculum: Curriculum,
  itemIds: ReadonlySet<string>,
  options: CurriculumCheckOptions = {},
): string[] {
  const problems: string[] = []
  const { stages } = curriculum
  const figures = options.figureItemIds ?? new Set<string>()

  if (stages.length === 0) problems.push('A curriculum needs at least one stage.')
  if (stages.length > MAX_STAGES) problems.push(`A curriculum has at most ${MAX_STAGES} stages.`)

  const stageIds = new Set<string>()
  const stepIds = new Set<string>()
  const asked = new Set<string>()

  for (const stage of stages) {
    const at = `Stage "${stage.id}"`
    if (!STAGE_ID_PATTERN.test(stage.id)) problems.push(`${at} needs an id of lower-case letters, digits and hyphens.`)
    if (stageIds.has(stage.id)) problems.push(`${at} repeats a stage id.`)
    stageIds.add(stage.id)
    if (blank(stage.title)) problems.push(`${at} needs a title.`)
    else if (stage.title.length > 40) problems.push(`${at} has a title over 40 characters; it is a row on the path.`)
    if (stage.steps.length === 0) problems.push(`${at} has no steps.`)
    if (stage.steps.length > MAX_STEPS_PER_STAGE) problems.push(`${at} has more than ${MAX_STEPS_PER_STAGE} steps.`)
    if (!stage.steps.some(isAsking)) problems.push(`${at} never asks the learner anything.`)

    for (const step of stage.steps) {
      const where = `${at}, step "${step.id}"`
      if (!STAGE_ID_PATTERN.test(step.id)) problems.push(`${where} needs an id of lower-case letters, digits and hyphens.`)
      if (stepIds.has(step.id)) problems.push(`${where} repeats a step id.`)
      stepIds.add(step.id)

      const known = (id: string, label: string) => {
        if (!itemIds.has(id)) problems.push(`${where} ${label} "${id}", which the topic does not have.`)
      }
      for (const id of askedItemIds(step)) { known(id, 'asks about'); asked.add(id) }

      switch (step.kind) {
        case 'show':
          if (blank(step.title) || blank(step.body)) problems.push(`${where} needs a title and a body.`)
          if (step.itemId !== undefined) {
            known(step.itemId, 'shows')
            if (figures.has(step.itemId) && blank(step.altText)) problems.push(`${where} shows a figure and needs altText.`)
          }
          break
        case 'choose':
          if (blank(step.prompt)) problems.push(`${where} needs a prompt.`)
          if (step.options.length < 2 || step.options.length > 6) problems.push(`${where} needs 2-6 options.`)
          if (!distinct(step.options) || step.options.some(blank)) problems.push(`${where} has a blank or repeated option.`)
          if (step.options.filter((option) => option === step.answer).length !== 1) problems.push(`${where} needs exactly one option equal to its answer.`)
          if (blank(step.explain)) problems.push(`${where} needs a one-line explanation for a wrong answer.`)
          break
        case 'contrast':
          if (step.itemIds.length < 2 || step.itemIds.length > 3) problems.push(`${where} contrasts 2-3 items.`)
          if (!distinct(step.itemIds)) problems.push(`${where} repeats an item.`)
          if (!step.itemIds.includes(step.answerItemId)) problems.push(`${where} has an answer that is not one of its items.`)
          if (blank(step.prompt)) problems.push(`${where} needs a prompt.`)
          if (blank(step.explain)) problems.push(`${where} needs a one-line explanation for a wrong answer.`)
          break
        case 'order':
          if (blank(step.prompt)) problems.push(`${where} needs a prompt.`)
          if (step.blocks.length < 2 || step.blocks.length > 8) problems.push(`${where} needs 2-8 blocks.`)
          if (!distinct(step.blocks) || step.blocks.some(blank)) problems.push(`${where} has a blank or repeated block.`)
          if (blank(step.explain)) problems.push(`${where} needs a one-line explanation for a wrong order.`)
          break
        case 'complete':
          if (blank(step.before) && blank(step.after)) problems.push(`${where} needs text around the gap.`)
          if (step.options.length < 2 || step.options.length > 6) problems.push(`${where} needs 2-6 options.`)
          if (!distinct(step.options) || step.options.some(blank)) problems.push(`${where} has a blank or repeated option.`)
          if (step.options.filter((option) => option === step.answer).length !== 1) problems.push(`${where} needs exactly one option equal to its answer.`)
          if (blank(step.explain)) problems.push(`${where} needs a one-line explanation for a wrong answer.`)
          break
        case 'checkpoint':
          if (step.itemIds.length === 0) problems.push(`${where} needs at least one item.`)
          if (!distinct(step.itemIds)) problems.push(`${where} repeats an item.`)
          break
        case 'summary':
          if (blank(step.text)) problems.push(`${where} needs text.`)
          break
        case 'recall':
          break
      }
    }
  }

  if (options.requireFullCoverage !== false) {
    const missing = [...itemIds].filter((id) => !asked.has(id))
    if (missing.length > 0) problems.push(`These scored items are never asked about: ${missing.join(', ')}.`)
  }
  return problems
}
