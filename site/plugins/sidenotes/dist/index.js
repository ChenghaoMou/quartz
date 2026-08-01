import crypto from "node:crypto"

function escapeHtml(value) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character],
  )
}

function inlineMarkdown(value) {
  const escaped = escapeHtml(value)
  return escaped
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" rel="external noopener">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
}

function render(kind, anchor, note, id, number) {
  const marker = kind === "margin" ? "✦" : String(number)
  const label = kind === "margin" ? "Open margin note" : `Open sidenote ${number}`
  const className = `sidenote sidenote-${kind}`
  const reference = `<button class="sidenote-ref" type="button" aria-expanded="false" aria-controls="${id}" aria-label="${label}">${marker}</button>`
  const aside = `<aside class="${className}" id="${id}" role="note"><span class="sidenote-number" aria-hidden="true">${marker}</span>${inlineMarkdown(note)}</aside>`
  return `${anchor ? `<span class="sidenote-anchor">${inlineMarkdown(anchor)}</span>` : ""}${reference}${aside}`
}

export const Sidenotes = () => ({
  name: "Sidenotes",
  textTransform(_ctx, source) {
    const prefix = crypto.createHash("sha1").update(source).digest("hex").slice(0, 7)
    const noteContent = String.raw`((?:[^\[\]\n]|\[[^\]\n]+\]\([^)]+\))+)`
    let number = 0
    let output = source.replace(
      new RegExp(String.raw`\[([^\]\n]+)\]\^\[` + noteContent + String.raw`\]`, "g"),
      (_match, anchor, note) => {
        number += 1
        return render("numbered", anchor, note, `sn-${prefix}-${number}`, number)
      },
    )
    output = output.replace(
      new RegExp(String.raw`\^\[` + noteContent + String.raw`\]`, "g"),
      (_match, note) => {
        number += 1
        return render("numbered", "", note, `sn-${prefix}-${number}`, number)
      },
    )
    output = output.replace(
      new RegExp(String.raw`\+\[` + noteContent + String.raw`\]`, "g"),
      (_match, note) => {
        number += 1
        return render("margin", "", note, `sn-${prefix}-${number}`, number)
      },
    )
    return output
  },
  externalResources() {
    return {
      js: [
        {
          loadTime: "afterDOMReady",
          contentType: "inline",
          script: String.raw`const initSidenotes=()=>document.querySelectorAll(".sidenote-ref").forEach(button=>{if(button.dataset.ready)return;button.dataset.ready="true";const note=document.getElementById(button.getAttribute("aria-controls"));const toggle=()=>{const open=button.getAttribute("aria-expanded")!=="true";button.setAttribute("aria-expanded",String(open));note?.classList.toggle("is-open",open)};button.addEventListener("click",toggle);window.addCleanup?.(()=>button.removeEventListener("click",toggle))});document.addEventListener("nav",initSidenotes);document.addEventListener("render",initSidenotes);initSidenotes();`,
        },
      ],
    }
  },
})
