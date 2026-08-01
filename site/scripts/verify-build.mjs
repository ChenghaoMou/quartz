import fs from "node:fs/promises"
import path from "node:path"

const output = path.resolve(process.cwd(), process.argv[2] ?? "public")
const required = ["index.html", "404.html"]

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

console.log("Verified production entry points: public/index.html and public/404.html")
