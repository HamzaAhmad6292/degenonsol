"use client"

/**
 * Photorealistic sun — layered radial glows, limb darkening on the disc,
 * cross-hair lens flare streaks, and a slow rotation on the corona.
 * Every edge is gradient → transparent. No hard borders anywhere.
 */
export function Sun({
  className = "",
  style = {},
}: {
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <>
      <style>{`
        @keyframes sun-corona-rotate {
          from { transform: rotate(0deg);   }
          to   { transform: rotate(360deg); }
        }
        @keyframes sun-pulse {
          0%, 100% { opacity: 1;    transform: scale(1);    }
          50%       { opacity: 0.88; transform: scale(0.97); }
        }
        @keyframes sun-flare-pulse {
          0%, 100% { opacity: 0.55; transform: scaleX(1);   }
          50%       { opacity: 0.75; transform: scaleX(1.08); }
        }
        @keyframes sun-flare-pulse-v {
          0%, 100% { opacity: 0.45; transform: scaleY(1);   }
          50%       { opacity: 0.65; transform: scaleY(1.10); }
        }
      `}</style>

      <div
        className={`relative pointer-events-none select-none ${className}`}
        style={{ isolation: "isolate", ...style }}
        aria-hidden
      >

        {/* ── 1. OUTERMOST ATMOSPHERIC BLOOM ─────────────────────────────────
            Extends ~2× the component size in every direction.
            Ultra-soft, barely-there warm scatter.                           */}
        <div style={{
          position: "absolute",
          inset: "-100%",
          borderRadius: "50%",
          background: `
            radial-gradient(circle,
              rgba(255, 250, 210, 0.22) 0%,
              rgba(255, 228, 160, 0.10) 30%,
              rgba(255, 200, 110, 0.04) 55%,
              transparent 80%
            )
          `,
          filter: "blur(48px)",
        }} />

        {/* ── 2. CORONA / CHROMOSPHERE GLOW ──────────────────────────────────
            Warm amber-white halo, slowly rotating to feel alive.            */}
        <div style={{
          position: "absolute",
          inset: "-60%",
          borderRadius: "50%",
          background: `
            radial-gradient(circle,
              rgba(255, 244, 200, 0.55) 0%,
              rgba(255, 220, 140, 0.28) 38%,
              rgba(255, 185,  90, 0.09) 65%,
              transparent 88%
            )
          `,
          filter: "blur(28px)",
          animation: "sun-corona-rotate 90s linear infinite",
        }} />

        {/* ── 3. INNER DIFFUSE HALO ───────────────────────────────────────────
            Crisp-ish warm ring that defines where the disc ends.            */}
        <div style={{
          position: "absolute",
          inset: "-30%",
          borderRadius: "50%",
          background: `
            radial-gradient(circle,
              rgba(255, 248, 225, 0.72) 0%,
              rgba(255, 230, 170, 0.40) 42%,
              rgba(255, 200, 110, 0.12) 68%,
              transparent 90%
            )
          `,
          filter: "blur(14px)",
          animation: "sun-pulse 8s ease-in-out infinite",
        }} />

        {/* ── 4. SOLAR DISC — limb darkening ─────────────────────────────────
            Real suns are brighter at centre, darker toward the edge ("limb
            darkening"). We fake it with a tight radial: white core fading to
            deep amber at the perimeter, then fully transparent.             */}
        <div style={{
          position: "absolute",
          inset: "8%",
          borderRadius: "50%",
          background: `
            radial-gradient(circle,
              rgba(255, 255, 252, 1.00)  0%,
              rgba(255, 252, 240, 0.99) 12%,
              rgba(255, 244, 210, 0.97) 28%,
              rgba(255, 228, 168, 0.93) 48%,
              rgba(255, 198, 110, 0.82) 66%,
              rgba(240, 160,  70, 0.52) 80%,
              rgba(220, 130,  40, 0.18) 92%,
              transparent               100%
            )
          `,
          filter: "blur(3px)",
          animation: "sun-pulse 8s ease-in-out infinite",
        }} />

        {/* ── 5. SPECULAR HOTSPOT ─────────────────────────────────────────────
            Tiny pure-white off-centre highlight — gives the disc a spherical,
            glossy feel rather than a flat circle.                           */}
        <div style={{
          position: "absolute",
          top: "18%", left: "22%",
          width: "36%", height: "32%",
          borderRadius: "50%",
          background: `
            radial-gradient(ellipse,
              rgba(255, 255, 255, 0.82)  0%,
              rgba(255, 255, 250, 0.42) 40%,
              transparent               80%
            )
          `,
          filter: "blur(5px)",
          animation: "sun-pulse 8s ease-in-out infinite",
        }} />

        {/* ── 6. LENS FLARE — horizontal streak ──────────────────────────────
            Classic camera-lens streak. Width is ~4× the component.         */}
        <div style={{
          position: "absolute",
          top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: "400%", height: "14%",
          background: `
            radial-gradient(ellipse 50% 50% at 50% 50%,
              rgba(255, 252, 230, 0.60)  0%,
              rgba(255, 240, 190, 0.30) 20%,
              rgba(255, 220, 140, 0.12) 45%,
              transparent               70%
            )
          `,
          filter: "blur(4px)",
          animation: "sun-flare-pulse 6s ease-in-out infinite",
        }} />

        {/* ── 7. LENS FLARE — vertical streak ────────────────────────────────
            Slightly narrower and offset phase so they pulse independently.  */}
        <div style={{
          position: "absolute",
          top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: "14%", height: "380%",
          background: `
            radial-gradient(ellipse 50% 50% at 50% 50%,
              rgba(255, 252, 230, 0.50)  0%,
              rgba(255, 235, 180, 0.24) 22%,
              rgba(255, 215, 130, 0.08) 48%,
              transparent               70%
            )
          `,
          filter: "blur(4px)",
          animation: "sun-flare-pulse-v 6s ease-in-out infinite",
          animationDelay: "1.5s",
        }} />

        {/* ── 8. DIAGONAL FLARE (45°) ─────────────────────────────────────────
            A third, rotated streak adds the lens-optics complexity.         */}
        <div style={{
          position: "absolute",
          top: "50%", left: "50%",
          transform: "translate(-50%, -50%) rotate(42deg)",
          width: "300%", height: "8%",
          background: `
            radial-gradient(ellipse 50% 50% at 50% 50%,
              rgba(255, 245, 200, 0.35)  0%,
              rgba(255, 220, 150, 0.14) 28%,
              transparent               62%
            )
          `,
          filter: "blur(6px)",
          animation: "sun-flare-pulse 9s ease-in-out infinite",
          animationDelay: "3s",
        }} />

      </div>
    </>
  )
}