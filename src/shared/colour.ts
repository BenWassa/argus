export type RGB = readonly [number, number, number]
export type OKLCH = readonly [number, number, number]
export type Colour = string | OKLCH

const clamp = (value: number) => Math.max(0, Math.min(1, value))

/** CSS Color 4's D65 OKLab transform, before display-gamut clipping. */
export function oklchToLinearSrgb([lightness, chroma, hue]: OKLCH): RGB {
  const angle = hue * Math.PI / 180
  const a = chroma * Math.cos(angle)
  const b = chroma * Math.sin(angle)
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
}

export function linearToSrgb(value: number): number {
  const clipped = clamp(value)
  return clipped <= 0.0031308 ? 12.92 * clipped : 1.055 * clipped ** (1 / 2.4) - 0.055
}

export function srgbToLinear(value: number): number {
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
}

/** Ratios use the clipped sRGB display colour, rather than out-of-gamut light. */
export function toSrgb(colour: Colour): RGB {
  if (typeof colour !== 'string') return oklchToLinearSrgb(colour).map(linearToSrgb) as unknown as RGB
  if (!/^#[\da-f]{6}$/i.test(colour)) throw new Error(`Expected six-digit hex: ${colour}`)
  return [1, 3, 5].map(offset => parseInt(colour.slice(offset, offset + 2), 16) / 255) as unknown as RGB
}

export function relativeLuminance(colour: Colour): number {
  const [r, g, b] = toSrgb(colour).map(srgbToLinear)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrastRatio(a: Colour, b: Colour): number {
  const values = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x)
  return (values[0] + 0.05) / (values[1] + 0.05)
}

export function hueDistance(a: number, b: number): number {
  const distance = ((a - b) % 360 + 360) % 360
  return Math.min(distance, 360 - distance)
}

/** Reverse transform, so hex colours can be compared by hue. */
export function toOklch(colour: Colour): OKLCH {
  if (typeof colour !== 'string') return colour
  const [r, g, b] = toSrgb(colour).map(srgbToLinear)
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const bAxis = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, Math.hypot(a, bAxis), (Math.atan2(bAxis, a) * 180 / Math.PI + 360) % 360]
}

export function colourCss(colour: Colour): string {
  return typeof colour === 'string' ? colour : `oklch(${colour.join(' ')})`
}
