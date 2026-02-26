"use client"

/**
 * Inline pine tree SVG — improved geometry, depth shading, and proper trunks.
 * Variant 1: classic layered pine (balanced)
 * Variant 2: fuller, wide-canopy spruce
 * Variant 3: tall, narrow Nordic fir
 */
export function PineTree({
  variant,
  id,
  className = "",
  style = {},
}: {
  variant: 1 | 2 | 3
  id: string
  className?: string
  style?: React.CSSProperties
}) {
  const fillId      = `pine-fill-${id}`
  const fillLightId = `pine-fill-light-${id}`
  const fillDarkId  = `pine-fill-dark-${id}`
  const trunkId     = `pine-trunk-${id}`

  /* ─── Shared defs factory ─────────────────────────────── */
  const makeDefs = (
    dark1: string, dark2: string,
    mid1:  string, mid2:  string,
    lite1: string, lite2: string,
    trunk1: string, trunk2: string,
  ) => (
    <defs>
      {/* base foliage */}
      <linearGradient id={fillId} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%"   stopColor={dark1} />
        <stop offset="100%" stopColor={dark2} />
      </linearGradient>
      {/* shadow / right-side tiers */}
      <linearGradient id={fillDarkId} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%"   stopColor={mid1} />
        <stop offset="100%" stopColor={mid2} />
      </linearGradient>
      {/* highlight / left-side tiers */}
      <linearGradient id={fillLightId} x1="100%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%"   stopColor={lite1} />
        <stop offset="100%" stopColor={lite2} />
      </linearGradient>
      {/* trunk */}
      <linearGradient id={trunkId} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%"   stopColor={trunk1} />
        <stop offset="100%" stopColor={trunk2} />
      </linearGradient>
    </defs>
  )

  const trees = {
    /* ════════════════════════════════
       VARIANT 1 — Classic pine
       viewBox 100 × 240
       ════════════════════════════════ */
    1: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 100 240"
        preserveAspectRatio="xMidYMax meet"
        aria-hidden
        className={className}
        style={style}
      >
        {makeDefs(
          "#1a3d28","#0f2418",   // base
          "#0d2518","#071810",   // shadow
          "#2a5c3a","#1a3d28",   // highlight
          "#3d2b1a","#1f1208",   // trunk
        )}

        {/* ── TRUNK (solid rectangle + rounded bottom cap) ── */}
        {/*  width 16 px, centred at x=50, from y=180 → y=240 */}
        <rect
          x="42" y="174" width="16" height="60"
          fill={`url(#${trunkId})`}
          rx="2"
        />
        {/* subtle light edge on trunk */}
        <rect x="42" y="174" width="5" height="60" fill="#4a3420" opacity="0.45" rx="2" />

        {/* ── TIER 5 (bottom, widest) ── */}
        {/* shadow half (right) */}
        <polygon
          points="50,148 88,188 68,192 50,168"
          fill={`url(#${fillDarkId})`}
        />
        {/* lit half (left) */}
        <polygon
          points="50,148 12,188 32,192 50,168"
          fill={`url(#${fillLightId})`}
        />
        {/* overlap at centre spine */}
        <polygon
          points="50,148 50,168 56,188 44,188"
          fill={`url(#${fillId})`}
          opacity="0.6"
        />

        {/* ── TIER 4 ── */}
        <polygon points="50,114 84,162 66,167 50,138 34,167 16,162" fill={`url(#${fillDarkId})`} />
        <polygon points="50,114 50,138 57,160 43,160" fill={`url(#${fillId})`} opacity="0.55" />
        <polygon points="50,114 16,162 34,167 50,138" fill={`url(#${fillLightId})`} />

        {/* ── TIER 3 ── */}
        <polygon points="50,82 80,134 64,139 50,110 36,139 20,134" fill={`url(#${fillDarkId})`} />
        <polygon points="50,82 50,110 56,132 44,132" fill={`url(#${fillId})`} opacity="0.55" />
        <polygon points="50,82 20,134 36,139 50,110" fill={`url(#${fillLightId})`} />

        {/* ── TIER 2 ── */}
        <polygon points="50,52 74,104 60,108 50,82 40,108 26,104" fill={`url(#${fillDarkId})`} />
        <polygon points="50,52 50,82 55,104 45,104" fill={`url(#${fillId})`} opacity="0.55" />
        <polygon points="50,52 26,104 40,108 50,82" fill={`url(#${fillLightId})`} />

        {/* ── TIER 1 (top) ── */}
        <polygon points="50,18 68,64 58,68 50,50 42,68 32,64" fill={`url(#${fillDarkId})`} />
        <polygon points="50,18 50,50 54,66 46,66" fill={`url(#${fillId})`} opacity="0.5" />
        <polygon points="50,18 32,64 42,68 50,50" fill={`url(#${fillLightId})`} />

        {/* ── TIP ── */}
        <polygon points="50,4 56,26 44,26" fill={`url(#${fillLightId})`} />
      </svg>
    ),

    /* ════════════════════════════════
       VARIANT 2 — Wide spruce
       ════════════════════════════════ */
    2: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 120 240"
        preserveAspectRatio="xMidYMax meet"
        aria-hidden
        className={className}
        style={style}
      >
        {makeDefs(
          "#1b4030","#0e2a1e",
          "#0d2a1e","#071c12",
          "#2d6644","#1b4030",
          "#3a2818","#1c1008",
        )}

        {/* TRUNK — wider for a spruce */}
        <rect x="51" y="178" width="18" height="58" fill={`url(#${trunkId})`} rx="2" />
        <rect x="51" y="178" width="6"  height="58" fill="#4a3420" opacity="0.4" rx="2" />
        {/* root flare */}
        <polygon points="51,228 69,228 74,240 46,240" fill={`url(#${trunkId})`} />

        {/* TIER 5 — very wide drooping boughs */}
        <polygon points="60,150 108,196 86,202 60,172 34,202 12,196" fill={`url(#${fillDarkId})`} />
        <polygon points="60,150 60,172 66,194 54,194" fill={`url(#${fillId})`} opacity="0.55" />
        <polygon points="60,150 12,196 34,202 60,172" fill={`url(#${fillLightId})`} />

        {/* TIER 4 */}
        <polygon points="60,114 104,166 82,172 60,140 38,172 16,166" fill={`url(#${fillDarkId})`} />
        <polygon points="60,114 60,140 66,168 54,168" fill={`url(#${fillId})`} opacity="0.55" />
        <polygon points="60,114 16,166 38,172 60,140" fill={`url(#${fillLightId})`} />

        {/* TIER 3 */}
        <polygon points="60,80 98,136 78,142 60,108 42,142 22,136" fill={`url(#${fillDarkId})`} />
        <polygon points="60,80 60,108 66,138 54,138" fill={`url(#${fillId})`} opacity="0.5" />
        <polygon points="60,80 22,136 42,142 60,108" fill={`url(#${fillLightId})`} />

        {/* TIER 2 */}
        <polygon points="60,50 90,104 72,110 60,78 48,110 30,104" fill={`url(#${fillDarkId})`} />
        <polygon points="60,50 60,78 65,106 55,106" fill={`url(#${fillId})`} opacity="0.5" />
        <polygon points="60,50 30,104 48,110 60,78" fill={`url(#${fillLightId})`} />

        {/* TIER 1 */}
        <polygon points="60,22 80,66 66,70 60,50 54,70 40,66" fill={`url(#${fillDarkId})`} />
        <polygon points="60,22 60,50 64,68 56,68" fill={`url(#${fillId})`} opacity="0.5" />
        <polygon points="60,22 40,66 54,70 60,50" fill={`url(#${fillLightId})`} />

        {/* TIP */}
        <polygon points="60,6 66,28 54,28" fill={`url(#${fillLightId})`} />
      </svg>
    ),

    /* ════════════════════════════════
       VARIANT 3 — Tall narrow fir
       ════════════════════════════════ */
    3: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 80 240"
        preserveAspectRatio="xMidYMax meet"
        aria-hidden
        className={className}
        style={style}
      >
        {makeDefs(
          "#173622","#0b2016",
          "#0b2016","#06140c",
          "#265236","#173622",
          "#362014","#180e06",
        )}

        {/* TRUNK — narrow fir */}
        <rect x="36" y="178" width="8" height="60" fill={`url(#${trunkId})`} rx="1.5" />
        <rect x="36" y="178" width="3" height="60" fill="#4a3420" opacity="0.4" rx="1.5" />

        {/* TIER 6 (bottom) */}
        <polygon points="40,156 66,192 54,196 40,170 26,196 14,192" fill={`url(#${fillDarkId})`} />
        <polygon points="40,156 40,170 44,192 36,192" fill={`url(#${fillId})`} opacity="0.55" />
        <polygon points="40,156 14,192 26,196 40,170" fill={`url(#${fillLightId})`} />

        {/* TIER 5 */}
        <polygon points="40,124 64,164 52,168 40,138 28,168 16,164" fill={`url(#${fillDarkId})`} />
        <polygon points="40,124 40,138 44,164 36,164" fill={`url(#${fillId})`} opacity="0.55" />
        <polygon points="40,124 16,164 28,168 40,138" fill={`url(#${fillLightId})`} />

        {/* TIER 4 */}
        <polygon points="40,94 62,136 50,140 40,108 30,140 18,136" fill={`url(#${fillDarkId})`} />
        <polygon points="40,94 40,108 44,136 36,136" fill={`url(#${fillId})`} opacity="0.5" />
        <polygon points="40,94 18,136 30,140 40,108" fill={`url(#${fillLightId})`} />

        {/* TIER 3 */}
        <polygon points="40,66 60,108 50,112 40,80 30,112 20,108" fill={`url(#${fillDarkId})`} />
        <polygon points="40,66 40,80 44,108 36,108" fill={`url(#${fillId})`} opacity="0.5" />
        <polygon points="40,66 20,108 30,112 40,80" fill={`url(#${fillLightId})`} />

        {/* TIER 2 */}
        <polygon points="40,40 56,78 47,82 40,56 33,82 24,78" fill={`url(#${fillDarkId})`} />
        <polygon points="40,40 40,56 43,80 37,80" fill={`url(#${fillId})`} opacity="0.5" />
        <polygon points="40,40 24,78 33,82 40,56" fill={`url(#${fillLightId})`} />

        {/* TIER 1 */}
        <polygon points="40,16 52,48 45,52 40,34 35,52 28,48" fill={`url(#${fillDarkId})`} />
        <polygon points="40,16 40,34 43,50 37,50" fill={`url(#${fillId})`} opacity="0.5" />
        <polygon points="40,16 28,48 35,52 40,34" fill={`url(#${fillLightId})`} />

        {/* TIP */}
        <polygon points="40,4 44,20 36,20" fill={`url(#${fillLightId})`} />
      </svg>
    ),
  }

  return trees[variant]
}