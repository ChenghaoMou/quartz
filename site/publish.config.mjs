import path from "node:path"

const root = path.resolve(import.meta.dirname, "..")

export default {
  root,
  vault: process.env.OBSIDIAN_VAULT
    ? path.resolve(process.env.OBSIDIAN_VAULT)
    : path.join(root, ".site.local.vault"),
  output: path.join(root, "content"),
  staticContent: path.join(root, "site", "content-static"),
  manifest: path.join(root, "site", "content-manifest.json"),
  publishField: "publish",
  publicFrontmatter: [
    "title",
    "description",
    "published",
    "modified",
    "type",
    "status",
    "tags",
    "aliases",
    "cssclasses",
  ],
  copiedAssetExtensions: [".avif", ".gif", ".jpeg", ".jpg", ".pdf", ".png", ".svg", ".webp"],
}
