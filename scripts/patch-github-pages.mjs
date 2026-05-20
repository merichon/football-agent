import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const distDir = fileURLToPath(new URL("../dist/", import.meta.url));

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walk(path));
    } else {
      files.push(path);
    }
  }
  return files;
}

async function patchTextFile(path) {
  const original = await readFile(path, "utf8");
  let patched = original
    .replaceAll('href="/_expo', 'href="./_expo')
    .replaceAll('href="/assets', 'href="./assets')
    .replaceAll('src="/_expo', 'src="./_expo')
    .replaceAll('src="/assets', 'src="./assets')
    .replaceAll('"/assets/assets', '"./assets/assets')
    .replaceAll('httpServerLocation:"/assets', 'httpServerLocation:"./assets')
    .replaceAll("httpServerLocation:'/assets", "httpServerLocation:'./assets")
    .replaceAll('href="../_expo/', 'href="./_expo/')
    .replaceAll('src="../_expo/', 'src="./_expo/')
    .replaceAll('href="./_expo\\', 'href="./_expo/')
    .replaceAll('src="./_expo\\', 'src="./_expo/')
    .replaceAll("\\static\\", "/static/")
    .replaceAll("\\css\\", "/css/")
    .replaceAll("\\js\\", "/js/");

  if (patched !== original) {
    await writeFile(path, patched, "utf8");
  }
}

try {
  await stat(distDir);
} catch {
  throw new Error("dist klasoru bulunamadi. Once `npm run build:web` calistir.");
}

const files = await walk(distDir);
for (const file of files) {
  if (/\.(html|js|css|json)$/.test(file)) {
    await patchTextFile(file);
  }
}

await writeFile(join(distDir, ".nojekyll"), "", "utf8");
console.log("GitHub Pages paths patched in dist/ and .nojekyll added.");
