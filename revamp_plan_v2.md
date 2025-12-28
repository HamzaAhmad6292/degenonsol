# Design Revamp Plan V2: The Celebrity Otter ("Berang Berang TikTok")

## 1. Core Concept: "The First Otter on TikTok"

Instead of a generic "jungle" theme, we will pivot to a **Narrative-Driven Lifestyle** aesthetic. The website will feel like the personal portfolio/vlog of a famous influencer otter. It captures the "cute but degen" vibe—an otter living a human-like, chaotic, and famous life.

**Key Tagline:** _BERANG BERANG PERTAMA YANG MAIN TIKTOK_ (The First Otter to Play TikTok)

## 2. Visual Direction

- **Style**: "Candid & Cinematic". High-quality, realistic AI images that look like photos taken from a phone or a movie scene.
- **Mood**: Golden hour, warm sunlight, relatable "POV" shots (looking out a car window, holding a phone, wearing sunglasses).
- **Layout**: Editorial/Social Media hybrid. Think "Instagram Profile meets High-End Portfolio".

## 3. New Component Architecture

### A. `OtterHero` (The "Car Window" Moment)

- **Visual**: A full-screen, immersive background of the otter looking out of a luxury car window at a passerby (recreating the user's reference).
- **Vibe**: "I made it."
- **Overlay**: Minimal text. Just the tagline "BERANG BERANG PERTAMA YANG MAIN TIKTOK" in a bold, cinematic font.
- **Interaction**: Parallax effect where the background (street) moves slightly differently from the otter.

### B. `OtterLifestyleGrid` (The "Degen Life")

- **Concept**: A masonry grid of "Polaroids" or "TikTok Thumbnails".
- **Content**:
  1.  _The Gamer_: Otter with a headset and gaming PC.
  2.  _The Trader_: Otter looking at charts on multiple screens.
  3.  _The Vibe_: Otter floating in a pool with sunglasses.
- **Effect**: Hovering over an image plays a subtle video loop or zooms in.

### C. `StoryTimeline` (The Journey)

- **Format**: A vertical scrolling timeline.
- **Narrative**:
  - "Born in the river."
  - "Discovered TikTok."
  - "Became a Degen."
  - "Taking over the world."

### D. `InteractiveMascot`

- **Feature**: A fixed, small 3D-style otter in the corner that follows your cursor with its eyes. Clicking it triggers a "squeak" sound or a chat bubble with a meme.

## 4. Color Palette Refinement

Shift from "Deep Jungle" to **"Golden Hour Lifestyle"**.

| Role           | Color              | Hex       | Vibe                        |
| -------------- | ------------------ | --------- | --------------------------- |
| **Background** | **Warm Off-White** | `#F9F7F2` | Clean, organic, editorial.  |
| **Primary**    | **Otter Brown**    | `#8D6E63` | Natural fur tone.           |
| **Accent**     | **TikTok Teal**    | `#69C9D0` | subtle nod to the platform. |
| **Text**       | **Dark Espresso**  | `#3E2723` | Softer than black.          |

## 5. Implementation Plan

### Phase 1: Asset Generation (CRITICAL)

We need specific, high-quality AI images to sell this story.

1.  **Hero Image**: Realistic otter, back view, looking out car window at a city street.
2.  **Gamer Otter**: Cute otter with gaming headset.
3.  **Rich Otter**: Otter with gold chain and sunglasses.

### Phase 2: Component Build

1.  Create `OtterHero` with parallax.
2.  Build `OtterLifestyleGrid`.
3.  Refactor `Navigation` to be minimal (let the images speak).

### Phase 3: "Cute" Polish

1.  Add "paw print" cursor trails.
2.  Use rounded, bubbly buttons.

## 6. Proposed Workflow

1.  **Generate Images**: I will attempt to generate the specific "Car Window" and "Lifestyle" images again.
2.  **Scaffold Components**: Create the new Hero and Grid components.
3.  **Assemble Page**: Replace the current "Jungle" page with this new "Celebrity" layout.
