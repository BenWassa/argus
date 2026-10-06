import type { IdentifiedItem, Topic } from '../library/topic'

export const CAF_RANK_EQUIVALENCIES_ID = 'caf-rank-equivalencies'

export interface CafRankLevel {
  level: number
  army: string
  armyAbbr: string
  rcaf: string
  rcafAbbr: string
  rcn: string
  rcnAbbr: string
  status: 'statutory rank' | 'appointment' | 'junior classification'
}

/**
 * Current practical CAF cross-environment recognition ladder (#176/#177).
 *
 * QR&O 3.01 owns the statutory hierarchy. The two extra practical rows are
 * deliberate and must not be described as extra statutory ranks:
 *
 * - MCpl/MS is an appointment above Cpl/S1; QR&O 3.08 and CAFMPI 01/26 say
 *   the underlying rank remains Corporal / Sailor 1st Class.
 * - Private/Aviator Basic and Trained are junior classifications represented
 *   separately in current CAF rank references, with RCN S3/S2 designations.
 *
 * Learner-facing RCN names use the current Sailor terminology from CAFMPI
 * 01/26 and current CAF rank pages. QR&O's web table still carries the legacy
 * Seaman names at these junior levels; Learn copy records that discrepancy.
 */
export const CAF_RANK_LEVELS: readonly CafRankLevel[] = [
  { level: 1, army: 'General', armyAbbr: 'Gen', rcaf: 'General', rcafAbbr: 'Gen', rcn: 'Admiral', rcnAbbr: 'Adm', status: 'statutory rank' },
  { level: 2, army: 'Lieutenant-General', armyAbbr: 'LGen', rcaf: 'Lieutenant-General', rcafAbbr: 'LGen', rcn: 'Vice-Admiral', rcnAbbr: 'VAdm', status: 'statutory rank' },
  { level: 3, army: 'Major-General', armyAbbr: 'MGen', rcaf: 'Major-General', rcafAbbr: 'MGen', rcn: 'Rear-Admiral', rcnAbbr: 'RAdm', status: 'statutory rank' },
  { level: 4, army: 'Brigadier-General', armyAbbr: 'BGen', rcaf: 'Brigadier-General', rcafAbbr: 'BGen', rcn: 'Commodore', rcnAbbr: 'Cmdre', status: 'statutory rank' },
  { level: 5, army: 'Colonel', armyAbbr: 'Col', rcaf: 'Colonel', rcafAbbr: 'Col', rcn: 'Captain(N)', rcnAbbr: 'Capt(N)', status: 'statutory rank' },
  { level: 6, army: 'Lieutenant-Colonel', armyAbbr: 'LCol', rcaf: 'Lieutenant-Colonel', rcafAbbr: 'LCol', rcn: 'Commander', rcnAbbr: 'Cdr', status: 'statutory rank' },
  { level: 7, army: 'Major', armyAbbr: 'Maj', rcaf: 'Major', rcafAbbr: 'Maj', rcn: 'Lieutenant-Commander', rcnAbbr: 'LCdr', status: 'statutory rank' },
  { level: 8, army: 'Captain', armyAbbr: 'Capt', rcaf: 'Captain', rcafAbbr: 'Capt', rcn: 'Lieutenant(N)', rcnAbbr: 'Lt(N)', status: 'statutory rank' },
  { level: 9, army: 'Lieutenant', armyAbbr: 'Lt', rcaf: 'Lieutenant', rcafAbbr: 'Lt', rcn: 'Sub-Lieutenant', rcnAbbr: 'SLt', status: 'statutory rank' },
  { level: 10, army: 'Second Lieutenant', armyAbbr: '2Lt', rcaf: 'Second Lieutenant', rcafAbbr: '2Lt', rcn: 'Acting Sub-Lieutenant', rcnAbbr: 'A/SLt', status: 'statutory rank' },
  { level: 11, army: 'Officer Cadet', armyAbbr: 'OCdt', rcaf: 'Officer Cadet', rcafAbbr: 'OCdt', rcn: 'Naval Cadet', rcnAbbr: 'NCdt', status: 'statutory rank' },
  { level: 12, army: 'Chief Warrant Officer', armyAbbr: 'CWO', rcaf: 'Chief Warrant Officer', rcafAbbr: 'CWO', rcn: 'Chief Petty Officer 1st Class', rcnAbbr: 'CPO1', status: 'statutory rank' },
  { level: 13, army: 'Master Warrant Officer', armyAbbr: 'MWO', rcaf: 'Master Warrant Officer', rcafAbbr: 'MWO', rcn: 'Chief Petty Officer 2nd Class', rcnAbbr: 'CPO2', status: 'statutory rank' },
  { level: 14, army: 'Warrant Officer', armyAbbr: 'WO', rcaf: 'Warrant Officer', rcafAbbr: 'WO', rcn: 'Petty Officer 1st Class', rcnAbbr: 'PO1', status: 'statutory rank' },
  { level: 15, army: 'Sergeant', armyAbbr: 'Sgt', rcaf: 'Sergeant', rcafAbbr: 'Sgt', rcn: 'Petty Officer 2nd Class', rcnAbbr: 'PO2', status: 'statutory rank' },
  { level: 16, army: 'Master Corporal', armyAbbr: 'MCpl', rcaf: 'Master Corporal', rcafAbbr: 'MCpl', rcn: 'Master Sailor', rcnAbbr: 'MS', status: 'appointment' },
  { level: 17, army: 'Corporal', armyAbbr: 'Cpl', rcaf: 'Corporal', rcafAbbr: 'Cpl', rcn: 'Sailor 1st Class', rcnAbbr: 'S1', status: 'statutory rank' },
  { level: 18, army: 'Private (Trained)', armyAbbr: 'Pte(T)', rcaf: 'Aviator (Trained)', rcafAbbr: 'Avr(T)', rcn: 'Sailor 2nd Class', rcnAbbr: 'S2', status: 'junior classification' },
  { level: 19, army: 'Private (Basic)', armyAbbr: 'Pte(B)', rcaf: 'Aviator (Basic)', rcafAbbr: 'Avr(B)', rcn: 'Sailor 3rd Class', rcnAbbr: 'S3', status: 'junior classification' },
]

