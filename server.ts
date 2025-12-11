import { readdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const comps: Record<string, string> = {};
const dir = "./components";

for (const file of readdirSync(dir)) {
  if (!file.endsWith(".html")) continue;
  const name = file.replace(".html", "");
  comps[name] = readFileSync(join(dir, file), "utf8").trim();
}

for (const file of readdirSync(".")) {
  if (!file.endsWith(".html")) continue;

  let content = readFileSync(file, "utf8");
  for (const name in comps) {
    const tag = new RegExp(`<${name}\\s*/>`, "g");
    content = content.replace(tag, comps[name]);
  }

  writeFileSync(file, content);
}
