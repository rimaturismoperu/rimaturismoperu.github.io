import { buildAll, normalizeState } from "../lib/site-builder.js";

const encoder = new TextEncoder();
const loginAttempts = new Map();
const MAX_BODY_BYTES = 2 * 1024 * 1024;
const MAX_IMAGE_BODY_BYTES = 1_100_000;
const MAX_TOURS = 28;
const SESSION_SECONDS = 8 * 60 * 60;

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const cors = corsHeaders(origin, env);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

    try {
      verifyConfiguration(env);
      const allowedOrigin = String(env.ALLOWED_ORIGIN || "").replace(/\/$/, "");
      if (origin && origin.replace(/\/$/, "") !== allowedOrigin) {
        throw httpError(403, "Origen no autorizado.");
      }
      const url = new URL(request.url);
      if (url.pathname === "/api/health" && request.method === "GET") return json({ ok: true }, 200, cors);
      if (url.pathname === "/api/login" && request.method === "POST") return await login(request, env, cors);
      const session = await requireSession(request, env);
      if (url.pathname === "/api/content" && request.method === "GET") {
        const state = normalizeState(JSON.parse(await getRepoText(env, "data/content.json")));
        state.site.baseUrl = publicSiteUrl(env);
        return json({ state, adminEmail: session.email }, 200, cors);
      }
      if (url.pathname === "/api/image" && request.method === "POST") return await uploadImage(request, env, cors);
      if (url.pathname === "/api/publish" && request.method === "POST") return await publish(request, env, cors);
      return json({ error: "Ruta no encontrada." }, 404, cors);
    } catch (error) {
      const status = Number(error.status) || 500;
      const message = status >= 500 ? "El servicio no pudo completar la operación. Revisa la configuración del panel." : error.message;
      if (status >= 500) console.error(error);
      return json({ error: message }, status, cors);
    }
  },
};

function verifyConfiguration(env) {
  const required = ["ADMIN_EMAIL", "ADMIN_PASSWORD_HASH", "SESSION_SECRET", "GITHUB_TOKEN", "REPO_OWNER", "REPO_NAME", "BRANCH", "ALLOWED_ORIGIN", "PUBLIC_SITE_URL"];
  const missing = required.filter((name) => !env[name]);
  if (missing.length) throw httpError(500, `Configuración incompleta: ${missing.join(", ")}`);
  publicSiteUrl(env);
}

function publicSiteUrl(env) {
  let url;
  try { url = new URL(String(env.PUBLIC_SITE_URL || "")); }
  catch { throw httpError(500, "PUBLIC_SITE_URL no contiene una dirección válida."); }
  if (url.protocol !== "https:" || url.pathname !== "/" || url.search || url.hash) {
    throw httpError(500, "PUBLIC_SITE_URL debe ser la dirección https principal del sitio, sin rutas adicionales.");
  }
  return url.origin;
}

function corsHeaders(origin, env) {
  const allowed = String(env?.ALLOWED_ORIGIN || "").replace(/\/$/, "");
  const normalized = origin.replace(/\/$/, "");
  return {
    "Access-Control-Allow-Origin": normalized && normalized === allowed ? origin : allowed,
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
    "Cache-Control": "no-store",
    "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
    "X-Content-Type-Options": "nosniff",
  };
}

function json(value, status, headers = {}) {
  return new Response(JSON.stringify(value), { status, headers: { ...headers, "Content-Type": "application/json; charset=utf-8" } });
}

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function readJson(request, maximum = MAX_BODY_BYTES) {
  const length = Number(request.headers.get("Content-Length") || 0);
  if (length > maximum) throw httpError(413, "La carga es demasiado grande.");
  const text = await request.text();
  if (text.length > maximum) throw httpError(413, "La carga es demasiado grande.");
  try { return JSON.parse(text); } catch { throw httpError(400, "Los datos recibidos no son válidos."); }
}

