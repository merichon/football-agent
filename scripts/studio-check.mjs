import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const isWindows = process.platform === "win32";

const requiredDocs = [
  "docs/STUDIO_OPERATING_SYSTEM.md",
  "docs/PROFESSIONALIZATION.md",
  "docs/DATA_PACKS_MODS_SECURITY.md",
  "docs/GOOGLE_CLOUD_BACKEND_BLUEPRINT.md",
  "docs/LIVEOPS_MARKETING_RELEASE.md",
  "docs/ART_DIRECTION.md",
  "docs/AUDIO_DIRECTION.md",
  "docs/ASSET_LICENSES.md",
  "docs/RESEARCH_SOURCES.md"
];

const requiredAssetDirs = [
  "assets/art/ui",
  "assets/art/badges",
  "assets/art/backgrounds",
  "assets/art/icons",
  "assets/audio/music",
  "assets/audio/sfx",
  "assets/audio/ambience"
];

const forbiddenSecretPatterns = [
  /AIza[0-9A-Za-z_-]{20,}/,
  /-----BEGIN PRIVATE KEY-----/,
  /sk-[A-Za-z0-9_-]{20,}/,
  /ghp_[A-Za-z0-9_]{20,}/
];

function run(command, args) {
  console.log(`\n> ${command} ${args.join(" ")}`);
  if (isWindows) {
    execFileSync(process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", [command, ...args].join(" ")], { stdio: "inherit" });
  } else {
    execFileSync(command, args, { stdio: "inherit" });
  }
}

function fail(message) {
  console.error(`\n[studio-check] ${message}`);
  process.exit(1);
}

for (const doc of requiredDocs) {
  if (!existsSync(doc)) fail(`Missing required studio doc: ${doc}`);
}

for (const dir of requiredAssetDirs) {
  if (!existsSync(dir)) fail(`Missing required asset pipeline folder: ${dir}`);
}

const envExample = existsSync(".env.example") ? readFileSync(".env.example", "utf8") : "";
if (!envExample.includes("replace-on-backend-only")) {
  fail(".env.example must keep backend secrets as placeholders.");
}

const scannedFiles = [
  ".env.example",
  "src/game/platformServices.js",
  "docs/GOOGLE_CLOUD_BACKEND_BLUEPRINT.md"
];

for (const file of scannedFiles) {
  if (!existsSync(file)) continue;
  const body = readFileSync(file, "utf8");
  for (const pattern of forbiddenSecretPatterns) {
    if (pattern.test(body)) fail(`Potential secret-like value found in ${file}.`);
  }
}

const platformServices = readFileSync("src/game/platformServices.js", "utf8");
[
  "buildGoogleCloudReadinessPlan",
  "validateGoogleBackendConfig",
  "createCloudSyncAdapter",
  "buildAiNarratorProxyPayload",
  "validateRemoteConfig"
].forEach((symbol) => {
  if (!platformServices.includes(symbol)) fail(`Missing platform boundary: ${symbol}`);
});

run("npm", ["run", "test:all"]);
run("npx", ["tsc", "--noEmit"]);

console.log("\nStudio check complete. For release candidates, also run npm run build:web:pages and a browser smoke test.");
