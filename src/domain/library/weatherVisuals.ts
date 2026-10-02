import type { LearnSection } from '../learning/content'

/** Approved #129 artwork. These scenes illustrate ranges, never exact forces. */
export const beaufortVisualGuide: LearnSection = {
  heading: 'Read the wind at a glance',
  blocks: [
    { type: 'paragraph', text: 'Compare the same coastline as wind strengthens. These illustrations build intuition; a still image cannot diagnose an exact force. Test asks only the force names and knot ranges.' },
    {
      type: 'entries',
      presentation: 'visual-guide',
      entries: [
        ['0–3', 'Calm to gentle breeze', 'Mostly smooth water develops ripples, then small wavelets. Leaves and grasses begin to move.', 'Ripples · small wavelets · light vegetation movement', '0-3', 'Rocky lighthouse coast in calm to light-breeze conditions, with smooth water and only small ripples.'],
        ['4–6', 'Moderate to strong breeze', 'Whitecaps become common, waves grow and exposed vegetation moves continuously.', 'Frequent whitecaps · larger waves · sustained movement', '4-6', 'The same lighthouse coast under moderate to strong breeze, with frequent whitecaps and wind-bent grasses.'],
        ['7–9', 'Near gale to strong gale', 'Foam blows along rough breaking seas, spray increases and larger branches are visibly affected.', 'Breaking waves · streaking foam · spray · difficult walking', '7-9', 'The same lighthouse coast in near-gale to strong-gale conditions, with rough breaking seas, blown spray and bent vegetation.'],
        ['10–12', 'Storm to hurricane force', 'Very high seas and dense spray dominate. Visibility can deteriorate sharply and structural damage becomes possible.', 'Very high waves · airborne spray · poor visibility · damage risk', '10-12', 'The same lighthouse coast in storm to hurricane-force conditions, with very rough seas, dense spray, rain and reduced visibility.'],
      ].map(([marker, title, text, cues, range, alt]) => ({
        marker, title,
        fields: [{ label: 'Visible effects', text }, { label: 'Look for', text: cues }],
        visual: {
          source: { kind: 'image', src: `/media/beaufort/beaufort-${range}.avif`, width: 700, height: 300 },
          alt,
          assetId: `beaufort-${range}`,
          credit: 'Illustrative artwork supplied for Argus, approved Beaufort guide set (#129).',
        },
      })),
    },
  ],
}
