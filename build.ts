import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, normalize } from 'path';
import { fileURLToPath } from 'url';

import { getHtml } from './ast-jsx.ts';
import { injectScriptBeforeClosingTag } from './ast-html.ts';

const ENTRY_FILE = 'src/index.tsx';
const OUTPUT_DIR = 'dist';

function getEntry(): string {
  const content = readFileSync(ENTRY_FILE, 'utf-8');
  return getHtml(content) || "";
}

function injectHMRClient(html: string): string {
  const hmrScript = `const ws = new WebSocket('ws://' + location.host);
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === 'rebuild') location.reload();
    };`;
  return injectScriptBeforeClosingTag(html, hmrScript, 'body');
}

export async function build(dev: boolean = false): Promise<void> {
  let homeHtml = getEntry();

  if (dev) {
    homeHtml = injectHMRClient(homeHtml);
  }

  const normalizedOutputDir = normalize(OUTPUT_DIR);
  mkdirSync(normalizedOutputDir, { recursive: true });

  const outputPath = join(normalizedOutputDir, 'index.html');
  writeFileSync(outputPath, `<!DOCTYPE html>${homeHtml}`);
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  const dev = process.argv.includes('--dev');
  await build(dev);
}
