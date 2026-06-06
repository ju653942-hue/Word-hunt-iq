/**
 * Production static server for Expo web export.
 *
 * Serves the output of `expo export --platform web` (dist/) as a SPA:
 * - Known static assets (.js, .css, images, fonts) served directly
 * - Everything else falls back to index.html (client-side routing)
 *
 * Zero external dependencies — uses only Node.js built-ins.
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

const STATIC_ROOT = path.resolve(__dirname, "..", "dist");
const INDEX_HTML  = path.join(STATIC_ROOT, "index.html");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js":   "application/javascript; charset=utf-8",
  ".mjs":  "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css":  "text/css; charset=utf-8",
  ".png":  "image/png",
  ".jpg":  "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif":  "image/gif",
  ".svg":  "image/svg+xml",
  ".ico":  "image/x-icon",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2":"font/woff2",
  ".ttf":  "font/ttf",
  ".otf":  "font/otf",
  ".map":  "application/json",
  ".txt":  "text/plain",
};

function serveFile(filePath, res, statusCode = 200) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";
  const content = fs.readFileSync(filePath);
  res.writeHead(statusCode, {
    "content-type": contentType,
    "cache-control": ext === ".html"
      ? "no-cache, no-store, must-revalidate"
      : "public, max-age=31536000, immutable",
  });
  res.end(content);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);
  const rawPath = url.pathname;

  // Strip any base path prefix
  const basePath = (process.env.BASE_PATH || "/").replace(/\/+$/, "");
  const pathname = basePath && rawPath.startsWith(basePath)
    ? rawPath.slice(basePath.length) || "/"
    : rawPath;

  // Resolve to a file inside STATIC_ROOT
  const safePath = path.normalize(pathname).replace(/^(\.\.(\/|\\|$))+/, "");
  const filePath = path.join(STATIC_ROOT, safePath);

  // Security: never escape STATIC_ROOT
  if (!filePath.startsWith(STATIC_ROOT)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  // Serve the exact file if it exists
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    serveFile(filePath, res);
    return;
  }

  // Directory: try index.html inside it
  const dirIndex = path.join(filePath, "index.html");
  if (fs.existsSync(dirIndex)) {
    serveFile(dirIndex, res);
    return;
  }

  // SPA fallback: serve root index.html for client-side routing
  if (fs.existsSync(INDEX_HTML)) {
    serveFile(INDEX_HTML, res);
    return;
  }

  res.writeHead(404, { "content-type": "text/plain" });
  res.end("Not Found");
});

const port = parseInt(process.env.PORT || "3000", 10);
server.listen(port, "0.0.0.0", () => {
  console.log(`Serving Expo web build from dist/ on port ${port}`);
});
