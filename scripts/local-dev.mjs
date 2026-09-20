import { existsSync } from "node:fs"
import { spawn, spawnSync } from "node:child_process"
import { join } from "node:path"

const root = process.cwd()
const backend = join(root, "backend")
const npm = process.platform === "win32" ? "npm.cmd" : "npm"
const shell = process.platform === "win32"

function fail(message) {
  console.error("\n[local-dev] " + message)
  process.exit(1)
}

function run(args, cwd) {
  if (!existsSync(cwd)) fail(`Directory not found: ${cwd}`)

  const result = spawnSync(npm, args, {
    cwd,
    stdio: "inherit",
    shell,
  })

  if (result.error) {
    fail(`Failed to run "${npm} ${args.join(" ")}": ${result.error.message}`)
  }

  if (result.status !== 0) {
    fail(`Command "${npm} ${args.join(" ")}" exited with code ${result.status ?? "unknown"}`)
  }
}

if (!existsSync(backend)) {
  fail(`Backend folder was not found at ${backend}. Make sure you are on the local-full-stack-test branch and that the backend/ folder exists.`)
}

console.log("[local-dev] Checking dependencies...")

if (!existsSync(join(root, "node_modules"))) run(["install"], root)
if (!existsSync(join(backend, "node_modules"))) run(["install"], backend)

console.log("[local-dev] Setting up local SQLite database...")
run(["run", "setup"], backend)

console.log("[local-dev] Starting backend on http://127.0.0.1:3000")
const backendProcess = spawn(
  npm,
  ["run", "dev", "--", "--hostname", "127.0.0.1", "--port", "3000"],
  { cwd: backend, stdio: "inherit", shell }
)

console.log("[local-dev] Starting frontend on http://127.0.0.1:8443")
const frontendProcess = spawn(
  npm,
  ["run", "dev", "--", "--host", "127.0.0.1", "--port", "8443"],
  { cwd: root, stdio: "inherit", shell }
)

let shuttingDown = false

function shutdown(code = 0) {
  if (shuttingDown) return
  shuttingDown = true

  if (!backendProcess.killed) backendProcess.kill()
  if (!frontendProcess.killed) frontendProcess.kill()

  process.exit(code)
}

backendProcess.on("error", (error) => {
  console.error("\n[local-dev] Backend failed to start:", error.message)
  shutdown(1)
})

frontendProcess.on("error", (error) => {
  console.error("\n[local-dev] Frontend failed to start:", error.message)
  shutdown(1)
})

backendProcess.on("exit", (code) => {
  if (!shuttingDown && code !== 0) {
    console.error(`\n[local-dev] Backend stopped with code ${code ?? "unknown"}`)
    shutdown(1)
  }
})

frontendProcess.on("exit", (code) => {
  if (!shuttingDown && code !== 0) {
    console.error(`\n[local-dev] Frontend stopped with code ${code ?? "unknown"}`)
    shutdown(1)
  }
})

process.on("SIGINT", () => shutdown(0))
process.on("SIGTERM", () => shutdown(0))
