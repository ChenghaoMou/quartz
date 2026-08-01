# Personal writing garden — design review

## Review scope

Reviewed the current Quartz v5 implementation against the design brief and the real source vault at `../blog`. Evidence was captured from the running site at 1280×800, 768×1024, and 375×812 in light mode, plus 1280×800 and 375×812 in dark mode. Superseded baseline captures were removed after sign-off; the retained `screenshots/final-*.svg` files document the accepted implementation.

## Verdict

> **Status:** The computational-field-notebook direction documented below was superseded after hands-on review. The current implementation restores the original Flexoki/system-type design and retains only the new dither logo. The critique remains useful as a record of why the first redesign was rejected.

The implementation is usable but not authored enough to satisfy the brief. It uses familiar editorial signals—oversized serif type, thin rules, restrained colour, and abstract geometry—without giving those elements a coherent job. The result is visually large but experientially thin. The empty feed makes the site feel like a theme demo rather than Chenghao's accumulated body of work.

The redesign should be built around the character already present in the writing: technical field reports, notebook-like experiments, candid work-in-progress notes, and a long-running Zettelkasten. The revised philosophy is **computational field notebook**: rigorous editorial typography, instrument-like controls, visible archive structure, and deterministic dither that acts as a signal for the body of writing.

## What is working

- The Flexoki-derived palette is comfortable for long reading and remains a strong foundation.
- The public-content export is intentionally defensive and auditable.
- Semantic navigation, appearance persistence, focus styles, and reduced-motion handling exist.
- Sidenotes fit both the vault's history and the desired reading experience.
- The implementation is isolated under `site/`, keeping future Quartz upstream work reviewable.

## Material failures

### 1. The content is absent from the experience

The homepage advertises “Latest writing” and then reports zero pieces even though the source vault contains three substantial posts, 447 evergreen notes, and 1,337 highlights. This is the most damaging issue: the visual design has no relationship to the archive it represents.

Action: introduce an explicit legacy-public import map for the already-public blog repository. Import representative posts and identity pages with inferred public metadata while leaving the strict `publish: true` contract intact for future vault publishing.

### 2. The hero is static theatre

The orange plane, purple plane, circle, and dotted orb do not encode content or invite interaction. At tablet and mobile widths they consume most of the first viewport and push the writing below the fold. Their overlap with the deck feels accidental rather than composed.

Action: replace the illustration with a deterministic signal field derived from the visible writing list. Feed rows and field bands should share indices and respond together on hover/focus. Dither becomes information-bearing texture.

### 3. Typography lacks a complete hierarchy

The oversized Source Serif title is doing almost all the expressive work. Interface text is heavy, tightly spaced, and generic; body copy is underdeveloped; line lengths and vertical rhythm do not adapt to technical articles with tables, code, images, and long headings. The title wraps awkwardly at both desktop and mobile widths.

Action: move to Literata for reading, Spline Sans for navigation/headings, and Fragment Mono for metadata/code. Define optical sizes, a disciplined fluid type ramp, paragraph rhythm, heading intervals, list/table treatment, and a narrower article measure. Let the homepage title use a compact typographic lockup rather than maximum scale.

### 4. Navigation and controls feel assembled

Search drops to a separate row at desktop, the appearance button is a generic bordered rectangle, and the mobile navigation is simply a wrapped desktop row. Controls have large boxes but little hierarchy or feedback. Active page state is absent.

Action: create a single masthead grid with a wordmark, indexed links, an integrated search trigger, and a compact three-state appearance control. On mobile, keep the essential controls in one intentional two-row composition; do not merely shrink the desktop layout.

### 5. The layout wastes space without creating tension

Quartz's empty left rail remains part of the grid while the main composition sits in a narrow centre column. The asymmetry is not purposeful: there is neither a useful reading rail nor a strong full-width composition.

Action: take ownership of the page grid. Homepage content should span a deliberate 12-column canvas; article pages should use a reading column plus metadata/sidenote rail. The right rail should have a job or disappear.

