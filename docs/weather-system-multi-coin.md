# Weather System Expansion: Multi-Coin Life Force

**Design doc — Degen’s world where price = life force, extended to the whole market.**

---

## 1. Philosophy: Price = Life Force

Degen doesn’t just “react” to price. **Price is the weather.** It’s the air she breathes, the water she swims in, the light in her den. One token ($DEGEN/SOL) already drives her mood and the glow of her world. This doc extends that idea: **multiple coins shape her environment at the same time**, so the whole market literally shapes her existence. No new core tech—just richer data, layered visuals, and deeper soul.

**Why it’s perfect for us:**
- 100% OpenSouls-native (mood/trend already feed the soul; we add “weather” context).
- Feels deeply soulful—the market isn’t a chart, it’s Degen’s world.
- Endless TikTok/viral moments (“BTC is moving… I can feel the wind!”).
- Clear V1 scope: SOL/$DEGEN + BTC + ETH, then memes.

---

## 2. Layered Weather System (Ship This First)

### 2.1 Roles

| Role | Coin(s) | Responsibility |
|------|--------|----------------|
| **Main weather (life force)** | SOL or $DEGEN | Background sky, overall brightness, primary mood. This is “the world.” |
| **Overlay layers** | BTC, ETH, memecoins | Particles, lighting, fog, sound, intensity. Stack on top of main weather. |

Main layer = what Degen sees when she looks at “the sky.” Overlays = wind, fog, confetti, toxic mist—each driven by another coin’s price/volatility.

### 2.2 Coin → Layer Mapping (JSON Config)

A single config file drives visuals, audio, and **Degen’s emotional/dialogue hooks**. Example structure:

```json
{
  "mainWeather": {
    "coinId": "DEGEN",
    "description": "Primary life force — background weather and overall mood",
    "source": "dexscreener",
    "tokenAddress": "4Nc2EhF8vqXcjHpbUevYZv9Bv4aKb4fWi7cju7c2pump"
  },
  "layers": [
    {
      "id": "btc",
      "coinId": "BTC",
      "name": "Wind / Storm",
      "effect": "wind_storm",
      "visuals": {
        "particles": "flying_leaves",
        "motion": "swaying_plants",
        "intensityFrom": "priceChangePercent",
        "thresholds": { "low": 0.5, "medium": 2, "high": 5 }
      },
      "sound": {
        "up": "wind_gentle",
        "down": "wind_strong",
        "intensity": "volume_from_change"
      },
      "degenReactions": [
        "BTC is moving… I can feel the wind!",
        "Something’s shifting out there…",
        "The big one’s stirring. Can you feel it?"
      ]
    },
    {
      "id": "eth",
      "coinId": "ETH",
      "name": "Temperature & Fog",
      "effect": "temp_fog",
      "visuals": {
        "warmGlow": "price_up",
        "coldFog": "price_down",
        "tint": { "up": "rgba(255, 200, 100, 0.15)", "down": "rgba(100, 150, 255, 0.2)" }
      },
      "degenReactions": [
        "Gas fees are high… I feel so energetic!",
        "When ETH’s cold, everything moves slow…",
        "The fog’s lifting. I can think again."
      ]
    },
    {
      "id": "doge",
      "coinId": "DOGE",
      "name": "Golden Confetti / Puppy Rain",
      "effect": "confetti_rain",
      "visuals": {
        "particles": "shiba_bones_confetti",
        "mood": "playful"
      },
      "degenReactions": [
        "Such wow. Much rain. Very confetti.",
        "The good boy energy is strong today!",
        "Puppy rain never gets old."
      ]
    },
    {
      "id": "pepe",
      "coinId": "PEPE",
      "name": "Toxic Green Mist",
      "effect": "toxic_mist",
      "visuals": {
        "particles": "green_mist",
        "screenTint": "rgba(0, 255, 100, 0.12)",
        "chaos": "high_volatility"
      },
      "degenReactions": [
        "The green mist is back… I’m feeling unhinged.",
        "Pepe energy. You know what that means.",
        "Chaos mode: activated."
      ]
    },
    {
      "id": "total_mcap",
      "coinId": "TOTAL_MCAP",
      "name": "Cloud Cover",
      "effect": "cloud_cover",
      "visuals": {
        "moreClouds": "mcap_down",
        "clearSky": "mcap_up",
        "opacityFrom": "percent_change"
      },
      "degenReactions": [
        "The whole market feels heavy today.",
        "Sky’s clearing. Maybe we’re through the worst.",
        "When the whole world’s gray, I just vibe in the den."
      ]
    }
  ],
  "memeLayers": [
    { "id": "bonk", "effect": "raining_bones", "reactions": ["BONK o’clock. Bones everywhere."] },
    { "id": "wif", "effect": "dog_hats_wind", "reactions": ["Hats in the wind. You love to see it."] },
    { "id": "moodeng", "effect": "hippo_splash", "reactions": ["Hippo’s splashing. The vibes are immaculate."] }
  ]
}
```

