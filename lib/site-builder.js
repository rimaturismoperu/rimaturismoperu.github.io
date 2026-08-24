export const CATEGORY_LABELS = Object.freeze({
  huaylas: "Callejón de Huaylas",
  conchucos: "Callejón de Conchucos",
  lima: "Salidas desde Lima",
});

export const WHATSAPP_ICON = `<svg class="wa-icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path fill="currentColor" d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93a7.898 7.898 0 0 0-2.327-5.607ZM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.546 6.546 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592Zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.066-.315-.099-.445.099-.133.197-.513.646-.629.775-.116.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.174-1.101-1.371-.116-.198-.013-.306.087-.404.089-.088.197-.23.296-.346.1-.116.133-.198.198-.33.066-.133.033-.248-.017-.347-.05-.099-.445-1.074-.61-1.47-.16-.389-.323-.335-.445-.34-.116-.007-.247-.007-.379-.007a.729.729 0 0 0-.528.247c-.182.198-.692.678-.692 1.654 0 .976.71 1.916.81 2.049.098.132 1.394 2.13 3.38 2.988.472.205.84.326 1.129.417.474.15.904.129 1.244.078.38-.058 1.171-.48 1.338-.943.164-.462.164-.858.116-.943-.05-.083-.182-.132-.38-.23Z"/></svg>`;

const DEFAULT_IMAGE = "assets/gallery/equipo-chacas.webp";
const LEGAL_PAGES = Object.freeze({
  reservations: "politicas-de-reserva.html",
  terms: "terminos-y-condiciones.html",
  privacy: "politica-de-privacidad.html",
});

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

function safeHttpsUrl(value, fallback = "") {
  const candidate = safeString(value, 500);
  try {
    const url = new URL(candidate);
    return url.protocol === "https:" ? url.toString() : fallback;
  } catch {
    return fallback;
  }
}

