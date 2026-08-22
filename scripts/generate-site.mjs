import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { buildAll } from "../lib/site-builder.js";

const root = resolve(import.meta.dirname, "..");
const state = JSON.parse(await readFile(resolve(root, "data/content.json"), "utf8"));
const indexTemplate = await readFile(resolve(root, "index.html"), "utf8");
const { files } = buildAll(indexTemplate, state);

await Promise.all(Object.entries(files).map(([path, content]) => writeFile(resolve(root, path), content, "utf8")));
console.log(`Sitio generado: ${state.tours.length} experiencias y ${Object.keys(files).length} archivos actualizados.`);