async function login(request, env, cors) {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const now = Date.now();
  const attempt = loginAttempts.get(ip) || { count: 0, start: now };
  if (now - attempt.start > 15 * 60 * 1000) { attempt.count = 0; attempt.start = now; }
  if (attempt.count >= 8) throw httpError(429, "Demasiados intentos. Espera 15 minutos antes de volver a intentar.");

  const body = await readJson(request);
  const emailMatches = constantTimeEqual(String(body.email || "").trim().toLowerCase(), String(env.ADMIN_EMAIL).trim().toLowerCase());
  const passwordMatches = await verifyPassword(String(body.password || ""), env.ADMIN_PASSWORD_HASH, env.SESSION_SECRET);
  if (!emailMatches || !passwordMatches) {
    attempt.count += 1;
    loginAttempts.set(ip, attempt);
    throw httpError(401, "Correo o contraseña incorrectos.");
  }
  loginAttempts.delete(ip);
  const token = await createSession({ email: String(env.ADMIN_EMAIL).trim().toLowerCase(), exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS }, env.SESSION_SECRET);
  return json({ token, expiresIn: SESSION_SECONDS }, 200, cors);
}

async function verifyPassword(password, stored, secret) {
  const parts = String(stored || "").split("$");
  if (parts.length !== 2 || parts[0] !== "hmac-sha256") return false;
  const expected = parts[1];
  const calculated = await sign(`password:${password}`, secret);
  return constantTimeEqual(calculated, expected);
}

async function createSession(payload, secret) {
  const encoded = bytesToBase64Url(encoder.encode(JSON.stringify(payload)));
  const signature = await sign(encoded, secret);
  return `${encoded}.${signature}`;
}

async function requireSession(request, env) {
  const auth = request.headers.get("Authorization") || "";
  if (!auth.startsWith("Bearer ")) throw httpError(401, "La sesión no es válida. Vuelve a ingresar.");
  const [encoded, provided] = auth.slice(7).split(".");
  if (!encoded || !provided) throw httpError(401, "La sesión no es válida. Vuelve a ingresar.");
  const expected = await sign(encoded, env.SESSION_SECRET);
  if (!constantTimeEqual(provided, expected)) throw httpError(401, "La sesión no es válida. Vuelve a ingresar.");
  let payload;
  try { payload = JSON.parse(new TextDecoder().decode(base64UrlToBytes(encoded))); } catch { throw httpError(401, "La sesión no es válida. Vuelve a ingresar."); }
  if (payload.exp < Math.floor(Date.now() / 1000) || payload.email !== String(env.ADMIN_EMAIL).trim().toLowerCase()) throw httpError(401, "La sesión venció. Vuelve a ingresar.");
  return payload;
}

async function sign(value, secret) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return bytesToBase64Url(new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value))));
}

function constantTimeEqual(a, b) {
  const left = encoder.encode(a);
  const right = encoder.encode(b);
  return constantTimeBytes(left, right);
}

function constantTimeBytes(left, right) {
  let diff = left.length ^ right.length;
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    const leftByte = left.length ? left[index % left.length] : 0;
    const rightByte = right.length ? right[index % right.length] : 0;
    diff |= leftByte ^ rightByte;
  }
  return diff === 0;
}

