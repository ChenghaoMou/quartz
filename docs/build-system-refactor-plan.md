# Build-system refactor plan

## Outcome

Keep the personal site as two independently maintained repositories with one explicit build contract:

```text
Codeberg blog repository ──content:checkout──> ignored content/
                                      │
Quartz framework ──folder policy──────┤
                                      v
                              Quartz build ──> public/
                                                   │
                                      artifact checks + deploy
```

- The blog repository owns Markdown, attachments, and its root `index.md`.
- This repository owns Quartz, folder-level publication policy, design, and build verification.
- Cloudflare joins the two only inside its ephemeral build workspace.

The visual target and critique live in `.design/personal-writing-garden/DESIGN_BRIEF.md` and
`DESIGN_REVIEW.md`.

## Invariants

- Never commit `content/` or a generated content manifest to the framework repository.
- Never mutate source documents during a framework build.
- Keep excluded folders in `quartz.config.yaml`; do not require duplicated `publish: true` metadata.
- Preserve the established exclusions for private, working, archived, and ordering content.
- A successful deploy must contain both `public/index.html` and `public/404.html`.
- Keep personal behavior in configuration or site-local plugins rather than Quartz core.

## Refactor sequence

The first implementation pass is complete: external content checkout and output verification share
one command path; folder policy has regression coverage; site-local plugins build from typed source;
and the personal stylesheet is divided by responsibility. The remaining sequence records the next
quality and automation work rather than prerequisites for publishing.

### 1. Make the repository boundary reproducible — complete

- Pin Node and npm versions across local development, CI, and Cloudflare.
- Clone the Codeberg publishing repository into ignored `content/` in CI and Cloudflare.
- Add a single verification entry point covering formatting, types, tests, production build, and
  required output files.
- Record the external content revision in build logs for reproducibility.

Exit condition: a clean framework checkout plus the content clone produces the same root routes in
CI and Cloudflare, and a missing `index.html` fails the build.

### 2. Make publication policy testable — in progress

- Treat `configuration.ignorePatterns` as the canonical folder policy.
- Add fixtures proving excluded folders and `__order__.md` files never reach `public/`.
- Keep the draft filter as an independent frontmatter-level safeguard.
- Add a link report for links from public pages into excluded content.

Exit condition: policy changes are reviewed as framework changes and have regression tests without
editing documents in the content repository.

### 3. Turn custom plugins into source packages — complete

- Move `site/plugins/*/dist/*.js` to typed source under `site/plugins/*/src/`.
- Add a deterministic plugin build command; stop hand-editing generated `dist/` files.
- Share component types and lifecycle helpers.
- Expand render tests for SiteChrome, HomeHero, HomeFeed, NoteStatus, and Sidenotes.

Exit condition: a custom component change is made in source and rebuilt deterministically.

### 4. Separate design tokens from page composition — in progress

- Keep the responsibility-based stylesheet split small as visual primitives continue to settle.
- Keep system typography and Flexoki colour roles explicit.
- Isolate the nine-dot mark and pull-switch assembly as self-contained components.
- Add a small component gallery for typography, search, feed rows, sidenotes, tags, and both themes.

Exit condition: each visual primitive has one owner and can be reviewed without finding a suitable
live article.

### 5. Add browser-level quality gates

- Smoke-test the home page, About, Colophon, one code-heavy post, folder indexes, and tags.
- Cover phone, tablet, and desktop viewports in light and dark modes.
- Assert no horizontal overflow, one page-level heading, working search, persisted appearance,
  working sidenotes, and reachable keyboard focus.
- Save focused screenshots as CI artifacts.

Exit condition: route, layout, and interaction regressions fail before deployment.

### 6. Make upstream synchronization routine

- Keep upstream merges separate from content-policy and design refactors.
- Maintain a small adapter surface in `site/`, `quartz.config.yaml`, and the custom-style import.
- Run the full external-content build after every upstream merge.
- Keep the read-only drift workflow linked to `docs/upstream-sync.md`.

Exit condition: upstream changes normally conflict only with configuration or adapters, not personal
content.

## Recommended work packages

1. Component gallery for the existing style modules.
2. Browser smoke suite and CI visual artifacts.
3. Reproducible deployment metadata and upstream-merge automation.

Each package must leave the site deployable independently.

## Success measures

- Zero content files tracked by the framework repository.
- Zero excluded-folder files in the production artifact.
- A missing root page fails locally and in CI before Cloudflare publishes.
- No hand-edited generated plugin code.
- One command verifies the joined framework/content build.
- A visual change can be reviewed at all required breakpoints in under five minutes.
