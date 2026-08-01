# Sleepless in Debugging — design brief

## Intent

Build a durable personal writing garden for Chenghao: useful first to a future self, legible to technical peers, and comfortable with ideas that are still changing. It should feel authored rather than themed, but reading must remain the dominant interaction.

## Experience

The homepage is a chronological editorial front page. Essays and notes live in one feed, distinguished by a compact type label; notes also show one plain maturity state: `draft`, `in-progress`, or `evergreen`. Search, topics, and backlinks support quiet discovery. Graphs, explorers, analytics, comments, thumbnails, and engagement mechanics stay out of the primary experience.

The visual philosophy is **dithered editorial modernism**: warm Flexoki paper and ink, a serif reading voice, a restrained grotesk interface voice, fine rules, asymmetry, and deterministic geometric forms. The homepage carries the strongest composition. Section pages may use faint fragments of the motif; article pages stay quiet. Dithering is texture, not decoration everywhere.

## Structure

- Global: compact S/D mark, Writing, Topics, About, search, and a persisted System/Light/Dark appearance control.
- Home: manifesto-scale title, ambient geometric/dither field, then a single reverse-chronological feed.
- Article/note: title, date and reading metadata, tags, note maturity when applicable, body, sidenotes, then backlinks.
- Discovery: tag index, search, RSS, sitemap, and contextual backlinks.

## Content contract

The Obsidian vault is private. A deterministic export selects only Markdown with `publish: true`, validates public metadata and links, copies referenced assets, strips non-public frontmatter, and replaces `content/` atomically. `content/` plus `site/content-manifest.json` are the auditable public artifact.

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