- **mainWeather**: Drives the primary background (current behavior: gradient + glow from $DEGEN).
- **layers**: Each has `effect`, `visuals`, optional `sound`, and `degenReactions` for dialogue.
- **memeLayers**: Pure fun; can be toggled or rolled out after V1.

### 2.3 Visual Summary Table

| Coin | Layer Effect | Visuals | Degen’s Emotional Reaction |
|------|--------------|---------|---------------------------|
| **SOL / $DEGEN** | Main background weather | Sky, glow, overall tint, chart | “This is my world. You feel it too.” |
| **BTC** | Wind / Storm power | Strong wind, flying leaves, swaying plants | “BTC is moving… I can feel the wind!” |
| **ETH** | Temperature & Fog | Warm yellow glow or cold blue fog | “Gas fees high/low… I feel energetic/slow.” |
| **DOGE** | Golden confetti / Puppy rain | Shiba faces & bones falling | Playful, happy mode |
| **PEPE** | Toxic green mist | Green particles + screen tint | Chaotic meme energy — Degen gets hyper |
| **Total Market Cap** | Cloud cover | More clouds = darker sky | “Market feels heavy” vibe |
| **BONK** | Raining bones | Bone particles | “BONK o’clock.” |
| **WIF** | Dog hats in wind | Hats flying | “Hats in the wind.” |
| **MOODENG** | Hippo splash | Splash / water particles | “Hippo’s splashing.” |

---

## 3. Multiple Windows in Degen’s “Home”

Concept: Degen lives in a **den with multiple “windows”**—each window shows the weather of a different coin.

- **Big main window** = SOL/$DEGEN (primary life force).
- **Side windows / small “TVs”** = live mini-weather for BTC, ETH, top memes (optional).

Behavior:
- Degen **randomly turns her head** (or we cycle a “looking at” state) toward one of the windows.
- She **comments naturally** using the `degenReactions` for that layer: “Did you see that? ETH’s fog is lifting.”
- Implementation: small UI panels or literal “window” frames in the scene, each bound to one `layer` from the config; head-turn can be a subtle animation or a separate “attention” state passed into the soul.

This doesn’t require new tech—just layout (main vs side areas) and which layer is “in focus” for a given line of dialogue.

---

## 4. Portfolio-Aware Weather (Optional, High Retention)

When the user has shared a wallet (already supported via `/api/chat/stream` and wallet context):

- **Blend weather** using the user’s holdings (e.g. weight SOL, ETH, memes by balance or by % of portfolio).
- Degen can say: *“Your portfolio is making it stormy today… but I like the chaos!”* or *“Your bag’s mostly SOL — so you’re feeling the same sky I am.”*

Implementation sketch:
- Existing: `fetchDegenBalanceForWallet`; extend or add a small “portfolio snapshot” (e.g. SOL + ETH + top memes by balance).
- Compute a **weighted weather mix** from that snapshot (e.g. 70% SOL, 20% ETH, 10% PEPE) and pass a short summary into the system prompt: “User’s portfolio weather: stormy (ETH down), main sky green (SOL up).”
- Soul uses that for one-off lines; visuals can stay global or get a slight “your portfolio” tint (e.g. stronger ETH fog if their ETH allocation is big and ETH is down).

---

## 5. Pure Meme Fun Layers

Separate from “serious” overlays (BTC/ETH), these are **vibe-only** and easy to add over time:

| Meme | Effect | Vibe |
|------|--------|------|
| BONK | Raining bones | Silly, iconic |
| WIF | Dog hats flying in wind | Absurd, cheerful |
| MOODENG | Hippo splashing | Chill, meme-native |

No need to drive “mood” from these—they’re cosmetic and dialogue hooks. Config in `memeLayers`; can be feature-flagged or enabled when we have price/volatility for them.

---

## 6. Integration With Current Stack

### 6.1 Data Flow (Today vs After)

