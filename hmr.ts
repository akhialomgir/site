import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import { join } from 'path';
import chokidar from 'chokidar';
import { WebSocketServer } from 'ws';

import { build } from './build.ts';

type FileEvent = 'add' | 'change' | 'unlink' | 'addDir' | 'unlinkDir';

let wsClients: Set<any> = new Set();

function broadcastHMR(message: Record<string, any>) {
  wsClients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(JSON.stringify(message));
    }
  });
}

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
    await build(true);
    broadcastHMR({ type: 'rebuild' });
  }
}

async function createDevServer() {
  const server = createServer((_, res) => {
    const html = readFileSync(join(process.cwd(), 'dist/index.html'), 'utf-8');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  });

  const wss = new WebSocketServer({ server });
  wss.on('connection', (ws) => {
    wsClients.add(ws);
    ws.on('close', () => wsClients.delete(ws));
  });

  server.listen(3000);
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  console.log('building...');
  await build(true);
  console.log('build complete');

  await createDevServer();
  console.log('[hmr] server: http://localhost:3000');
  console.log('[hmr] ws: ws://localhost:3000');

  createWatcher(join(process.cwd(), 'src'));
}
