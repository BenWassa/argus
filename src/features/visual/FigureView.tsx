import {
  angleDialGeometry,
  DIAL_VIEWBOX,
  northReferenceGeometry,
  type FigureSpec,
} from '../../domain/visual/figures'

/**
 * Deterministic rendering of a registry figure (#146). One function per kind,
 * each reading the pure geometry its domain module computes, so the picture and
 * any answer key derived from the same spec can never disagree.
 *
 * The SVG is decorative to assistive technology: the owning `VisualView` names
 * it with the visual's required text alternative, so the figure itself adds no
 * second, possibly contradictory, description.
 */
export function FigureView({ figure }: { figure: FigureSpec }) {
  switch (figure.kind) {
    case 'angle-dial': {
      const geometry = angleDialGeometry(figure)
      return (
        <svg
          className="figure figure-angle-dial"
          viewBox={`0 0 ${DIAL_VIEWBOX} ${DIAL_VIEWBOX}`}
          aria-hidden="true"
          focusable="false"
        >
          <circle
            className="figure-ring"
            cx={geometry.centre.x}
            cy={geometry.centre.y}
            r={geometry.ringRadius}
          />
          {geometry.guides.map((guide, index) => (
            <line
              className="figure-guide"
              key={index}
              x1={guide.from.x}
              y1={guide.from.y}
              x2={guide.to.x}
              y2={guide.to.y}
            />
          ))}
          {geometry.arcPath && <path className="figure-arc" d={geometry.arcPath} />}
          {geometry.cardinals.map((mark) => (
            <text
              className="figure-cardinal"
              key={mark.label}
              x={mark.x}
              y={mark.y}
              textAnchor="middle"
              dominantBaseline="central"
            >
              {mark.label}
            </text>
          ))}
          {geometry.pointers.map((pointer, index) => (
            <g key={`${pointer.bearing}-${index}`}>
              <line
                className="figure-pointer"
                x1={geometry.centre.x}
                y1={geometry.centre.y}
                x2={pointer.tip.x}
                y2={pointer.tip.y}
              />
              {pointer.label && (
                <text
                  className="figure-pointer-label"
                  x={pointer.labelAt.x}
                  y={pointer.labelAt.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  {pointer.label}
                </text>
              )}
            </g>
          ))}
          <circle className="figure-hub" cx={geometry.centre.x} cy={geometry.centre.y} r={3} />
        </svg>
      )
    }
    case 'north-reference': {
      const geometry = northReferenceGeometry(figure)
      return (
        <svg
          className="figure figure-north-reference"
          viewBox={`0 0 ${DIAL_VIEWBOX} ${DIAL_VIEWBOX}`}
          aria-hidden="true"
          focusable="false"
        >
          {geometry.rays.map((ray) => (
            <g key={ray.ref}>
              {/* The three norths are told apart by line style, not colour alone. */}
              <line
                className={`figure-north-ray is-${ray.ref}`}
                x1={geometry.vertex.x}
                y1={geometry.vertex.y}
                x2={ray.tip.x}
                y2={ray.tip.y}
              />
              <text
                className="figure-pointer-label"
                x={ray.labelAt.x}
                y={ray.labelAt.y}
                textAnchor="middle"
                dominantBaseline="central"
              >
                {ray.label}
              </text>
            </g>
          ))}
          <circle className="figure-hub" cx={geometry.vertex.x} cy={geometry.vertex.y} r={3} />
        </svg>
      )
    }
  }
}
