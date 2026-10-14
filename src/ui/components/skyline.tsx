/**
 * Decorative city skyline (Direction B). Deterministic, so server and client render the same SVG.
 * Purely visual: aria-hidden. Parallax motion is added by the parent where appropriate.
 */
type Layer = 1 | 2 | 3

const COLORS: Record<Layer, string> = { 1: '#1D3558', 2: '#16294A', 3: '#0B1A31' }
const HEIGHTS: Record<Layer, [number, number]> = { 1: [90, 200], 2: [60, 150], 3: [30, 90] }

function buildings(layer: Layer) {
  let seed = layer * 97
  const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280
  const [minH, maxH] = HEIGHTS[layer]
  const rects: { x: number; w: number; h: number; windows: { x: number; y: number }[] }[] = []
  let x = -20
  while (x < 1220) {
    const w = Math.round(34 + rnd() * 60)
    const h = Math.round(minH + rnd() * (maxH - minH))
    const windows: { x: number; y: number }[] = []
    if (layer === 1 && rnd() > 0.55) {
      for (let wy = 300 - h + 14; wy < 290; wy += 18) {
        for (let wx = x + 8; wx < x + w - 8; wx += 14)
          if (rnd() > 0.62) windows.push({ x: wx, y: wy })
      }
    }
    rects.push({ x, w, h, windows })
    x += w + 2
  }
  return rects
}

export function SkylineLayer({ layer, className }: { layer: Layer; className?: string }) {
  return (
    <svg
      viewBox="0 0 1200 300"
      preserveAspectRatio="xMidYMax slice"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {buildings(layer).map((b) => (
        <g key={b.x}>
          <rect x={b.x} y={300 - b.h} width={b.w} height={b.h} fill={COLORS[layer]} />
          {b.windows.map((w) => (
            <rect
              key={`${w.x}-${w.y}`}
              x={w.x}
              y={w.y}
              width={5}
              height={7}
              fill="#F2C14E"
              opacity={0.55}
            />
          ))}
        </g>
      ))}
      {layer === 1 ? <path d="M880 300 L905 60 L930 300 Z" fill={COLORS[1]} /> : null}
    </svg>
  )
}
