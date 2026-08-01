# Publishing from the content repository

The Quartz framework and the writing are deliberately separate:

- `ChenghaoMou/quartz` contains the renderer, design, and build contract.
- `codeberg.org/Chenghao2023/blog` is the publishing repository and supplies `content/`.

The framework ignores `content/`; never commit a copy of the writing here. Existing notes do not
need duplicated `publish: true` flags. Publication is instead constrained by
`configuration.ignorePatterns` in `quartz.config.yaml`, which preserves the framework repository's
folder-level policy.

The following source areas are excluded: `private`, `templates`, `.obsidian`, `4archives`, `journal`,
`public`, `boilerplates`, `inbox`, `highlights/Archive`, and every `__order__.md` file.

## Local preview

Clone or symlink the publishing repository at `content/`, then run:

```sh
npm run site:dev
```

For this workspace, the existing checkout can be linked without copying it:

```sh
ln -s ../blog content
```

## Cloudflare Pages

Use Node 24 and configure:

```text
Build command: git clone --depth 1 https://codeberg.org/Chenghao2023/blog.git content && npm run site:build
Build output directory: public
Root directory: /
Production branch: v5
```

`npm run site:build` verifies that both `public/index.html` and `public/404.html` exist. A content
checkout or filter regression therefore fails the deployment instead of publishing a 404-only site.
