# Build-system refactor plan

## Outcome

Make the site feel like a small, dependable publishing system rather than a customized Quartz checkout. Quartz remains the renderer and upstream dependency; Chenghao's content contract, design system, and site components become a thin, tested layer with clear inputs and outputs.

```text
private vault ─┐
legacy public ─┼─> content compiler ─> content/ + manifest
static pages ──┘                           │
                                           v
site source ─> plugin build ─> Quartz adapter ─> public/
                                           │
                              checks + visual evidence
```

The visual target and critique live in `.design/personal-writing-garden/DESIGN_BRIEF.md` and `DESIGN_REVIEW.md`.

## Constraints

- Do not fork Quartz core for site features that can live in configuration or plugins.
- Never give the deploy environment access to the private vault.
- Keep `content/` and `site/content-manifest.json` as the auditable deployment input.
- Preserve source-vault files byte-for-byte; migration normalization happens in generated output.
- A Quartz upstream update must remain a normal merge with a small, explainable conflict surface.
- Optimize for one author and a durable workflow, not a general-purpose CMS.

## Current baseline

- Branch `v5` is based on upstream Quartz v5 and is currently zero commits behind `upstream/v5`.
- Site behavior is isolated in `site/plugins/`, `site/styles/`, `quartz.config.yaml`, and one custom-style import.
- The content exporter is atomic, validates metadata and public links, copies assets, and hashes the result.
- An exact legacy-public map imports three existing posts plus About and Colophon without opening an entire vault directory.
- The largest engineering smell is that custom plugin code is maintained directly in `dist/` JavaScript. Styling is also one large file, so component ownership is implicit.

## Refactor sequence

### 1. Establish reproducible boundaries

Deliverables:

- Pin Node and package-manager versions in local development, CI, and Cloudflare.
- Add one `npm run verify` entry point that runs content integrity, formatting, types, unit tests, production build, and a lightweight HTML smoke test.
- Record build timing and emitted-file counts so regressions are visible.
- Keep the upstream-drift workflow read-only and make its result link to `docs/upstream-sync.md`.

Exit condition: a clean checkout with committed `content/` can run one command and produce the deploy artifact without a vault.

### 2. Turn custom plugins into source packages

Deliverables:

- Move `site/plugins/*/dist/*.js` to typed source under `site/plugins/*/src/`.
- Add a small plugin build script using the TypeScript/esbuild tooling already present in Quartz; generated `dist/` remains installable but is never hand-edited.
- Share component prop types and lifecycle helpers instead of embedding unrelated browser scripts in component files.
- Add render tests for SiteChrome, HomeHero, HomeFeed, NoteStatus, and Sidenotes.

Exit condition: changing a custom component requires editing only source; `npm run site:plugins:build` deterministically regenerates installable packages.

### 3. Split the content compiler by responsibility

Replace the monolithic exporter with these modules:

1. `discover` — walk allowed roots and classify source files.
2. `select` — apply `publish: true` or an exact legacy-public entry.
3. `normalise` — produce one typed public metadata model.
4. `graph` — resolve note links and reject private or ambiguous edges.
5. `assets` — resolve, fingerprint, and copy referenced files.
6. `emit` — stage, hash, manifest, and atomically swap output.

Add a schema for publish configuration and diagnostics with error codes, source path, and suggested fix. Invalid private templates may be skipped; malformed files that request publication must fail closed.

Exit condition: each stage has unit fixtures, and a dry-run command reports additions, removals, metadata changes, broken links, and asset changes without writing.

### 4. Separate the design system from page composition

Deliverables:

- Split `site/styles/site.scss` into tokens, foundations, chrome, home, article, search, and content-primitives modules with one entry file.
- Keep the original system-font contract explicit and avoid a remote font dependency; reserve monospace for code and metadata only.
- Keep the nine-dot site mark as an isolated component so visual identity does not leak into content layout.
- Add a tiny development gallery containing navigation, search, feed rows, article typography, code, tables, callouts, sidenotes, tags, and both themes.

Exit condition: each visual primitive has one owner, complete interaction states, and a fixture that can be reviewed without finding a suitable live article.

### 5. Add browser-level quality gates

Deliverables:

- Smoke-test home, About, one code-heavy essay, and one working note.
- Check 375×812, 768×1024, and 1280×800 in light and dark modes.
- Assert no horizontal document overflow, one page-level `h1`, working search, persisted appearance, current navigation state, and reachable keyboard focus.
- Save visual evidence as CI artifacts; use focused snapshots rather than brittle whole-site pixel tests.

Exit condition: layout and interaction regressions fail before deployment.

### 6. Retire migration-only behavior

The explicit legacy map is a bridge, not a second permanent CMS.

- Add the public metadata contract to source posts as each one is revised.
- Replace filename-based routes with explicit stable slugs where needed.
- Remove an entry from `legacyPublic` only after its source file passes the normal publisher unchanged.
- When the map reaches zero entries, remove legacy normalization and keep its fixtures as regression tests for previously published URLs.

Exit condition: all public material uses the same `publish: true` path, with redirects for any migrated URLs.

## Recommended work packages

1. Plugin source/build pipeline — medium scope, low content risk.
2. Exporter module split plus dry-run — medium scope, highest safety value.
3. Style-module split and fixture gallery — medium scope, no visual change intended.
4. Browser smoke suite and CI artifacts — small-to-medium scope.
5. One-post-at-a-time content migration — ongoing editorial work.

Each package should leave the site deployable on its own. Avoid combining a Quartz upstream merge with a content-compiler or design-system refactor in the same pull request.

## Success measures

- Fresh production build under 30 seconds on CI, excluding dependency installation.
- No hand-edited generated plugin files.
- One command for the full local/CI verification path.
- Zero implicit directory publication and zero unresolved public links.
- Upstream merges normally touch configuration or adapters, not personal components.
- A visual change can be reviewed across the required breakpoints in under five minutes.
