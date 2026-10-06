/**
 * Licence-safe implementation plan for #178.
 *
 * This module deliberately contains metadata only. It does not import, embed,
 * transform or ship any CAF rank-insignia artwork. The official image URLs are
 * research/provenance pointers and must not be turned into local /media assets
 * until written DND/CAF permission explicitly covers Argus's public PWA and
 * public GitHub repository use.
 */

export type CafRankService = 'army' | 'rcn' | 'rcaf'

export const CAF_RANK_RIGHTS_STATUS = 'blocked-pending-written-dnd-caf-licence' as const

const OFFICIAL_ASSET_ROOT =
  'https://www.canada.ca/content/dam/themes/defence/caf/militaryhistory/dhh/ranks'

export const CAF_RANK_SOURCE_PAGES: Record<CafRankService, string> = {
  army: 'https://www.canada.ca/en/services/defence/caf/military-identity-system/army-ranks.html',
  rcn: 'https://www.canada.ca/en/services/defence/caf/military-identity-system/navy-ranks.html',
  rcaf: 'https://www.canada.ca/en/services/defence/caf/military-identity-system/air-force-ranks.html',
}

export const CAF_RANK_DRESS_AUTHORITY =
  'https://www.canada.ca/en/services/defence/caf/military-identity-system/dress-manual/chapter-3/section-2.html'

export const CAF_RANK_RIGHTS_AUTHORITY =
  'https://www.canada.ca/en/department-national-defence/corporate/intellectual-property/crown-copyright.html'

export interface CafRankRecognitionPlanItem {
  id: string
  service: CafRankService
  level: number
  answer: string
  abbreviation: string
  options: readonly string[]
  officialSourcePageUrl: string
  officialAssetUrl: string
  dressInstructionFigure: '3-2-1' | '3-2-3' | '3-2-5' | '3-2-6' | '3-2-7' | '3-2-8'
  alt: string
  rightsStatus: typeof CAF_RANK_RIGHTS_STATUS
}

interface Seed {
  answer: string
  abbreviation: string
  asset: string
  options: readonly string[]
}

function planItem(
  service: CafRankService,
  level: number,
  seed: Seed,
  dressInstructionFigure: CafRankRecognitionPlanItem['dressInstructionFigure'],
): CafRankRecognitionPlanItem {
  const serviceLabel =
    service === 'army'
      ? 'Canadian Army'
      : service === 'rcn'
        ? 'Royal Canadian Navy'
        : 'Royal Canadian Air Force'

  return {
    id: `caf-${service}-rank-insignia-${String(level).padStart(2, '0')}`,
    service,
    level,
    answer: seed.answer,
    abbreviation: seed.abbreviation,
    options: seed.options,
    officialSourcePageUrl: CAF_RANK_SOURCE_PAGES[service],
    officialAssetUrl: `${OFFICIAL_ASSET_ROOT}/${seed.asset}`,
    dressInstructionFigure,
    alt: `${serviceLabel} service-dress rank insignia shown for visual identification; rank name omitted.`,
    rightsStatus: CAF_RANK_RIGHTS_STATUS,
  }
}

