import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, normalize } from 'path';

const ENTRY_FILE = 'src/index.tsx';
const OUTPUT_DIR = 'dist';

function build() {
  const content = readFileSync(ENTRY_FILE, 'utf-8');
  const html = content.match(/return\s*\(\s*<html>[\s\S]*<\/html>\s*\)/)?.[0]
    ?.replace(/^return\s*\(\s*|\s*\)$/g, '') || '';

  const normalizedOutputDir = normalize(OUTPUT_DIR);
  mkdirSync(normalizedOutputDir, { recursive: true });

  const outputPath = join(normalizedOutputDir, 'index.html');
  writeFileSync(outputPath, `<!DOCTYPE html>${html}`);
}

build();
