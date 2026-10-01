import type { FlagLetter } from './flags'

/**
 * The twelve-row asset manifest for Maritime II (#148), as the research note
 * §9 requires: per flag, where the meaning comes from, what the design is
 * checked against, how the asset is authored, who reviewed it and a hash that
 * pins the drawn design.
 *
 * `designSha256` is the SHA-256 of `canonicalDesign(flag.design)` (see
 * `flagHash.ts`), so any change to a flag's drawing fails a test until the hash
 * is deliberately re-pinned. It fences accidents; it does not prove a design is
 * correct.
 *
 * `review` is deliberately `null` for every flag. The authoritative depictions
 * (the IMO International Code of Signals and NGA Pub. 102) could not be reached
 * from the environments that produced and checked these redraws, so no flag has
 * been compared against them. A cross-check against the Wikimedia Commons
 * redraws (2026-09-30) found and fixed Oscar and Whiskey; it is recorded in the
 * issue note and is not a substitute for that review. The catalog topic should not ship until a reviewer has done that
 * comparison and filled this in; `docs/open/ISSUE_148_SIGNAL_FLAGS.md` lists what
 * to check.
 */
export interface FlagManifestEntry {
  letter: FlagLetter
  meaningSource: string
  designAuthority: string
  authoringMethod: 'project redraw'
  rendererId: string
  licence: string
  designSha256: string
  review: { reviewer: string; date: string; comparedWith: string[] } | null
}

const MEANING_SOURCE =
  'IMO International Code of Signals (2005 ed.; 5th ed. 2021, errata March 2022); meaning as retained in docs/open/ISSUE_138_MARITIME_VISUAL_LITERACY.md §3D'
const DESIGN_AUTHORITY =
  'IMO International Code of Signals flag designs; independent check: NGA Pub. 102 depiction'

export const FLAG_DESIGN_SHA256: Record<FlagLetter, string> = {
  A: '92760ed004d9cbfb5017b20a7877318ec4c4816a09f430cbd33dabcdceacb32c',
  B: 'bf0fd6133896145f5c8ec0c446c1a7d454f6d0df4af2424d282d340eb63ce67d',
  D: 'a089d66e2894b2e4f1a5ed3c6be27ec7cc282c7e5fe0fcde4807f7a60d0616ae',
  F: '5720ed190ee43a843ee82fca7120b6599630bbb15ad29e6dcd74d5506036ff4f',
  J: '94225215f12c4b8afb792abaa4f4422c61f32a9fb7f126ec4f1e57ba2704e8af',
  L: 'fd449624e1774bbb5be77d5a2501f3132ae2fd1c4e7d9dd6b44143a209895f76',
  M: '161c25f5c850a4ad946646ff188fead1003069dcd723f755ebacad543ae16808',
  O: 'a1993181911f34b34ca76a76632a969be9c3009c6fb4e749c0369651ad4ca655',
  U: 'a2428febb402805015d7018410aed8605c70f8ba01e27e95623fdaaf9d75c080',
  V: 'f0028fd8b4e6e20ba47c4a579adeba10d2483309a19a75bb7e78761a61299b7a',
  W: '1253844ae9e7ee0348364461d05b9b3bc2f573e8d6cd498eccc9dce44e805dee',
  Y: 'e29c7739b830ca44f7482e8d98046650a63530848d5ebf2b9ad243232bb475a0',
}

export const FLAG_MANIFEST: readonly FlagManifestEntry[] = (
  Object.keys(FLAG_DESIGN_SHA256) as FlagLetter[]
).map((letter) => ({
  letter,
  meaningSource: MEANING_SOURCE,
  designAuthority: DESIGN_AUTHORITY,
  authoringMethod: 'project redraw',
  rendererId: `signal-flag:${letter}`,
  licence: 'Project-authored deterministic redraw; no third-party artwork incorporated',
  designSha256: FLAG_DESIGN_SHA256[letter],
  review: null,
}))
