import { describe, expect, it } from 'vitest'
import {
  LIGHT_SECTORS,
  PLAN_LIGHTS,
  SCORED_ASPECTS,
  describeAspect,
  describeVisibleLights,
  isVisible,
  visibleLights,
} from './lights'

const sectorOf = (id: string) => LIGHT_SECTORS.find((light) => light.id === id)!

describe('Rule 21 sector data', () => {
  it('has the source arcs and colours', () => {
    expect(sectorOf('masthead')).toMatchObject({ colour: 'white', width: 225 })
    expect(sectorOf('starboard-sidelight')).toMatchObject({ colour: 'green', width: 112.5 })
    expect(sectorOf('port-sidelight')).toMatchObject({ colour: 'red', width: 112.5 })
    expect(sectorOf('sternlight')).toMatchObject({ colour: 'white', width: 135 })
  })

  it('puts the masthead light from right ahead to 22.5° abaft the beam on each side', () => {
    const mast = sectorOf('masthead')
    expect(mast.centre).toBe(0)
    expect(mast.from).toBe(247.5) // 22.5° abaft the port beam
    expect(mast.to).toBe(112.5) // 22.5° abaft the starboard beam
  })

  it('has sidelights that meet on the centreline and sectors that tile the full circle with no gap', () => {
    expect(sectorOf('starboard-sidelight').from).toBe(0)
    expect(sectorOf('port-sidelight').to).toBe(0)
    // Two sidelights plus the sternlight cover 360° exactly, without overlap.
    expect(112.5 + 112.5 + 135).toBe(360)
    expect(sectorOf('sternlight').from).toBe(112.5)
    expect(sectorOf('sternlight').to).toBe(247.5)
    for (let bearing = 0; bearing < 360; bearing += 0.5) {
      const covering = ['starboard-sidelight', 'port-sidelight', 'sternlight'].filter((id) =>
        isVisible(sectorOf(id), bearing),
      )
      expect(covering.length).toBeGreaterThanOrEqual(1)
    }
  })

  it('never lets rotation swap the sidelight colours: green is starboard, red is port', () => {
    // Starboard is clockwise from the bow. A bearing on the starboard side sees green, never red.
    for (let b = 1; b < 112; b += 1) {
      expect(visibleLights(b)).toContain('starboard-sidelight')
      expect(visibleLights(b)).not.toContain('port-sidelight')
    }
    for (let b = 249; b < 360; b += 1) {
      expect(visibleLights(b)).toContain('port-sidelight')
      expect(visibleLights(b)).not.toContain('starboard-sidelight')
    }
    expect(PLAN_LIGHTS.find((l) => l.colour === 'green')!.across).toBeGreaterThan(0)
    expect(PLAN_LIGHTS.find((l) => l.colour === 'red')!.across).toBeLessThan(0)
  })
})

describe('the eight scored aspects (research note §B1)', () => {
  it.each([
    [0, ['masthead', 'starboard-sidelight', 'port-sidelight']],
    [45, ['masthead', 'starboard-sidelight']],
    [90, ['masthead', 'starboard-sidelight']],
    [135, ['sternlight']],
    [180, ['sternlight']],
    [225, ['sternlight']],
    [270, ['masthead', 'port-sidelight']],
    [315, ['masthead', 'port-sidelight']],
  ])('from %i° an observer sees %j', (bearing, expected) => {
    expect([...visibleLights(bearing)].sort()).toEqual([...expected].sort())
  })

  it('avoids every sector edge, as the research requires', () => {
    const edges = [0, 112.5, 247.5]
    for (const aspect of SCORED_ASPECTS) {
      // 0° is the centreline, where the two sidelights meet; it is asked on purpose as "dead ahead".
      if (aspect === 0) continue
      for (const edge of edges) expect(Math.abs(aspect - edge)).toBeGreaterThan(1)
    }
  })

  it('is left-right symmetric about the centreline', () => {
    for (let b = 1; b < 180; b += 1) {
      const swap = (id: string) =>
        id === 'starboard-sidelight' ? 'port-sidelight' : id === 'port-sidelight' ? 'starboard-sidelight' : id
      expect(visibleLights(360 - b).map(swap).sort()).toEqual([...visibleLights(b)].sort())
    }
  })
})

describe('sector cut-offs, immediately inside and outside', () => {
  it('112.5° is the masthead/green and stern edge (inclusive on both sides)', () => {
    expect(visibleLights(112)).toEqual(['masthead', 'starboard-sidelight'])
    expect(visibleLights(112.5)).toEqual(['masthead', 'starboard-sidelight', 'sternlight'])
    expect(visibleLights(113)).toEqual(['sternlight'])
  })

  it('247.5° is the mirror edge on the port side', () => {
    expect(visibleLights(248)).toEqual(['masthead', 'port-sidelight'])
    expect(visibleLights(247.5)).toEqual(['masthead', 'port-sidelight', 'sternlight'])
    expect(visibleLights(247)).toEqual(['sternlight'])
  })

  it('the sternlight is the only light dead astern and the masthead is never seen astern', () => {
    expect(visibleLights(180)).toEqual(['sternlight'])
    for (let b = 113; b < 247; b += 1) expect(visibleLights(b)).not.toContain('masthead')
  })

  it('normalizes bearings outside 0–359', () => {
    expect(visibleLights(360)).toEqual(visibleLights(0))
    expect(visibleLights(-45)).toEqual(visibleLights(315))
  })
})

describe('wording', () => {
  it('describes a visible set in stable, rule-ordered text', () => {
    expect(describeVisibleLights(visibleLights(0))).toBe('Masthead light, red sidelight and green sidelight')
    expect(describeVisibleLights(visibleLights(45))).toBe('Masthead light and green sidelight')
    expect(describeVisibleLights(visibleLights(270))).toBe('Masthead light and red sidelight')
    expect(describeVisibleLights(visibleLights(180))).toBe('Sternlight only')
  })

  it('names each scored aspect in words', () => {
    expect(SCORED_ASPECTS.map(describeAspect)).toEqual([
      'dead ahead',
      'on the starboard bow',
      'on the starboard beam',
      'on the starboard quarter',
      'dead astern',
      'on the port quarter',
      'on the port beam',
      'on the port bow',
    ])
  })
})
