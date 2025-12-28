# Design Revamp Plan: Nature-meets-Degen

## 1. Vision

Transform the current "techy/crypto" aesthetic into a lush, immersive "Nature-meets-Degen" experience. The goal is to mimic an otter's natural habitat (jungle/river) while keeping the "degen" spirit alive through a playful cartoon mascot and vibrant accents.

## 2. Design Pillars

- **Biophilic UI**: Use organic shapes, rounded corners, and natural textures (frosted glass, wood hints) instead of sharp, digital lines.
- **Immersive Backgrounds**: Replace abstract blobs with high-quality, realistic jungle imagery or video loops (parallax effects).
- **Playful Mascot**: Center the experience around a "cartoon otter" character living in this realistic world.
- **Natural Motion**: Animations should mimic nature (swaying, floating, flowing) rather than digital pulses or glitches.

## 3. Color Palette

Shift from "Cyberpunk Neon" to "Tropical Jungle".

| Role           | Current (Techy)    | Proposed (Nature)     | Hex Code (Approx)          |
| -------------- | ------------------ | --------------------- | -------------------------- |
| **Background** | `#0f0f0f` (Black)  | **Deep Jungle Green** | `#051F20`                  |
| **Primary**    | `#0f6157` (Teal)   | **Lush Leaf Green**   | `#2D6A4F`                  |
| **Secondary**  | `#ffd166` (Yellow) | **Sunlight Gold**     | `#D4A373`                  |
| **Accent**     | `#ff4da6` (Pink)   | **Tropical Flower**   | `#E07A5F`                  |
| **Text**       | `#ffffff`          | **Off-White / Cream** | `#F2E9E4`                  |
| **Card Bg**    | `#1a1a1a`          | **Frosted Glass**     | `rgba(255, 255, 255, 0.1)` |

## 4. Typography

- **Headings**: Keep a bold font but consider a softer, more organic display font (e.g., _Outfit_ or _Fredoka_) or stick to _Poppins_ with softer weights.
- **Body**: Clean sans-serif like _Inter_ or _Nunito_ for high readability against complex backgrounds.

## 5. Component Redesign Strategy

### A. Global Styles (`globals.css`)

- Update CSS variables to the new "Tropical Jungle" palette.
- Add utility classes for `glass-panel` (backdrop-blur, subtle white border).
- Add custom animations: `sway`, `float-organic`, `ripple`.

### B. Hero Section (`hero-section.tsx`)

- **Background**:
  - Remove `BackgroundAnimation` (abstract blobs).
  - Add a full-screen image/video of a jungle river or dense rainforest.
  - Add a "vignette" overlay to darken edges and focus attention.
- **Mascot**:
  - Place the "Cartoon Otter" prominently in the center or bottom-center.
  - Use `framer-motion` to make it "breathe" or float gently.
- **Typography**:
  - Title "$degen" in a "stone" or "wood" texture effect, or just clean white with a heavy drop shadow to pop against the jungle.
  - Badge "@marcelldegen" styled like a wooden sign or a leaf.
- **Floating Elements**:
  - Replace abstract circles with **Fireflies** (small glowing dots moving randomly) or **Falling Leaves**.

### C. Navigation (`navigation.tsx`)

- **Style**: Floating "island" navbar.
- **Effect**: Heavy glassmorphism (`backdrop-blur-md`, `bg-white/10`) with rounded pill shape.
- **Links**: Glow with a "sunlight" effect on hover rather than a "neon" effect.

### D. Interactive Elements

- **Buttons**:
  - Primary: "Jungle Green" gradient with organic rounded corners (almost oval).
  - Secondary: "Outline" style with a "vine" border effect.
- **Cards**:
  - Use "Glass Cards" for content sections (About, Tokenomics) to let the jungle background show through.

## 6. Implementation Steps

1.  **Assets**: Generate/Find a "Real Jungle Background" and "Cartoon Otter" image.
2.  **Theme Setup**: Update `globals.css` with new colors and `@layer utilities`.
3.  **Hero Overhaul**: Rewrite `HeroSection` to use the new background and mascot layout.
4.  **Polish**: Add "Firefly" particle effects and "Leaf" sway animations.

## 7. Immediate Action Items

- [ ] Update `globals.css` variables.
- [ ] Create `components/jungle-background.tsx` to replace `background-animation.tsx`.
- [ ] Refactor `HeroSection` to match the new vibe.
