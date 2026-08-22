export const CATEGORY_LABELS = Object.freeze({
  huaylas: "Callejón de Huaylas",
  conchucos: "Callejón de Conchucos",
  lima: "Salidas desde Lima",
});

export const WHATSAPP_ICON = `<svg class="wa-icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path fill="currentColor" d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93a7.898 7.898 0 0 0-2.327-5.607ZM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.546 6.546 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592Zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.066-.315-.099-.445.099-.133.197-.513.646-.629.775-.116.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.174-1.101-1.371-.116-.198-.013-.306.087-.404.089-.088.197-.23.296-.346.1-.116.133-.198.198-.33.066-.133.033-.248-.017-.347-.05-.099-.445-1.074-.61-1.47-.16-.389-.323-.335-.445-.34-.116-.007-.247-.007-.379-.007a.729.729 0 0 0-.528.247c-.182.198-.692.678-.692 1.654 0 .976.71 1.916.81 2.049.098.132 1.394 2.13 3.38 2.988.472.205.84.326 1.129.417.474.15.904.129 1.244.078.38-.058 1.171-.48 1.338-.943.164-.462.164-.858.116-.943-.05-.083-.182-.132-.38-.23Z"/></svg>`;

const DEFAULT_IMAGE = "assets/gallery/equipo-chacas.webp";

export function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function slugify(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function safeString(value, max = 5000) {
  return String(value ?? "").trim().slice(0, max);
}

function safeList(value, maxItems = 20) {
  return (Array.isArray(value) ? value : [])
    .map((item) => safeString(item, 500))
    .filter(Boolean)
    .slice(0, maxItems);
}

function safeImage(value) {
  const path = safeString(value?.path, 250).replace(/^\.\//, "");
  if (!/^(assets\/(tours|uploads|gallery)\/[a-zA-Z0-9._/-]+)$/.test(path) || path.includes("..") || path.includes("//")) return null;
  return { path, alt: safeString(value?.alt, 180) || "Imagen de la experiencia" };
}

export function normalizeState(input) {
  const source = input && typeof input === "object" ? input : {};
  const siteSource = source.site && typeof source.site === "object" ? source.site : {};
  const whatsapp = safeString(siteSource.whatsapp, 20).replace(/\D/g, "") || "51970773171";
  const site = {
    name: safeString(siteSource.name, 100) || "Rimaturismo Perú",
    legalName: safeString(siteSource.legalName, 120) || "Pablo Acosta Padilla",
    ruc: safeString(siteSource.ruc, 20) || "10440262398",
    whatsapp,
    whatsappDisplay: safeString(siteSource.whatsappDisplay, 30) || formatPhone(whatsapp),
    email: safeString(siteSource.email, 160).toLowerCase(),
    baseUrl: (safeString(siteSource.baseUrl, 200) || "https://rimaturismoperu.github.io").replace(/\/$/, ""),
    description: safeString(siteSource.description, 300),
    address: safeString(siteSource.address, 300),
  };

  const used = new Set();
  const tours = (Array.isArray(source.tours) ? source.tours : []).slice(0, 28).map((raw, index) => {
    let slug = slugify(raw?.slug || raw?.id || raw?.name || `experiencia-${index + 1}`) || `experiencia-${index + 1}`;
    const baseSlug = slug;
    let suffix = 2;
    while (used.has(slug)) slug = `${baseSlug}-${suffix++}`;
    used.add(slug);
    const category = CATEGORY_LABELS[raw?.category] ? raw.category : "conchucos";
    const images = (Array.isArray(raw?.images) ? raw.images : []).map(safeImage).filter(Boolean).slice(0, 8);
    const showPrice = raw?.showPrice !== false;
    return {
      id: slug,
      slug,
      order: Number.isFinite(Number(raw?.order)) ? Number(raw.order) : index + 1,
      name: safeString(raw?.name, 140) || `Experiencia ${index + 1}`,
      category,
      categoryLabel: CATEGORY_LABELS[category],
      type: safeString(raw?.type, 160) || "Experiencia turística",
      cardDescription: safeString(raw?.cardDescription, 320),
      description: safeString(raw?.description, 5000),
      seoDescription: safeString(raw?.seoDescription || raw?.cardDescription, 300),
      duration: safeString(raw?.duration, 100) || "Consultar",
      schedule: safeString(raw?.schedule, 220) || "Horario por confirmar",
      difficulty: safeString(raw?.difficulty, 100) || "Consultar",
      showPrice,
      priceLabel: showPrice ? (safeString(raw?.priceLabel, 180) || "Tarifa del tour: consultar") : "",
      priceDetail: showPrice ? safeString(raw?.priceDetail, 500) : "",
      highlights: safeList(raw?.highlights),
      includes: safeList(raw?.includes),
      notIncludes: safeList(raw?.notIncludes),
      bring: safeList(raw?.bring),
      images,
      video: safeString(raw?.video, 250),
      videoTitle: safeString(raw?.videoTitle, 180),
    };
  }).sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, "es"));

  tours.forEach((tour, index) => { tour.order = index + 1; });
  return { version: 2, site, tours };
}

