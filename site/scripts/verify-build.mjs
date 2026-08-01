import fs from "node:fs/promises"
import path from "node:path"

const output = path.resolve(process.cwd(), process.argv[2] ?? "public")
const required = ["index.html", "404.html", "favicon.ico", "static/icon.png", "static/icon.svg"]

for (const relative of required) {
  const file = path.join(output, relative)
  try {
    const stat = await fs.stat(file)
    if (!stat.isFile() || stat.size === 0) throw new Error("empty output")
  } catch {
    console.error(`Build verification failed: ${path.join(output, relative)} is missing or empty.`)
    process.exit(1)
  }
}

const home = await fs.readFile(path.join(output, "index.html"), "utf8")
if (!home.includes("static/icon.svg")) {
  console.error("Build verification failed: public/index.html does not reference static/icon.svg.")
  process.exit(1)
}

console.log("Verified production entry points and favicon assets.")
