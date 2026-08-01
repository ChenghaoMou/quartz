import path from "node:path"
import { AliasRedirects as UpstreamAliasRedirects } from "@quartz-community/alias-redirects"
import type {
  FilePath,
  FullSlug,
  ProcessedContent,
  QuartzEmitterPlugin,
} from "@quartz-community/types"
import { isRelativeURL, simplifySlug } from "@quartz-community/utils"

type Options = {
  enableCaseRedirects: boolean
}

function aliasSlug(canonicalSlug: string, aliasTarget: string) {
  const target = isRelativeURL(aliasTarget)
    ? path.normalize(path.join(canonicalSlug, "..", aliasTarget))
    : aliasTarget
  return simplifySlug(target)
}

function canonicalSlugs(content: ProcessedContent[]) {
  return new Set(
    content
      .map(([_tree, file]) => file.data.slug)
      .filter((slug): slug is FullSlug => typeof slug === "string")
      .map((slug) => simplifySlug(slug)),
  )
}

type ContentFile = ProcessedContent[1]

function withoutCanonicalAliases(file: ContentFile, canonicalPages: Set<string>): ContentFile {
  if (typeof file.data.slug !== "string") return file
  const canonicalSlug = simplifySlug(file.data.slug)
  const currentAliases = Array.isArray(file.data.aliases) ? file.data.aliases : []
  const aliases = currentAliases.filter(
    (alias) => !canonicalPages.has(aliasSlug(canonicalSlug, alias)),
  )

  if (aliases.length === currentAliases.length) {
    return file
  }

  return Object.assign(Object.create(Object.getPrototypeOf(file)) as ContentFile, file, {
    ...file,
    data: {
      ...file.data,
      aliases,
    },
  })
}

function safeContent(content: ProcessedContent[]): ProcessedContent[] {
  const canonicalPages = canonicalSlugs(content)
  return content.map(
    ([tree, file]) =>
      [tree, withoutCanonicalAliases(file as ContentFile, canonicalPages)] as ProcessedContent,
  )
}

async function* emitFiles(
  result: Promise<FilePath[]> | AsyncGenerator<FilePath> | null,
): AsyncGenerator<FilePath> {
  if (result === null) return
  if (Symbol.asyncIterator in result) {
    yield* result
    return
  }
  yield* await result
}

export const AliasRedirects: QuartzEmitterPlugin<Partial<Options>> = (options = {}) => {
  const upstream = UpstreamAliasRedirects(options)

  return {
    ...upstream,
    name: "SafeAliasRedirects",
    async *emit(ctx, content, resources) {
      yield* emitFiles(upstream.emit(ctx, safeContent(content), resources))
    },
    async *partialEmit(ctx, content, resources, changeEvents) {
      if (!upstream.partialEmit) return
      const canonicalPages = canonicalSlugs(content)
      const safeEvents = changeEvents.map((event) =>
        event.file
          ? {
              ...event,
              file: withoutCanonicalAliases(event.file as ContentFile, canonicalPages),
            }
          : event,
      )
      yield* emitFiles(upstream.partialEmit(ctx, content, resources, safeEvents))
    },
  }
}