function bytesToBase64Url(bytes) {
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function base64UrlToBytes(value) {
  return base64ToBytes(value.replaceAll("-", "+").replaceAll("_", "/"));
}

function base64ToBytes(value) {
  const padded = value + "=".repeat((4 - value.length % 4) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function publish(request, env, cors) {
  const body = await readJson(request);
  if (!body.state || !Array.isArray(body.state.tours)) throw httpError(400, "El catálogo recibido no es válido.");
  if (body.state.tours.length > MAX_TOURS) throw httpError(400, `El plan gratuito admite hasta ${MAX_TOURS} experiencias en este panel.`);
  const state = normalizeState(body.state);
  state.site.baseUrl = publicSiteUrl(env);
  if (!/^51\d{9}$/.test(state.site.whatsapp)) throw httpError(400, "El WhatsApp debe tener 11 dígitos y comenzar con 51.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.site.email)) throw httpError(400, "El correo electrónico no es válido.");
  if (!state.tours.length) throw httpError(400, "Debe existir al menos una experiencia.");

  const [oldText, indexTemplate] = await Promise.all([getRepoText(env, "data/content.json"), getRepoText(env, "index.html")]);
  const oldState = normalizeState(JSON.parse(oldText));
  const { files } = buildAll(indexTemplate, state);
  const head = await github(env, `/git/ref/heads/${encodeURIComponent(env.BRANCH)}`);
  const headSha = head.object.sha;
  const commit = await github(env, `/git/commits/${headSha}`);
  const tree = await github(env, `/git/trees/${commit.tree.sha}?recursive=1`);
  const existing = new Map((tree.tree || []).filter((item) => item.type === "blob").map((item) => [item.path, item.sha]));

  const textEntries = await mapLimit(Object.entries(files), 5, async ([path, content]) => {
    const blob = await github(env, "/git/blobs", { method: "POST", body: { content, encoding: "utf-8" } });
    return { path, mode: "100644", type: "blob", sha: blob.sha };
  });
  const entries = [...textEntries];

  const newTours = new Set(state.tours.map((tour) => tour.slug));
  oldState.tours.filter((tour) => !newTours.has(tour.slug)).forEach((tour) => {
    const path = `tours/${tour.slug}.html`;
    if (existing.has(path)) entries.push({ path, mode: "100644", type: "blob", sha: null });
  });
  const newImages = new Set(state.tours.flatMap((tour) => tour.images.map((image) => image.path)));
  const oldManagedImages = new Set(oldState.tours.flatMap((tour) => tour.images.map((image) => image.path)).filter((path) => /^(?:assets\/uploads\/|assets\/tours\/)/.test(path)));
  oldManagedImages.forEach((path) => { if (!newImages.has(path) && existing.has(path)) entries.push({ path, mode: "100644", type: "blob", sha: null }); });
  existing.forEach((_sha, path) => {
    if (path.startsWith("assets/uploads/") && !newImages.has(path) && !entries.some((entry) => entry.path === path)) {
      entries.push({ path, mode: "100644", type: "blob", sha: null });
    }
  });

  const newTree = await github(env, "/git/trees", { method: "POST", body: { base_tree: commit.tree.sha, tree: entries } });
  const newCommit = await github(env, "/git/commits", { method: "POST", body: { message: `Actualización desde el panel: ${new Date().toISOString()}`, tree: newTree.sha, parents: [headSha] } });
  await github(env, `/git/refs/heads/${encodeURIComponent(env.BRANCH)}`, { method: "PATCH", body: { sha: newCommit.sha, force: false } });
  return json({ ok: true, state, commit: newCommit.sha }, 200, cors);
}

async function uploadImage(request, env, cors) {
  const body = await readJson(request, MAX_IMAGE_BODY_BYTES);
  const path = String(body.path || "");
  const base64 = String(body.base64 || "");
  if (!/^assets\/uploads\/[a-zA-Z0-9._-]+\.webp$/.test(path)) throw httpError(400, "La ruta de la fotografía no es válida.");
  if (!/^[A-Za-z0-9+/=]+$/.test(base64) || base64.length > 850_000) throw httpError(400, "La fotografía es demasiado grande o no es válida.");
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  await github(env, `/contents/${encodedPath}`, {
    method: "PUT",
    body: {
      message: `Fotografía cargada desde el panel: ${path.split("/").pop()}`,
      content: base64,
      branch: env.BRANCH,
    },
  });
  return json({ ok: true, path }, 200, cors);
}

async function mapLimit(items, limit, callback) {
  const results = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await callback(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

async function getRepoText(env, path) {
  const result = await github(env, `/contents/${path}?ref=${encodeURIComponent(env.BRANCH)}`);
  if (!result.content) throw httpError(500, `No se pudo leer ${path}.`);
  return new TextDecoder().decode(base64ToBytes(String(result.content).replace(/\s/g, "")));
}

async function github(env, path, options = {}) {
  const response = await fetch(`https://api.github.com/repos/${env.REPO_OWNER}/${env.REPO_NAME}${path}`, {
    method: options.method || "GET",
    headers: {
      "Accept": "application/vnd.github+json",
      "Authorization": `Bearer ${env.GITHUB_TOKEN}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "Rimaturismo-Panel",
      "Content-Type": "application/json",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 409 || response.status === 422) throw httpError(409, "GitHub recibió otro cambio al mismo tiempo. Recarga el panel y vuelve a intentarlo.");
    throw httpError(502, `GitHub no pudo guardar los cambios (${response.status}).`);
  }
  return data;
}
