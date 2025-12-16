import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync, cpSync } from "fs";
import { join, relative, dirname } from "path";

const compsDir = "./components";
const srcDir = "./src"
const outDir = "./dist";

mkdirSync(outDir, { recursive: true });

type ComponentsMap = Record<string, [string, string]>;
const comps: ComponentsMap = {};

// inject meta
function injectMeta(html: string): string {
  const metaContent = comps['Meta']?.[0] || '';

  return html.replace('</head>', metaContent + '\n</head>');
}

// turn relative paths to absolute paths
function addHrefPrefix(html: string) {
  return html.replace(/href="([^#][^"]*)"/g, (match, url: string) => {
    if (url.startsWith('http') || url.startsWith('/') || url.startsWith('#')) {
      return match;
    }
    return `href="/site/${url}"`
  })
}

// get comps
function getComponents(currentDir = compsDir, baseDir = compsDir, prefix = '') {
  const items = readdirSync(currentDir, { withFileTypes: true });

  for (const item of items) {
    const fullpath = join(currentDir, item.name);

    if (item.isDirectory()) {
      const nextPrefix = prefix + item.name + '-';
      getComponents(fullpath, baseDir, nextPrefix);
    } else if (item.isFile() && item.name.endsWith(".html")) {
      const nameWithoutExt = item.name.replace(/\.html$/, '');
      const componentName = prefix ? `${prefix}-${nameWithoutExt}` : nameWithoutExt;
      const content = readFileSync(fullpath, "utf8");
      const htmlMatch = content.match(/^<>\s*\n(.*?)\n<\/>\s*/s);
      const styleMatch = content.match(/<style>(.*?)<\/style>/s);
      comps[componentName] = [
        htmlMatch ? htmlMatch[1].trim() : '',
        styleMatch ? styleMatch[1].trim() : ''
      ];
    }
  }
}

function replaceComponentsRecursively(content: string, components: ComponentsMap, maxIterations = 99) {
  let result = content;

  for (let i = 0; i < maxIterations; i++) {
    let changed = false;

    for (const [name, [compContent]] of Object.entries(components)) {
      const pattern = new RegExp(`<${name}\\s*/>`, 'g');
      const newResult = result.replace(pattern, compContent);

      if (newResult !== result) {
        changed = true;
        result = newResult;
      }
    }
    if (!changed) break;

    const hasRemainingTags = Object.keys(components).some(name => new RegExp(`<${name}\\s*/>`).test(result));
    if (!hasRemainingTags) break;
  }
  return result;
}

// embed comps
function embedComponents(currentDir = srcDir, baseDir = srcDir, prefix = '') {
  const items = readdirSync(currentDir, { withFileTypes: true });

  for (const item of items) {
    const fullpath = join(currentDir, item.name);

    if (item.isDirectory()) {
      const nextPrefix = prefix + item.name + '-';
      embedComponents(fullpath, baseDir, nextPrefix);
    } else if (item.isFile() && item.name.endsWith(".html")) {
      const relativePath = relative(baseDir, fullpath);
      const outputPath = join(outDir, relativePath);
      const outputDir = dirname(outputPath);

      if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
      }

      let content = readFileSync(fullpath, "utf8");

      content = replaceComponentsRecursively(content, comps);

      content = injectMeta(content);
      content = addHrefPrefix(content);

      const styles = Object.keys(comps).map(n => comps[n][1]).filter(Boolean).join('\n');
      if (styles && content.includes('</head>')) {
        content = content.replace('</head>', `<style>\n${styles}\n</style>\n</head>`);
      }

      writeFileSync(outputPath, content);
    }
  }
}

getComponents();
embedComponents()

if (existsSync("./assets")) {
  cpSync("./assets", join(outDir, "assets"), { recursive: true });
}

