(() => {
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = matchMedia("(pointer:fine) and (min-width:769px)");
  const progress = document.getElementById("scroll-progress");
  const backToTop = document.getElementById("back-to-top");
  const header = document.querySelector(".site-header");
  const navLinks = [...document.querySelectorAll(".nav a[href^='#']")];
  const sections = navLinks.map((link) => document.querySelector(link.getAttribute("href"))).filter(Boolean);

  document.querySelectorAll("a,button,select").forEach((node) => node.classList.add("interactive"));
  document.querySelectorAll(".button,.header-cta,.contact-action").forEach((node) => node.classList.add("magnetic"));

  function updateScrollUI() {
    const max = document.documentElement.scrollHeight - innerHeight;
    const ratio = max > 0 ? scrollY / max : 0;
    progress.style.width = `${ratio * 100}%`;
    backToTop.classList.toggle("visible", scrollY > 650);
    header.classList.toggle("scrolled", scrollY > 24);

    let current = sections[0]?.id;
    sections.forEach((section) => {
      if (section.getBoundingClientRect().top <= 180) current = section.id;
    });
    navLinks.forEach((link) => link.classList.toggle("active", link.getAttribute("href") === `#${current}`));
  }
  addEventListener("scroll", updateScrollUI, { passive: true });
  addEventListener("resize", updateScrollUI, { passive: true });
  updateScrollUI();
  backToTop.addEventListener("click", () => scrollTo({ top: 0, behavior: reducedMotion.matches ? "auto" : "smooth" }));

  const projectTrack = document.getElementById("project-track");
  const projectSlides = projectTrack ? [...projectTrack.querySelectorAll("[data-project-slide]")] : [];
  const projectButtons = [...document.querySelectorAll("[data-project-dir]")];
  const projectCurrent = document.getElementById("project-current");
  const projectProgress = document.getElementById("project-progress-fill");
  let currentProject = 0;
  let projectScrollTimer;

  function projectScrollLeft(slide) {
    if (!projectTrack || !slide) return 0;
    const trackRect = projectTrack.getBoundingClientRect();
    const slideRect = slide.getBoundingClientRect();
    return projectTrack.scrollLeft + slideRect.left - trackRect.left;
  }

  function nearestProjectIndex() {
    if (!projectTrack || !projectSlides.length) return 0;
    return projectSlides.reduce((best, slide, index) => {
      const distance = Math.abs(projectScrollLeft(slide) - projectTrack.scrollLeft);
      return distance < best.distance ? { index, distance } : best;
    }, { index: 0, distance: Infinity }).index;
  }

  function renderProjectState(index) {
    currentProject = index;
    projectSlides.forEach((slide, slideIndex) => slide.classList.toggle("is-active", slideIndex === index));
    if (projectCurrent) projectCurrent.textContent = String(index + 1).padStart(2, "0");
    if (projectProgress) projectProgress.style.width = `${((index + 1) / projectSlides.length) * 100}%`;
  }

  function goToProject(index, behavior = "smooth") {
    if (!projectTrack || !projectSlides.length) return;
    const safeIndex = (index + projectSlides.length) % projectSlides.length;
    renderProjectState(safeIndex);
    projectTrack.scrollTo({ left: projectScrollLeft(projectSlides[safeIndex]), behavior: reducedMotion.matches ? "auto" : behavior });
  }

  projectButtons.forEach((button) => button.addEventListener("click", () => {
    goToProject(currentProject + Number(button.dataset.projectDir));
  }));

  if (projectTrack) {
    projectTrack.addEventListener("scroll", () => {
      clearTimeout(projectScrollTimer);
      projectScrollTimer = setTimeout(() => renderProjectState(nearestProjectIndex()), 90);
    }, { passive: true });
    projectTrack.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      goToProject(currentProject + (event.key === "ArrowRight" ? 1 : -1));
    });
    addEventListener("resize", () => goToProject(currentProject, "auto"), { passive: true });
    renderProjectState(0);
  }

  const mobileCarouselMedia = matchMedia("(max-width:640px)");
  const mobileCarousels = [...document.querySelectorAll("[data-mobile-carousel]")];

  mobileCarousels.forEach((track) => {
    const cards = [...track.children];
    const nav = document.querySelector(`[data-mobile-carousel-nav="${track.id}"]`);
    const countCurrent = nav?.querySelector(".mobile-carousel-count strong");
    const progressFill = nav?.querySelector(".mobile-carousel-progress i");
    const buttons = nav ? [...nav.querySelectorAll("[data-mobile-carousel-dir]")] : [];
    let current = 0;
    let scrollFrame = 0;

    function cardLeft(card) {
      const trackRect = track.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      return track.scrollLeft + cardRect.left - trackRect.left;
    }

    function nearestIndex() {
      return cards.reduce((best, card, index) => {
        const distance = Math.abs(cardLeft(card) - track.scrollLeft);
        return distance < best.distance ? { index, distance } : best;
      }, { index: 0, distance: Infinity }).index;
    }

    function render(index) {
      current = Math.max(0, Math.min(cards.length - 1, index));
      if (countCurrent) countCurrent.textContent = String(current + 1).padStart(2, "0");
      if (progressFill) progressFill.style.width = `${((current + 1) / cards.length) * 100}%`;
      buttons.forEach((button) => {
        const direction = Number(button.dataset.mobileCarouselDir);
        button.disabled = direction < 0 ? current === 0 : current === cards.length - 1;
      });
    }

    function goTo(index, behavior = "smooth") {
      if (!mobileCarouselMedia.matches || !cards.length) return;
      const safeIndex = Math.max(0, Math.min(cards.length - 1, index));
      render(safeIndex);
      track.scrollTo({ left: cardLeft(cards[safeIndex]), behavior: reducedMotion.matches ? "auto" : behavior });
    }

    buttons.forEach((button) => button.addEventListener("click", () => {
      goTo(current + Number(button.dataset.mobileCarouselDir));
    }));

    track.addEventListener("scroll", () => {
      if (!mobileCarouselMedia.matches || scrollFrame) return;
      scrollFrame = requestAnimationFrame(() => {
        render(nearestIndex());
        scrollFrame = 0;
      });
    }, { passive: true });

    track.addEventListener("keydown", (event) => {
      if (!mobileCarouselMedia.matches || (event.key !== "ArrowLeft" && event.key !== "ArrowRight")) return;
      event.preventDefault();
      goTo(current + (event.key === "ArrowRight" ? 1 : -1));
    });

    addEventListener("resize", () => {
      if (mobileCarouselMedia.matches) goTo(current, "auto");
      else {
        track.scrollLeft = 0;
        render(0);
      }
    }, { passive: true });

    render(0);
  });

  const reviewTrack = document.getElementById("reviews-track");
  const reviewCards = reviewTrack ? [...reviewTrack.querySelectorAll(".review-card")] : [];
  const reviewButtons = [...document.querySelectorAll("[data-review-dir]")];
  const reviewPagination = document.getElementById("review-pagination");
  let reviewDots = [];
  let currentReviewPage = 0;
  let currentReviewPageSize = 0;

  function reviewPageSize() {
    if (innerWidth <= 640) return 1;
    if (innerWidth <= 980) return 2;
    return 3;
  }

  function reviewPageCount() {
    return Math.ceil(reviewCards.length / reviewPageSize());
  }

  function nearestReviewPage() {
    if (!reviewTrack || !reviewCards.length) return 0;
    const size = reviewPageSize();
    const starts = reviewCards.filter((_, index) => index % size === 0);
    return starts.reduce((best, card, page) => {
      const distance = Math.abs(card.offsetLeft - reviewTrack.scrollLeft);
      return distance < best.distance ? { page, distance } : best;
    }, { page: 0, distance: Infinity }).page;
  }

  function renderReviewState(page) {
    currentReviewPage = page;
    reviewDots.forEach((dot, dotPage) => dot.classList.toggle("active", dotPage === currentReviewPage));
    reviewButtons.forEach((button) => {
      const dir = Number(button.dataset.reviewDir);
      button.disabled = dir < 0 ? currentReviewPage === 0 : currentReviewPage === reviewPageCount() - 1;
    });
  }

  function updateReviews() {
    renderReviewState(nearestReviewPage());
  }

  function goToReviewPage(page, behavior = "smooth") {
    const size = reviewPageSize();
    const safePage = Math.max(0, Math.min(reviewPageCount() - 1, page));
    const card = reviewCards[safePage * size];
    if (!card) return;
    renderReviewState(safePage);
    reviewTrack.scrollTo({ left: card.offsetLeft, behavior: reducedMotion.matches ? "auto" : behavior });
  }

  function rebuildReviewPagination() {
    if (!reviewPagination) return;
    reviewPagination.replaceChildren();
    reviewDots = Array.from({ length: reviewPageCount() }, (_, page) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "review-dot interactive";
      dot.setAttribute("aria-label", `Группа отзывов ${page + 1}`);
      dot.addEventListener("click", () => goToReviewPage(page));
      reviewPagination.append(dot);
      return dot;
    });
    currentReviewPageSize = reviewPageSize();
    updateReviews();
  }

  reviewButtons.forEach((button) => button.addEventListener("click", () => {
    goToReviewPage(currentReviewPage + Number(button.dataset.reviewDir));
  }));

  if (reviewTrack) {
    let ticking = false;
    let dragging = false;
    let moved = false;
    let startX = 0;
    let startScroll = 0;

    reviewTrack.addEventListener("scroll", () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { updateReviews(); ticking = false; });
    }, { passive: true });
    reviewTrack.addEventListener("pointerdown", (event) => {
      dragging = true;
      moved = false;
      startX = event.clientX;
      startScroll = reviewTrack.scrollLeft;
      reviewTrack.setPointerCapture(event.pointerId);
    });
    reviewTrack.addEventListener("pointermove", (event) => {
      if (!dragging) return;
      const delta = event.clientX - startX;
      if (Math.abs(delta) > 4) moved = true;
      if (moved) {
        reviewTrack.classList.add("dragging");
        reviewTrack.scrollLeft = startScroll - delta;
      }
    });
    const endDrag = () => {
      if (!dragging) return;
      dragging = false;
      reviewTrack.classList.remove("dragging");
      if (moved) {
        goToReviewPage(nearestReviewPage());
      }
    };
    reviewTrack.addEventListener("pointerup", endDrag);
    reviewTrack.addEventListener("pointercancel", endDrag);
    rebuildReviewPagination();
    addEventListener("resize", () => {
      if (currentReviewPageSize !== reviewPageSize()) {
        rebuildReviewPagination();
        goToReviewPage(0, "auto");
      } else {
        updateReviews();
      }
    }, { passive: true });
  }

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const node = entry.target;
      const end = Number(node.dataset.count);
      const decimals = Number(node.dataset.decimals || 0);
      const suffix = node.dataset.suffix || "";
      const start = performance.now();
      const duration = reducedMotion.matches ? 1 : 1000;
      const tick = (now) => {
        const p = Math.min(1, (now - start) / duration);
        node.textContent = (end * (1 - Math.pow(1 - p, 3))).toFixed(decimals) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      counterObserver.unobserve(node);
    });
  }, { threshold: .7 });
  document.querySelectorAll("[data-count]").forEach((node) => counterObserver.observe(node));

  document.querySelectorAll(".reveal").forEach((node, index) => {
    if (!node.style.getPropertyValue("--delay")) node.style.setProperty("--delay", `${(index % 4) * 55}ms`);
  });

  if (finePointer.matches) {
    const cursor = document.getElementById("cursor");
    const coords = document.getElementById("cursor-coords");
    let targetX = -100;
    let targetY = -100;
    let x = -100;
    let y = -100;
    let idleTimer;

    addEventListener("mousemove", (event) => {
      targetX = event.clientX;
      targetY = event.clientY;
      coords.textContent = `X ${String(Math.round(targetX)).padStart(3,"0")} · Y ${String(Math.round(targetY)).padStart(3,"0")}`;
      cursor.classList.remove("idle");
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => cursor.classList.add("idle"), 1250);
    }, { passive: true });

    const renderCursor = () => {
      const speed = reducedMotion.matches ? 1 : .22;
      x += (targetX - x) * speed;
      y += (targetY - y) * speed;
      cursor.style.transform = `translate3d(${x - 17}px,${y - 17}px,0)`;
      requestAnimationFrame(renderCursor);
    };
    requestAnimationFrame(renderCursor);

    document.addEventListener("pointerover", (event) => {
      if (event.target.closest("a,button,select,.interactive")) cursor.classList.add("active");
    });
    document.addEventListener("pointerout", (event) => {
      const interactive = event.target.closest("a,button,select,.interactive");
      if (interactive && !interactive.contains(event.relatedTarget)) cursor.classList.remove("active");
    });
    document.querySelectorAll(".cursor-safe").forEach((node) => {
      node.addEventListener("mouseenter", () => cursor.classList.add("safe"));
      node.addEventListener("mouseleave", () => cursor.classList.remove("safe"));
    });
  }

  if (finePointer.matches && !reducedMotion.matches) {
    document.querySelectorAll(".magnetic").forEach((node) => {
      node.addEventListener("mousemove", (event) => {
        const rect = node.getBoundingClientRect();
        node.style.setProperty("--mx", `${(event.clientX - rect.left - rect.width / 2) * .12}px`);
        node.style.setProperty("--my", `${(event.clientY - rect.top - rect.height / 2) * .15}px`);
      });
      node.addEventListener("mouseleave", () => {
        node.style.setProperty("--mx", "0px");
        node.style.setProperty("--my", "0px");
      });
    });

    document.querySelectorAll(".tilt").forEach((node) => {
      node.addEventListener("mousemove", (event) => {
        const rect = node.getBoundingClientRect();
        const px = ((event.clientX - rect.left) / rect.width) * 100;
        const py = ((event.clientY - rect.top) / rect.height) * 100;
        node.style.setProperty("--px", `${px}%`);
        node.style.setProperty("--py", `${py}%`);
        node.style.transform = `perspective(850px) rotateX(${(50 - py) * .055}deg) rotateY(${(px - 50) * .055}deg) translateY(-4px)`;
      });
      node.addEventListener("mouseleave", () => { node.style.transform = ""; });
    });
  }
})();
