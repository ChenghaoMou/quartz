import fs from "node:fs"
import path from "node:path"

const root = path.resolve(import.meta.dirname, "..")
const legacyVault = path.resolve(root, "..", "blog")
const localVault = path.join(root, ".site.local.vault")
const vault = process.env.OBSIDIAN_VAULT
  ? path.resolve(process.env.OBSIDIAN_VAULT)
  : fs.existsSync(legacyVault)
    ? legacyVault
    : localVault

export default {
  root,
  vault,
  output: path.join(root, "content"),
  staticContent: path.join(root, "site", "content-static"),
  manifest: path.join(root, "site", "content-manifest.json"),
  publishField: "publish",
  ignoredVaultPaths: ["4archives", "Excalidraw", "boilerplates", "inbox", "journal"],
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
  assetSearchPaths: ["statics"],
  enableLegacyImport:
    process.env.LEGACY_PUBLIC_IMPORT === "1" ||
    (!process.env.OBSIDIAN_VAULT && vault === legacyVault),
  legacyPublic: {
    "posts/20230220150602.md": {
      output: "writing/large-scale-near-deduplication-behind-bigcode.md",
      title: "Large-scale Near-deduplication Behind BigCode",
      description:
        "A field report on document-level near-deduplication at BigCode scale—its motivations, trade-offs, and lessons learned.",
      published: "2023-02-20",
      type: "essay",
      stripLeadingHeading: true,
    },
    "posts/20240630131948.md": {
      output: "writing/fine-tuning-idefics2-for-contract-vqa.md",
      title: "Fine-tuning Idefics2-8B for Multi-page Contract VQA",
      description:
        "A practical notebook for adapting Idefics2-8B to answer questions across multi-page contract documents.",
      published: "2024-06-30",
      type: "essay",
      stripLeadingHeading: true,
    },
    "posts/20250204203858.md": {
      output: "writing/pain-points-building-voice-agents.md",
      title: "Pain Points Building Voice Agents",
      description:
        "Working notes on extensibility, developer experience, and uncertainty in production voice-agent systems.",
      published: "2025-02-04",
      type: "note",
      status: "draft",
      stripLeadingHeading: true,
    },
    "notes/20240218204257.md": {
      output: "about.md",
      title: "About Me",
      description:
        "Chenghao is a machine-learning engineer in Dublin, thinking about language technology, its social impact, cooking, reading, and writing.",
      published: "2024-02-18",
      type: "page",
      stripLeadingHeading: true,
      replacements: [
        {
          from: "![[DBD48D14-3318-4978-A90F-9FC88FFC86B7_1_105_c.jpeg|Sunset at Herbert Park, Dublin, Ireland, 2024]]",
          to: "![Sunset at Herbert Park, Dublin, Ireland, 2024](DBD48D14-3318-4978-A90F-9FC88FFC86B7_1_105_c.jpeg)",
        },
      ],
    },
    "notes/20251221100853.md": {
      output: "colophon.md",
      title: "Colophon",
      description: "How this digital garden is built, typeset, and published.",
      published: "2025-12-21",
      type: "page",
      stripLeadingHeading: true,
    },
  },
}
