import { describe, expect, it } from 'vitest'
import {
  CAF_RANK_EQUIVALENCIES_ID,
  CAF_RANK_LEVELS,
  cafRankEquivalenciesTopic,
} from './cafRankTopic'

describe('CAF rank equivalencies (#177)', () => {
  it('ships exactly 19 ordered practical levels without calling all 19 statutory ranks', () => {
    const topic = cafRankEquivalenciesTopic()

    expect(topic.id).toBe(CAF_RANK_EQUIVALENCIES_ID)
    expect(topic.items).toHaveLength(19)
    expect(CAF_RANK_LEVELS).toHaveLength(19)
    expect(CAF_RANK_LEVELS.filter((level) => level.status === 'statutory rank')).toHaveLength(16)
    expect(CAF_RANK_LEVELS.filter((level) => level.status === 'appointment')).toHaveLength(1)
    expect(CAF_RANK_LEVELS.filter((level) => level.status === 'junior classification')).toHaveLength(2)
    expect(topic.scope).toContain('statutory hierarchy has 17 ranks')
    expect(topic.scope).toContain('appointment')
    expect(topic.scope).toContain('Basic and Trained classifications')
  })

  it('uses stable bidirectional item identities and current RCN terminology', () => {
    const topic = cafRankEquivalenciesTopic()

    expect(topic.items.map((item) => item.id)).toEqual(
      Array.from({ length: 19 }, (_, index) =>
        `caf-rank-equivalencies-item-${String(index + 1).padStart(2, '0')}`,
      ),
    )
    expect(topic.items.every((item) => item.kind === 'bidirectional')).toBe(true)

    expect(topic.items[0]).toMatchObject({
      prompt: 'Army / RCAF — General',
      answer: 'RCN — Admiral',
    })
    expect(topic.items[15]).toMatchObject({
      prompt: 'Army / RCAF — Master Corporal',
      answer: 'RCN — Master Sailor',
    })
    expect(topic.items[17]).toMatchObject({
      prompt: 'Army — Private (Trained) / RCAF — Aviator (Trained)',
      answer: 'RCN — Sailor 2nd Class',
    })
    expect(topic.items[18]).toMatchObject({
      prompt: 'Army — Private (Basic) / RCAF — Aviator (Basic)',
      answer: 'RCN — Sailor 3rd Class',
    })

    const scored = topic.items.map((item) => `${item.prompt} ${item.answer}`).join(' ')
    expect(scored).not.toMatch(/Master Seaman|Leading Seaman|Able Seaman|Ordinary Seaman/)
  })

  it('keeps appointment, classification and nomenclature caveats visible in Learn', () => {
    const topic = cafRankEquivalenciesTopic()
    const section = topic.learn?.sections?.[0]
    const blocks = section?.blocks ?? []
    const bullets = blocks.find((block) => block.type === 'bullets')
    const text = bullets?.type === 'bullets' ? bullets.items.join(' ') : ''

    expect(text).toContain('MCpl/MS is an appointment')
    expect(text).toContain('older Seaman designations')
    expect(topic.learn?.limitations?.some((note) => note.includes('insignia recognition'))).toBe(true)
    expect(topic.learn?.sources?.map((source) => source.url)).toEqual([
      'https://www.canada.ca/en/department-national-defence/corporate/policies-standards/queens-regulations-orders/vol-1-administration/ch-3-rank-seniority-command-precedence.html',
      'https://www.canada.ca/en/department-national-defence/corporate/policies-standards/canadian-forces-military-personnel-instructions/promotion-and-other-rank-changes.html',
    ])
  })
})
