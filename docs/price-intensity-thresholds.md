# Price change intensity thresholds

These values drive **otter GIF intensity** (happy/sad idle levels) and **weather intensity** (rain, sunrise/sun, flowers). They are shared between `app/chat/page.tsx` (`getIdleIntensity`) and `components/fullscreen-otter-display.tsx` (rain tiers, sunrise, flowers).

## Thresholds (by absolute price change %)

| | Price change (selected interval) | Otter GIF state | Rain (down) | Sunrise / sun / flowers (up) |
|---|-----------------------------------|-----------------|-------------|------------------------------|
| **Low** | &lt; 2% | `idle` / `sad_idle` | Light rain (22 drops, slower, 40% opacity) | Subtle sunrise + small sun (50% scale), no flowers |
| **Medium** | 2% ≤ … &lt; 3% | `happy_idle_2` / `sad_idle_2` | Medium rain (38 drops, 55% opacity) | Stronger sunrise + larger sun (75%), sun pulse, 7 flowers |
| **High** | ≥ 3% | `happy_idle_3` / `sad_idle_3` | Heavy rain (55 drops, faster, 72% opacity) | Full sunrise + largest sun, pulse, 14 flowers |

## Where they’re defined

- **Chat page (GIF logic):** `app/chat/page.tsx` — `getIdleIntensity(priceChangePercent, isHappy)` uses **2** and **3** (percent).
- **Display (weather):** `components/fullscreen-otter-display.tsx` — `PRICE_INTENSITY.LOW_PERCENT = 2`, `PRICE_INTENSITY.HIGH_PERCENT = 3`, and `getIntensityTier(priceChangePercent)` returns 1, 2, or 3.

Keep these in sync: if you change 2% / 3% in one place, update the other.
