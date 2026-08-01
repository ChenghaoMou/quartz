import type { QuartzTransformerPlugin } from "@quartz-community/types"
import type { Nodes, Root } from "hast"

function renderedText(node: Nodes): string {
  if (node.type === "text") return node.value
  if (!("children" in node)) return ""
  return node.children.map((child) => renderedText(child)).join("")
}

function comparableTitle(value: string): string {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ")
}

export const DeduplicateTitle: QuartzTransformerPlugin = () => ({
  name: "DeduplicateTitle",
  htmlPlugins() {
    return [
      () => (tree: Root, file) => {
        const title = file.data.frontmatter?.title
        if (typeof title !== "string") return

        const leadingIndex = tree.children.findIndex(
          (child) => child.type !== "text" || child.value.trim() !== "",
        )
        if (leadingIndex === -1) return

        const leading = tree.children[leadingIndex]
        if (leading?.type !== "element" || leading.tagName !== "h1") return
        if (comparableTitle(renderedText(leading)) !== comparableTitle(title)) return

        tree.children.splice(leadingIndex, 1)
      },
    ]
  },
})
