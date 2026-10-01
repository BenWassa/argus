import {
  angleDialGeometry,
  DIAL_VIEWBOX,
  northReferenceGeometry,
  type FigureSpec,
} from '../../domain/visual/figures'
import {
  dayShapeStackGeometry,
  lightStackGeometry,
  vesselPlanGeometry,
} from '../../domain/maritime/geometry'

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
    case 'vessel-plan': {
      const geometry = vesselPlanGeometry(figure)
      return (
        <svg
          className="figure figure-vessel-plan"
          viewBox={`0 0 ${DIAL_VIEWBOX} ${DIAL_VIEWBOX}`}
          aria-hidden="true"
          focusable="false"
        >
          {geometry.labels.length > 0 && (
            <line
              className="figure-guide"
              x1={geometry.centreline.from.x}
              y1={geometry.centreline.from.y}
              x2={geometry.centreline.to.x}
              y2={geometry.centreline.to.y}
            />
          )}
          {geometry.sectors.map((sector) => (
            <g key={sector.id}>
              <path className={`figure-sector is-${sector.colour}`} d={sector.path} />
              <text
                className="figure-sector-label"
                x={sector.label.x}
                y={sector.label.y}
                textAnchor="middle"
                dominantBaseline="central"
              >
                {sector.label.letter}
              </text>
            </g>
          ))}
          <path className="figure-hull" d={geometry.hull} />
          {geometry.lights.map((light) => (
            <circle
              className={`figure-light is-${light.colour}`}
              key={light.id}
              cx={light.x}
              cy={light.y}
              r={5}
            />
          ))}
          {geometry.labels.map((label) => (
            <text
              className="figure-cardinal"
              key={label.text}
              x={label.x}
              y={label.y}
              textAnchor="middle"
              dominantBaseline="central"
            >
              {label.text}
            </text>
          ))}
          {geometry.observer && (
            <g>
              <line
                className="figure-observer-line"
                x1={geometry.observer.at.x}
                y1={geometry.observer.at.y}
                x2={geometry.observer.towards.x}
                y2={geometry.observer.towards.y}
              />
              <circle className="figure-observer" cx={geometry.observer.at.x} cy={geometry.observer.at.y} r={6} />
            </g>
          )}
        </svg>
      )
    }
    case 'light-stack': {
      const lights = lightStackGeometry(figure)
      return (
        <svg
          className="figure figure-light-stack"
          viewBox={`0 0 ${DIAL_VIEWBOX} ${DIAL_VIEWBOX}`}
          aria-hidden="true"
          focusable="false"
        >
          {lights.map((light, index) => (
            <circle className={`figure-light is-${light.colour}`} key={index} cx={light.cx} cy={light.cy} r={light.r} />
          ))}
        </svg>
      )
    }
    case 'day-shape-stack': {
      const shapes = dayShapeStackGeometry(figure)
      return (
        <svg
          className="figure figure-day-shapes"
          viewBox={`0 0 ${DIAL_VIEWBOX} ${DIAL_VIEWBOX}`}
          aria-hidden="true"
          focusable="false"
        >
          {/* Shapes are black by the regulations, so they sit on a light ground. */}
          <rect className="figure-day-ground" x="0" y="0" width={DIAL_VIEWBOX} height={DIAL_VIEWBOX} />
          {shapes.map((shape, index) =>
            shape.kind === 'ball' ? (
              <circle className="figure-day-shape" key={index} cx={shape.cx} cy={shape.cy} r={shape.r} />
            ) : (
              <polygon className="figure-day-shape" key={index} points={shape.points} />
            ),
          )}
        </svg>
      )
    }
  }
}
