import beaufortWindScale from '../../assets/library-icons/beaufort-wind-scale.svg'
import cardinalBearings from '../../assets/library-icons/cardinal-bearings.svg'
import firearmSafetyActsProve from '../../assets/library-icons/firearm-safety-acts-prove.svg'
import greekAlphabet from '../../assets/library-icons/greek-alphabet.svg'
import gridNorthMapBearings from '../../assets/library-icons/grid-north-map-bearings.svg'
import hexDigitsBinary from '../../assets/library-icons/hex-digits-binary.svg'
import internationalMorseLettersPrinted from '../../assets/library-icons/international-morse-letters-printed.svg'
import navigationLights from '../../assets/library-icons/navigation-lights.svg'
import northReferencesDeclination from '../../assets/library-icons/north-references-declination.svg'
import natoPhonetic from '../../assets/library-icons/nato-phonetic.svg'
import oodaLoop from '../../assets/library-icons/ooda-loop.svg'
import primarySurvey from '../../assets/library-icons/primary-survey.svg'
import reciprocalBearings from '../../assets/library-icons/reciprocal-bearings.svg'
import radiotelephonyNumbers from '../../assets/library-icons/radiotelephony-numbers.svg'
import scubaEquipmentAbbreviations from '../../assets/library-icons/scuba-equipment-abbreviations.svg'
import signalFlags from '../../assets/library-icons/signal-flags.svg'
import siPrefixes from '../../assets/library-icons/si-prefixes.svg'
import vesselDayShapes from '../../assets/library-icons/vessel-day-shapes.svg'
import wholeCircleBearings from '../../assets/library-icons/whole-circle-bearings.svg'

const icons: Record<string, string> = {
  'beaufort-wind-scale': beaufortWindScale,
  'cardinal-bearings': cardinalBearings,
  'firearm-safety-acts-prove': firearmSafetyActsProve,
  'greek-alphabet': greekAlphabet,
  'grid-north-map-bearings': gridNorthMapBearings,
  'hex-digits-binary': hexDigitsBinary,
  'international-morse-letters-printed': internationalMorseLettersPrinted,
  'nato-phonetic': natoPhonetic,
  'navigation-lights': navigationLights,
  'north-references-declination': northReferencesDeclination,
  'ooda-loop': oodaLoop,
  'primary-survey': primarySurvey,
  'radiotelephony-numbers': radiotelephonyNumbers,
  'reciprocal-bearings': reciprocalBearings,
  'scuba-equipment-abbreviations': scubaEquipmentAbbreviations,
  'signal-flags': signalFlags,
  'si-prefixes': siPrefixes,
  'vessel-day-shapes': vesselDayShapes,
  'whole-circle-bearings': wholeCircleBearings,
}

export function topicIcon(topicId: string): string | undefined {
  return icons[topicId]
}
