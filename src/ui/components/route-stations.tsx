/**
 * Small decorative route line N5 → N4 → N3 (the level-check metaphor, DESIGN_SYSTEM §2).
 * The accessible description is passed in (translated) because the picture carries meaning.
 */
export function RouteStations({ label }: { label: string }) {
  const stations = [
    { code: 'N5', x: 24, color: 'var(--line-n5)' },
    { code: 'N4', x: 150, color: 'var(--line-n4)' },
    { code: 'N3', x: 276, color: 'var(--line-n3)' },
  ]
  return (
    <svg viewBox="0 0 300 70" className="h-auto w-full max-w-[300px]" role="img" aria-label={label}>
      <defs>
        {/* userSpaceOnUse: a horizontal line has zero height, so a bounding-box gradient would not paint. */}
        <linearGradient
          id="nm-route-line"
          gradientUnits="userSpaceOnUse"
          x1="24"
          y1="0"
          x2="276"
          y2="0"
        >
          <stop offset="0" style={{ stopColor: 'var(--line-n5)' }} />
          <stop offset="0.5" style={{ stopColor: 'var(--line-n4)' }} />
          <stop offset="1" style={{ stopColor: 'var(--line-n3)' }} />
        </linearGradient>
      </defs>
      <path d="M24 24 H276" stroke="url(#nm-route-line)" strokeWidth="8" strokeLinecap="round" />
      {stations.map((s) => (
        <g key={s.code}>
          <circle cx={s.x} cy={24} r={12} fill="#fff" style={{ stroke: s.color }} strokeWidth={5} />
          <text
            x={s.x}
            y={62}
            textAnchor="middle"
            fontSize="18"
            fontWeight="700"
            style={{ fill: 'var(--text-on-night)', fontFamily: 'var(--font-sign)' }}
          >
            {s.code}
          </text>
        </g>
      ))}
    </svg>
  )
}
