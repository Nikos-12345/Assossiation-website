document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector(".site-header");
  const menuButton = document.querySelector(".menu-toggle");
  const navigation = document.querySelector(".main-nav");
  const dropdowns = document.querySelectorAll(".nav-dropdown");
  const isMobile = () => window.matchMedia("(max-width: 850px)").matches;

  function closeDropdowns() {
    dropdowns.forEach((dropdown) => {
      dropdown.classList.remove("is-open");
      dropdown.querySelector(".dropdown-toggle")?.setAttribute("aria-expanded", "false");
    });
  }

  function closeMenu({ restoreFocus = false } = {}) {
    if (!menuButton || !navigation) return;

    navigation.classList.remove("is-open");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.querySelector(".sr-only")?.replaceChildren("Άνοιγμα μενού");
    closeDropdowns();

    if (restoreFocus) menuButton.focus();
  }

  /* ---------- Header ---------- */
  /* Ενημέρωση σε ένα animation frame, για ομαλή κύλιση σε όλες τις συσκευές. */
  let lastScrollY = window.scrollY;
  let scrollIsQueued = false;

  function updateHeaderState() {
    const currentScrollY = window.scrollY;
    header?.classList.toggle("is-scrolled", currentScrollY > 20);

    if (isMobile()) {
      header?.classList.remove("is-hidden");
      lastScrollY = currentScrollY;
      return;
    }

    const difference = currentScrollY - lastScrollY;

    if (currentScrollY <= 50) {
      header?.classList.remove("is-hidden");
    } else if (difference > 6 && currentScrollY > 80) {
      header?.classList.add("is-hidden");
      closeDropdowns();
    } else if (difference < -6) {
      header?.classList.remove("is-hidden");
    }

    if (Math.abs(difference) > 6) {
      lastScrollY = Math.max(0, currentScrollY);
    }
  }

  function queueHeaderUpdate() {
    if (scrollIsQueued) return;

    scrollIsQueued = true;
    window.requestAnimationFrame(() => {
      updateHeaderState();
      scrollIsQueued = false;
    });
  }

  updateHeaderState();
  window.addEventListener("scroll", queueHeaderUpdate, { passive: true });

  /* ---------- Mobile menu και dropdowns ---------- */
  if (menuButton && navigation) {
    menuButton.addEventListener("click", () => {
      const isOpen = navigation.classList.toggle("is-open");

      menuButton.setAttribute("aria-expanded", String(isOpen));
      menuButton.querySelector(".sr-only")?.replaceChildren(
        isOpen ? "Κλείσιμο μενού" : "Άνοιγμα μενού"
      );

      if (!isOpen) closeDropdowns();
    });

    navigation.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMenu);
    });
  }

  document.querySelectorAll(".dropdown-toggle").forEach((button) => {
    button.addEventListener("click", () => {
      const dropdown = button.closest(".nav-dropdown");
      if (!dropdown) return;

      const willOpen = !dropdown.classList.contains("is-open");
      closeDropdowns();

      if (willOpen) {
        dropdown.classList.add("is-open");
        button.setAttribute("aria-expanded", "true");
      }
    });
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".nav-dropdown")) closeDropdowns();

    if (
      isMobile() &&
      navigation?.classList.contains("is-open") &&
      !event.target.closest(".site-header")
    ) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu({ restoreFocus: true });
  });

  window.addEventListener("resize", () => {
    if (!isMobile()) {
      closeMenu();
      return;
    }

    closeDropdowns();
    queueHeaderUpdate();
  });

  /* ---------- Hero φωτογραφίες ---------- */
  const heroPhotos = document.querySelectorAll(".hero-photo");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (heroPhotos.length > 1 && !reducedMotion) {
    let currentPhoto = 0;

    window.setInterval(() => {
      if (document.hidden) return;

      heroPhotos[currentPhoto].classList.remove("is-active");
      currentPhoto = (currentPhoto + 1) % heroPhotos.length;
      heroPhotos[currentPhoto].classList.add("is-active");
    }, 5000);
  }

  /* ---------- Photo carousels ---------- */
  function setupPhotoCarousel(carouselSelector, pageSelector) {
    const carousel = document.querySelector(carouselSelector);
    const pages = carousel ? Array.from(carousel.querySelectorAll(pageSelector)) : [];

    if (!carousel || !pages.length) return;

    let currentPage = pages.findIndex((page) => page.classList.contains("is-active"));
    if (currentPage < 0) currentPage = 0;

    const applyPageState = (nextPage) => {
      currentPage = nextPage;

      pages.forEach((page, index) => {
        const isActive = index === currentPage;
        page.classList.toggle("is-active", isActive);
        page.setAttribute("aria-hidden", String(!isActive));
      });
    };

    applyPageState(currentPage);
    carousel.setAttribute("aria-live", "off");

    if (pages.length < 2 || reducedMotion) return;

    let carouselInterval;

    const stop = () => window.clearInterval(carouselInterval);
    const start = () => {
      stop();

      if (document.hidden) return;

      carouselInterval = window.setInterval(() => {
        if (document.hidden) return;
        applyPageState((currentPage + 1) % pages.length);
      }, 5000);
    };

    carousel.addEventListener("mouseenter", stop);
    carousel.addEventListener("mouseleave", start);
    carousel.addEventListener("focusin", stop);
    carousel.addEventListener("pointerdown", stop, { passive: true });
    carousel.addEventListener("pointerup", start, { passive: true });
    carousel.addEventListener("pointercancel", start, { passive: true });

    carousel.addEventListener("focusout", (event) => {
      if (!carousel.contains(event.relatedTarget)) start();
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stop();
      else start();
    });

    start();
  }

  setupPhotoCarousel("[data-activities-carousel]", ".activities-page");
  setupPhotoCarousel("[data-seminars-carousel]", ".seminars-page");

  /* ---------- Επιστροφή στην κορυφή ---------- */
  document.querySelectorAll('a[href="#top"]').forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
    });
  });

  /* ---------- Προσωρινό premium fallback για εικόνες που δεν έχουν δοθεί ακόμη ---------- */
  document.querySelectorAll(".activity-card, .seminar-card").forEach((card) => {
    const image = card.querySelector("img");
    if (!image) return;

    const setFallback = () => {
      if (card.classList.contains("is-media-missing")) return;

      card.classList.add("is-media-missing");
      card.dataset.mediaFallback = card.classList.contains("seminar-card")
        ? "Φωτογραφία σεμιναρίου"
        : "Φωτογραφία δραστηριότητας";
      image.setAttribute("alt", "");
      image.setAttribute("aria-hidden", "true");
    };

    image.addEventListener("error", setFallback, { once: true });
    if (image.complete && image.naturalWidth === 0) setFallback();
  });

  /* ---------- Εμφάνιση στοιχείων στο scroll ---------- */
  const revealSelector = [
    ".section-heading",
    ".activities-heading",
    ".activities-carousel",
    ".seminars-heading",
    ".seminars-carousel",
    ".split-layout > *",
    ".quick-grid a",
    ".news-card",
    ".listing-card",
    ".event-list article",
    ".board-grid article",
    ".document-list a",
    ".member-card",
    ".contact-page-grid > *"
  ].join(", ");

  const revealItems = document.querySelectorAll(revealSelector);

  revealItems.forEach((item, index) => {
    item.classList.add("reveal");
    item.style.setProperty("--reveal-delay", `${Math.min((index % 4) * 90, 270)}ms`);
  });

  let revealObserver = null;

  if ("IntersectionObserver" in window) {
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const element = entry.target;
        element.classList.add("is-visible");
        revealObserver.unobserve(element);

        const delay = Number.parseInt(element.style.getPropertyValue("--reveal-delay"), 10) || 0;

        window.setTimeout(() => {
          element.classList.remove("reveal", "is-visible");
          element.style.removeProperty("--reveal-delay");
        }, delay + 800);
      });
    }, { threshold: 0.12 });

    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => {
      item.classList.remove("reveal");
      item.style.removeProperty("--reveal-delay");
    });
  }

  /* ---------- Φωτογραφία μελών από αριστερά ---------- */
  const memberPhotos = document.querySelectorAll(".members-photo");

  if ("IntersectionObserver" in window) {
    const slideObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        slideObserver.unobserve(entry.target);
      });
    }, { threshold: 0.25 });

    memberPhotos.forEach((photo) => {
      photo.classList.add("slide-in-left");
      slideObserver.observe(photo);
    });
  }

  /* ---------- Κατάλογος ηλεκτρολόγων ---------- */
  const sourceMembers = [
    {
      name: "Πέτρου Ιωάννης",
      street: "Ομονοίας 46",
      zip: "65302",
      phone: "6900000000",
      email: "petrou@example.gr",
      municipality: "Καβάλας",
      city: "Καβάλα"
    },
    {
      name: "Αναστασιάδης Αναστάσιος",
      street: "Ομόνοιας 45",
      zip: "65302",
      phone: "6900000000",
      email: "anastasiadis@example.gr",
      municipality: "Καβάλας",
      city: "Καβάλα"
    },
    {
      name: "Βασιλείου Βασίλειος",
      street: "Βενιζέλου 12",
      zip: "65403",
      phone: "6900000000",
      email: "vasileiou@example.gr",
      municipality: "Καβάλας",
      city: "Καβάλα"
    }
  ];

  /* Προσωρινά δείγματα για να φαίνεται η σελιδοποίηση. */
  const electricians = Array.from({ length: 8 }, () => sourceMembers).flat();
  const ITEMS_PER_PAGE = 12;
  let currentPage = 1;
  let filteredData = [...electricians];

  const membersGrid = document.querySelector("#members-grid");
  const paginationContainer = document.querySelector("#pagination");

  const escapeHtml = (value) => String(value ?? "-")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  function displayMembers(page, data) {
    if (!membersGrid) return;

    membersGrid.replaceChildren();

    const start = (page - 1) * ITEMS_PER_PAGE;
    const members = data.slice(start, start + ITEMS_PER_PAGE);

    if (!members.length) {
      membersGrid.innerHTML = '<p class="no-results">Δεν βρέθηκαν ηλεκτρολόγοι με αυτά τα κριτήρια.</p>';
      return;
    }

    members.forEach((member, index) => {
      const card = document.createElement("article");
      card.className = "member-card reveal";
      card.style.setProperty("--reveal-delay", `${(index % 4) * 90}ms`);

      card.innerHTML = `
        <div class="card-top-icon" aria-hidden="true">
          <svg width="34" height="26" viewBox="0 0 24 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="24" height="18" rx="2" fill="#1b639e"/>
            <rect x="3" y="3" width="7" height="6" fill="#ffffff"/>
            <circle cx="6.5" cy="5" r="1.5" fill="#1b639e"/>
            <path d="M4 8.5C4 7.5 5 7 6.5 7C8 7 9 7.5 9 8.5" stroke="#1b639e" stroke-width="0.8"/>
            <rect x="12" y="4" width="9" height="1.5" fill="#ffffff"/>
            <rect x="12" y="7" width="7" height="1.5" fill="#ffffff"/>
            <rect x="3" y="11" width="18" height="4" fill="#ffffff"/>
          </svg>
        </div>
        <h3 class="member-name">${escapeHtml(member.name)}</h3>
        <div class="member-details">
          <div><strong>Οδός:</strong> ${escapeHtml(member.street)}</div>
          <div><strong>ΤΚ:</strong> ${escapeHtml(member.zip)}</div>
          <div><strong>Κινητό Τηλ:</strong> ${escapeHtml(member.phone)}</div>
          <div><strong>Email:</strong> ${escapeHtml(member.email)}</div>
          <div><strong>Δήμος:</strong> ${escapeHtml(member.municipality)}</div>
          <div><strong>Πόλη / Περιοχή:</strong> ${escapeHtml(member.city)}</div>
        </div>
      `;

      membersGrid.appendChild(card);

      if (revealObserver) {
        revealObserver.observe(card);
      } else {
        card.classList.remove("reveal");
        card.style.removeProperty("--reveal-delay");
      }
    });
  }

  function setupPagination(data) {
    if (!paginationContainer) return;

    paginationContainer.replaceChildren();
    const pageCount = Math.ceil(data.length / ITEMS_PER_PAGE);
    if (pageCount <= 1) return;

    const nav = document.createElement("nav");
    nav.className = "pagination-bar";
    nav.setAttribute("aria-label", "Σελιδοποίηση καταλόγου ηλεκτρολόγων");

    for (let page = 1; page <= pageCount; page += 1) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = page;
      button.classList.toggle("active", page === currentPage);
      button.setAttribute("aria-label", `Σελίδα ${page}`);

      button.addEventListener("click", () => {
        currentPage = page;
        updateView();
      });

      nav.appendChild(button);
    }

    const nextButton = document.createElement("button");
    nextButton.type = "button";
    nextButton.textContent = "ΕΠΟΜΕΝΟ";
    nextButton.className = "next-btn";
    nextButton.disabled = currentPage === pageCount;

    nextButton.addEventListener("click", () => {
      if (currentPage < pageCount) {
        currentPage += 1;
        updateView();
      }
    });

    nav.appendChild(nextButton);
    paginationContainer.appendChild(nav);
  }

  function updateView() {
    displayMembers(currentPage, filteredData);
    setupPagination(filteredData);
  }

  if (membersGrid) updateView();

  const memberSearch = document.querySelector("#member-search");

  if (memberSearch) {
    memberSearch.addEventListener("input", () => {
      const query = memberSearch.value.toLocaleLowerCase("el").trim();

      filteredData = electricians.filter((member) => {
        return [member.name, member.street, member.zip, member.municipality, member.city]
          .some((value) => String(value).toLocaleLowerCase("el").includes(query));
      });

      currentPage = 1;
      updateView();
    });
  }

  /* ---------- Φόρμα επικοινωνίας ---------- */
  const form = document.querySelector("#contact-form");

  if (form) {
    const status = form.querySelector(".form-status");

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const action = form.getAttribute("action") || "";

      if (!action || action.includes("ΤΟ_ΚΩΔΙΚΟ_ΣΟΥ")) {
        status.textContent = "Προεπισκόπηση: η φόρμα δεν έχει ακόμα συνδεθεί με υπηρεσία email.";
        return;
      }

      const submitButton = form.querySelector('button[type="submit"]');
      submitButton.disabled = true;
      status.textContent = "Αποστολή…";

      try {
        const response = await fetch(action, {
          method: "POST",
          body: new FormData(form),
          headers: { Accept: "application/json" }
        });

        if (response.ok) {
          status.textContent = "Ευχαριστούμε! Το μήνυμά σας στάλθηκε.";
          form.reset();
        } else {
          status.textContent = "Κάτι πήγε στραβά. Δοκιμάστε ξανά ή καλέστε μας.";
        }
      } catch {
        status.textContent = "Δεν ήταν δυνατή η αποστολή. Ελέγξτε τη σύνδεσή σας και δοκιμάστε ξανά.";
      } finally {
        submitButton.disabled = false;
      }
    });
  }

  /* ---------- Τρέχον έτος ---------- */
  const year = document.querySelector("#current-year");
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Αστραπές hero ---------- */
  const random = (min, max) => min + Math.random() * (max - min);

  function boltPath(x1, y1, x2, y2, displacement, detail) {
    let points = [[x1, y1], [x2, y2]];

    for (let distance = displacement; distance > detail; distance *= 0.55) {
      const nextPoints = [points[0]];

      for (let index = 0; index < points.length - 1; index += 1) {
        const [ax, ay] = points[index];
        const [bx, by] = points[index + 1];
        const dx = bx - ax;
        const dy = by - ay;
        const length = Math.hypot(dx, dy) || 1;
        const offset = (Math.random() - 0.5) * 2 * distance;

        nextPoints.push(
          [(ax + bx) / 2 - (dy / length) * offset, (ay + by) / 2 + (dx / length) * offset],
          [bx, by]
        );
      }

      points = nextPoints;
    }

    return points;
  }

  function strokeBolt(context, points, width, brightness, taper) {
    const layers = [
      [9, `rgba(80,130,255,${0.05 * brightness})`],
      [4, `rgba(140,185,255,${0.15 * brightness})`],
      [1.7, `rgba(215,232,255,${0.4 * brightness})`],
      [0.7, `rgba(255,255,255,${0.95 * brightness})`]
    ];

    layers.forEach(([factor, color]) => {
      context.strokeStyle = color;

      for (let index = 0; index < points.length - 1; index += 1) {
        const progress = index / (points.length - 1);
        context.lineWidth = Math.max(0.5, width * factor * (1 - taper * progress));
        context.beginPath();
        context.moveTo(points[index][0], points[index][1]);
        context.lineTo(points[index + 1][0], points[index + 1][1]);
        context.stroke();
      }
    });
  }

  function drawBolt(context, x, height, width, depth, angle, length, startY, brightness) {
    const endX = x + Math.sin(angle) * length;
    const endY = startY + Math.cos(angle) * length;
    const bolt = boltPath(x, startY, endX, endY, length * (depth === 0 ? 0.15 : 0.22), 1.4);

    strokeBolt(context, bolt, width, brightness, depth === 0 ? 0.5 : 0.9);

    const maxBranches = depth === 0 ? 10 : depth === 1 ? 3 : 0;
    let branches = 0;

    for (let index = Math.floor(bolt.length * 0.12); index < bolt.length - 4 && branches < maxBranches; index += 1) {
      if (Math.random() < (depth === 0 ? 0.09 : 0.06)) {
        const [branchX, branchY] = bolt[index];
        const side = Math.random() < 0.5 ? -1 : 1;

        drawBolt(
          context,
          branchX,
          height,
          width * 0.5,
          depth + 1,
          angle + side * random(0.3, 0.85),
          length * random(0.2, 0.45) * (depth === 0 ? 1 : 0.7),
          branchY,
          brightness * 0.8
        );

        branches += 1;
      }
    }
  }

  function drawLightning(context, width, height, xRatio) {
    const x = width * xRatio;
    const glow = context.createRadialGradient(x, height * 0.45, 0, x, height * 0.45, height * 1.1);

    glow.addColorStop(0, "rgba(130,175,255,0.28)");
    glow.addColorStop(1, "rgba(130,175,255,0)");

    context.fillStyle = glow;
    context.fillRect(x - height * 1.2, 0, height * 2.4, height);
    context.lineCap = "round";
    context.lineJoin = "round";

    drawBolt(context, x, height, Math.max(1.1, height / 190), 0, random(-0.12, 0.12), height * 1.05, -8, 1);
  }

  function initLightning(hero) {
    const canvas = document.createElement("canvas");
    canvas.className = "lightning";
    canvas.setAttribute("aria-hidden", "true");
    hero.prepend(canvas);

    const context = canvas.getContext("2d");
    let heroIsVisible = true;

    new IntersectionObserver(([entry]) => {
      heroIsVisible = entry.isIntersecting;
    }).observe(hero);

    const zones = [[0.06, 0.24], [0.4, 0.6]];

    function strike() {
      if (heroIsVisible && !document.hidden) {
        const ratio = window.devicePixelRatio > 1 ? 2 : 1;
        const width = hero.clientWidth;
        const height = hero.clientHeight;

        canvas.width = width * ratio;
        canvas.height = height * ratio;
        context.scale(ratio, ratio);
        context.globalCompositeOperation = "lighter";

        const firstZone = Math.floor(Math.random() * 2);
        drawLightning(context, width, height, random(...zones[firstZone]));

        if (Math.random() < 0.25) {
          drawLightning(context, width, height, random(...zones[1 - firstZone]));
        }

        canvas.animate([
          { opacity: 0 },
          { opacity: 1, offset: 0.05 },
          { opacity: 0.2, offset: 0.16 },
          { opacity: 0.95, offset: 0.24 },
          { opacity: 0.3, offset: 0.4 },
          { opacity: 0.6, offset: 0.48 },
          { opacity: 0 }
        ], { duration: random(650, 950), easing: "linear" });
      }

      window.setTimeout(strike, random(2500, 5500));
    }

    window.setTimeout(strike, 900);
  }

  if (!reducedMotion) {
    document.querySelectorAll(".page-hero").forEach(initLightning);
  }
});
