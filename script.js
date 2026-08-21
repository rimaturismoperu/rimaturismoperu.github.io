(() => {
  const menuToggle = document.querySelector(".menu-toggle");
  const navigation = document.querySelector(".main-nav");
  const navigationLinks = document.querySelectorAll(".main-nav a");
  const filterButtons = document.querySelectorAll(".filter-button");
  const tourCards = document.querySelectorAll(".tour-card");
  const year = document.querySelector("#year");

  const closeMenu = () => {
    if (!menuToggle || !navigation) return;
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Abrir menú");
    navigation.classList.remove("is-open");
    document.body.classList.remove("menu-open");
  };

  if (menuToggle && navigation) {
    menuToggle.addEventListener("click", () => {
      const willOpen = menuToggle.getAttribute("aria-expanded") !== "true";
      menuToggle.setAttribute("aria-expanded", String(willOpen));
      menuToggle.setAttribute("aria-label", willOpen ? "Cerrar menú" : "Abrir menú");
      navigation.classList.toggle("is-open", willOpen);
      document.body.classList.toggle("menu-open", willOpen);
    });
    navigationLinks.forEach((link) => link.addEventListener("click", closeMenu));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMenu();
    });
    window.addEventListener("resize", () => {
      if (window.innerWidth > 960) closeMenu();
    });
  }

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const selected = button.dataset.filter;
      filterButtons.forEach((item) => {
        const active = item === button;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-pressed", String(active));
      });
      tourCards.forEach((card) => {
        const show = selected === "all" || card.dataset.category === selected;
        card.hidden = !show;
        if (show) requestAnimationFrame(() => card.classList.add("is-visible"));
      });
    });
  });

  if (year) year.textContent = new Date().getFullYear();

  const revealElements = document.querySelectorAll(".reveal");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reducedMotion || !("IntersectionObserver" in window)) {
    revealElements.forEach((element) => element.classList.add("is-visible"));
  } else {
    const observer = new IntersectionObserver((entries, activeObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        activeObserver.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -7% 0px", threshold: 0.07 });
    revealElements.forEach((element) => observer.observe(element));
  }

  const lightbox = document.querySelector("#lightbox");
  const lightboxImage = lightbox?.querySelector("img");
  const lightboxClose = lightbox?.querySelector(".lightbox__close");
  document.querySelectorAll(".js-lightbox").forEach((button) => {
    button.addEventListener("click", () => {
      if (!lightbox || !lightboxImage) return;
      lightboxImage.src = button.dataset.image || "";
      lightboxImage.alt = button.dataset.alt || "";
      lightbox.showModal();
    });
  });
  lightboxClose?.addEventListener("click", () => lightbox?.close());
  lightbox?.addEventListener("click", (event) => {
    if (event.target === lightbox) lightbox.close();
  });
})();
