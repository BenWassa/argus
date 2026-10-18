import { useEffect, useState, type CSSProperties } from 'react'
import { colourCss, contrastRatio } from './colour'
import { candidateIds, contrastReport, modeRoles, palettes, pairReport, roleIds, screenRoles, trackRoles, type CandidateId, type Palette, type Role } from './palettes'
import '../../features/library/LibraryPage.css'
import '../../features/today/Today.css'
import './paletteSheet.css'

const labels: Record<Role, string> = {
  action: 'Action', key: 'Key', listen: 'Listen', read: 'Read', free: 'Free play',
  knowledge: 'Knowledge', survival: 'Survival', tradecraft: 'Tradecraft',
  correct: 'Correct', miss: 'Miss', decay: 'Decay',
}
const names: Record<CandidateId, string> = { current: 'Current', signal: 'Signal', peacock: 'Peacock', families: 'Families' }
const visionIds = ['none', 'deuteranopia', 'protanopia'] as const
type Vision = typeof visionIds[number]

function candidateFromUrl(): CandidateId {
  const value = new URLSearchParams(window.location.search).get('candidate')
  return candidateIds.find(id => id === value) ?? 'current'
}

function roleStyle(palette: Palette, role: Role): CSSProperties {
  return {
    '--role': palette[role] ? colourCss(palette[role]) : 'var(--muted)',
    '--role-soft': 'color-mix(in srgb, var(--role) 12%, transparent)',
  } as CSSProperties
}

function Glyph({ role }: { role: Role }) {
  if (role === 'listen') return <svg viewBox="0 0 48 24" width="48" height="24" aria-hidden="true"><path d="M1 12 C7 -2 17 -2 24 12 S41 26 47 12" fill="none" stroke="currentColor" strokeWidth="2" /></svg>
  return <span aria-hidden="true">{({ key: '·—', read: '·— → A', free: '∞', knowledge: '◎', survival: '△', tradecraft: '⌕', decay: '◆' } as Partial<Record<Role, string>>)[role]}</span>
}

function MorseGroup({ palette }: { palette: Palette }) {
  return <section className="palette-screen" aria-labelledby="palette-morse">
    <h2 id="palette-morse">Morse</h2>
    <button type="button" className="palette-primary">Continue lesson 6</button>
    <div className="palette-modes">
      {modeRoles.map(role => <button type="button" className="palette-mode" style={roleStyle(palette, role)} key={role}>
        <span className="palette-glyph"><Glyph role={role} /></span><span>{labels[role]}</span>
      </button>)}
    </div>
    <ol className="palette-path" aria-label="Example lesson path">
      {['N S', 'M U', 'R D', 'W K', 'G H', 'O V'].map((letters, index) => <li className={`palette-path-row ${index < 3 ? 'is-done' : index === 3 ? 'is-current' : 'is-locked'}`} key={letters}>
        <span className="palette-node" aria-hidden="true">{letters}</span>
        <span>{index < 3 ? `✓ Lesson ${index + 3}` : index === 3 ? 'Lesson 6' : `Locked · Lesson ${index + 3}`}</span>
      </li>)}
      <li className="palette-path-row"><span className="palette-node palette-tier" aria-hidden="true">W</span><span>Words <span className="palette-pips">{modeRoles.slice(0, 3).map(role => <i style={roleStyle(palette, role)} key={role} />)}</span><span className="palette-small">Key · Listen · Read</span></span></li>
      <li className="palette-path-row palette-repair"><span className="palette-node" aria-hidden="true">◆</span><span>Test<span className="palette-small">◆ Needs repair</span></span></li>
    </ol>
  </section>
}

