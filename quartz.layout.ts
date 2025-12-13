import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"

// components shared across all pages
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [
    // Row 1: Navigation - left side (Breadcrumbs with site identity) and right side (Search + Darkmode)
    // Header component handles the layout with space-between
    Component.Breadcrumbs(),
    Component.Search(),
    Component.Darkmode(),
  ],
  afterBody: [
    // Backlinks appear at the end of the article
    Component.Backlinks(),
  ],
  footer: Component.Footer({
    links: {
      "Source Code": "https://codeberg.org/Chenghao2023/blog",
      "Flexoki Color Theme": "https://stephango.com/flexoki",
    },
  }),
}

// components for pages that display a single page (e.g. a single note)
export const defaultContentPageLayout: PageLayout = {
  beforeBody: [Component.ContentMeta(), Component.TagList()],
  left: [
    // Col 1: Table of Contents (sticky)
    Component.DesktopOnly(Component.TableOfContents()),
  ],
  right: [],
}

// components for pages that display lists of pages (e.g. tags or folders)
export const defaultListPageLayout: PageLayout = {
  beforeBody: [Component.ContentMeta()],
  left: [],
  right: [],
}
