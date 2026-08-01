# Publishing from Obsidian

The private vault is never deployed. The repository contains only the curated output in `content/`.

The current repository also has a temporary, exact path-by-path legacy map in `site/publish.config.mjs`. It imports material that was already public in the old blog and supplies the newer public metadata contract during migration. It does not publish directories wholesale; new writing should use `publish: true`.

## Mark a piece public

Add frontmatter like:

```yaml
publish: true
title: A useful title
description: One sentence used in feeds and search.
published: 2026-08-01
type: note
status: in-progress
tags:
  - systems
```

Use `type: essay` for a finished long-form piece; essays do not require `status`. A public piece may only link to other public pieces. Referenced images and PDFs are copied automatically.

## Export and preview

```sh
OBSIDIAN_VAULT=/absolute/path/to/vault npm run content:export
npm run site:check
npm run site:dev
```

The first command atomically replaces `content/` and updates `site/content-manifest.json`. Commit both together. `npm run content:check` fails if the public files and manifest diverge.

For a persistent local path, create the ignored symlink `.site.local.vault` pointing to the vault instead of setting `OBSIDIAN_VAULT` each time.

## Deploy

Cloudflare Pages should use Node 24, `npm run site:build` as the build command, and `public` as the output directory. The committed public export is the deploy input; Cloudflare does not need access to the private vault.
