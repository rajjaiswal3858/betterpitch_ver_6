# BetterPitch design layer

A visual and motion pass over the existing site. Structure, sections, order, copy
and behaviour are unchanged: the site is a recorded Next.js build, so the pass
lives in an injected layer (`betterpitch/theme.css`, `polish.css`, `polish.js`,
plus the home hero in `hero.css`/`hero.js`) that only adds classes, CSS
variables, transforms and decorative overlays to existing elements after React
hydrates.

## Concept card

```
Idea:        Every call, your best pitch: a premium AI voice product on a dark stage
Metaphor:    a signal lighting up the dark, the waveform and neon edges
Signature:   the hero voice demo (tile bloom, aurora, glass play orb, travelling neon edge), see hero.js
Emotion:     futuristic, confident, premium
Motion verb: charge and glow: things rise out of the dark and light up
Screenshot:  the hero, black into violet into electric blue, the play orb glowing above the waveform
```

## System

- **Palette: dark neon** (`betterpitch/theme.css`): void `#05040a` (page), surface
  `#0d0b18` (cards, inputs), raised `#141126`, text `#f6f5fc`, muted `#a6a3b8`,
  neon violet `#8b5cf6` / purple `#a855f7`, electric blue `#3b82f6`, cyan `#22d3ee`.
  The neon gradient (purple → indigo → blue → cyan) is used for solid buttons, the
  hero's italic line, animated heading words and glowing edges.
- **How the light site turns dark**: theme.css overrides the site's Tailwind
  variables. The neutral scale is inverted (text reads light, neutral fills turn
  into dark surfaces and hairlines); ivory/lavender grounds become near-black;
  primary tints become dark violet; primary-800 becomes neon violet. `--color-white`
  stays white (white text and translucent glass on dark panels still need it), so
  opaque `bg-white` variants are overridden one by one. Utilities with light or
  purple colours typed in are recoloured individually at the end of the file.
  Dark logo SVGs (customers, press) are drawn white with a filter. Product
  screenshots and illustrations are image files and keep their own colours.
- **Chat panel**: its iframe is a separate app with its own tokens; server.js gives
  it `betterpitch/chat.css` (its built-in dark token set, retinted) instead of the
  site layer.
- **Type** (the site's own files): Intrinseca for display, Helvetica Now for text and
  UI. Display tracking -0.034em, leading 1.03, balanced lines; the page headline
  carries a faint violet glow.
- **Motion**: one ease family, `cubic-bezier(.16,1,.3,1)` (out) and `(.165,.84,.44,1)`
  (soft). GSAP + ScrollTrigger (served from node_modules, the CSP blocks CDNs) drive
  pointer-following motion and scroll-linked parallax; CSS transitions drive the
  one-shot reveals. Framer Motion is not used: it needs the site's React source,
  and this is a compiled recording.

## Treatments (one per role)

| Role | Treatment |
|---|---|
| Page headline | words rise, un-blur and stagger in (45 ms) as the page appears; the line under it follows |
| Section headings | the same word reveal when scrolled into view; original text nodes are put back afterwards |
| Card groups | rise 30 px, fade and settle from 98.5 % scale, staggered 80 ms |
| Cards | violet hairline glass; on hover a neon arc travels round the edge, a spotlight follows the pointer, and the card tilts in 3D (max 7°, GSAP) |
| Primary buttons | neon gradient that slides on hover, a highlight spreads from where the pointer entered, magnetic pull toward the pointer with an elastic return |
| Secondary buttons | violet fill spreads from the pointer, edge turns cyan, magnetic |
| "Case study" pills | glow and arrow nudge, gentle magnetic pull |
| Nav and footer links | gradient underline draws in from the left, soft glow |
| Inputs | cyan focus ring with violet glow, cyan caret |
| Focus | 2 px cyan ring, offset 3 px |
| Page change | in-site link: the page dims and blurs away; the new page rises in |
| Decoration | ambient violet/blue/cyan light drifting behind everything, pointer glow, line art and the product shot in slow parallax, hero aurora, floating motes, tile bloom, travelling panel edge |
| Scrolling | Lenis smooth scroll inside `#page-scroller` (fine pointers only), synced to ScrollTrigger |

## Rules kept

- Reduced motion: no smooth scroll, reveals, parallax, tilt, magnetism, pointer glow
  or idle animation; all content visible.
- Touch: hover effects sit in `@media (hover: hover)`; tilt, magnetism and the pointer
  glow run on fine pointers only. Nothing depends on hover.
- Content already on screen is never hidden for a scroll reveal (only the page
  headline waits for its intro, held by a removable style with a 4.5 s failsafe).
  Revealed elements are handed back to the site's own transitions afterwards, and a
  scroll-time sweep reveals anything a fast scroll skipped past.
- Motion uses `translate`/`scale`/`rotate` and opacity; magnetism uses the CSS
  `translate` property so it never fights the site's own transforms or moves layout.
- If React re-renders the document (a recoverable hydration error in the recorded
  build), the layer re-attaches to the new elements and restores its overlays.
- Accessibility additions: skip link as the first tab stop, 24 px tap targets on nav
  links; decorative layers are `aria-hidden` and ignore the pointer.
