export type TestCardTextScale = 'short' | 'medium' | 'long'

/**
 * Test cards use display type for token-length recall, then step down for
 * phrases and sentence/paragraph content so longer material stays scannable.
 */
export function testCardTextScale(text: string): TestCardTextScale {
  const length = text.trim().length
  if (length <= 16) return 'short'
  if (length <= 56) return 'medium'
  return 'long'
}

export function testCardTextClass(text: string): string {
  const scale = testCardTextScale(text)
  return scale === 'short' ? '' : ` is-${scale}`
}
