// Runs both dev processes together: the backend (Bun, --watch for hot
// reload) and the Vite dev server (frontend, hot reload + the /api and /ws
// proxy to the backend). Ctrl-C, or either process crashing, brings down
// both.

const backendCwd = new URL("../backend", import.meta.url).pathname;
const frontendCwd = new URL("../frontend", import.meta.url).pathname;

const backend = Bun.spawn(["bun", "run", "dev"], {
  cwd: backendCwd,
  stdio: ["inherit", "inherit", "inherit"],
});

const frontend = Bun.spawn(["bun", "run", "dev"], {
  cwd: frontendCwd,
  stdio: ["inherit", "inherit", "inherit"],
});

let shuttingDown = false;
function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  backend.kill();
  frontend.kill();
}

process.on("SIGINT", () => {
  shutdown();
  process.exit(0);
});
process.on("SIGTERM", () => {
  shutdown();
  process.exit(0);
});

// If either process exits on its own (e.g. a crash), bring down the other too
// rather than leaving one dangling.
Promise.race([backend.exited, frontend.exited]).then(() => {
  console.log("\nOne process exited — shutting down the other.");
  shutdown();
  process.exit(1);
});