const ARMY: readonly Seed[] = [
  { answer: 'General', abbreviation: 'Gen', asset: 'army-general.png', options: ['General', 'Lieutenant-General', 'Major-General', 'Brigadier-General'] },
  { answer: 'Lieutenant-General', abbreviation: 'LGen', asset: 'army-lieutenant-general.png', options: ['General', 'Lieutenant-General', 'Major-General', 'Brigadier-General'] },
  { answer: 'Major-General', abbreviation: 'MGen', asset: 'army-major-general.png', options: ['General', 'Lieutenant-General', 'Major-General', 'Brigadier-General'] },
  { answer: 'Brigadier-General', abbreviation: 'BGen', asset: 'army-brigadier-general.png', options: ['General', 'Lieutenant-General', 'Major-General', 'Brigadier-General'] },
  { answer: 'Colonel', abbreviation: 'Col', asset: 'army-colonel.png', options: ['Colonel', 'Lieutenant-Colonel', 'Major'] },
  { answer: 'Lieutenant-Colonel', abbreviation: 'LCol', asset: 'army-lieutenant-colonel.png', options: ['Colonel', 'Lieutenant-Colonel', 'Major'] },
  { answer: 'Major', abbreviation: 'Maj', asset: 'army-major.png', options: ['Colonel', 'Lieutenant-Colonel', 'Major'] },
  { answer: 'Captain', abbreviation: 'Capt', asset: 'army-captain.png', options: ['Captain', 'Lieutenant', 'Second Lieutenant'] },
  { answer: 'Lieutenant', abbreviation: 'Lt', asset: 'army-lieutenant.png', options: ['Captain', 'Lieutenant', 'Second Lieutenant'] },
  { answer: 'Second Lieutenant', abbreviation: '2Lt', asset: 'army-lieutenant-2.png', options: ['Captain', 'Lieutenant', 'Second Lieutenant', 'Officer Cadet'] },
  { answer: 'Officer Cadet', abbreviation: 'OCdt', asset: 'army-officer-cadet.png', options: ['Officer Cadet', 'Second Lieutenant', 'Lieutenant'] },
  { answer: 'Chief Warrant Officer', abbreviation: 'CWO', asset: 'army-senior-chief-warrant-officer.png', options: ['Chief Warrant Officer', 'Master Warrant Officer', 'Warrant Officer', 'Sergeant'] },
  { answer: 'Master Warrant Officer', abbreviation: 'MWO', asset: 'army-master-warrant-officer.png', options: ['Chief Warrant Officer', 'Master Warrant Officer', 'Warrant Officer', 'Sergeant'] },
  { answer: 'Warrant Officer', abbreviation: 'WO', asset: 'army-warrant-officer.png', options: ['Chief Warrant Officer', 'Master Warrant Officer', 'Warrant Officer', 'Sergeant'] },
  { answer: 'Sergeant', abbreviation: 'Sgt', asset: 'army-sergeant.png', options: ['Chief Warrant Officer', 'Master Warrant Officer', 'Warrant Officer', 'Sergeant'] },
  { answer: 'Master Corporal', abbreviation: 'MCpl', asset: 'army-master-corporal.png', options: ['Master Corporal', 'Corporal', 'Private (Trained)', 'Private (Basic)'] },
  { answer: 'Corporal', abbreviation: 'Cpl', asset: 'army-corporal.png', options: ['Master Corporal', 'Corporal', 'Private (Trained)', 'Private (Basic)'] },
  { answer: 'Private (Trained)', abbreviation: 'Pte(T)', asset: 'army-private.png', options: ['Master Corporal', 'Corporal', 'Private (Trained)', 'Private (Basic)'] },
  { answer: 'Private (Basic)', abbreviation: 'Pte(B)', asset: 'army-private-basic.png', options: ['Master Corporal', 'Corporal', 'Private (Trained)', 'Private (Basic)'] },
]

