import { spawn } from "node:child_process";

const commands = [
  ["api", "npm", ["run", "api:dev"]],
  ["web", "npm", ["run", "dev:web"]],
];

const children = commands.map(([name, command, args]) => {
  const child = spawn(command, args, {
    stdio: "inherit",
    shell: true,
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      return;
    }

    process.exitCode = code ?? 0;
    stopChildren();
  });

  return { name, child };
});

const stopChildren = () => {
  for (const { child } of children) {
    if (!child.killed) {
      child.kill("SIGTERM");
    }
  }
};

process.on("SIGINT", () => {
  stopChildren();
  process.exit(130);
});

process.on("SIGTERM", () => {
  stopChildren();
  process.exit(143);
});
