import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

const compsDir = "./components";
const outDir = "./dist";

if (!existsSync(outDir)) mkdirSync(outDir);

const comps: Record<string, string> = {};

for (const file of readdirSync(compsDir)) {
  if (file.endsWith(".html")) {
    const name = file.replace(".html", "");
    comps[name] = readFileSync(join(compsDir, file), "utf8").trim();
  }
}

for (const file of readdirSync(".")) {
  if (file.endsWith(".html")) {
    let content = readFileSync(file, "utf8");
    for (const name in comps) {
      const tag = new RegExp(`<${name}\\s*/>`, "g");
      content = content.replace(tag, comps[name]);
    }
    writeFileSync(join(outDir, file), content);
  }
}