export function formatPhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (/^51\d{9}$/.test(digits)) return `+51 ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
  return digits ? `+${digits}` : "+51 970 773 171";
}

function imageFor(tour) {
  return tour.images[0] || { path: DEFAULT_IMAGE, alt: `Experiencia ${tour.name}` };
}

function waUrl(site, tourName = "") {
  const text = tourName
    ? `Hola Rimaturismo Perú, deseo cotizar ${tourName}. ¿Podrían confirmarme disponibilidad, precio total y qué incluye?`
    : "Hola Rimaturismo Perú, deseo información sobre sus experiencias.";
  return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(text)}`;
}

function renderCard(tour, index) {
  const cover = imageFor(tour);
  const price = tour.showPrice && tour.priceLabel ? `<span>${escapeHtml(tour.priceLabel)}</span>` : "";
  return `<article class="tour-card reveal" data-category="${escapeHtml(tour.category)}">
  <a class="tour-card__image" href="tours/${escapeHtml(tour.slug)}.html" target="_blank" rel="noopener" aria-label="Abrir información de ${escapeHtml(tour.name)} en otra pestaña">
    <img src="${escapeHtml(cover.path)}" alt="${escapeHtml(cover.alt)}" loading="lazy" />
    <span class="tour-card__number">${String(index + 1).padStart(2, "0")}</span>
    <span class="tour-card__category">${escapeHtml(tour.categoryLabel)}</span>
  </a>
  <div class="tour-card__body">
    <p class="tour-card__type">${escapeHtml(tour.type)}</p>
    <h3><a href="tours/${escapeHtml(tour.slug)}.html" target="_blank" rel="noopener">${escapeHtml(tour.name)}</a></h3>
    <p>${escapeHtml(tour.cardDescription)}</p>
    <div class="tour-card__meta"><span>${escapeHtml(tour.duration)}</span>${price}</div>
    <a class="tour-card__link" href="tours/${escapeHtml(tour.slug)}.html" target="_blank" rel="noopener">Ver experiencia <span aria-hidden="true">↗</span></a>
  </div>
</article>`;
}

