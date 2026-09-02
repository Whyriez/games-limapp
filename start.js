import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SERVER_DIR = path.join(__dirname, "server");
const CLIENT_DIR = path.join(__dirname, "client");

console.log("\x1b[35m%s\x1b[0m", "=======================================================");
console.log("\x1b[1m\x1b[36m%s\x1b[0m", " 🕵️  UNDERCOVER: STEALTH EDITION (RUNNER ENGINE)");
console.log("\x1b[35m%s\x1b[0m", "=======================================================");
console.log("\x1b[32m%s\x1b[0m", " 🚀 Backend Server : http://localhost:4000");
console.log("\x1b[34m%s\x1b[0m", " 🎮 Frontend Client : http://localhost:1001 (Proxies to Backend)");
console.log("\x1b[33m%s\x1b[0m", " 🔒 Admin Portal    : http://localhost:1001/admin");
console.log("\x1b[35m%s\x1b[0m", "=======================================================\n");

const isWindows = process.platform === "win32";
const npmExecutable = isWindows ? "npm.cmd" : "npm";

// 1. Spawn Backend Server
const serverProcess = spawn(npmExecutable, ["run", "dev"], {
  cwd: SERVER_DIR,
  stdio: ["inherit", "pipe", "pipe"],
  shell: isWindows,
  env: { ...process.env },
});

serverProcess.stdout.on("data", (data) => {
  const lines = data.toString().trim().split("\n");
  for (const line of lines) {
    if (line.trim()) {
      console.log(`\x1b[32m[SERVER]\x1b[0m ${line}`);
    }
  }
});

serverProcess.stderr.on("data", (data) => {
  const lines = data.toString().trim().split("\n");
  for (const line of lines) {
    if (line.trim()) {
      console.error(`\x1b[31m[SERVER ERR]\x1b[0m ${line}`);
    }
  }
});

// 2. Spawn Frontend Client on Port 1001
const clientProcess = spawn(npmExecutable, ["run", "dev"], {
  cwd: CLIENT_DIR,
  stdio: ["inherit", "pipe", "pipe"],
  shell: isWindows,
  env: { ...process.env, PORT: "1001" },
});

clientProcess.stdout.on("data", (data) => {
  const lines = data.toString().trim().split("\n");
  for (const line of lines) {
    if (line.trim()) {
      console.log(`\x1b[36m[CLIENT]\x1b[0m ${line}`);
    }
  }
});

clientProcess.stderr.on("data", (data) => {
  const lines = data.toString().trim().split("\n");
  for (const line of lines) {
    if (line.trim()) {
      console.error(`\x1b[33m[CLIENT ERR]\x1b[0m ${line}`);
    }
  }
});

// Graceful Cleanup on Exit
function cleanup() {
  console.log("\n\x1b[33m[RUNNER] Shutting down Server and Client...\x1b[0m");
  try {
    if (isWindows) {
      if (serverProcess.pid) spawn("taskkill", ["/pid", serverProcess.pid.toString(), "/f", "/t"]);
      if (clientProcess.pid) spawn("taskkill", ["/pid", clientProcess.pid.toString(), "/f", "/t"]);
    } else {
      serverProcess.kill("SIGTERM");
      clientProcess.kill("SIGTERM");
    }
  } catch {
    // Ignore cleanup errors
  }
  process.exit(0);
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
