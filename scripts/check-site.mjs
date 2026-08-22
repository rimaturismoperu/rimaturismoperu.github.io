import { access, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const state = JSON.parse(await readFile(resolve(root, "data/content.json"), "utf8"));
const errors = [];

if (state.tours.length !== 18) errors.push(`Se esperaban 18 experiencias y existen ${state.tours.length}.`);
if (state.tours.length > 28) errors.push("El catálogo supera el límite seguro del panel gratuito.");
if (new Set(state.tours.map((tour) => tour.slug)).size !== state.tours.length) errors.push("Hay direcciones de tours repetidas.");
const publicTourText = JSON.stringify(state.tours);
if (/\b20\d{2}\b|\b(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b/i.test(publicTourText)) {
  errors.push("El catálogo contiene una fecha o mes que debe retirarse en esta etapa.");
}
for (const tour of state.tours) {
  if (!tour.name || !tour.description || !tour.cardDescription) errors.push(`Falta contenido obligatorio en ${tour.slug}.`);
  if (!tour.schedule) errors.push(`Falta horario en ${tour.slug}.`);
  if ((tour.images || []).length > 8) errors.push(`${tour.slug} supera las 8 fotografías.`);
}

for (const slug of ["semana-santa-en-chacas", "fiesta-patronal-mama-ashu"]) {
  const tour = state.tours.find((item) => item.slug === slug);
  if (!tour || tour.showPrice !== false) errors.push(`${slug} debe mantenerse sin precio visible.`);
  if (tour?.priceLabel || tour?.priceDetail) errors.push(`${slug} conserva información de precio aunque está oculto.`);
  const html = await readFile(resolve(root, `tours/${slug}.html`), "utf8");
  if (/Programa desde S\/320|<span>Tarifa<\/span>/.test(html)) errors.push(`${slug} todavía muestra un precio.`);
}

const pages = ["index.html", "admin/index.html", "setup/generador-credenciales.html", ...state.tours.map((tour) => `tours/${tour.slug}.html`)];
for (const page of pages) {
  const absolute = resolve(root, page);
  const html = await readFile(absolute, "utf8");
  if (!html.includes('name="viewport"')) errors.push(`${page} no tiene configuración adaptable.`);
  const attributes = [...html.matchAll(/\b(?:src|href)="([^"]+)"/g)].map((match) => match[1]);
  for (const reference of attributes) {
    if (/^(?:https?:|mailto:|tel:|data:|#)/.test(reference)) continue;
    const clean = reference.split("#")[0].split("?")[0];
    if (!clean) continue;
    try { await access(resolve(dirname(absolute), clean)); }
    catch { errors.push(`${page} enlaza un archivo inexistente: ${reference}`); }
  }
}

const index = await readFile(resolve(root, "index.html"), "utf8");
if ((index.match(/ADMIN:TOUR-CARDS:START/g) || []).length !== 1 || (index.match(/ADMIN:TOUR-CARDS:END/g) || []).length !== 1) errors.push("Los marcadores del catálogo en index.html no son válidos.");
if (!index.includes("wa-icon")) errors.push("No se encontró el logotipo vectorial de WhatsApp.");
if (!index.includes(`<link rel="canonical" href="${state.site.baseUrl}/"`)) errors.push("La dirección canónica del inicio no coincide con la configuración SEO.");
const robots = await readFile(resolve(root, "robots.txt"), "utf8");
for (const privatePath of ["/admin/", "/setup/", "/data/", "/worker/"]) {
  if (!robots.includes(`Disallow: ${privatePath}`)) errors.push(`robots.txt no protege ${privatePath}.`);
}

const publicStyles = await readFile(resolve(root, "styles.css"), "utf8");
if (!/html,\s*body\s*\{[^}]*overflow-x:\s*(?:clip|hidden)/s.test(publicStyles)) {
  errors.push("La página pública no bloquea el desplazamiento horizontal accidental.");
}
if (!/@media\s*\(max-width:\s*680px\)[\s\S]*?\.tour-grid\s*\{\s*grid-template-columns:\s*1fr/s.test(publicStyles)) {
  errors.push("El catálogo no cambia a una columna en celulares.");
}
if (!/@media\s*\(min-width:\s*1600px\)/.test(publicStyles)) {
  errors.push("Falta la adaptación para pantallas grandes de computadora.");
}

const adminStyles = await readFile(resolve(root, "admin/admin.css"), "utf8");
if (!/body\s*\{[^}]*overflow-x:\s*hidden/s.test(adminStyles)) {
  errors.push("El panel no bloquea el desplazamiento horizontal accidental.");
}
if (!/@media\(max-width:720px\)[\s\S]*?\.dashboard__layout\{display:block\}/s.test(adminStyles)) {
  errors.push("El panel no tiene su diseño especial para celulares.");
}

if (errors.length) {
  console.error(`Pruebas fallidas (${errors.length}):\n- ${errors.join("\n- ")}`);
  process.exitCode = 1;
} else {
  console.log(`Pruebas correctas: ${pages.length} páginas, ${state.tours.length} experiencias y enlaces locales verificados.`);
}
