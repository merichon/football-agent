import { execFileSync } from "node:child_process";

const isWindows = process.platform === "win32";

const steps = [
  ["npm", ["run", "test:all"]],
  ["npx", ["tsc", "--noEmit"]],
  ["npm", ["run", "build:web:pages"]]
];

for (const [command, args] of steps) {
  console.log(`\n> ${command} ${args.join(" ")}`);
  if (isWindows) {
    execFileSync(process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", [command, ...args].join(" ")], { stdio: "inherit" });
  } else {
    execFileSync(command, args, { stdio: "inherit" });
  }
}

console.log("\nRelease check complete. Run npm audit and manual mobile smoke tests before store submission.");