const RCN: readonly Seed[] = [
  { answer: 'Admiral', abbreviation: 'Adm', asset: 'navy-admiral-sleeve.png', options: ['Admiral', 'Vice-Admiral', 'Rear-Admiral', 'Commodore'] },
  { answer: 'Vice-Admiral', abbreviation: 'VAdm', asset: 'navy-vice-admiral-sleeve.png', options: ['Admiral', 'Vice-Admiral', 'Rear-Admiral', 'Commodore'] },
  { answer: 'Rear-Admiral', abbreviation: 'RAdm', asset: 'navy-rear-admiral-sleeve.png', options: ['Admiral', 'Vice-Admiral', 'Rear-Admiral', 'Commodore'] },
  { answer: 'Commodore', abbreviation: 'Cmdre', asset: 'navy-commodore-sleeve.png', options: ['Admiral', 'Vice-Admiral', 'Rear-Admiral', 'Commodore'] },
  { answer: 'Captain(N)', abbreviation: 'Capt(N)', asset: 'navy-captain.png', options: ['Captain(N)', 'Commander', 'Lieutenant-Commander'] },
  { answer: 'Commander', abbreviation: 'Cdr', asset: 'navy-commander.png', options: ['Captain(N)', 'Commander', 'Lieutenant-Commander'] },
  { answer: 'Lieutenant-Commander', abbreviation: 'LCdr', asset: 'navy-lieutenant-commander.png', options: ['Captain(N)', 'Commander', 'Lieutenant-Commander'] },
  { answer: 'Lieutenant(N)', abbreviation: 'Lt(N)', asset: 'navy-lieutenant.png', options: ['Lieutenant(N)', 'Sub-Lieutenant', 'Acting Sub-Lieutenant', 'Naval Cadet'] },
  { answer: 'Sub-Lieutenant', abbreviation: 'SLt', asset: 'navy-sub-lieutenant.png', options: ['Lieutenant(N)', 'Sub-Lieutenant', 'Acting Sub-Lieutenant', 'Naval Cadet'] },
  { answer: 'Acting Sub-Lieutenant', abbreviation: 'A/SLt', asset: 'navy-acting-sub-lieutenant.png', options: ['Lieutenant(N)', 'Sub-Lieutenant', 'Acting Sub-Lieutenant', 'Naval Cadet'] },
  { answer: 'Naval Cadet', abbreviation: 'NCdt', asset: 'navy-naval-cadet.png', options: ['Lieutenant(N)', 'Sub-Lieutenant', 'Acting Sub-Lieutenant', 'Naval Cadet'] },
  { answer: 'Chief Petty Officer 1st Class', abbreviation: 'CPO1', asset: 'navy-chief-petty-officer-1.png', options: ['Chief Petty Officer 1st Class', 'Chief Petty Officer 2nd Class', 'Petty Officer 1st Class', 'Petty Officer 2nd Class'] },
  { answer: 'Chief Petty Officer 2nd Class', abbreviation: 'CPO2', asset: 'navy-chief-petty-officer-2.png', options: ['Chief Petty Officer 1st Class', 'Chief Petty Officer 2nd Class', 'Petty Officer 1st Class', 'Petty Officer 2nd Class'] },
  { answer: 'Petty Officer 1st Class', abbreviation: 'PO1', asset: 'navy-petty-officer-1.png', options: ['Chief Petty Officer 1st Class', 'Chief Petty Officer 2nd Class', 'Petty Officer 1st Class', 'Petty Officer 2nd Class'] },
  { answer: 'Petty Officer 2nd Class', abbreviation: 'PO2', asset: 'navy-petty-officer-2.png', options: ['Chief Petty Officer 1st Class', 'Chief Petty Officer 2nd Class', 'Petty Officer 1st Class', 'Petty Officer 2nd Class'] },
  { answer: 'Master Sailor', abbreviation: 'MS', asset: 'navy-master-seaman.png', options: ['Master Sailor', 'Sailor 1st Class', 'Sailor 2nd Class', 'Sailor 3rd Class'] },
  { answer: 'Sailor 1st Class', abbreviation: 'S1', asset: 'navy-leading-seaman.png', options: ['Master Sailor', 'Sailor 1st Class', 'Sailor 2nd Class', 'Sailor 3rd Class'] },
  { answer: 'Sailor 2nd Class', abbreviation: 'S2', asset: 'navy-able-seaman.png', options: ['Master Sailor', 'Sailor 1st Class', 'Sailor 2nd Class', 'Sailor 3rd Class'] },
  { answer: 'Sailor 3rd Class', abbreviation: 'S3', asset: 'navy-ordinary-seaman.png', options: ['Master Sailor', 'Sailor 1st Class', 'Sailor 2nd Class', 'Sailor 3rd Class'] },
]

