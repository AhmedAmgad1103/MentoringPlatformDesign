import { existsSync } from "node:fs"
import { join } from "node:path"
import { spawnSync } from "node:child_process"

const backend = join(process.cwd(), "backend")
const npm = process.platform === "win32" ? "npm.cmd" : "npm"

function run(args) {
  const result = spawnSync(npm, args, { cwd: backend, stdio: "inherit", shell: false })
  if (result.status !== 0) process.exit(result.status ?? 1)
}

if (!existsSync(join(backend, "node_modules"))) run(["install"])
run(["run", "setup"])
