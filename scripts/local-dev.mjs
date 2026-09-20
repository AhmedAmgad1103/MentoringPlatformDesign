import { existsSync } from "node:fs"
import { spawn, spawnSync } from "node:child_process"
import { join } from "node:path"

const root = process.cwd()
const backend = join(root, "backend")
const npm = process.platform === "win32" ? "npm.cmd" : "npm"

function run(args, cwd) {
  const result = spawnSync(npm, args, {
    cwd,
    stdio: "inherit",
    shell: false,
  })
  if (result.status !== 0) process.exit(result.status ?? 1)
}

if (!existsSync(join(root, "node_modules"))) run(["install"], root)
if (!existsSync(join(backend, "node_modules"))) run(["install"], backend)

run(["run", "setup"], backend)

const backendProcess = spawn(
  npm,
  ["run", "dev", "--", "--hostname", "127.0.0.1", "--port", "3000"],
  { cwd: backend, stdio: "inherit", shell: false }
)

const frontendProcess = spawn(
  npm,
  ["run", "dev", "--", "--host", "127.0.0.1", "--port", "8443"],
  { cwd: root, stdio: "inherit", shell: false }
)

function shutdown() {
  if (!backendProcess.killed) backendProcess.kill("SIGTERM")
  if (!frontendProcess.killed) frontendProcess.kill("SIGTERM")
}

process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)

backendProcess.on("exit", (code) => {
  if (code && !frontendProcess.killed) frontendProcess.kill("SIGTERM")
})

frontendProcess.on("exit", (code) => {
  if (code && !backendProcess.killed) backendProcess.kill("SIGTERM")
})
