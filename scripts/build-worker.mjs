import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const builder = (await readFile(resolve(root, "lib/site-builder.js"), "utf8"))
  .replace(/^export\s+/gm, "");
const worker = (await readFile(resolve(root, "worker/worker.js"), "utf8"))
  .replace(/^import\s+\{[^\n]+\}\s+from\s+"\.\.\/lib\/site-builder\.js";\s*\n/, "");
const banner = `/* Rimaturismo Perú · Worker autónomo generado automáticamente.\n   No coloques contraseñas ni tokens dentro de este archivo. */\n\n`;

await writeFile(resolve(root, "worker/worker-standalone.js"), `${banner}${builder}\n\n${worker}`, "utf8");
console.log("Worker autónomo creado: worker/worker-standalone.js");
