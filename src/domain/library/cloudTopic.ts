import type { Topic } from './topic'
import type { LearnEntry } from '../learning/content'

// Classification copy and asset QA: #141 and #131's maintained provenance ledger.
const GENERA = [
  ['Ci', 'Cirrus', 'High', 'Detached white filaments, patches or narrow bands, with a fibrous or silky appearance.', 'Jebulon', '3.0'],
  ['Cc', 'Cirrocumulus', 'High', 'Very small white grains or ripples, generally without shading. Most regular elements appear less than 1° wide.', 'King of Hearts', '3.0'],
  ['Cs', 'Cirrostratus', 'High', 'A transparent whitish veil covering part or all of the sky, often producing halos.', 'Eduardo Marquetti', '2.0'],
  ['Ac', 'Altocumulus', 'Middle', 'White or grey rounded masses, rolls or patches, generally with shading. Regular elements usually appear 1–5° wide.', 'Bidgee', '3.0'],
  ['As', 'Altostratus', 'Middle', 'A grey or blue sheet. The Sun may appear vaguely through thinner parts, as through ground glass; no halo.', 'The Great Cloudwatcher', '3.0'],
  ['Ns', 'Nimbostratus', 'Middle; often extends into other levels', 'A thick grey or dark diffuse layer that blots out the Sun, usually with continuous rain or snow.', 'Simon A. Eugster', '3.0'],
  ['St', 'Stratus', 'Low', 'A generally uniform grey low layer. When the Sun is visible its outline is clear. Ragged patches are also possible.', 'GerritR', '4.0'],
  ['Sc', 'Stratocumulus', 'Low', 'Large rounded masses or rolls in a grey or white layer, usually with dark parts. Regular elements appear more than 5° wide.', 'GerritR', '4.0'],
  ['Cu', 'Cumulus', 'Low base; tops may reach higher levels', 'Detached dense mounds, domes or towers with sharp cauliflower-like tops and darker, nearly horizontal bases.', 'Toby Hudson', '3.0'],
  ['Cb', 'Cumulonimbus', 'Low base; develops through all levels', 'A heavy dense cloud of great vertical extent. Its upper portion becomes smooth or fibrous and often spreads into an anvil.', 'Kamil Nowacki', '4.0'],
] as const

const PHOTO_SOURCES: Record<string, string> = {
  "cirrus": "https://commons.wikimedia.org/wiki/File:Cirrus_Sierra.JPG",
  "cirrocumulus": "https://commons.wikimedia.org/wiki/File:Cirrocumulus_clouds_Thousand_Oaks_July_2010.jpg",
  "cirrostratus": "https://commons.wikimedia.org/wiki/File:Cirrostratus_fibratus_with_22_degrees_halo.jpg",
  "altocumulus": "https://commons.wikimedia.org/wiki/File:Altocumulus.jpg",
  "altostratus": "https://commons.wikimedia.org/wiki/File:Altostratus_translucidus.jpg",
  "nimbostratus": "https://commons.wikimedia.org/wiki/File:Nimbostratus_virga_grey_with_hills.jpg",
  "stratocumulus": "https://commons.wikimedia.org/wiki/File:Stratocumulus_stratiformis_%C3%BCber_dem_Wachtk%C3%BCppel.jpg",
  "stratus": "https://commons.wikimedia.org/wiki/File:Stratus_nebulosus_%C3%BCber_Limburg,_26.11.2020.jpg",
  "cumulus": "https://commons.wikimedia.org/wiki/File:Cumulus_humilis_clouds.jpg",
  "cumulonimbus": "https://commons.wikimedia.org/wiki/File:Cumulonimbus_incus_over_Warsaw,_Poland.jpg"
}

function entry([marker, title, meta, cue, creator, licence]: typeof GENERA[number]): LearnEntry {
  const genus = title.toLowerCase()
  return {
    marker, title, meta,
    fields: [{ label: 'Look for', text: cue }],
    visual: {
      source: { kind: 'image', src: `/media/clouds/${genus}.avif`, width: 700, height: 467 },
      alt: `${title}: ${cue}`,
      credit: `Photo: ${creator}, CC BY-SA ${licence}, via Wikimedia Commons. Cropped and resized; derivative under the same licence.`,
      assetId: `cloud-${genus}`,
    },
  }
}

