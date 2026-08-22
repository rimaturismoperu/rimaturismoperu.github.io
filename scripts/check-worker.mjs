import worker from "../worker/worker.js";

const encoder = new TextEncoder();
const password = "Prueba-Segura-2026";
const secret = "secreto-de-prueba-con-suficiente-longitud";
const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
const bits = new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(`password:${password}`)));
const b64url = (bytes) => Buffer.from(bytes).toString("base64url");
const env = {
  ADMIN_EMAIL: "panel@rimaturismo.pe",
  ADMIN_PASSWORD_HASH: `hmac-sha256$${b64url(bits)}`,
  SESSION_SECRET: secret,
  GITHUB_TOKEN: "token-de-prueba",
  REPO_OWNER: "rimaturismoperu",
  REPO_NAME: "rimaturismoperu.github.io",
  BRANCH: "main",
  ALLOWED_ORIGIN: "https://rimaturismo-peru.pages.dev",
  PUBLIC_SITE_URL: "https://rimaturismo-peru.pages.dev",
};

const allowedOrigin = { Origin: env.ALLOWED_ORIGIN, "Content-Type": "application/json" };
const health = await worker.fetch(new Request("https://panel.example/api/health", { headers: allowedOrigin }), env);
if (health.status !== 200 || !(await health.json()).ok) throw new Error("Falló la comprobación de salud del Worker.");

const forbidden = await worker.fetch(new Request("https://panel.example/api/health", { headers: { Origin: "https://sitio-ajeno.example" } }), env);
if (forbidden.status !== 403) throw new Error("El Worker no bloqueó un origen ajeno.");

const wrong = await worker.fetch(new Request("https://panel.example/api/login", { method: "POST", headers: allowedOrigin, body: JSON.stringify({ email: env.ADMIN_EMAIL, password: "incorrecta" }) }), env);
if (wrong.status !== 401) throw new Error("El Worker aceptó una contraseña incorrecta.");

const correct = await worker.fetch(new Request("https://panel.example/api/login", { method: "POST", headers: allowedOrigin, body: JSON.stringify({ email: env.ADMIN_EMAIL, password }) }), env);
const session = await correct.json();
if (correct.status !== 200 || !session.token) throw new Error("El Worker no creó una sesión válida.");

const originalFetch = globalThis.fetch;
let uploadedPath = "";
globalThis.fetch = async (url, options = {}) => {
  const address = String(url);
  if (address.includes("/contents/data/content.json")) {
    const content = Buffer.from(JSON.stringify({ site: { email: "panel@rimaturismo.pe" }, tours: [] })).toString("base64");
    return new Response(JSON.stringify({ content }), { status: 200, headers: { "Content-Type": "application/json" } });
  }
  if (address.includes("/contents/assets/uploads/") && options.method === "PUT") {
    uploadedPath = address;
    return new Response(JSON.stringify({ content: { sha: "foto" } }), { status: 201, headers: { "Content-Type": "application/json" } });
  }
  return new Response(JSON.stringify({ message: "Ruta simulada no encontrada" }), { status: 404, headers: { "Content-Type": "application/json" } });
};

try {
  const authenticatedHeaders = { ...allowedOrigin, Authorization: `Bearer ${session.token}` };
  const contentResponse = await worker.fetch(new Request("https://panel.example/api/content", { headers: authenticatedHeaders }), env);
  const content = await contentResponse.json();
  if (contentResponse.status !== 200 || content.state.site.baseUrl !== env.PUBLIC_SITE_URL) throw new Error("El panel no aplicó la dirección pública al SEO.");

  const imageResponse = await worker.fetch(new Request("https://panel.example/api/image", {
    method: "POST",
    headers: authenticatedHeaders,
    body: JSON.stringify({ path: "assets/uploads/prueba.webp", base64: "AA==" }),
  }), env);
  if (imageResponse.status !== 200 || !uploadedPath.endsWith("/contents/assets/uploads/prueba.webp")) throw new Error("Falló la carga segura de imágenes.");
} finally {
  globalThis.fetch = originalFetch;
}

console.log("Pruebas del panel correctas: origen, contraseña, sesión, SEO y carga de imágenes verificados.");
