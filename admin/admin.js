(() => {
  "use strict";
  const API = String(window.RIMA_ADMIN_API || "").replace(/\/$/, "");
  const UNCONFIGURED = !API || API.includes("PEGA_AQUI");
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const lines = (value) => String(value || "").split("\n").map((item) => item.trim()).filter(Boolean);
  const slugify = (value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
  const categoryLabels = { huaylas: "Callejón de Huaylas", conchucos: "Callejón de Conchucos", lima: "Salidas desde Lima" };
  const imageFallback = "../assets/gallery/equipo-chacas.webp";

  let state = null;
  let selectedSlug = "";
  let uploads = new Map();
  let busy = false;

  const loginView = $("#login-view");
  const dashboard = $("#dashboard");
  const loginForm = $("#login-form");
  const loginMessage = $("#login-message");
  const tourEditor = $("#tour-editor");
  const contactEditor = $("#contact-editor");
  const loadingPanel = $("#loading-panel");
  const publishMessage = $("#publish-message");
  const confirmDialog = $("#confirm-dialog");

  if (UNCONFIGURED) {
    $("#setup-warning").hidden = false;
    $("#login-form button").disabled = true;
  }

  const setMessage = (element, text = "", type = "") => {
    element.textContent = text;
    element.className = `form-message${type ? ` is-${type}` : ""}`;
  };

  async function api(path, options = {}) {
    const token = sessionStorage.getItem("rima_admin_token");
    const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(`${API}${path}`, { ...options, headers });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401 && path !== "/api/login") logout(false);
      throw new Error(data.error || "No fue posible completar la operación.");
    }
    return data;
  }

  function logout(reload = true) {
    sessionStorage.removeItem("rima_admin_token");
    if (reload) location.reload();
  }

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (UNCONFIGURED || busy) return;
    setMessage(loginMessage, "Verificando acceso...");
    busy = true;
    $("#login-form button").disabled = true;
    try {
      const result = await api("/api/login", { method: "POST", body: JSON.stringify({ email: $("#login-email").value.trim(), password: $("#login-password").value }) });
      sessionStorage.setItem("rima_admin_token", result.token);
      await openDashboard();
    } catch (error) {
      setMessage(loginMessage, error.message, "error");
    } finally {
      busy = false;
      $("#login-form button").disabled = false;
    }
  });

  $("#logout-button").addEventListener("click", () => logout());

  async function openDashboard() {
    loginView.hidden = true;
    dashboard.hidden = false;
    loadingPanel.hidden = false;
    tourEditor.hidden = true;
    contactEditor.hidden = true;
    try {
      const result = await api("/api/content");
      state = result.state;
      $("#admin-email-label").textContent = result.adminEmail || "Administrador";
      selectedSlug = state.tours[0]?.slug || "";
      renderTourList();
      if (selectedSlug) selectTour(selectedSlug);
      else showContactSettings();
    } catch (error) {
      loadingPanel.innerHTML = `<p>${escapeHtml(error.message)}</p>`;
    }
  }

  function escapeHtml(value) {
    const node = document.createElement("div");
    node.textContent = String(value || "");
    return node.innerHTML;
  }

  function renderTourList(filter = "") {
    const term = filter.trim().toLocaleLowerCase("es");
    const list = $("#tour-list");
    list.innerHTML = "";
    state.tours.filter((tour) => tour.name.toLocaleLowerCase("es").includes(term)).forEach((tour) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `tour-item${tour.slug === selectedSlug ? " is-active" : ""}`;
      const cover = tour.images?.[0]?.path ? `../${tour.images[0].path}` : imageFallback;
      button.innerHTML = `<span class="tour-item__thumb"><img src="${escapeHtml(cover)}" alt="" /></span><span class="tour-item__copy"><strong>${escapeHtml(tour.name)}</strong><small>${escapeHtml(categoryLabels[tour.category] || "Experiencia")}</small></span>`;
      button.addEventListener("click", () => selectTour(tour.slug));
      list.append(button);
    });
  }

  $("#tour-search").addEventListener("input", (event) => renderTourList(event.target.value));

  function currentTour() {
    return state.tours.find((tour) => tour.slug === selectedSlug);
  }

  function selectTour(slug) {
    selectedSlug = slug;
    loadingPanel.hidden = true;
    contactEditor.hidden = true;
    tourEditor.hidden = false;
    renderTourList($("#tour-search").value);
    fillTourForm();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function fillTourForm() {
    const tour = currentTour();
    if (!tour) return;
    $("#editor-title").textContent = tour.name;
    $("#tour-slug").textContent = `/tours/${tour.slug}.html`;
    const values = {
      name: tour.name, category: tour.category, type: tour.type, duration: tour.duration,
      cardDescription: tour.cardDescription, description: tour.description, schedule: tour.schedule,
      difficulty: tour.difficulty, priceLabel: tour.priceLabel, priceDetail: tour.priceDetail,
      highlights: (tour.highlights || []).join("\n"), includes: (tour.includes || []).join("\n"),
      notIncludes: (tour.notIncludes || []).join("\n"), bring: (tour.bring || []).join("\n"),
    };
    Object.entries(values).forEach(([name, value]) => { tourEditor.elements[name].value = value || ""; });
    tourEditor.elements.showPrice.checked = tour.showPrice !== false;
    togglePriceFields();
    renderImages();
    setMessage(publishMessage);
  }

  function syncTourFromForm() {
    const tour = currentTour();
    if (!tour) return;
    ["name", "category", "type", "duration", "cardDescription", "description", "schedule", "difficulty", "priceLabel", "priceDetail"].forEach((name) => { tour[name] = tourEditor.elements[name].value.trim(); });
    ["highlights", "includes", "notIncludes", "bring"].forEach((name) => { tour[name] = lines(tourEditor.elements[name].value); });
    tour.showPrice = tourEditor.elements.showPrice.checked;
    tour.categoryLabel = categoryLabels[tour.category];
    tour.seoDescription = tour.cardDescription;
    $("#editor-title").textContent = tour.name || "Nueva experiencia";
  }

  tourEditor.addEventListener("input", (event) => {
    syncTourFromForm();
    if (event.target.name === "showPrice") togglePriceFields();
  });

  function togglePriceFields() {
    $("#price-fields").hidden = !tourEditor.elements.showPrice.checked;
  }

  function renderImages() {
    const tour = currentTour();
    const list = $("#image-list");
    list.innerHTML = "";
    (tour.images || []).forEach((image, index) => {
      const card = document.createElement("article");
      card.className = "image-card";
      const src = uploads.get(image.path)?.preview || `../${image.path}`;
      card.innerHTML = `${index === 0 ? '<span class="cover-badge">Portada</span>' : ""}<img src="${escapeHtml(src)}" alt="${escapeHtml(image.alt || "")}" /><div class="image-card__info"><input type="text" maxlength="180" value="${escapeHtml(image.alt || "")}" aria-label="Descripción de imagen" /><div class="image-card__actions"><button type="button" data-action="up">↑ Subir</button><button type="button" data-action="down">↓ Bajar</button><button class="remove" type="button" data-action="remove">Eliminar</button></div></div>`;
      $("input", card).addEventListener("input", (event) => { image.alt = event.target.value; });
      $$('button[data-action]', card).forEach((button) => button.addEventListener("click", () => moveImage(index, button.dataset.action)));
      list.append(card);
    });
  }

  function moveImage(index, action) {
    const images = currentTour().images;
    if (action === "remove") {
      const [removed] = images.splice(index, 1);
      if (removed) uploads.delete(removed.path);
    } else {
      const target = action === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= images.length) return;
      [images[index], images[target]] = [images[target], images[index]];
    }
    renderImages();
  }

  $("#image-upload").addEventListener("change", async (event) => {
    if (busy) return;
    const tour = currentTour();
    const available = 8 - (tour.images?.length || 0);
    const files = [...event.target.files].slice(0, Math.max(0, available));
    if (!files.length) {
      setMessage(publishMessage, available ? "Selecciona una fotografía válida." : "Esta experiencia ya tiene el máximo de 8 fotografías.", "error");
      return;
    }
    busy = true;
    event.target.disabled = true;
    setMessage(publishMessage, "Optimizando y subiendo fotografías...");
    try {
      for (const [index, file] of files.entries()) {
        setMessage(publishMessage, `Preparando fotografía ${index + 1} de ${files.length}...`);
        const optimized = await optimizeImage(file);
        const safeName = slugify(file.name.replace(/\.[^.]+$/, "")) || `foto-${Date.now()}`;
        let path = `assets/uploads/${tour.slug}-${safeName}-${Date.now()}.webp`;
        while (tour.images.some((image) => image.path === path)) path = path.replace(/\.webp$/, "-2.webp");
        setMessage(publishMessage, `Subiendo fotografía ${index + 1} de ${files.length}...`);
        await api("/api/image", { method: "POST", body: JSON.stringify({ path, base64: optimized.base64 }) });
        tour.images.push({ path, alt: `${tour.name} - fotografía ${tour.images.length + 1}` });
        uploads.set(path, { preview: optimized.preview });
        renderImages();
      }
      setMessage(publishMessage, `${files.length} fotografía(s) lista(s). Pulsa “Guardar y publicar” para mostrarlas en la web.`, "success");
    } catch (error) {
      setMessage(publishMessage, error.message, "error");
    } finally {
      busy = false;
      event.target.disabled = false;
      event.target.value = "";
    }
  });

  function optimizeImage(file) {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith("image/")) return reject(new Error("El archivo seleccionado no es una imagen."));
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("No se pudo leer la fotografía."));
      reader.onload = () => {
        const image = new Image();
        image.onerror = () => reject(new Error("Una fotografía está dañada o no es compatible."));
        image.onload = async () => {
          const maxSide = 1600;
          const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(image.width * scale));
          canvas.height = Math.max(1, Math.round(image.height * scale));
          canvas.getContext("2d", { alpha: false }).drawImage(image, 0, 0, canvas.width, canvas.height);
          let quality = .84;
          let blob = await canvasBlob(canvas, quality);
          while (blob.size > 600 * 1024 && quality > .36) { quality -= .08; blob = await canvasBlob(canvas, quality); }
          if (blob.size > 620 * 1024) return reject(new Error("La fotografía no pudo reducirse lo suficiente. Prueba con una imagen de menor tamaño."));
          const dataUrl = await blobToDataUrl(blob);
          resolve({ base64: dataUrl.split(",")[1], preview: dataUrl, size: blob.size });
        };
        image.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  const canvasBlob = (canvas, quality) => new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("No se pudo optimizar la fotografía.")), "image/webp", quality));
  const blobToDataUrl = (blob) => new Promise((resolve, reject) => { const reader = new FileReader(); reader.onerror = reject; reader.onload = () => resolve(reader.result); reader.readAsDataURL(blob); });

  $("#add-tour-button").addEventListener("click", () => {
    if (state.tours.length >= 28) {
      alert("El panel admite hasta 28 experiencias para mantenerse dentro del plan gratuito.");
      return;
    }
    let slug = `nueva-experiencia-${Date.now().toString().slice(-6)}`;
    while (state.tours.some((tour) => tour.slug === slug)) slug += "-2";
    state.tours.push({ id: slug, slug, order: state.tours.length + 1, name: "Nueva experiencia", category: "conchucos", categoryLabel: categoryLabels.conchucos, type: "Experiencia turística", cardDescription: "", description: "", seoDescription: "", duration: "Full day", schedule: "Horario por confirmar", difficulty: "Consultar", showPrice: true, priceLabel: "Tarifa del tour: consultar", priceDetail: "", highlights: [], includes: [], notIncludes: [], bring: [], images: [], video: "", videoTitle: "" });
    selectTour(slug);
  });

  $("#delete-tour-button").addEventListener("click", async () => {
    const tour = currentTour();
    if (!tour) return;
    const confirmed = await confirmAction("Eliminar experiencia", `Se eliminará “${tour.name}”, su página y sus fotografías cargadas desde el panel. Esta acción se aplicará al publicar.`);
    if (!confirmed) return;
    (tour.images || []).forEach((image) => uploads.delete(image.path));
    state.tours = state.tours.filter((item) => item.slug !== tour.slug);
    selectedSlug = state.tours[0]?.slug || "";
    renderTourList();
    if (selectedSlug) selectTour(selectedSlug); else showContactSettings();
    setMessage(publishMessage, "Tour retirado. Pulsa “Guardar y publicar” en cualquier sección para confirmar.", "success");
  });

  function confirmAction(title, text) {
    $("#confirm-title").textContent = title;
    $("#confirm-text").textContent = text;
    confirmDialog.showModal();
    return new Promise((resolve) => confirmDialog.addEventListener("close", () => resolve(confirmDialog.returnValue === "confirm"), { once: true }));
  }

  tourEditor.addEventListener("submit", async (event) => {
    event.preventDefault();
    syncTourFromForm();
    const tour = currentTour();
    if (!tour.name || !tour.cardDescription || !tour.description) return setMessage(publishMessage, "Completa el nombre y las dos descripciones antes de publicar.", "error");
    await publish(publishMessage);
  });

  $("#contact-settings-button").addEventListener("click", showContactSettings);

  function showContactSettings() {
    selectedSlug = "";
    loadingPanel.hidden = true;
    tourEditor.hidden = true;
    contactEditor.hidden = false;
    renderTourList($("#tour-search").value);
    ["whatsapp", "whatsappDisplay", "email"].forEach((name) => { contactEditor.elements[name].value = state.site[name] || ""; });
    setMessage($("#contact-message"));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  contactEditor.addEventListener("submit", async (event) => {
    event.preventDefault();
    const digits = contactEditor.elements.whatsapp.value.replace(/\D/g, "");
    if (digits.length < 10 || !contactEditor.elements.email.validity.valid) return setMessage($("#contact-message"), "Revisa el número de WhatsApp y el correo.", "error");
    state.site.whatsapp = digits;
    state.site.whatsappDisplay = contactEditor.elements.whatsappDisplay.value.trim();
    state.site.email = contactEditor.elements.email.value.trim().toLowerCase();
    await publish($("#contact-message"));
  });

  async function publish(messageElement) {
    if (busy) return;
    const confirmed = await confirmAction("Publicar cambios", "La página pública se actualizará automáticamente. Puede tardar entre 1 y 5 minutos en verse.");
    if (!confirmed) return;
    finalizeNewTourSlugs();
    busy = true;
    $$("button[type='submit']").forEach((button) => { button.disabled = true; });
    setMessage(messageElement, "Guardando y publicando...");
    try {
      state.tours.forEach((tour, index) => { tour.order = index + 1; });
      const result = await api("/api/publish", { method: "POST", body: JSON.stringify({ state }) });
      state = result.state;
      uploads = new Map();
      renderTourList();
      if (selectedSlug) fillTourForm();
      setMessage(messageElement, "¡Listo! Cambios enviados. La página se actualizará en 1 a 5 minutos.", "success");
    } catch (error) {
      setMessage(messageElement, error.message, "error");
    } finally {
      busy = false;
      $$("button[type='submit']").forEach((button) => { button.disabled = false; });
    }
  }

  function finalizeNewTourSlugs() {
    const used = new Set(state.tours.map((tour) => tour.slug));
    state.tours.forEach((tour) => {
      if (!/^nueva-experiencia-\d+(?:-2)*$/.test(tour.slug)) return;
      const oldSlug = tour.slug;
      used.delete(oldSlug);
      const base = slugify(tour.name) || "experiencia";
      let next = base;
      let suffix = 2;
      while (used.has(next)) next = `${base}-${suffix++}`;

      tour.slug = next;
      tour.id = next;
      used.add(next);
      if (selectedSlug === oldSlug) selectedSlug = next;
    });
  }

  if (!UNCONFIGURED && sessionStorage.getItem("rima_admin_token")) openDashboard();
})();