function AppGroup({ palette }: { palette: Palette }) {
  return <section className="palette-screen" aria-labelledby="palette-app">
    <h2 id="palette-app">App</h2>
    <nav className="nav palette-nav" aria-label="Example navigation"><ul>{['Home', 'Roles', 'Library'].map(label => <li key={label}><button type="button" className="nav-btn" aria-current={label === 'Library' ? 'page' : undefined}>{label}</button></li>)}</ul></nav>
    <h3>Library</h3>
    <div className="palette-plates">
      {[...trackRoles, 'decay' as const].map((role, index) => <button type="button" className="index-row lib-row has-topic-icon" data-started="true" data-repair={role === 'decay' ? 'true' : undefined} style={roleStyle(palette, role)} key={role}>
        <span className="topic-icon palette-topic-icon"><Glyph role={role} /></span>
        <span className="index-title">{['Morse code', 'Navigation', 'Observation', 'First aid'][index]}</span>
        <span className="gauge gauge-row"><span className="gauge-track"><span className="gauge-fill" style={{ width: `${[46, 60, 35, 70][index]}%` }} /></span></span>
        <span className="gauge-label lib-row-reading">{role === 'decay' ? '◆ Needs repair' : `${labels[role]} · ${[12, 6, 7][index]} / ${[26, 10, 20][index]} settled`}</span>
      </button>)}
    </div>
    <h3>Home</h3>
    <div className="palette-rings">{trackRoles.map((role, index) => <figure style={roleStyle(palette, role)} key={role}>
      <span className="home-dial"><svg viewBox="0 0 56 56" aria-hidden="true"><circle className="home-dial-track" cx="28" cy="28" r="23" /><circle className="home-dial-arc" cx="28" cy="28" r="23" strokeDasharray={2 * Math.PI * 23} strokeDashoffset={2 * Math.PI * 23 * (1 - [0.46, 0.6, 0.35][index])} /></svg><span className="home-dial-mark">{[12, 6, 7][index]}</span></span>
      <figcaption>{labels[role]}<span className="palette-small">{[12, 6, 7][index]} / {[26, 10, 20][index]}</span></figcaption>
    </figure>)}</div>
    <div className="palette-feedback">{(['correct', 'miss'] as const).map(role => <span className="palette-chip" style={roleStyle(palette, role)} key={role}>{role === 'correct' ? '✓ Correct' : '× Miss'}</span>)}</div>
  </section>
}

function ConstraintReport({ palette }: { palette: Palette }) {
  const rows = contrastReport(palette)
  const inkRatio = contrastRatio(palette.actionInk, palette.action!)
  return <section className="palette-report" aria-labelledby="palette-constraints">
    <h2 id="palette-constraints">Constraint report</h2>
    <p>Unsimulated, gamut-clipped sRGB. Text ≥ 4.5:1. Fill / icon ≥ 3:1. Washes are decorative.</p>
    <h3>Action ink on action</h3>
    <p>{inkRatio.toFixed(2)}:1 · Text {inkRatio >= 4.5 ? 'PASS' : 'FAIL'} · Fill / icon {inkRatio >= 3 ? 'PASS' : 'FAIL'}</p>
    <h3>Every chassis step</h3>
    <p>Each cell shows text and a solid icon on the named neutral, followed by measured contrast and text / icon results. Mode hues are unavailable in Current.</p>
    {roleIds.map(role => <div className="palette-swatch-role" key={role}>
      <h4>{labels[role]}</h4>
      {palette[role] ? <div className="palette-swatches">{rows.filter(row => row.role === role).map(row => <div className="palette-swatch" style={{ ...roleStyle(palette, role), background: `var(--${row.surface})` }} key={row.surface}>
        <span className="palette-swatch-sample">● Aa</span><span>{row.surface}</span><span>{row.ratio.toFixed(2)}:1</span><span>T {row.textPass ? 'PASS' : 'FAIL'} · I {row.iconPass ? 'PASS' : 'FAIL'}</span>
      </div>)}</div> : <p>N/A</p>}
    </div>)}
    <h3>Co-occurring roles</h3>
    <p>Flag when hue distance &lt; 30° and lightness difference &lt; 0.08. All pairs are listed. Neutral control hues are included literally.</p>
    {Object.entries(screenRoles).map(([screen, roles]) => {
      const pairs = pairReport(palette, roles)
      return <div key={screen}><h4>{screen} · {pairs.filter(pair => pair.conflict).length} flagged</h4>
        <table><caption>{screen} hue separation</caption><thead><tr><th scope="col">Pair</th><th scope="col">Δ hue / L</th><th scope="col">Result</th></tr></thead><tbody>
          {pairs.map(pair => <tr key={`${pair.a}-${pair.b}`}><th scope="row">{labels[pair.a]} / {labels[pair.b]}</th><td>{pair.hue === null ? 'N/A' : `${pair.hue.toFixed(1)}° / ${pair.lightness!.toFixed(3)}`}</td><td>{pair.hue === null ? 'N/A' : pair.conflict ? 'FLAG' : 'PASS'}</td></tr>)}
        </tbody></table></div>
    })}
    <p>Morse excludes Correct: sessions use the mode hue with ✓. Labels, glyphs and counts carry meaning alongside colour.</p>
    <h3>Owner check</h3><p>Does this read as Argus, Duolingo green, or generic SaaS blue? Category resemblance needs human judgment.</p>
  </section>
}