function replaceContactData(html, site) {
  return html
    .replace(/https:\/\/wa\.me\/[^?"]*/g, `https://wa.me/${site.whatsapp}`)
    .replace(/Reservas:\s*[^<]+/g, `Reservas: ${escapeHtml(site.whatsappDisplay)}`)
    .replace(/<a href="tel:[^"]+">[^<]+<\/a>/g, `<a href="tel:+${site.whatsapp}">${escapeHtml(site.whatsappDisplay)}</a>`)
    .replace(/"telephone":\s*"[^"]+"/g, `"telephone": "${escapeHtml(site.whatsappDisplay)}"`)
    .replace(/href="mailto:[^"]+"/g, `href="mailto:${escapeHtml(site.email)}"`)
    .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, escapeHtml(site.email));
}

export function buildIndex(indexTemplate, rawState) {
  const state = normalizeState(rawState);
  const { site, tours } = state;
  const start = "<!-- ADMIN:TOUR-CARDS:START -->";
  const end = "<!-- ADMIN:TOUR-CARDS:END -->";
  if (!indexTemplate.includes(start) || !indexTemplate.includes(end)) {
    throw new Error("El index.html no contiene los marcadores del panel administrativo.");
  }
  const counts = Object.fromEntries(Object.keys(CATEGORY_LABELS).map((key) => [key, tours.filter((tour) => tour.category === key).length]));
  let html = indexTemplate.replace(new RegExp(`${start}[\\s\\S]*?${end}`), `${start}\n${tours.map(renderCard).join("\n")}\n${end}`);
  html = html
    .replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${escapeHtml(site.description)}" />`)
    .replace(/<meta property="og:image" content="[^"]*" \/>/, `<meta property="og:image" content="${site.baseUrl}/${escapeHtml(imageFor(tours[0] || { images: [] }).path)}" />`)
    .replace(/<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${site.baseUrl}/" />`)
    .replace(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${site.baseUrl}/" />`)
    .replace(/("url":\s*)"https?:\/\/[^\"]+"/, `$1"${site.baseUrl}/"`)
    .replace(/content="\d+ experiencias para descubrir los paisajes, pueblos y tradiciones de Áncash\."/, `content="${tours.length} experiencias para descubrir los paisajes, pueblos y tradiciones de Áncash."`)
    .replace(/Explorar \d+ experiencias/g, `Explorar ${tours.length} experiencias`)
    .replace(/<div><strong>\d+<\/strong><span>experiencias<\/span><\/div>/, `<div><strong>${tours.length}</strong><span>experiencias</span></div>`)
    .replace(/(data-filter="all"[^>]*>Todas <span>)\d+(<\/span>)/, `$1${tours.length}$2`)
    .replace(/(data-filter="huaylas"[^>]*>Callejón de Huaylas <span>)\d+(<\/span>)/, `$1${counts.huaylas}$2`)
    .replace(/(data-filter="conchucos"[^>]*>Callejón de Conchucos <span>)\d+(<\/span>)/, `$1${counts.conchucos}$2`)
    .replace(/(data-filter="lima"[^>]*>Salidas desde Lima <span>)\d+(<\/span>)/, `$1${counts.lima}$2`);
  return replaceContactData(html, site);
}

function renderList(items, fallback) {
  const values = items.length ? items : [fallback];
  if (values.length === 1) return `<p>${escapeHtml(values[0])}</p>`;
  return `<ul>${values.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function jsonLd(value) {
  return JSON.stringify(value, null, 2).replaceAll("<", "\\u003c");
}

export function buildTour(tourInput, rawState) {
  const state = normalizeState(rawState);
  const tour = state.tours.find((item) => item.slug === tourInput.slug) || tourInput;
  const { site } = state;
  const cover = imageFor(tour);
  const canonical = `${site.baseUrl}/tours/${tour.slug}.html`;
  const contactUrl = waUrl(site, tour.name);
  const summaryPrice = tour.showPrice ? `<div><span>Tarifa</span><strong>${escapeHtml(tour.priceLabel)}</strong></div>` : "";
  const contactCard = tour.showPrice
    ? `<aside class="price-card reveal"><p>Resumen de tarifa</p><h2>${escapeHtml(tour.priceLabel)}</h2><div>${escapeHtml(tour.priceDetail || "Solicita la tarifa total antes de reservar.")}</div><p class="price-card__note">Solicita una cotización escrita antes de realizar cualquier pago. La página no procesa pagos en línea.</p><a class="button button--whatsapp" href="${contactUrl}" target="_blank" rel="noopener noreferrer">${WHATSAPP_ICON}<span>Consultar por WhatsApp</span></a></aside>`
    : `<aside class="price-card reveal"><p>Coordina tu salida</p><h2>Consulta disponibilidad y condiciones</h2><div>La tarifa de esta experiencia especial se confirma directamente por WhatsApp.</div><p class="price-card__note">La página no procesa pagos en línea.</p><a class="button button--whatsapp" href="${contactUrl}" target="_blank" rel="noopener noreferrer">${WHATSAPP_ICON}<span>Consultar por WhatsApp</span></a></aside>`;
  const gallery = tour.images.length
    ? tour.images.map((image) => `<button class="gallery-item js-lightbox" type="button" data-image="../${escapeHtml(image.path)}" data-alt="${escapeHtml(image.alt)}" aria-label="Ampliar imagen: ${escapeHtml(image.alt)}"><img src="../${escapeHtml(image.path)}" alt="${escapeHtml(image.alt)}" loading="lazy" /><span>Ampliar</span></button>`).join("\n")
    : `<div class="gallery-item gallery-item--message"><div><strong>Galería en preparación</strong><span>Próximamente se añadirán imágenes de esta experiencia.</span></div></div>`;
  const video = tour.video && /^(assets\/videos\/[a-zA-Z0-9._/-]+)$/.test(tour.video)
    ? `<section class="detail-video section"><div class="container detail-video__grid"><div><p class="eyebrow">Video de la experiencia</p><h2>${escapeHtml(tour.videoTitle || tour.name)}</h2></div><video controls preload="metadata" playsinline poster="../${escapeHtml(cover.path)}"><source src="../${escapeHtml(tour.video)}" type="video/mp4" /></video></div></section>`
    : "";
  const structured = {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: tour.name,
    description: tour.seoDescription,
    url: canonical,
    image: tour.images.map((image) => `${site.baseUrl}/${image.path}`),
    touristType: tour.type,
    provider: { "@type": "TravelAgency", name: site.name, url: `${site.baseUrl}/`, telephone: site.whatsappDisplay, email: site.email },
  };

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="theme-color" content="#103e33" />
  <meta name="description" content="${escapeHtml(tour.seoDescription || tour.cardDescription)}" />
  <meta name="robots" content="index, follow" />
  <meta property="og:type" content="website" />
  <meta property="og:locale" content="es_PE" />
  <meta property="og:site_name" content="${escapeHtml(site.name)}" />
  <meta property="og:title" content="${escapeHtml(tour.name)} | ${escapeHtml(site.name)}" />
  <meta property="og:description" content="${escapeHtml(tour.seoDescription || tour.cardDescription)}" />
  <meta property="og:image" content="${site.baseUrl}/${escapeHtml(cover.path)}" />
  <meta property="og:url" content="${canonical}" />
  <meta name="twitter:card" content="summary_large_image" />
  <link rel="canonical" href="${canonical}" />
  <link rel="icon" href="../favicon.svg" type="image/svg+xml" />
  <link rel="stylesheet" href="../styles.css" />
  <title>${escapeHtml(tour.name)} | ${escapeHtml(site.name)}</title>
  <script type="application/ld+json">${jsonLd(structured)}</script>
</head>
<body class="detail-page">
  <a class="skip-link" href="#contenido">Saltar al contenido principal</a>
  <div class="announcement"><div class="container announcement__inner"><span>Agencia virtual con atención personalizada</span><span>Reservas: ${escapeHtml(site.whatsappDisplay)}</span></div></div>
  <header class="site-header detail-header"><div class="container header__inner">
    <a class="brand" href="../index.html" aria-label="${escapeHtml(site.name)}, ir al inicio"><img src="../assets/logo-principal.jpg" alt="${escapeHtml(site.name)}" /></a>
    <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="menu-principal" aria-label="Abrir menú"><span></span><span></span><span></span></button>
    <nav class="main-nav" id="menu-principal" aria-label="Navegación principal"><a href="../index.html">Inicio</a><a href="../index.html#experiencias">Experiencias</a><a href="../index.html#nosotros">Nosotros</a><a href="../index.html#reservas">Reservas</a><a href="../index.html#contacto">Contacto</a><a class="button button--small button--whatsapp" href="${waUrl(site)}" target="_blank" rel="noopener noreferrer">${WHATSAPP_ICON}<span>WhatsApp</span></a></nav>
  </div></header>
  <main id="contenido">
    <section class="detail-hero"><img src="../${escapeHtml(cover.path)}" alt="${escapeHtml(cover.alt)}" /><div class="detail-hero__overlay"></div><div class="container detail-hero__content">
      <nav class="breadcrumbs" aria-label="Ruta de navegación"><a href="../index.html">Inicio</a><span>/</span><a href="../index.html#experiencias">Experiencias</a><span>/</span><span>${escapeHtml(tour.name)}</span></nav>
      <p class="eyebrow eyebrow--light">${escapeHtml(tour.categoryLabel)} · ${escapeHtml(tour.type)}</p><h1>${escapeHtml(tour.name)}</h1><p>${escapeHtml(tour.cardDescription)}</p>
      <a class="button button--primary" href="${contactUrl}" target="_blank" rel="noopener noreferrer">${WHATSAPP_ICON}<span>Cotizar esta experiencia</span></a>
    </div></section>
    <section class="detail-summary"><div class="container detail-summary__grid${tour.showPrice ? "" : " detail-summary__grid--three"}"><div><span>Duración</span><strong>${escapeHtml(tour.duration)}</strong></div><div><span>Horario</span><strong>${escapeHtml(tour.schedule)}</strong></div><div><span>Dificultad</span><strong>${escapeHtml(tour.difficulty)}</strong></div>${summaryPrice}</div></section>
    <section class="detail-intro section"><div class="container detail-intro__grid"><article class="detail-intro__copy reveal"><p class="eyebrow">Sobre la experiencia</p><h2>Una ruta para conocer ${escapeHtml(tour.name)}.</h2><p class="lead">${escapeHtml(tour.description)}</p><div class="source-note"><strong>Información importante:</strong> los horarios son referenciales y pueden variar por clima, tránsito, operación o condiciones de seguridad.</div></article>${contactCard}</div></section>
    <section class="highlights section section--forest"><div class="container highlights__grid"><div><p class="eyebrow eyebrow--light">Lo más destacado</p><h2>Momentos principales de la ruta.</h2></div><ul>${(tour.highlights.length ? tour.highlights : ["Recorrido coordinado directamente con la agencia"]).map((item) => `<li><span>✓</span>${escapeHtml(item)}</li>`).join("")}</ul></div></section>
    <section class="tour-gallery section" aria-labelledby="gallery-title"><div class="container"><div class="section-heading reveal"><p class="eyebrow">Galería real</p><h2 id="gallery-title">Imágenes de ${escapeHtml(tour.name)}.</h2></div><div class="tour-gallery__grid">${gallery}</div></div></section>
    ${video}
    <section class="details-list section section--soft"><div class="container details-list__grid"><article class="reveal"><span class="details-list__number">01</span><h2>Qué incluye</h2>${renderList(tour.includes, "El contenido exacto del servicio se detalla en la cotización enviada por WhatsApp.")}</article><article class="reveal"><span class="details-list__number">02</span><h2>Qué no incluye</h2>${renderList(tour.notIncludes, "Ingresos, alimentación y servicios adicionales se confirman antes de reservar.")}</article><article class="reveal"><span class="details-list__number">03</span><h2>Qué llevar</h2>${renderList(tour.bring, "Consulta las recomendaciones antes de la salida.")}</article></div></section>
    <section class="safety section"><div class="container safety__panel reveal"><div><p class="eyebrow">Reserva informada</p><h2>Antes de confirmar tu salida.</h2></div><div><p>Consulta disponibilidad, punto de encuentro, estado de la ruta, alimentación, ingresos e inclusiones exactas. Para caminatas y alta montaña, informa cualquier condición médica y solicita una evaluación adecuada.</p><a href="${contactUrl}" target="_blank" rel="noopener noreferrer">Solicitar información completa <span aria-hidden="true">→</span></a></div></div></section>
    <section class="detail-cta section"><div class="container detail-cta__panel reveal"><div><p class="eyebrow eyebrow--light">¿Te interesa esta experiencia?</p><h2>Cotiza ${escapeHtml(tour.name)} directamente con ${escapeHtml(site.name)}.</h2></div><a class="button button--primary button--large" href="${contactUrl}" target="_blank" rel="noopener noreferrer">${WHATSAPP_ICON}<span>Escribir por WhatsApp</span></a></div></section>
  </main>
  <footer class="site-footer" id="contacto"><div class="container footer__grid"><div class="footer__brand"><img src="../assets/logo-oscuro.jpg" alt="${escapeHtml(site.name)}" /><p>Experiencias auténticas para descubrir Áncash desde una mirada local.</p></div><div><h2>Contacto oficial</h2><ul><li><a href="tel:+${site.whatsapp}">${escapeHtml(site.whatsappDisplay)}</a></li><li><a href="mailto:${escapeHtml(site.email)}">${escapeHtml(site.email)}</a></li><li>Atención exclusivamente virtual</li></ul></div><div><h2>Datos de la empresa</h2><ul><li>${escapeHtml(site.name)}</li><li>Titular: ${escapeHtml(site.legalName)}</li><li>RUC ${escapeHtml(site.ruc)}</li><li>Chacas, Asunción, Áncash</li></ul></div><div><h2>Información importante</h2><ul><li>La web no procesa pagos en línea.</li><li>Tarifas, ingresos y horarios se confirman antes de reservar.</li><li>Políticas y registros se incorporarán en la etapa final.</li></ul></div></div><div class="container footer__bottom"><span>© <span id="year"></span> ${escapeHtml(site.name)}</span><span>Viaja informado · Respeta las comunidades y la naturaleza</span></div></footer>
  <a class="floating-whatsapp" href="${contactUrl}" target="_blank" rel="noopener noreferrer" aria-label="Conversar con ${escapeHtml(site.name)} por WhatsApp">${WHATSAPP_ICON}<span>WhatsApp</span></a>
  <dialog class="lightbox" id="lightbox"><button type="button" class="lightbox__close" aria-label="Cerrar imagen">×</button><img src="" alt="" /></dialog><script src="../script.js"></script>
</body>
</html>`;
}

export function buildSitemap(rawState) {
  const state = normalizeState(rawState);
  const urls = [`${state.site.baseUrl}/`, ...state.tours.map((tour) => `${state.site.baseUrl}/tours/${tour.slug}.html`)];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url) => `  <url><loc>${escapeHtml(url)}</loc></url>`).join("\n")}\n</urlset>\n`;
}

export function buildRobots(rawState) {
  const { site } = normalizeState(rawState);
  return `User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /setup/\nDisallow: /data/\nDisallow: /lib/\nDisallow: /scripts/\nDisallow: /worker/\nSitemap: ${site.baseUrl}/sitemap.xml\n`;
}

export function buildAll(indexTemplate, rawState) {
  const state = normalizeState(rawState);
  const files = {
    "index.html": buildIndex(indexTemplate, state),
    "data/content.json": `${JSON.stringify(state, null, 2)}\n`,
    "sitemap.xml": buildSitemap(state),
    "robots.txt": buildRobots(state),
  };
  state.tours.forEach((tour) => { files[`tours/${tour.slug}.html`] = buildTour(tour, state); });
  return { state, files };
}