export function cloudTopic(createdAt: string): Topic {
  return {
    id: 'cloud-genera', title: 'Cloud Genera', track: 'tradecraft',
    scope: 'The ten WMO cloud-genus abbreviations → their full names. Test scores vocabulary only, not photographic identification, cloud heights, species, weather prediction or professional observation.',
    items: GENERA.map(([prompt, answer], index) => ({ id: `cloud-genera-item-${String(index + 1).padStart(2, '0')}`, kind: 'forward', prompt, answer })),
    learn: {
      kind: 'briefing',
      overview: 'A genus is one of the ten main WMO cloud classes. Learn the vocabulary here and use the photographs to compare visible forms. The photographs are orientation examples, never Test questions.',
      sections: [
        {
          heading: 'Cloud levels',
          blocks: [{ type: 'definitions', items: [
            { term: 'High', definition: 'Cirrus (Ci), Cirrocumulus (Cc), Cirrostratus (Cs).' },
            { term: 'Middle', definition: 'Altocumulus (Ac), Altostratus (As), Nimbostratus (Ns). Altostratus often extends above this level; Nimbostratus usually extends into other levels.' },
            { term: 'Low-base', definition: 'Stratus (St), Stratocumulus (Sc), Cumulus (Cu), Cumulonimbus (Cb). Cumulus and Cumulonimbus can develop far upward. Vertical development is a cue, not a fourth WMO level.' },
          ] }],
        },
        ...[
          { heading: 'High clouds', genera: GENERA.slice(0, 3) },
          { heading: 'Middle clouds', genera: GENERA.slice(3, 6) },
          { heading: 'Low-base clouds', genera: GENERA.slice(6) },
        ].map(({ heading, genera }) => ({ heading, blocks: [{ type: 'entries' as const, presentation: 'visual-guide' as const, entries: genera.map(entry) }] })),
        {
          heading: 'Compare grains, masses and rolls',
          blocks: [{ type: 'paragraph', text: 'Cirrocumulus, Altocumulus and Stratocumulus form a size continuum: tiny, usually unshaded grains; medium, often shaded masses; large low rolls or masses. Apparent widths for regular elements are respectively less than 1°, usually 1–5°, and greater than 5°. These ground-observer cues need wider sky context; a tight photograph can hide it.' }],
        },
        {
          heading: 'Compare veils and sheets',
          blocks: [{ type: 'paragraph', text: 'Cirrostratus is a transparent whitish veil, often with a halo. Altostratus is greyer or bluer and gives no halo; the Sun can appear as through ground glass. Nimbostratus is thick enough to hide the Sun, usually with continuous rain or snow. Cirrus differs from Cirrostratus by its detached filaments rather than a broad veil.' }],
        },
        {
          heading: 'Compare uniform layers and cloud towers',
          blocks: [{ type: 'paragraph', text: 'Stratus is generally uniform; Stratocumulus has distinct rounded masses or rolls and dark parts. Cumulus has sharp detached mounds or towers. Cumulonimbus has much greater vertical extent, with a smooth or fibrous upper portion that often spreads into an anvil.' }],
        },
        {
          heading: 'What clouds can tell you',
          blocks: [{ type: 'paragraph', text: 'Cloud form can describe present conditions and support identification. A genus or one photograph does not predict when rain will arrive or how severe future weather will be. Motion, wider sky context and measured heights are absent from these still images.' }],
        },
      ],
      limitations: ['Completion proves the ten abbreviation-to-name mappings only. One photograph per genus cannot demonstrate recognition across natural variation.', 'The guide is for ground views in ordinary daylight. It does not cover species, varieties, night, aircraft or satellite views, height measurement, professional observing or forecasting.'],
      sources: [
        { label: 'WMO International Cloud Atlas: cloud genera', url: 'https://cloudatlas.wmo.int/en/clouds-genera.html', note: 'Controlling taxonomy and ten-genus vocabulary.' },
        { label: 'WMO: cloud definitions and levels', url: 'https://cloudatlas.wmo.int/en/clouds-definitions.html', note: 'WMO level allocation and exceptions.' },
        { label: 'WMO: tabular guide to genera', url: 'https://cloudatlas.wmo.int/en/tabular-guide-genus.html', note: 'Comparative identification cues for ground observation.' },
        ...GENERA.map(([, title, , , creator, licence]) => ({ label: `${title} photograph: ${creator}, CC BY-SA ${licence}`, url: PHOTO_SOURCES[title.toLowerCase()], note: `Cropped/resized derivative shared under CC BY-SA ${licence} (https://creativecommons.org/licenses/by-sa/${licence}/). Original source and packaged hash are recorded in the repository’s #131 asset ledger.` })),
      ],
    },
    status: 'unstarted', createdAt, drilledAt: null, learningAt: null, completedAt: null, lastTestedAt: null, spotCheckedAt: null, history: [],
  }
}
