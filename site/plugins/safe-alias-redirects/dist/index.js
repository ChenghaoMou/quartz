import path from "node:path"
import { AliasRedirects as UpstreamAliasRedirects } from "@quartz-community/alias-redirects"
import { isRelativeURL, simplifySlug } from "@quartz-community/utils"

function aliasSlug(canonicalSlug, aliasTarget) {
  const target = isRelativeURL(aliasTarget)
    ? path.normalize(path.join(canonicalSlug, "..", aliasTarget))
    : aliasTarget
  return simplifySlug(target)
}

function canonicalSlugs(content) {
  return new Set(
    content
      .map(([_tree, file]) => file.data.slug)
      .filter(Boolean)
      .map((slug) => simplifySlug(slug)),
  )
}

function withoutCanonicalAliases(file, canonicalPages) {
  const canonicalSlug = simplifySlug(file.data.slug)
  const aliases = (file.data.aliases ?? []).filter(
    (alias) => !canonicalPages.has(aliasSlug(canonicalSlug, alias)),
  )

  if (aliases.length === (file.data.aliases ?? []).length) {
    return file
  }

  return {
    ...file,
    data: {
      ...file.data,
      aliases,
    },
  }
}

function safeContent(content) {
  const canonicalPages = canonicalSlugs(content)
  return content.map(([tree, file]) => [tree, withoutCanonicalAliases(file, canonicalPages)])
}

export const AliasRedirects = (options) => {
  const upstream = UpstreamAliasRedirects(options)

  return {
    ...upstream,
    name: "SafeAliasRedirects",
    async *emit(ctx, content, resources) {
      yield* upstream.emit(ctx, safeContent(content), resources)
    },
    async *partialEmit(ctx, content, resources, changeEvents) {
      const canonicalPages = canonicalSlugs(content)
      const safeEvents = changeEvents.map((event) =>
        event.file
          ? {
              ...event,
              file: withoutCanonicalAliases(event.file, canonicalPages),
            }
          : event,
      )
      yield* upstream.partialEmit(ctx, content, resources, safeEvents)
    },
  }
}