const RCAF: readonly Seed[] = [
  { answer: 'General', abbreviation: 'Gen', asset: 'air-general.png', options: ['General', 'Lieutenant-General', 'Major-General', 'Brigadier-General'] },
  { answer: 'Lieutenant-General', abbreviation: 'LGen', asset: 'air-lieutenant-general.png', options: ['General', 'Lieutenant-General', 'Major-General', 'Brigadier-General'] },
  { answer: 'Major-General', abbreviation: 'MGen', asset: 'air-major-general.png', options: ['General', 'Lieutenant-General', 'Major-General', 'Brigadier-General'] },
  { answer: 'Brigadier-General', abbreviation: 'BGen', asset: 'air-brigadier-general.png', options: ['General', 'Lieutenant-General', 'Major-General', 'Brigadier-General'] },
  { answer: 'Colonel', abbreviation: 'Col', asset: 'air-colonel.png', options: ['Colonel', 'Lieutenant-Colonel', 'Major'] },
  { answer: 'Lieutenant-Colonel', abbreviation: 'LCol', asset: 'air-lieutenant-colonel.png', options: ['Colonel', 'Lieutenant-Colonel', 'Major'] },
  { answer: 'Major', abbreviation: 'Maj', asset: 'air-major.png', options: ['Colonel', 'Lieutenant-Colonel', 'Major'] },
  { answer: 'Captain', abbreviation: 'Capt', asset: 'air-captain.png', options: ['Captain', 'Lieutenant', 'Second Lieutenant', 'Officer Cadet'] },
  { answer: 'Lieutenant', abbreviation: 'Lt', asset: 'air-lieutenant.png', options: ['Captain', 'Lieutenant', 'Second Lieutenant', 'Officer Cadet'] },
  { answer: 'Second Lieutenant', abbreviation: '2Lt', asset: 'air-lieutenant-2.png', options: ['Captain', 'Lieutenant', 'Second Lieutenant', 'Officer Cadet'] },
  { answer: 'Officer Cadet', abbreviation: 'OCdt', asset: 'air-officer-cadet.png', options: ['Captain', 'Lieutenant', 'Second Lieutenant', 'Officer Cadet'] },
  { answer: 'Chief Warrant Officer', abbreviation: 'CWO', asset: 'air-senior-chief-warrant-officer.png', options: ['Chief Warrant Officer', 'Master Warrant Officer', 'Warrant Officer', 'Sergeant'] },
  { answer: 'Master Warrant Officer', abbreviation: 'MWO', asset: 'air-master-warrant-officer.png', options: ['Chief Warrant Officer', 'Master Warrant Officer', 'Warrant Officer', 'Sergeant'] },
  { answer: 'Warrant Officer', abbreviation: 'WO', asset: 'air-warrant-officer.png', options: ['Chief Warrant Officer', 'Master Warrant Officer', 'Warrant Officer', 'Sergeant'] },
  { answer: 'Sergeant', abbreviation: 'Sgt', asset: 'air-sergeant.png', options: ['Chief Warrant Officer', 'Master Warrant Officer', 'Warrant Officer', 'Sergeant'] },
  { answer: 'Master Corporal', abbreviation: 'MCpl', asset: 'air-master-corporal.png', options: ['Master Corporal', 'Corporal', 'Aviator (Trained)', 'Aviator (Basic)'] },
  { answer: 'Corporal', abbreviation: 'Cpl', asset: 'air-corporal.png', options: ['Master Corporal', 'Corporal', 'Aviator (Trained)', 'Aviator (Basic)'] },
  { answer: 'Aviator (Trained)', abbreviation: 'Avr(T)', asset: 'air-aviator.png', options: ['Master Corporal', 'Corporal', 'Aviator (Trained)', 'Aviator (Basic)'] },
  { answer: 'Aviator (Basic)', abbreviation: 'Avr(B)', asset: 'air-aviator-basic.png', options: ['Master Corporal', 'Corporal', 'Aviator (Trained)', 'Aviator (Basic)'] },
]

export const CAF_RANK_RECOGNITION_PLAN: readonly CafRankRecognitionPlanItem[] = [
  ...ARMY.map((seed, index) => planItem('army', index + 1, seed, index < 11 ? '3-2-1' : '3-2-6')),
  ...RCN.map((seed, index) => planItem('rcn', index + 1, seed, index < 11 ? '3-2-3' : '3-2-7')),
  ...RCAF.map((seed, index) => planItem('rcaf', index + 1, seed, index < 11 ? '3-2-5' : '3-2-8')),
]

export function cafRankRecognitionPlanFor(service: CafRankService): readonly CafRankRecognitionPlanItem[] {
  return CAF_RANK_RECOGNITION_PLAN.filter((item) => item.service === service)
}
