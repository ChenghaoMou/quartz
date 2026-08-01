import config from "../publish.config.mjs"
import { exportContent } from "./lib/content-export.mjs"

try {
  const manifest = await exportContent(config)
  console.log(`Exported ${Object.keys(manifest.files).length} public files to content/`)
} catch (error) {
  console.error(`Content export failed: ${error.message}`)
  process.exitCode = 1
}