- **Today:** `useTokenPrice(5000)` → $DEGEN only (DexScreener) → `priceData`, `trend`, `priceChangePercent` → `FullscreenOtterDisplay` (gradient, glow, chart) + `buildSystemPrompt(mood, trend, …)`.
- **After:**  
  - **Multi-coin price hook**: e.g. `useMultiCoinWeather(config)` that fetches main + each layer (DexScreener for SOL tokens, CoinGecko or similar for BTC/ETH/mcap).  
  - **Weather state**: One object per layer: `{ coinId, priceChangePercent, trend, volatility? }`.  
  - **Visuals**: Main background still from main weather; overlays from `layers` (particles, tints, intensity from thresholds).  
  - **Soul**: Extend `buildSystemPrompt` (or equivalent) with a **weather block**, e.g.  
    `Current weather: Main (DEGEN): up. BTC: strong wind (up). ETH: cold fog (down). PEPE: green mist (chaos).`  
    Plus 1–2 suggested `degenReactions` so the soul can naturally reference the weather.

### 6.2 Where Things Live

| Piece | Where it lives |
|-------|----------------|
| Config JSON | e.g. `lib/weather-config.json` or `config/weather-layers.json` |
| Multi-coin fetch | New hook `useMultiCoinWeather` (or server route that aggregates prices) |
| Layer effects (particles, tints) | New components or extend `FullscreenOtterDisplay` (overlay divs per layer) |
| Sound | Optional; trigger by layer + trend (e.g. Howler or HTML5 Audio) |
| System prompt weather block | `app/api/chat/stream/route.ts` — `buildSystemPrompt(..., weatherContext)` |
| Dialogue reactions | From config; can be injected as examples or as “suggested line” in the prompt |

### 6.3 OpenSouls / Soul

- **Environment**: If the soul has access to `soul.env`, we can pass `weather: { main, layers }` (short summary) so the soul can say “I can feel the wind” when BTC layer is active.
- **No new mental process required**—just richer context (weather + optional portfolio blend) so existing emotional response and dialogue stay in character.

---

## 7. Phased Rollout

### Phase 1 — Layered weather (MVP)
- **Main**: SOL or $DEGEN (unchanged).
- **Overlays**: BTC, ETH only (wind + temp/fog).
- **Config**: JSON with 2 layers; thresholds and simple particles/tints.
- **Soul**: Add weather block to system prompt; use 1–2 reactions per layer.

### Phase 2 — More layers + multi-window
- Add Total Market Cap (cloud cover).
- Add 1–2 memes (e.g. DOGE, PEPE).
- Introduce “windows” UI: main + side panels; optional head-turn / “looking at” logic for dialogue.

### Phase 3 — Portfolio-aware + meme fun
- Portfolio-weighted weather and dialogue (“your portfolio is making it stormy”).
- BONK, WIF, MOODENG (or current top memes) as cosmetic layers.

---

## 8. Sound Design (Optional)

- **Wind** (BTC): gentle vs strong by price change.
- **Ambient** (ETH): warm hum vs cold drone.
- **Memes**: short, recognizable sounds (e.g. “bonk”, “splash”) when that layer is active.
- Keep levels low so they don’t overpower TTS; mix so only 1–2 layers are prominent at a time.

---

## 9. Why This Isn’t “New Tech”

- Same stack: Next.js, React, existing chat/stream, OpenSouls, DexScreener.
- Add: one config file, one multi-coin data source, overlay components, and a weather block in the prompt.
- The “illusion of life” gets 10× richer: the market isn’t a number, it’s **wind, fog, confetti, and chaos** in Degen’s world—and she talks about it like she lives in it.

---

## 10. Summary

| Idea | Description |
|------|-------------|
| **Layered weather** | SOL/$DEGEN = main sky; BTC/ETH/memes = overlay effects (wind, fog, confetti, mist, clouds). |
| **JSON config** | Single source for layer effects, visuals, sound, and Degen’s reaction lines. |
| **Multi-window** | Main window = SOL; side windows = other coins; Degen looks and comments. |
| **Portfolio-aware** | Optional blend from user’s wallet so Degen says “your portfolio is making it stormy.” |
| **Meme layers** | BONK, WIF, MOODENG (and others) as pure fun visuals + one-liners. |
| **Ship order** | V1: SOL + BTC + ETH. Then clouds + memes, then windows, then portfolio blend. |

Ready to build: start with **Phase 1** (main + BTC + ETH layers + weather block in prompt), then iterate.
