import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, normalize } from 'path';
import { fileURLToPath } from 'url';

import { getHtml } from './ast.ts';

const ENTRY_FILE = 'src/index.tsx';
const OUTPUT_DIR = 'dist';

function getEntry(): string {
  const content = readFileSync(ENTRY_FILE, 'utf-8');
  return getHtml(content) || "";
}

export async function build(): Promise<void> {
  const homeHtml = getEntry();

  const normalizedOutputDir = normalize(OUTPUT_DIR);
  mkdirSync(normalizedOutputDir, { recursive: true });

  const outputPath = join(normalizedOutputDir, 'index.html');
  writeFileSync(outputPath, `<!DOCTYPE html>${homeHtml}`);
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  await build();
}