### 6. Dark mode is mostly an inversion

The same translucent geometry becomes muddy in dark mode, and the visual hierarchy collapses into cream type on black with orange accents. Surfaces and code-heavy content do not yet have their own dark-mode contrast logic.

Action: tune dark surfaces independently, reduce luminous area, use dither density instead of translucent colour mass, and give code, tables, selections, rules, and interactive states explicit dark tokens.

## Responsive findings

| Viewport  | Finding                                                                                                                                                               | Severity |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| 1280×800  | Search wraps beneath navigation; hero uses the centre but leaves layout rails visually unresolved; no writing is visible above the fold.                              | High     |
| 768×1024  | Hero consumes roughly two thirds of the viewport; geometry is clipped; feed is empty; navigation spacing is mechanically distributed.                                 | High     |
| 375×812   | Two-line navigation and half-width search dominate the header; title and illustration overfill the viewport; no primary content appears in the captured first screen. | Critical |
| Dark mode | Decorative planes become brown/purple haze and lose edge definition; interaction hierarchy remains unchanged from light mode.                                         | Medium   |

## Accessibility and interaction

- Existing focus-visible treatment is a sound start, but current hover effects rely too heavily on colour.
- The appearance control's cycle is discoverable only through its changing label; the compact redesign needs a stable name and visible state.
- Navigation requires current-page indication using `aria-current` and a non-colour cue.
- The signal field must remain decorative as a whole, avoid exposing every cell to assistive technology, and have no meaning that exists only in motion.
- Feed rows need a generous linked hit area without invalid nested links.
- All motion must stop under `prefers-reduced-motion`.

## Superseded first-pass direction

**Computational field notebook**

- A precise masthead resembling a labelled instrument, not an app toolbar.
- A compact home lockup paired with a live-looking dither signal field.
- Real essays and working notes visible immediately.
- Typographic rhythm suited to prose, code, tables, diagrams, and footnotes.
- Geometric/dither visuals connected to content indices and interaction states.
- Flexoki paper/ink retained, with red-orange as the primary signal and cyan/blue as a sparing secondary channel.
- Mobile-first composition with enhancement at 42rem and 72rem.

## Acceptance checks

- Real source content appears in the homepage feed and article routes.
- At least one post with code/tables and one draft-style note are inspected at all breakpoints.
- Header, search, theme control, feed rows, external links, tables, code blocks, callouts, and sidenotes have complete hover/focus/active/dark states.
- Homepage identity remains recognisable with CSS disabled: title, description, archive summary, and writing list are semantic content.
- No private or unlisted vault directory is imported implicitly.

## Implementation follow-up

This follow-up records the superseded first redesign. After review, the site returned to the original narrow, system-typography layout with the new logo retained. Current browser verification covers desktop and mobile home pages plus the code-heavy Idefics2 article with its left-side table of contents.

The redesign was re-reviewed after implementation using the same collaborative browser and viewport matrix. Final evidence is stored as:

- `screenshots/final-home-desktop-light.svg`
- `screenshots/final-home-tablet-light.svg`
- `screenshots/final-home-mobile-light.svg`
- `screenshots/final-home-desktop-dark.svg`
- `screenshots/final-home-mobile-dark.svg`
- `screenshots/final-article-desktop-light.svg`
- `screenshots/final-article-mobile-dark.svg`

The final pass confirmed:

- Real writing appears in the index, search, and stable article routes.
- The first viewport has a complete authored composition at all three widths; the mobile signal field ends before the writing index begins.
- Tablet title and signal field occupy separate grid columns without collision.
- The home and article documents have no horizontal overflow at 375px or 1280px.
- Search opens from the compact header, receives focus, and finds the voice-agent note from body content.
- The appearance control updates its accessible label and visible state.
- Active navigation uses both colour and a bottom rule.
- Code blocks remain within the reading column; wide tables scroll inside their wrapper rather than widening the document.
- Reduced-motion handling covers the scan line, status pulse, and interactive transitions.
