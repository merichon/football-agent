import { createReadStream, existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";

const root = resolve("dist");
const port = Number(process.env.PORT || 8081);

const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml"
};

function safePath(urlPath = "/") {
  const pathname = decodeURIComponent(urlPath.split("?")[0] || "/");
  if (pathname === "/") return join(root, "index.html");
  const clean = normalize(pathname).replace(/^[/\\]+/, "").replace(/^(\.\.[/\\])+/, "");
  const target = resolve(join(root, clean));
  return target.startsWith(root) ? target : join(root, "index.html");
}

const server = createServer(async (req, res) => {
  let target = safePath(req.url || "/");
  if (!existsSync(target)) target = join(root, "index.html");
  const info = await stat(target).catch(() => null);
  if (!info?.isFile()) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }
  res.writeHead(200, { "Content-Type": mime[extname(target)] || "application/octet-stream" });
  createReadStream(target).pipe(res);
});

server.listen(port, () => {
  console.log(`Football Agent dist server running at http://localhost:${port}/`);
});
