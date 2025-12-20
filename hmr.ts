import { createServer } from 'http';
import { watch, readFileSync, existsSync, statSync } from 'fs';
import { extname, join } from 'path';
import { exec } from 'child_process';

const PORT = 3000;
const DIST_DIR = './dist';
const SITE_PREFIX = '/site';

let isBuilding = false;
let pendingBuild = false;

function build() {
  isBuilding = true;
  exec('npx ts-node build.ts --dev', (error, stdout, stderr) => {
    isBuilding = false;
    if (error) {
      console.error('❌ Build failed:', error.message);
      if (stderr) console.error('stderr:', stderr);
    } else {
      if (stdout.trim()) console.log(stdout);
    }
    if (pendingBuild) {
      pendingBuild = false;
      build();
    }
  });
}

function setupWatchers() {
  const dirsToWatch = ['./src', './components'];

  dirsToWatch.forEach(dir => {
    if (!existsSync(dir)) {
      console.warn(`⚠️  Directory does not exist: ${dir}`);
      return;
    }

    watch(dir, { recursive: true }, (eventType, filename) => {
      if (!filename || filename.endsWith('~')) return;

      console.log(`📁 ${dir}/${filename} ${eventType === 'change' ? 'modified' : eventType}`);
      if (!isBuilding) build();
      else pendingBuild = true;
    });

    console.log(`👀 Start watching: ${dir}`);
  });
}

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

createServer((req, res) => {
  let requestPath = req.url === '/' ? '/index.html' : req.url;

  // remove github prefix
  if (requestPath.startsWith(SITE_PREFIX)) {
    requestPath = requestPath.substring(SITE_PREFIX.length);
    if (requestPath === '') {
      requestPath = '/index.html';
    }
  }

  // map to file path
  const filePath = join(DIST_DIR, requestPath);

  console.log(`req: ${req.url} → ${filePath}`); // debug log

  const ext = extname(filePath);

  if (existsSync(filePath)) {
    try {
      const content = readFileSync(filePath);
      const stats = statSync(filePath);
      res.writeHead(200, {
        'Content-Type': MIME_TYPES[ext] || 'text/plain',
        'Cache-Control': 'no-cache',
        'Last-Modified': stats.mtime.toUTCString(),
        'ETag': `W/"${stats.size}-${stats.mtime.getTime()}"`
      });
      res.end(content);
    } catch (err) {
      res.writeHead(500);
      res.end('Server Error');
    }
  } else {
    res.writeHead(404);
    res.end('File Not Found');
  }
}).listen(PORT, () => {
  console.log(`🚀 dev server: http://localhost:${PORT}${SITE_PREFIX}`);
  setupWatchers();
  build();
});
