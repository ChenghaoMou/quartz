import { readdirSync, rmSync, statSync } from "node:fs"
import { join, resolve } from "node:path"
import { spawnSync } from "node:child_process"
import process from "node:process"

const root = resolve(import.meta.dirname, "../..")
const pluginsDirectory = join(root, "site/plugins")
const compiler = join(root, "node_modules/typescript/bin/tsc")

const plugins = readdirSync(pluginsDirectory)
  .map((name) => join(pluginsDirectory, name))
  .filter((directory) => statSync(directory).isDirectory())
  .filter((directory) => statSync(join(directory, "tsconfig.json"), { throwIfNoEntry: false }))
  .sort()

for (const directory of plugins) {
  const name = directory.slice(pluginsDirectory.length + 1)
  rmSync(join(directory, "dist"), { recursive: true, force: true })
  const result = spawnSync(
    process.execPath,
    [compiler, "--project", join(directory, "tsconfig.json")],
    {
      cwd: root,
      stdio: "inherit",
    },
  )
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
  console.log(`Built site plugin: ${name}`)
}
