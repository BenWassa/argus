import { CLOUD_GENERA } from '../../library/cloudTopic'
import type { Curriculum, LessonStage, LessonStep } from '../stages'

/**
 * Cloud Genera lessons: look at the photograph, learn the name and its short
 * form, then be asked which cloud a photograph shows, three at a time.
 * Source boundary: the ten genera, cues and photographs already shipped in the
 * Cloud Genera topic. The photographs are for the lessons only; the Test still
 * scores the abbreviation-to-name vocabulary and nothing is added to it.
 */
const byAbbreviation = new Map<string, (typeof CLOUD_GENERA)[number]>(CLOUD_GENERA.map(genus => [genus.abbreviation, genus]))
const cloud = (abbreviation: string) => byAbbreviation.get(abbreviation)!

/** Look-alikes offered beside the right name, so the choice is a real one. */
const LOOK_ALIKES: Record<string, string[]> = {
  Ci: ['Cs', 'Cc', 'Ac'], Cc: ['Ac', 'Ci', 'Sc'], Cs: ['As', 'Ci', 'Cc'],
  Ac: ['Cc', 'Sc', 'As'], As: ['Cs', 'Ns', 'St'], Ns: ['As', 'St', 'Cb'],
  St: ['Sc', 'As', 'Ns'], Sc: ['Ac', 'St', 'Cu'], Cu: ['Cb', 'Sc', 'Ac'], Cb: ['Cu', 'Ns', 'Ci'],
}

function lesson(id: string, title: string, abbreviations: string[]): LessonStage {
  const genera = abbreviations.map(cloud)
  const shows = genera.map((genus): LessonStep => ({
    kind: 'show', id: `${id}-show-${genus.abbreviation.toLowerCase()}`, itemId: genus.itemId,
    title: genus.name, body: `${genus.abbreviation} (${genus.level.split(';')[0].toLowerCase()}). ${genus.cue}`,
    altText: genus.visual.alt, visual: genus.visual,
  }))
  const asks = genera.map((genus): LessonStep => ({
    kind: 'choose', id: `${id}-which-${genus.abbreviation.toLowerCase()}`, itemId: genus.itemId,
    prompt: 'Which cloud is this?', answer: genus.name, visual: genus.visual,
    options: [genus.name, ...LOOK_ALIKES[genus.abbreviation].map(other => cloud(other).name)],
    explain: `Look for: ${genus.cue}`,
  }))
  return { id, title, steps: [...shows, ...asks, { kind: 'checkpoint', id: `${id}-check`, itemIds: genera.map(genus => genus.itemId) }] }
}

export const cloudGeneraCurriculum: Curriculum = {
  stages: [
    lesson('cloud-high', 'High Clouds', ['Ci', 'Cc', 'Cs']),
    lesson('cloud-middle', 'Middle Clouds', ['Ac', 'As', 'Ns']),
    lesson('cloud-low-layers', 'Low Layers', ['St', 'Sc']),
    lesson('cloud-towers', 'Cloud Towers', ['Cu', 'Cb']),
  ],
}