function safeAssetPath(value, fallback) {
  const path = safeString(value, 250).replace(/^\.\//, "");
  if (!/^assets\/(?:gallery|tours|uploads)\/[a-zA-Z0-9._/-]+$/.test(path) || path.includes("..") || path.includes("//")) return fallback;
  return path;
}

function safeLocalPage(value, fallback) {
  const page = safeString(value, 120);
  return /^[a-z0-9-]+\.html$/.test(page) ? page : fallback;
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
    facebook: safeHttpsUrl(siteSource.facebook),
    tiktok: safeHttpsUrl(siteSource.tiktok),
    claimsBookUrl: safeHttpsUrl(siteSource.claimsBookUrl),
    privacyUrl: safeLocalPage(siteSource.privacyUrl, LEGAL_PAGES.privacy),
    termsUrl: safeLocalPage(siteSource.termsUrl, LEGAL_PAGES.terms),
    reservationsUrl: safeLocalPage(siteSource.reservationsUrl, LEGAL_PAGES.reservations),
    coverImage: safeAssetPath(siteSource.coverImage, "assets/gallery/portada-chacas.webp"),
    museumImage: safeAssetPath(siteSource.museumImage, "assets/gallery/museo-casa-torre-jara.webp"),
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
    .replace(/<meta property="og:image" content="[^"]*" \/>/, `<meta property="og:image" content="${site.baseUrl}/${escapeHtml(site.coverImage)}" />`)
    .replace(/<meta name="twitter:image" content="[^"]*" \/>/, `<meta name="twitter:image" content="${site.baseUrl}/${escapeHtml(site.coverImage)}" />`)
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

function renderFooter(site, prefix = "") {
  const socialLinks = [
    site.facebook ? `<li><a href="${escapeHtml(site.facebook)}" target="_blank" rel="noopener noreferrer">Facebook</a></li>` : "",
    site.tiktok ? `<li><a href="${escapeHtml(site.tiktok)}" target="_blank" rel="noopener noreferrer">TikTok</a></li>` : "",
  ].join("");
  const claimsLink = site.claimsBookUrl
    ? `<li><a href="${escapeHtml(site.claimsBookUrl)}" target="_blank" rel="noopener noreferrer">Libro de Reclamaciones</a></li>`
    : "";
  return `<footer class="site-footer" id="contacto"><div class="container footer__grid"><div class="footer__brand"><img src="${prefix}assets/logo-oscuro.jpg" alt="${escapeHtml(site.name)}" /><p>Experiencias auténticas para descubrir Áncash desde una mirada local.</p></div><div><h2>Contacto oficial</h2><ul><li><a href="tel:+${site.whatsapp}">${escapeHtml(site.whatsappDisplay)}</a></li><li><a href="mailto:${escapeHtml(site.email)}">${escapeHtml(site.email)}</a></li><li>Atención exclusivamente virtual</li>${socialLinks}</ul></div><div><h2>Datos de la empresa</h2><ul><li>${escapeHtml(site.name)}</li><li>Titular: ${escapeHtml(site.legalName)}</li><li>RUC ${escapeHtml(site.ruc)}</li><li>Chacas, Asunción, Áncash</li></ul></div><div><h2>Información y políticas</h2><ul><li><a href="${prefix}${escapeHtml(site.reservationsUrl)}">Políticas de reserva</a></li><li><a href="${prefix}${escapeHtml(site.termsUrl)}">Términos y condiciones</a></li><li><a href="${prefix}${escapeHtml(site.privacyUrl)}">Política de privacidad</a></li>${claimsLink}<li>La web no procesa pagos en línea.</li></ul></div></div><div class="container footer__bottom"><span>© <span id="year"></span> ${escapeHtml(site.name)}</span><span>Viaja informado · Respeta las comunidades y la naturaleza</span></div></footer>`;
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
    inLanguage: "es-PE",
    provider: {
      "@type": "TravelAgency",
      name: site.name,
      url: `${site.baseUrl}/`,
      telephone: site.whatsappDisplay,
      email: site.email,
      taxID: site.ruc,
      areaServed: "Áncash, Perú",
      sameAs: [site.facebook, site.tiktok].filter(Boolean),
    },
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
  <meta name="twitter:title" content="${escapeHtml(tour.name)} | ${escapeHtml(site.name)}" />
  <meta name="twitter:description" content="${escapeHtml(tour.seoDescription || tour.cardDescription)}" />
  <meta name="twitter:image" content="${site.baseUrl}/${escapeHtml(cover.path)}" />
  <link rel="canonical" href="${canonical}" />
  <link rel="alternate" hreflang="es-PE" href="${canonical}" />
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
    <section class="safety section"><div class="container safety__panel reveal"><div><p class="eyebrow">Reserva informada</p><h2>Antes de confirmar tu salida.</h2></div><div><p>Consulta disponibilidad, punto de encuentro, estado de la ruta, alimentación, ingresos e inclusiones exactas. Para caminatas y alta montaña, informa cualquier condición médica y solicita una evaluación adecuada.</p><a href="${contactUrl}" target="_blank" rel="noopener noreferrer">Solicitar información completa <span aria-hidden="true">→</span></a><a href="../${escapeHtml(site.reservationsUrl)}">Leer políticas de reserva <span aria-hidden="true">→</span></a></div></div></section>
    <section class="detail-cta section"><div class="container detail-cta__panel reveal"><div><p class="eyebrow eyebrow--light">¿Te interesa esta experiencia?</p><h2>Cotiza ${escapeHtml(tour.name)} directamente con ${escapeHtml(site.name)}.</h2></div><a class="button button--primary button--large" href="${contactUrl}" target="_blank" rel="noopener noreferrer">${WHATSAPP_ICON}<span>Escribir por WhatsApp</span></a></div></section>
  </main>
  ${renderFooter(site, "../")}
  <a class="floating-whatsapp" href="${contactUrl}" target="_blank" rel="noopener noreferrer" aria-label="Conversar con ${escapeHtml(site.name)} por WhatsApp">${WHATSAPP_ICON}<span>WhatsApp</span></a>
  <dialog class="lightbox" id="lightbox"><button type="button" class="lightbox__close" aria-label="Cerrar imagen">×</button><img src="" alt="" /></dialog><script src="../script.js"></script>
</body>
</html>`;
}

function legalContent(kind, site) {
  if (kind === "reservations") return {
    file: site.reservationsUrl,
    title: "Políticas de reserva, cambios y cancelaciones",
    description: `Condiciones de reserva, pago, cancelación, reprogramación y devolución de ${site.name}.`,
    eyebrow: "Reserva informada",
    intro: "Estas condiciones explican cómo confirmar una experiencia, qué ocurre si cambias tus planes y cómo se atienden las devoluciones.",
    body: `<section><h2>1. Canales de reserva</h2><p>Las consultas y reservas se atienden por esta página web, WhatsApp, llamada telefónica o correo electrónico. La web es informativa y <strong>no procesa pagos en línea</strong>. La reserva se considera confirmada cuando la agencia valida la disponibilidad, recibe el adelanto acordado y envía la constancia o confirmación al contacto del pasajero.</p></section>
<section><h2>2. Adelanto, saldo y medios de pago</h2><p>Para confirmar una reserva se solicita un adelanto equivalente al <strong>20 % del precio total</strong>. El saldo debe pagarse antes de la partida del tour, conforme a la coordinación enviada por la agencia.</p><p>Los medios aceptados son Yape, Plin, transferencia bancaria o efectivo. Antes de pagar, el pasajero debe verificar que el número y los datos de destino coincidan con los canales oficiales publicados en esta web.</p></section>
<section><h2>3. Precio e inclusiones</h2><p>El precio confirmado incluye impuestos, transporte de ida y vuelta y guía oficial, salvo que la cotización escrita indique algo diferente. No incluye alimentación, gastos personales, entradas ni servicios opcionales que no hayan sido incluidos expresamente.</p><p>Las tarifas pueden variar en feriados, temporadas especiales o por cambios de proveedores. Siempre prevalece la cotización escrita aceptada por el pasajero antes de pagar.</p></section>
<section><h2>4. Cancelación solicitada por el pasajero</h2><p>La cancelación debe comunicarse con una anticipación mínima de <strong>12 horas</strong> respecto de la hora programada de salida. Pasado ese plazo no corresponde devolución del adelanto ni de los pagos efectuados, salvo que una norma imperativa disponga otra cosa.</p></section>
<section><h2>5. Reprogramación</h2><p>El pasajero puede solicitar una reprogramación con al menos <strong>48 horas de anticipación</strong>. Se permite como máximo una reprogramación, sujeta a disponibilidad, y se aplica un cargo administrativo del <strong>15 %</strong> del precio del servicio.</p></section>
<section><h2>6. Puntualidad y ausencia</h2><p>El pasajero debe presentarse <strong>40 minutos antes</strong> de la hora de partida. Si no se presenta a la hora indicada o pierde la salida por una causa atribuible a él, se considera inasistencia y pierde el servicio, sin devolución.</p></section>
<section><h2>7. Cancelación por la agencia</h2><p>Si la agencia cancela el tour y no se acuerda una reprogramación, se devuelve el <strong>100 % del monto pagado</strong>. En caso de clima adverso, bloqueo o fallas de carretera, riesgos de seguridad u otra fuerza mayor, la agencia podrá reprogramar la experiencia o devolver el dinero. El plazo máximo informado para efectuar una devolución es de <strong>2 días</strong> desde que se confirma su procedencia.</p></section>
<section><h2>8. Grupo mínimo y cambios operativos</h2><p>Las salidas grupales requieren un mínimo de <strong>15 pasajeros</strong>, salvo acuerdo distinto. Por seguridad, clima, tránsito o disposiciones de las autoridades, la agencia puede ajustar horarios, orden de visitas o ruta, procurando mantener la finalidad principal de la experiencia e informando al pasajero.</p></section>
<section><h2>9. Cómo solicitar un cambio o devolución</h2><p>Escribe a <a href="https://wa.me/${site.whatsapp}" target="_blank" rel="noopener noreferrer">WhatsApp ${escapeHtml(site.whatsappDisplay)}</a> o a <a href="mailto:${escapeHtml(site.email)}">${escapeHtml(site.email)}</a>. Indica el nombre del titular de la reserva, tour, fecha coordinada, motivo y comprobante de pago.</p></section>`,
  };

  if (kind === "privacy") return {
    file: site.privacyUrl,
    title: "Política de privacidad",
    description: `Información sobre el tratamiento de datos personales de clientes y pasajeros de ${site.name}.`,
    eyebrow: "Datos personales",
    intro: "Te explicamos qué datos podemos solicitar, para qué los usamos y cómo ejercer tus derechos.",
    body: `<section><h2>1. Responsable del tratamiento</h2><p>El responsable es <strong>${escapeHtml(site.legalName)}</strong>, titular de ${escapeHtml(site.name)}, RUC ${escapeHtml(site.ruc)}, con domicilio en ${escapeHtml(site.address)}. Contacto: <a href="mailto:${escapeHtml(site.email)}">${escapeHtml(site.email)}</a> y <a href="tel:+${site.whatsapp}">${escapeHtml(site.whatsappDisplay)}</a>.</p></section>
<section><h2>2. Datos que podemos solicitar</h2><p>Según el servicio, podemos recopilar nombre y apellidos, DNI o pasaporte, teléfono, correo, edad, nacionalidad, datos de la reserva, comprobante de pago, contacto de emergencia y la información de salud estrictamente necesaria para la seguridad de la actividad.</p></section>
<section><h2>3. Finalidades</h2><ul><li>Atender consultas, cotizaciones y reservas.</li><li>Coordinar transporte, guía, proveedores y seguridad del pasajero.</li><li>Confirmar pagos y emitir comprobantes.</li><li>Responder solicitudes, reclamos y ejercer obligaciones legales.</li><li>Enviar promociones solo cuando la persona haya dado su consentimiento.</li></ul></section>
<section><h2>4. Datos de salud y consentimiento</h2><p>La información de salud es sensible. Se solicita únicamente cuando resulte necesaria para evaluar precauciones o coordinar la seguridad del pasajero y se trata con el consentimiento correspondiente. El pasajero debe brindar información veraz sobre condiciones que puedan afectar su participación.</p></section>
<section><h2>5. Destinatarios</h2><p>Los datos podrán compartirse solo en la medida necesaria con guías, transportistas, alojamientos, aseguradoras, operadores o autoridades vinculadas al servicio. No vendemos datos personales.</p></section>
<section><h2>6. Imágenes</h2><p>Las fotografías o videos identificables de pasajeros se utilizarán con autorización previa. La persona puede solicitar que no se publique o que se retire una imagen escribiendo a los canales oficiales.</p></section>
<section><h2>7. Conservación y seguridad</h2><p>La información operativa se conservará por un máximo de <strong>3 meses</strong> después de concluido el servicio, salvo que una obligación legal exija un plazo distinto. Se almacena en equipos bajo control de la empresa y se aplican medidas razonables para evitar acceso, pérdida o uso no autorizado.</p></section>
<section><h2>8. Derechos ARCO</h2><p>El titular puede solicitar acceso, rectificación, cancelación u oposición, así como revocar un consentimiento cuando corresponda. Debe escribir a <a href="mailto:${escapeHtml(site.email)}">${escapeHtml(site.email)}</a> o al WhatsApp ${escapeHtml(site.whatsappDisplay)}, indicando su nombre, documento, solicitud concreta y un medio de respuesta.</p></section>
<section><h2>9. Menores de edad</h2><p>No se aceptan reservas realizadas directamente por menores. Su participación debe ser gestionada por sus padres, representante o persona autorizada y sustentada con la documentación correspondiente.</p></section>
<section><h2>10. Cookies y cambios</h2><p>La página pública no utiliza cookies publicitarias ni vende información de navegación. Esta política podrá actualizarse cuando cambien los servicios o la normativa; la versión vigente se publicará en esta misma dirección.</p></section>
<section class="legal-note"><h2>Marco de referencia</h2><p>Esta política toma como referencia la <a href="https://www.gob.pe/institucion/congreso-de-la-republica/normas-legales/243470-29733" target="_blank" rel="noopener noreferrer">Ley N.º 29733</a> y su <a href="https://www.gob.pe/institucion/anpd/normas-legales/6554453-16-2024-jus" target="_blank" rel="noopener noreferrer">Reglamento aprobado por el D. S. N.º 016-2024-JUS</a>.</p></section>`,
  };

  return {
    file: site.termsUrl,
    title: "Términos y condiciones del servicio",
    description: `Condiciones generales para contratar tours y experiencias con ${site.name}.`,
    eyebrow: "Condiciones del servicio",
    intro: "Lee estas condiciones antes de confirmar una reserva. La cotización aceptada y estas reglas forman parte de la contratación.",
    body: `<section><h2>1. Identificación</h2><p>${escapeHtml(site.name)} es una agencia de viajes de atención virtual cuya titularidad corresponde a <strong>${escapeHtml(site.legalName)}</strong>, RUC ${escapeHtml(site.ruc)}, con domicilio en ${escapeHtml(site.address)}.</p></section>
<section><h2>2. Información y aceptación</h2><p>Los contenidos de la web describen experiencias de forma general. La disponibilidad, itinerario, precio total, inclusiones, exclusiones, punto de encuentro y condiciones definitivas se confirman por escrito antes del pago. Al entregar el adelanto, el pasajero declara haber recibido y aceptado esa información y estos términos.</p></section>
<section><h2>3. Reserva y pago</h2><p>La reserva se confirma con la validación de la agencia y el adelanto del 20 %. El saldo se paga antes de partir. Se aceptan Yape, Plin, transferencia o efectivo. Esta web no incorpora una pasarela de pago ni solicita claves bancarias.</p></section>
<section><h2>4. Precio</h2><p>El precio confirmado incluye impuestos, transporte de ida y vuelta y guía oficial, salvo indicación escrita distinta. No incluye alimentación, gastos personales, entradas ni actividades opcionales no detalladas. Los precios pueden variar por feriados o condiciones especiales; nunca se aplicará un cambio a una reserva ya confirmada sin informar y obtener la aceptación del pasajero.</p></section>
<section><h2>5. Requisitos del pasajero</h2><p>Cada pasajero debe portar DNI o pasaporte, brindar datos veraces y comunicar condiciones de salud relevantes para la seguridad. Debe usar ropa y equipo adecuados, especialmente para frío y altura, seguir las instrucciones del guía, respetar a las comunidades y no realizar actos ilegales, peligrosos o que afecten al grupo.</p></section>
<section><h2>6. Menores</h2><p>Los menores deben viajar con sus padres, representante o persona debidamente autorizada y con los documentos exigibles. No pueden contratar directamente el servicio.</p></section>
<section><h2>7. Salidas, puntualidad y grupo mínimo</h2><p>El pasajero debe presentarse 40 minutos antes. La inasistencia o llegada tardía atribuible al pasajero ocasiona la pérdida del tour. Las salidas grupales requieren al menos 15 pasajeros, salvo confirmación distinta.</p></section>
<section><h2>8. Seguridad y cambios de ruta</h2><p>La agencia puede modificar el orden, horario o ruta por clima, carretera, seguridad, autoridades o causas operativas justificadas. El pasajero conserva el derecho a recibir información clara y a que se le proponga una solución razonable cuando cambie sustancialmente el servicio.</p></section>
<section><h2>9. Cancelación, reprogramación y devolución</h2><p>Se aplican las <a href="${escapeHtml(site.reservationsUrl)}">Políticas de reserva, cambios y cancelaciones</a>, que forman parte de estos términos.</p></section>
<section><h2>10. Proveedores y bienes personales</h2><p>La agencia coordina servicios propios y de terceros necesarios para la experiencia y atiende las incidencias vinculadas a su organización. El pasajero debe cuidar sus pertenencias; la agencia no responde por pérdidas atribuibles al descuido del pasajero, sin perjuicio de las responsabilidades que correspondan legalmente.</p></section>
<section><h2>11. Fotografías</h2><p>El uso promocional de imágenes identificables requiere autorización. El pasajero puede negarse o solicitar el retiro por los canales de contacto.</p></section>
<section><h2>12. Atención, reclamos y ley aplicable</h2><p>Para consultas escribe a <a href="mailto:${escapeHtml(site.email)}">${escapeHtml(site.email)}</a> o al WhatsApp ${escapeHtml(site.whatsappDisplay)}. Los reclamos pueden presentarse en el <a href="${escapeHtml(site.claimsBookUrl)}" target="_blank" rel="noopener noreferrer">Libro de Reclamaciones virtual</a>. Se aplica la legislación peruana y los derechos irrenunciables reconocidos al consumidor.</p></section>
<section class="legal-note"><h2>Marco de referencia</h2><p>Estas condiciones toman como referencia el <a href="https://www.gob.pe/institucion/indecopi/normas-legales/1244218-29571" target="_blank" rel="noopener noreferrer">Código de Protección y Defensa del Consumidor, Ley N.º 29571</a>.</p></section>`,
  };
}

export function buildLegalPage(kind, rawState) {
  const { site } = normalizeState(rawState);
  const content = legalContent(kind, site);
  const canonical = `${site.baseUrl}/${content.file}`;
  const structured = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: content.title,
    description: content.description,
    url: canonical,
    inLanguage: "es-PE",
    isPartOf: { "@type": "WebSite", name: site.name, url: `${site.baseUrl}/` },
  };
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="theme-color" content="#103e33" />
  <meta name="description" content="${escapeHtml(content.description)}" />
  <meta name="robots" content="index, follow" />
  <meta property="og:type" content="website" />
  <meta property="og:locale" content="es_PE" />
  <meta property="og:site_name" content="${escapeHtml(site.name)}" />
  <meta property="og:title" content="${escapeHtml(content.title)} | ${escapeHtml(site.name)}" />
  <meta property="og:description" content="${escapeHtml(content.description)}" />
  <meta property="og:image" content="${site.baseUrl}/${escapeHtml(site.coverImage)}" />
  <meta property="og:url" content="${canonical}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(content.title)} | ${escapeHtml(site.name)}" />
  <meta name="twitter:description" content="${escapeHtml(content.description)}" />
  <meta name="twitter:image" content="${site.baseUrl}/${escapeHtml(site.coverImage)}" />
  <link rel="canonical" href="${canonical}" />
  <link rel="alternate" hreflang="es-PE" href="${canonical}" />
  <link rel="icon" href="favicon.svg" type="image/svg+xml" />
  <link rel="stylesheet" href="styles.css" />
  <title>${escapeHtml(content.title)} | ${escapeHtml(site.name)}</title>
  <script type="application/ld+json">${jsonLd(structured)}</script>
</head>
<body class="legal-page">
  <a class="skip-link" href="#contenido">Saltar al contenido principal</a>
  <div class="announcement"><div class="container announcement__inner"><span>Agencia virtual con atención personalizada</span><span>Reservas: ${escapeHtml(site.whatsappDisplay)}</span></div></div>
  <header class="site-header"><div class="container header__inner"><a class="brand" href="index.html" aria-label="${escapeHtml(site.name)}, ir al inicio"><img src="assets/logo-principal.jpg" alt="${escapeHtml(site.name)}" /></a><button class="menu-toggle" type="button" aria-expanded="false" aria-controls="menu-principal" aria-label="Abrir menú"><span></span><span></span><span></span></button><nav class="main-nav" id="menu-principal" aria-label="Navegación principal"><a href="index.html">Inicio</a><a href="index.html#experiencias">Experiencias</a><a href="index.html#reservas">Reservas</a><a href="index.html#contacto">Contacto</a><a class="button button--small button--whatsapp" href="${waUrl(site)}" target="_blank" rel="noopener noreferrer">${WHATSAPP_ICON}<span>WhatsApp</span></a></nav></div></header>
  <main id="contenido">
    <section class="legal-hero"><div class="container"><nav class="breadcrumbs" aria-label="Ruta de navegación"><a href="index.html">Inicio</a><span>/</span><span>${escapeHtml(content.title)}</span></nav><p class="eyebrow">${escapeHtml(content.eyebrow)}</p><h1>${escapeHtml(content.title)}</h1><p>${escapeHtml(content.intro)}</p><span class="legal-updated">Última actualización: 24 de agosto de 2026</span></div></section>
    <div class="container legal-layout"><aside class="legal-aside"><strong>Contacto oficial</strong><a href="tel:+${site.whatsapp}">${escapeHtml(site.whatsappDisplay)}</a><a href="mailto:${escapeHtml(site.email)}">${escapeHtml(site.email)}</a><a href="${escapeHtml(site.claimsBookUrl)}" target="_blank" rel="noopener noreferrer">Libro de Reclamaciones</a></aside><article class="legal-document">${content.body}</article></div>
  </main>
  ${renderFooter(site)}
  <a class="floating-whatsapp" href="${waUrl(site)}" target="_blank" rel="noopener noreferrer" aria-label="Conversar con ${escapeHtml(site.name)} por WhatsApp">${WHATSAPP_ICON}<span>WhatsApp</span></a>
  <script src="script.js"></script>
</body>
</html>`;
}

export function buildSitemap(rawState) {
  const state = normalizeState(rawState);
  const urls = [
    `${state.site.baseUrl}/`,
    ...state.tours.map((tour) => `${state.site.baseUrl}/tours/${tour.slug}.html`),
    `${state.site.baseUrl}/${state.site.reservationsUrl}`,
    `${state.site.baseUrl}/${state.site.termsUrl}`,
    `${state.site.baseUrl}/${state.site.privacyUrl}`,
  ];
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
    [state.site.reservationsUrl]: buildLegalPage("reservations", state),
    [state.site.termsUrl]: buildLegalPage("terms", state),
    [state.site.privacyUrl]: buildLegalPage("privacy", state),
  };
  state.tours.forEach((tour) => { files[`tours/${tour.slug}.html`] = buildTour(tour, state); });
  return { state, files };
}
