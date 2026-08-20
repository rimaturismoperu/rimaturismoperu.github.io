(() => {
  const menuToggle = document.querySelector(".menu-toggle");
  const navigation = document.querySelector(".main-nav");
  const navigationLinks = document.querySelectorAll(".main-nav a");
  const filterButtons = document.querySelectorAll(".filter-button");
  const tourCards = document.querySelectorAll(".tour-card");
  const tourButtons = document.querySelectorAll(".js-tour");
  const year = document.querySelector("#year");
  const whatsappNumber = "51970773171";

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
      if (window.innerWidth > 1020) closeMenu();
    });
  }

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const selectedFilter = button.dataset.filter;

      filterButtons.forEach((item) => {
        const isSelected = item === button;
        item.classList.toggle("is-active", isSelected);
        item.setAttribute("aria-pressed", String(isSelected));
      });

      tourCards.forEach((card) => {
        const shouldShow =
          selectedFilter === "all" || card.dataset.category === selectedFilter;
        card.hidden = !shouldShow;

        if (shouldShow) {
          requestAnimationFrame(() => card.classList.add("is-visible"));
        }
      });
    });
  });

  tourButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const tourName = button.dataset.tour || "una experiencia";
      const message = `Hola Rimaturismo Perú, deseo información sobre ${tourName}. ¿Podrían indicarme las próximas fechas, el precio y las condiciones?`;
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    });
  });

  if (year) {
    year.textContent = new Date().getFullYear();
  }

  const revealElements = document.querySelectorAll(".reveal");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealElements.forEach((element) => element.classList.add("is-visible"));
  } else {
    const observer = new IntersectionObserver(
      (entries, activeObserver) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          activeObserver.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );

    revealElements.forEach((element) => observer.observe(element));
  }
})();
