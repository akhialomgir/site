import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync, cpSync } from "fs";
import { join, relative, dirname } from "path";

const compsDir = "./components";
const srcDir = "./src"
const outDir = "./dist";

mkdirSync(outDir, { recursive: true });

const comps: Record<string, string> = {};

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
      comps[componentName] = readFileSync(fullpath, "utf8").trim();
    }
  }
}
getComponents();

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
      for (const name in comps) {
        const tag = new RegExp(`<${name}\\s*/>`, "g");
        content = content.replace(tag, comps[name]);
      }
      writeFileSync(outputPath, content);
    }
  }
}
embedComponents()

if (existsSync("./assets")) {
  cpSync("./assets", join(outDir, "assets"), { recursive: true });
}

