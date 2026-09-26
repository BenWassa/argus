import beaufortWindScale from '../../assets/library-icons/beaufort-wind-scale.svg'
import cardinalBearings from '../../assets/library-icons/cardinal-bearings.svg'
import firearmSafetyActsProve from '../../assets/library-icons/firearm-safety-acts-prove.svg'
import greekAlphabet from '../../assets/library-icons/greek-alphabet.svg'
import hexDigitsBinary from '../../assets/library-icons/hex-digits-binary.svg'
import internationalMorseLettersPrinted from '../../assets/library-icons/international-morse-letters-printed.svg'
import natoPhonetic from '../../assets/library-icons/nato-phonetic.svg'
import oodaLoop from '../../assets/library-icons/ooda-loop.svg'
import primarySurvey from '../../assets/library-icons/primary-survey.svg'
import radiotelephonyNumbers from '../../assets/library-icons/radiotelephony-numbers.svg'
import scubaEquipmentAbbreviations from '../../assets/library-icons/scuba-equipment-abbreviations.svg'
import siPrefixes from '../../assets/library-icons/si-prefixes.svg'

const icons: Record<string, string> = {
  'beaufort-wind-scale': beaufortWindScale,
  'cardinal-bearings': cardinalBearings,
  'firearm-safety-acts-prove': firearmSafetyActsProve,
  'greek-alphabet': greekAlphabet,
  'hex-digits-binary': hexDigitsBinary,
  'international-morse-letters-printed': internationalMorseLettersPrinted,
  'nato-phonetic': natoPhonetic,
  'ooda-loop': oodaLoop,
  'primary-survey': primarySurvey,
  'radiotelephony-numbers': radiotelephonyNumbers,
  'scuba-equipment-abbreviations': scubaEquipmentAbbreviations,
  'si-prefixes': siPrefixes,
}

export function topicIcon(topicId: string): string | undefined {
  return icons[topicId]
}
