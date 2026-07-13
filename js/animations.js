// ============================================================
// animations.js — Reveal allo scroll, contatori, parallax, loader
// ============================================================

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

// Il sito non ha più un loader/video di apertura: la home è già
// pronta (classe "hero-ready" impostata direttamente nell'HTML) e i dati
// vengono semplicemente renderizzati non appena arrivano.
function markSiteDataReady() {}
window.markSiteDataReady = markSiteDataReady;

// ── Reveal allo scroll ──────────────────────────────────────
function initReveal() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
  );

  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
}

// ── Contatori animati (sezione numeri) ─────────────────────
function initCounters() {
  const counters = document.querySelectorAll("[data-count]");
  if (!counters.length) return;

  const animate = (el) => {
    const target = Number(el.dataset.count);
    const suffisso = el.dataset.suffix || "";
    if (prefersReducedMotion) {
      el.textContent = target + suffisso;
      return;
    }
    const durata = 1600;
    const start = performance.now();
    const step = (now) => {
      const t = Math.min((now - start) / durata, 1);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      el.textContent = Math.round(target * eased) + suffisso;
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          animate(e.target);
          obs.unobserve(e.target);
        }
      });
    },
    { threshold: 0.5 },
  );
  counters.forEach((c) => obs.observe(c));
}

// ── Parallax leggero sull'hero ──────────────────────────────
function initParallax() {
  if (prefersReducedMotion) return;
  const media = document.getElementById("hero-media");
  if (!media) return;

  let ticking = false;
  window.addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        if (y < window.innerHeight * 1.2) {
          media.style.transform = `translateY(${y * 0.22}px)`;
        }
        ticking = false;
      });
    },
    { passive: true },
  );
}

// ── Pulsanti "magnetici" (si spostano leggermente verso il cursore) ──
function initMagneticButtons() {
  if (prefersReducedMotion) return;
  if (window.matchMedia("(hover: none)").matches) return; // no touch

  document.querySelectorAll(".btn").forEach((btn) => {
    btn.addEventListener("mousemove", (e) => {
      const r = btn.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      btn.style.transform = `translate(${x * 0.18}px, ${y * 0.35}px)`;
    });
    btn.addEventListener("mouseleave", () => {
      btn.style.transform = "";
    });
  });
}

// ── Glow che segue il cursore nell'hero (disabilitato per b/n) ──
function initHeroGlow() {
  // Non facciamo nulla per evitare gradienti colorati
}

// ── Marquee (duplicazione contenuto per loop infinito) ──────
function buildMarquee(parole) {
  const track = document.getElementById("marquee-track");
  if (!track || !parole || !parole.length) return;

  const blocco = parole
    .map(
      (p) =>
        `<span class="marquee-item">${p} <span class="marquee-sep">✳</span></span>`,
    )
    .join("");

  // Due copie identiche per un loop continuo (translateX -50%)
  track.innerHTML = blocco + blocco;
}

// ── Barra di progresso scroll in cima alla pagina ────────────
function initScrollProgress() {
  if (prefersReducedMotion) return;
  const bar = document.createElement("div");
  bar.className = "scroll-progress";
  bar.setAttribute("aria-hidden", "true");
  document.body.appendChild(bar);

  let ticking = false;
  const update = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? window.scrollY / max : 0;
    bar.style.transform = `scaleX(${Math.min(Math.max(p, 0), 1)})`;
    ticking = false;
  };
  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true },
  );
  update();
}

// ── Spotlight sulle card: un alone arancio segue il cursore ──
// (le card leggono --mx / --my nel CSS via radial-gradient)
function initCardSpotlight() {
  if (prefersReducedMotion) return;
  if (window.matchMedia("(hover: none)").matches) return;

  const selettori = ".servizio-card, .progetto-card, .team-card, .project-card";

  document.addEventListener("pointermove", (e) => {
    const card = e.target.closest(selettori);
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${e.clientX - r.left}px`);
    card.style.setProperty("--my", `${e.clientY - r.top}px`);
  });
}

initScrollProgress();
// Delegato sul documento: funziona anche sulle card generate dopo il render
initCardSpotlight();
