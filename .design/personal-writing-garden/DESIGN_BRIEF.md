# Sleepless in Debugging — design brief

## Intent

Build a durable personal writing garden for Chenghao: useful first to a future self, legible to technical peers, and comfortable with ideas that are still changing. It should feel authored rather than themed, but reading must remain the dominant interaction.

## Experience

The homepage is a quiet personal index: a short introduction, direct links into the garden, and a plain reverse-chronological writing list. Essays and notes live in one feed; notes may show one small maturity state: `draft`, `in-progress`, or `evergreen`. Search, topics, a table of contents, and backlinks support quiet discovery. Graphs, explorers, analytics, comments, thumbnails, and engagement mechanics stay out of the primary experience.

The visual philosophy is **Flexoki quiet utility**, restored from the original site: warm paper and ink, native system typography, modest type sizes, a narrow reading column, useful side rails, plain links, and generous but unshowy spacing. The nine-dot dither logo beside the site name is the single geometric signature. Minimalism here means careful hierarchy and comfortable reading, not an ornamental editorial composition.

## Structure

- Global: nine-dot dither mark beside the site name, Writing, Topics, About, search, and a persisted System/Light/Dark appearance control.
- Home: original introduction and signature, direct section links, then a restrained reverse-chronological feed.
- Article/note: modest title, date and reading metadata, tags, note maturity when applicable, body, left-side contents, sidenotes, then backlinks.
- Discovery: tag index, search, RSS, sitemap, and contextual backlinks.

## Content contract

The active Obsidian vault is private. A deterministic export selects only Markdown with `publish: true`, validates public metadata and links, copies referenced assets, strips non-public frontmatter, and replaces `content/` atomically. During migration, an explicit path-by-path legacy-public map may import material from the existing public blog repository and supply missing public metadata; it must never operate as a directory-wide implicit allowlist. `content/` plus `site/content-manifest.json` are the auditable public artifact.

Public pieces use:

- `title`, `description`, `published`, `type`
- `type: essay | note`
- notes additionally require `status: draft | in-progress | evergreen`
- optional `modified`, `tags`, `aliases`, and `cssclasses`

## Interaction and accessibility

- Full keyboard access and visible focus treatment.
- Minimum 44px controls in navigation.
- Semantic regions and headings; decorative geometry is named as one image rather than exposing every primitive.
- System appearance by default, explicit light/dark persistence, sufficient Flexoki contrast.
- Motion is minimal and disabled under reduced-motion preferences.
- Desktop sidenotes sit in the margin; narrower screens expose the same note through an accessible button.

## Success criteria

- Publishing a marked note is a repeatable command, not a manual copy ritual.
- A leaked private note or link is a build failure.
- The production build is reproducible on Node 24 in CI and Cloudflare Pages.
- The homepage is recognisably Chenghao’s at a glance; an article is calm enough for a long reading session.
- Quartz upgrades remain reviewable because site code lives in `site/`, configuration, and documented integration points.
