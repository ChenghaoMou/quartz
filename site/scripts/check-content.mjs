import config from "../publish.config.mjs"
import { checkContent } from "./lib/content-export.mjs"

try {
  const result = await checkContent(config)
  console.log(`Verified ${result.files} public content files.`)
} catch (error) {
  console.error(`Content check failed: ${error.message}`)
  process.exitCode = 1
}