/** An isolated visual fixture: no app providers, learner records or persistence. */
export function PaletteSheet() {
  const [candidate, setCandidate] = useState(candidateFromUrl)
  const [vision, setVision] = useState<Vision>('none')
  useEffect(() => {
    const onPopState = () => setCandidate(candidateFromUrl())
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])
  const palette = palettes[candidate]
  const style = {
    '--palette-action': colourCss(palette.action!), '--palette-action-ink': colourCss(palette.actionInk),
    '--palette-decay': colourCss(palette.decay!),
    filter: vision === 'none' ? undefined : `url(#palette-${vision})`,
  } as CSSProperties
  return <>
    <svg className="palette-filters" aria-hidden="true"><defs>
      {/* Machado et al. (2009), severity 1.0; matrices operate in linear RGB. */}
      <filter id="palette-deuteranopia" colorInterpolationFilters="linearRGB"><feColorMatrix type="matrix" values="0.367322 0.860646 -0.227968 0 0 0.280085 0.672501 0.047413 0 0 -0.011820 0.042940 0.968881 0 0 0 0 0 1 0" /></filter>
      <filter id="palette-protanopia" colorInterpolationFilters="linearRGB"><feColorMatrix type="matrix" values="0.152286 1.052583 -0.204868 0 0 0.114503 0.786281 0.099216 0 0 -0.003882 -0.048116 1.051998 0 0 0 0 0 1 0" /></filter>
    </defs></svg>
    <main className="palette-sheet app-shell" style={style} data-candidate={candidate} data-vision={vision}>
      <header><h1>Palette sheet</h1><p>Development study · Owner choice pending</p></header>
      <div className="palette-segments" role="group" aria-label="Palette candidate">{candidateIds.map(id => <button type="button" aria-pressed={id === candidate} key={id} onClick={() => {
        const url = new URL(window.location.href)
        url.searchParams.set('candidate', id)
        window.history.replaceState(null, '', url)
        setCandidate(id)
      }}>{names[id]}</button>)}</div>
      <p className="palette-system" aria-live="polite">{candidate === 'current' ? 'Current control · No mode hues' : candidate === 'families' ? 'Separate families' : 'Shared wheel'}</p>
      <div className="palette-screens"><MorseGroup palette={palette} /><AppGroup palette={palette} /></div>
      <ConstraintReport palette={palette} />
      <section className="palette-vision"><h2>Colour vision</h2><div className="palette-segments" role="group" aria-label="Colour vision simulation">{visionIds.map(id => <button type="button" key={id} aria-pressed={vision === id} onClick={() => setVision(id)}>{id === 'none' ? 'None' : id === 'deuteranopia' ? 'Deuteranopia' : 'Protanopia'}</button>)}</div><p>Approximation using Machado et al. (2009), full severity. Contrast numbers remain unsimulated.</p></section>
    </main>
  </>
}