function landAirLabel(level: CafRankLevel): string {
  if (level.army === level.rcaf) return `Army / RCAF — ${level.army}`
  return `Army — ${level.army} / RCAF — ${level.rcaf}`
}

const items: IdentifiedItem[] = CAF_RANK_LEVELS.flatMap((level, index) => {
  const pair = String(index + 1).padStart(2, '0')
  const landAir = landAirLabel(level)
  const navy = `RCN — ${level.rcn}`
  return [
    {
      id: `${CAF_RANK_EQUIVALENCIES_ID}-item-${pair}-land-air-to-rcn`,
      kind: 'forward' as const,
      prompt: landAir,
      answer: navy,
    },
    {
      id: `${CAF_RANK_EQUIVALENCIES_ID}-item-${pair}-rcn-to-land-air`,
      kind: 'forward' as const,
      prompt: navy,
      answer: landAir,
    },
  ]
})

export function cafRankEquivalenciesTopic(): Topic {
  return {
    id: CAF_RANK_EQUIVALENCIES_ID,
    title: 'CAF Rank Equivalencies',
    scope:
      'The 19 practical current Canadian Armed Forces hierarchy equivalencies between Canadian Army / RCAF designations and Royal Canadian Navy designations, tested in both directions as 38 directional prompts. The statutory hierarchy has 17 ranks; this practical set inserts the Master Corporal / Master Sailor appointment and displays the single Private / Aviator rank at Basic and Trained classifications. Insignia are not scored.',
    track: 'learning',
    items,
    learn: {
      kind: 'concise',
      overview:
        'CAF members share one hierarchy across environmental uniforms; the RCN uses naval designations while Army and RCAF mostly share rank names.',
      sections: [
        {
          heading: 'The practical hierarchy',
          blocks: [
            {
              type: 'table',
              columns: ['Level', 'Army', 'RCAF', 'RCN', 'Status'],
              rows: CAF_RANK_LEVELS.map((level) => [
                String(level.level),
                `${level.army} (${level.armyAbbr})`,
                `${level.rcaf} (${level.rcafAbbr})`,
                `${level.rcn} (${level.rcnAbbr})`,
                level.status,
              ]),
            },
            {
              type: 'bullets',
              items: [
                'QR&O 3.01 defines 17 statutory ranks. This practical table inserts MCpl/MS and splits the one Private/Aviator rank into Basic and Trained classifications.',
                'MCpl/MS is an appointment: the underlying rank remains Corporal/Sailor 1st Class.',
                'Current CAF policy uses Master Sailor and Sailor 1st/2nd/3rd Class; QR&O’s web table still carries older Seaman designations.',
              ],
            },
          ],
        },
      ],
      limitations: [
        'Test covers cross-environment equivalency only; insignia recognition, regimental titles and dress-placement rules are separate.',
        'Completion does not imply CAF service, leadership authority, command competence or military qualification.',
      ],
      sources: [
        {
          label: 'National Defence — QR&O Volume I, Chapter 3',
          url: 'https://www.canada.ca/en/department-national-defence/corporate/policies-standards/queens-regulations-orders/vol-1-administration/ch-3-rank-seniority-command-precedence.html',
          note: 'Article 3.01 defines the statutory rank hierarchy and environmental designations. Article 3.08 defines Master Corporal as an appointment while the member remains substantively a Corporal.',
        },
        {
          label: 'National Defence — CAFMPI 01/26, Promotion and other rank changes',
          url: 'https://www.canada.ca/en/department-national-defence/corporate/policies-standards/canadian-forces-military-personnel-instructions/promotion-and-other-rank-changes.html',
          note: 'Current personnel policy using Master Sailor and Sailor 1st/2nd/3rd Class terminology and confirming MCpl/MS as an appointment above the underlying Cpl/S1 rank.',
        },
        {
          label: 'National Defence — Military ranks',
          url: 'https://www.canada.ca/en/services/defence/caf/military-identity-system/rank-appointment-insignia.html',
          note: 'Current CAF service-reference table for Navy, Army and Air Force rank designations, classifications and abbreviations; it also records the RCN gender-neutral junior-rank nomenclature change pending amendment of QR&O 3.01.',
        },
      ],
    },
    status: 'unstarted',
    createdAt: new Date(0).toISOString(),
    drilledAt: null,
    learningAt: null,
    completedAt: null,
    lastTestedAt: null,
    spotCheckedAt: null,
    history: [],
  }
}
