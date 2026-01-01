import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import { join } from 'path';
import chokidar from 'chokidar';

import { build } from './build.ts';

type FileEvent = 'add' | 'change' | 'unlink' | 'addDir' | 'unlinkDir';

//TODO Create a websocket to refresh the browser on file changes

function createWatcher(rootDir: string) {
  const watcher = chokidar.watch(rootDir, {
    ignoreInitial: true,
    ignored: /(node_modules|\.git|dist)/,
  });
  watcher.on('all', (event, filePath) => {
    void onFileChange(event as FileEvent, filePath);
  });
  watcher.on('error', (err) => {
    console.log('[watcher] error:', err);
  })
  console.log(`[watcher] watching ${rootDir}`);
  return watcher;
}

async function onFileChange(event: FileEvent, filePath: string) {
  console.log(`[watcher] event=${event} path=${filePath}`);
  if (event === 'change' || event === 'add' || event === 'unlink') {
    await build();
  }
}


if (fileURLToPath(import.meta.url) === process.argv[1]) {
  console.log('building...');
  build();
  console.log('build complete');

  const server = createServer((_, res) => {
    const html = readFileSync(join(process.cwd(), 'dist/index.html'), 'utf-8');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  });
  server.listen(3000);
  console.log('[hmr] server: http://localhost:3000');
  createWatcher(join(process.cwd(), 'src'));
}
