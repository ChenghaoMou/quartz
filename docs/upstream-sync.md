# Syncing Quartz upstream

The personal site follows Quartz’s `v5` branch while keeping custom work at explicit integration points: `quartz.config.yaml`, `quartz/styles/custom.scss`, and `site/`.

## Safety references

- `v4-pre-v5-2026-08-01` is the annotated archive of the old Quartz 4 site.
- `upstream` should point to `https://github.com/jackyzha0/quartz.git`.
- The weekly upstream-drift workflow reports how many new v5 commits exist.

## Update procedure

```sh
git fetch upstream v5
git switch v5
git switch -c chore/quartz-upstream-YYYY-MM-DD
git merge --no-ff upstream/v5
npm ci
npm run install-plugins
npm run site:check
npm run site:build
```

Resolve upstream changes in core files in favour of upstream unless the personal site has a documented reason to differ. Pay special attention to the config loader, component layout API, client navigation lifecycle, and plugin lock format. Then inspect the homepage and one article in desktop/mobile and light/dark modes before merging.

Do not merge Quartz 4 into this branch; the v4 tag exists only for reference and rollback.
