import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync, cpSync } from "fs";
import { join, relative, dirname } from "path";

const compsDir = "./components";
const srcDir = "./src"
const outDir = "./dist";

mkdirSync(outDir, { recursive: true });

const comps: Record<string, [string, string]> = {};

// inject meta
function injectMeta(html: string): string {
  const metaContent = comps['Meta']?.[0] || '';

  const headEnd = html.indexOf('</head>');
  const headContent = html.substring(0, headEnd);

  if (headContent.includes('<style')) {
    const styleIndex = headContent.indexOf('<style');
    return html.substring(0, styleIndex) +
      metaContent + '\n' +
      html.substring(styleIndex);
  }

  return html.replace('</head>', metaContent + '\n</head>');
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

      Object.keys(comps).forEach(name => {
        const tag = new RegExp(`<${name}\\s*/>`, "g");
        if (tag.test(content)) content = content.replace(tag, comps[name][0]);
      });

      content = injectMeta(content);

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

