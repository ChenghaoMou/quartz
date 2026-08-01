import { jsx, jsxs } from "preact/jsx-runtime"
import type {
  FullSlug,
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzPluginData,
} from "@quartz-community/types"
import { formatDate, resolveRelative } from "@quartz-community/utils"

type Frontmatter = {
  description?: string
  status?: string
  title?: string
  type?: string
}

type PageData = Omit<QuartzPluginData, "dates" | "frontmatter" | "slug" | "unlisted"> & {
  dates?: {
    created?: Date
    modified?: Date
    published?: Date
  }
  frontmatter?: Frontmatter
  slug: FullSlug
  unlisted?: boolean
}

type HomeFeedOptions = {
  limit?: number
}

const asPage = (value: QuartzPluginData & Record<string, unknown>) => value as PageData

export const HomeHero: QuartzComponentConstructor = () => {
  const Component: QuartzComponent = ({ fileData }) => {
    const page = asPage(fileData)
    if (page.slug !== "index") return null

    return jsxs("section", {
      class: "home-intro",
      "aria-labelledby": "home-title",
      children: [
        jsx("h1", { id: "home-title", children: "Home" }),
        jsx("p", {
          children:
            "This is my journey in personal knowledge management—building a Zettelkasten system through lifelong reading and writing.",
        }),
        jsxs("p", {
          class: "home-signature",
          children: ["✌️", jsx("span", { children: "Chenghao" })],
        }),
        jsxs("nav", {
          class: "home-links",
          "aria-label": "Explore the site",
          children: [
            jsx("a", {
              href: resolveRelative(page.slug, "posts/index" as FullSlug),
              children: "Writing",
            }),
            jsx("a", {
              href: resolveRelative(page.slug, "tags/index" as FullSlug),
              children: "Topics",
            }),
            jsx("a", {
              href: resolveRelative(page.slug, "notes/20251221100853" as FullSlug),
              children: "Colophon",
            }),
            jsx("a", {
              href: resolveRelative(page.slug, "notes/20240218204257" as FullSlug),
              children: "About me",
            }),
          ],
        }),
      ],
    })
  }

  return Component
}

function pageDate(page: PageData) {
  return page.dates?.created ?? page.dates?.modified ?? page.dates?.published
}

function publicWriting(allFiles: (QuartzPluginData & Record<string, unknown>)[]) {
  return allFiles
    .map(asPage)
    .filter((page) => page.slug !== "index" && !page.slug.endsWith("/index"))
    .filter((page) => {
      const type = page.frontmatter?.type
      return type === "essay" || type === "note" || /^(?:posts|notes)\//.test(page.slug)
    })
    .filter((page) => page.unlisted !== true)
}

export const HomeFeed: QuartzComponentConstructor<HomeFeedOptions> = (options = {}) => {
  const limit = options.limit ?? 24
  const Component: QuartzComponent = ({ allFiles, fileData, cfg }) => {
    const page = asPage(fileData)
    if (page.slug !== "index") return null

    const pages = publicWriting(allFiles)
      .sort((a, b) => (pageDate(b)?.getTime() ?? 0) - (pageDate(a)?.getTime() ?? 0))
      .slice(0, limit)

    return jsxs("section", {
      class: "home-feed",
      "aria-labelledby": "recent-writing",
      children: [
        jsx("h2", { id: "recent-writing", children: "Recent writing" }),
        pages.length === 0
          ? jsx("p", { class: "empty-feed", children: "The public index is being assembled." })
          : jsx("ol", {
              class: "feed-list",
              children: pages.map((item) => {
                const frontmatter = item.frontmatter ?? {}
                const date = pageDate(item)
                return jsxs(
                  "li",
                  {
                    class: "feed-item",
                    children: [
                      jsxs("div", {
                        class: "feed-line",
                        children: [
                          jsx("a", {
                            class: "internal",
                            href: resolveRelative(page.slug, item.slug),
                            children: frontmatter.title ?? "Untitled",
                          }),
                          date
                            ? jsx("time", {
                                dateTime: date.toISOString(),
                                children: formatDate(date, cfg.locale),
                              })
                            : null,
                        ],
                      }),
                      frontmatter.type === "note" && frontmatter.status
                        ? jsx("span", { class: "feed-status", children: frontmatter.status })
                        : null,
                      frontmatter.description
                        ? jsx("p", {
                            class: "feed-description",
                            children: frontmatter.description,
                          })
                        : null,
                    ],
                  },
                  item.slug,
                )
              }),
            }),
      ],
    })
  }

  return Component
}

const noteStatusCopy = {
  draft: "An early sketch; the edges are still rough.",
  "in-progress": "A working note that may change as the idea develops.",
  evergreen: "A maintained note, revisited when the idea evolves.",
} as const

export const NoteStatus: QuartzComponentConstructor = () => {
  const Component: QuartzComponent = ({ fileData }) => {
    const page = asPage(fileData)
    const frontmatter = page.frontmatter ?? {}
    const status = frontmatter.status
    if (
      page.slug === "index" ||
      frontmatter.type !== "note" ||
      !status ||
      !(status in noteStatusCopy)
    ) {
      return null
    }

    return jsxs("aside", {
      class: "note-status",
      children: [
        jsx("span", { children: status }),
        jsx("p", { children: noteStatusCopy[status as keyof typeof noteStatusCopy] }),
      ],
    })
  }

  return Component
}
