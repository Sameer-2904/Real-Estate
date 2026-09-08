# NESTORA — Find a Place Worth Coming Home To

An immersive, cinematic landing experience for a fictional luxury real-estate brand, built as a self-initiated portfolio piece. No frameworks, no build step — open `index.html` and it runs.

> **This is a concept project.** NESTORA is not a real company. All residences, agents, and testimonials are fictional, created to demonstrate frontend, animation, and UX craft.

---

## What this is

A single scroll-driven story for one property — **The Glass House**, Jaipur — that moves the visitor through:

```
Hero (fanned card deck)  →  Camera "journey" (5 scenes)  →  Typographic interlude
   →  Specifications  →  Materials  →  Interior gallery (pinned horizontal scroll)
   →  Floor plan  →  Location  →  Neighbourhood story  →  Lifestyle
   →  Property collection  →  Private viewing inquiry
```

Then it opens up into a small collection of two further residences, each explorable in a fullscreen tabbed view (gallery / specs / amenities / location).

## Features

- **Cinematic hero** — a fanned deck of eight photo cards falls into place over an oversized italic "ghost" headline, floats gently, tilts in 3D on hover, drifts with mouse parallax, and flies apart on scroll to hand off into the next section.
- **Scroll-driven camera journey** — five pinned scenes (Arrival → Living Space → Master Suite → Courtyard → Rooftop), text and a cross-fading photographic backdrop synced to scroll progress via GSAP ScrollTrigger.
- **Pinned horizontal galleries** for the interior tour and the neighbourhood story.
- **Interactive floor plan** with clickable rooms, per-floor tabs, and a detail panel.
- **Stylised dark location map** with travel-time stats (no external map API dependency).
- **Fullscreen property experience** for each residence in the collection, with tabbed gallery/specs/amenities/location.
- **Private viewing inquiry form** with real client-side validation and a confirmation state.
- **Custom cursor, magnetic buttons, smooth scroll (Lenis), scroll reveals (GSAP ScrollTrigger)** — all disabled automatically for touch devices and `prefers-reduced-motion`.
- **No build tooling required.** Everything runs directly in the browser from static files.

## Tech stack

| Purpose | Library |
|---|---|
| Animation & scroll-linked motion | [GSAP](https://gsap.com/) + ScrollTrigger |
| Smooth scrolling | [Lenis](https://github.com/darkroomengineering/lenis) |
| Fonts | [Fraunces](https://fonts.google.com/specimen/Fraunces) (display serif) + [Manrope](https://fonts.google.com/specimen/Manrope) (UI/body), via Google Fonts |
| Everything else | Vanilla HTML / CSS / JavaScript |

All three libraries load from CDN in `index.html` — there's nothing to install.

**A note on scope:** an earlier version of this project rendered the hero backdrop as a live WebGL scene (vanilla Three.js) that the camera moved through. It was removed — it behaved inconsistently across different desktop GPUs/drivers and occasionally failed silently, which isn't acceptable for a piece meant to represent reliable work. The site now uses a single, robust code path (a cross-fading photographic sequence) on every device, desktop and mobile alike.

## Running it locally

No build step, no dependencies to install. Two options:

```bash
# Option 1 — just open it
open index.html

# Option 2 — serve it (recommended, avoids any local file:// quirks)
npx serve .
# or
python3 -m http.server 8080
```

## Project structure

```
nestora-experience/
├── index.html      # Markup for every section
├── styles.css       # Full design system + all component/section styles
├── data.js          # All copy & content: the residence, journey scenes, hotspots,
│                     # materials, gallery, floor plans, location, neighbourhood,
│                     # lifestyle, the property collection, and the advisor
├── app.js            # All behaviour: preloader, cursor, hero, scroll journey,
│                     # galleries, floor plan, forms, modals, toasts
└── README.md
```

Content and behaviour are deliberately separated — to point this at a different property, you only need to edit `data.js`.

## Design system

| Token | Value | Use |
|---|---|---|
| `--obsidian` | `#15130F` | Primary background |
| `--ivory` | `#F4EFE6` | Primary text on dark |
| `--stone` | `#A79C89` | Secondary / muted text |
| `--gold` | `#C9A467` | Accent, CTAs, active states |
| `--gold-soft` | `#D9BE8C` | Headline/price accents |

Display type is **Fraunces** (editorial serif, used for headlines and the hero's ghost text); UI and body copy use **Manrope**. Motion favours slow, deliberate easing (`power3`/`power4` curves, `.6–1.1s` durations) over anything bouncy or abrupt.

## Content model

`data.js` exports plain arrays/objects consumed by `app.js`:

- `RESIDENCE` — the hero property's core facts
- `JOURNEY_SCENES` — the 5 camera-journey scenes (label, quote, backdrop image)
- `HOTSPOTS`, `MATERIALS`, `GALLERY_IMAGES`, `FLOOR_PLANS`, `LOCATION_STATS`
- `NEIGHBORHOOD_STORY`, `LIFESTYLE_IMAGES`
- `COLLECTION` — the other residences shown at the end
- `ADVISOR`, `SPECIFICATIONS`, `SPEC_BADGES`

Swapping in a real property is mostly a `data.js` edit; almost nothing in `app.js` is property-specific.

## Credits & attributions

- **Photography:** [Unsplash](https://unsplash.com), used under the [Unsplash License](https://unsplash.com/license) (free to use, no attribution required — credited here anyway as good practice).
- **Advisor portrait:** [randomuser.me](https://randomuser.me), a placeholder-portrait generator for mockups.
- **Fonts:** Fraunces and Manrope, both open-source via [Google Fonts](https://fonts.google.com).
- **Hero card-deck technique:** the "cards fall in, float, fan apart on scroll" mechanic was adapted from [*Landing page: GSAP Carousel / gallery*](https://codepen.io/dermalhealth/pen/KwNNbYZ) by Deckard on CodePen, MIT-licensed. The interaction pattern was reimplemented for this project's own visual identity, typography, copy, and imagery — no original code, styling, or content was reused directly.
- **Animation & scrolling:** [GSAP](https://gsap.com) and [Lenis](https://github.com/darkroomengineering/lenis).

## Known limitations

- **Sourced imagery is unverified over time.** Unsplash photo IDs can be removed by their photographers; a broken image means the ID is gone, not that anything else is wrong. Replace the affected entry in `data.js` with a fresh, confirmed-live Unsplash photo ID.
- **No backend.** The inquiry form, "save," and "compare" style flows are frontend-only demonstrations — nothing is emailed, stored remotely, or booked.
- **Content is fictional**, created for this portfolio piece.

## License

The code in this repository is the author's own work and may be used for learning or portfolio reference. Imagery, fonts, and the referenced hero-animation technique carry their own licenses as noted above.
