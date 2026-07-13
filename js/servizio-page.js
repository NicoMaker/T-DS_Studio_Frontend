// ============================================================
// servizio-page.js — Pagina di dettaglio di un singolo servizio
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {
  "use strict";

  const loadingEl = document.getElementById("sd-loading");
  const notfoundEl = document.getElementById("sd-notfound");
  const contentEl = document.getElementById("sd-content");

  try {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get("slug");

    const [siteData, progettiData, serviziData] = await Promise.all([
      SiteData.load("site"),
      SiteData.load("progetti"),
      SiteData.load("servizi"),
    ]);

    window.API_URL = siteData.azienda.apiUrl || "/api/contatti";

    renderFooterSocial(siteData);

    const servizio = (serviziData.servizi || []).find((s) => s.slug === slug);

    if (!servizio) {
      loadingEl.style.display = "none";
      notfoundEl.style.display = "";
      initNav();
      return;
    }

    document.title = `${servizio.titolo} – T-DS Studio`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", servizio.descrizione);

    // Icona / immagine di copertina
    const iconEl = document.getElementById("sd-icon");
    if (servizio.icona) {
      const isUrl = /^https?:\/\/|\//i.test(servizio.icona);
      if (isUrl) {
        iconEl.innerHTML = `
          <img src="${servizio.icona}" alt="" aria-hidden="true" class="sd-icon-bg" onerror="this.style.display='none'" />
          <img src="${servizio.icona}" alt="${servizio.titolo}" loading="lazy" class="sd-icon-main" />`;
        iconEl.setAttribute("data-lightbox-src", servizio.icona);
        iconEl.setAttribute("data-lightbox-caption", servizio.titolo);
        iconEl.setAttribute("role", "button");
        iconEl.setAttribute("tabindex", "0");
        iconEl.setAttribute(
          "aria-label",
          `Ingrandisci l'immagine di ${servizio.titolo}`,
        );
      } else {
        iconEl.textContent = servizio.icona;
      }
    } else {
      iconEl.textContent = "◆";
    }

    document.getElementById("sd-title").textContent = servizio.titolo;
    document.getElementById("sd-desc").textContent = servizio.descrizione;

    const lista = document.getElementById("sd-lista");
    lista.classList.add("lista-check");
    lista.innerHTML = (servizio.dettagli || [])
      .map((d) => `<li>${d}</li>`)
      .join("");

    // FAQ
    const faqWrap = document.getElementById("sd-faq");
    if (servizio.faq && servizio.faq.length) {
      faqWrap.innerHTML = servizio.faq
        .map((f, i) => `
        <div class="faq-item">
          <button class="faq-toggle" aria-expanded="false" aria-controls="faq-body-${i}">
            <span class="faq-label">${f.domanda}</span>
            <span class="faq-plus" aria-hidden="true">+</span>
          </button>
          <div class="faq-body" id="faq-body-${i}">
            <p>${f.risposta}</p>
          </div>
        </div>
      `)
        .join("");

      faqWrap.querySelectorAll(".faq-toggle").forEach((btn) => {
        btn.addEventListener("click", () => {
          const item = btn.closest(".faq-item");
          const eraAperta = item.classList.contains("open");

          faqWrap.querySelectorAll(".faq-item").forEach((el) => {
            el.classList.remove("open");
            el.querySelector(".faq-toggle").setAttribute(
              "aria-expanded",
              "false",
            );
          });

          if (!eraAperta) {
            item.classList.add("open");
            btn.setAttribute("aria-expanded", "true");
          }
        });
      });
    } else {
      faqWrap.innerHTML = "";
    }

    // ── Progetti correlati ──────────────────────────────────
    const correlatiWrap = document.getElementById("sd-correlati-wrap");
    const correlatiGrid = document.getElementById("sd-correlati-grid");
    const correlati =
      servizio.categorie_correlate && servizio.categorie_correlate.length
        ? progettiData.progetti.filter((p) =>
            servizio.categorie_correlate.includes(p.categoria),
          )
        : [];

    if (correlati.length) {
      correlatiGrid.innerHTML = correlati
        .map((p, i) => {
          const linkValido = isUrlValida(p.link);
          const codiceValido = isUrlValida(p.codice);
          const isBehance = linkValido && /behance\.net/i.test(p.link);
          const labelLink = isBehance ? "Guarda su Behance" : "Apri il sito";

          const testoRicerca =
            `${p.titolo} ${p.categoria || ""} ${p.descrizione || ""} ` +
            `${(p.dettagli || []).join(" ")} ${(p.tecnologie || []).join(" ")} ${p.anno || ""}`;

          return `
        <div class="project-card" data-cat="${p.categoria}" data-search="${testoRicerca.replace(/"/g, "&quot;").toLowerCase()}">
          <div class="project-img-wrap" data-lightbox-src="${p.immagine || p.immagine_placeholder}" data-lightbox-caption="${(p.titolo || "").replace(/"/g, "&quot;")}" role="button" tabindex="0" aria-label="Ingrandisci l'immagine di ${p.titolo}">
            <img src="${p.immagine || p.immagine_placeholder}" alt="" aria-hidden="true" loading="lazy" class="project-img-bg" onerror="this.style.display='none'">
            <img src="${p.immagine || p.immagine_placeholder}" alt="${p.titolo}" loading="lazy" class="project-img-main" onerror="this.onerror=null;this.src='${p.immagine_placeholder || ""}'">
            <span class="project-img-zoom-badge" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </span>
            <div class="project-overlay"></div>
          </div>
          <div class="project-body">
            <p class="project-anno">${p.anno}</p>
            <h3 class="project-title">${p.titolo}</h3>
            <p class="project-desc">${p.descrizione}</p>

            <div class="progetto-footer-group">
              ${
                linkValido || codiceValido
                  ? `<div class="progetto-actions">
                      ${
                        linkValido
                          ? `<a class="project-link-btn primario" href="${p.link}" target="_blank" rel="noopener" aria-label="${labelLink}: ${p.titolo}">${labelLink} ${SVG_EXTERNAL}</a>`
                          : ""
                      }
                      ${
                        codiceValido
                          ? `<a class="project-link-btn" href="${p.codice}" target="_blank" rel="noopener" aria-label="Codice sorgente di ${p.titolo} su GitHub">Codice su GitHub ${SVG_EXTERNAL}</a>`
                          : ""
                      }
                    </div>`
                  : ""
              }

              <button
                type="button"
                class="progetto-toggle"
                aria-expanded="false"
                aria-controls="correlato-extra-${p.id || i}"
              >
                <span class="progetto-toggle-label">Più informazioni</span>
                <span class="progetto-plus" aria-hidden="true">+</span>
              </button>

              <div class="progetto-extra" id="correlato-extra-${p.id || i}">
                <div class="progetto-extra-inner">
                  ${
                    p.dettagli && p.dettagli.length
                      ? `<ul class="progetto-dettagli">
                          ${p.dettagli.map((d) => `<li>${d}</li>`).join("")}
                        </ul>`
                      : ""
                  }
                  ${
                    p.tecnologie && p.tecnologie.length
                      ? `<div class="project-tech">${p.tecnologie.map((t) => `<span class="tech-tag">${t}</span>`).join("")}</div>`
                      : ""
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
        })
        .join("");
      correlatiWrap.style.display = "";

      initProgettiToggle(correlatiGrid);

      initFilterGrid({
        grid: correlatiGrid,
        searchInput: document.getElementById("sd-search-correlati"),
        emptyEl: document.getElementById("sd-correlati-empty"),
        cardSelector: ".project-card",
      });
    } else {
      correlatiWrap.style.display = "none";
    }

    // ── Servizi correlati (TUTTI tranne il corrente) ────────
    const altriGrid = document.getElementById("sd-altri-servizi-grid");
    if (altriGrid) {
      const serviziDaMostrare = serviziData.servizi.filter(
        (s) => s.slug !== slug,
      );

      altriGrid.innerHTML = serviziDaMostrare
        .map((s, i) => {
          let iconHtml = "◆";
          if (s.icona) {
            const isUrl = /^https?:\/\/|\//i.test(s.icona);
            if (isUrl) {
              iconHtml = `<img src="${s.icona}" alt="${s.titolo}" loading="lazy" class="servizio-icona-img" />`;
            } else {
              iconHtml = s.icona;
            }
          }
          return `
          <a
            href="servizio.html?slug=${s.slug}"
            class="servizio-card reveal reveal-delay-${i % 3}"
            style="--card-accent:${s.colore || "var(--accent)"}"
            aria-label="Scopri i dettagli di ${s.titolo}"
          >
            <div class="servizio-icona" aria-hidden="true">${iconHtml}</div>
            <h3>${s.titolo}</h3>
            <p>${s.descrizione}</p>
            <span class="servizio-cta">
              Scopri i dettagli
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </span>
          </a>
        `;
        })
        .join("");
    }

    // ── FORM CONTATTI: precompilazione e init ──────────────
    const formSelect = document.getElementById("f-servizio");
    if (formSelect) {
      serviziData.servizi.forEach((s) => {
        const opt = document.createElement("option");
        opt.value = s.titolo;
        opt.textContent = s.titolo;
        formSelect.appendChild(opt);
      });
      formSelect.value = servizio.titolo;
    }

    if (typeof FormContatti !== "undefined") {
      FormContatti.init();
    }

    // ── Scroll liscio al form ──────────────────────────────
    const ctaLinks = document.querySelectorAll(
      'a[href="#contatti-form-servizio"]',
    );
    ctaLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const target = document.getElementById("contatti-form-servizio");
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
          setTimeout(() => {
            const firstInput = target.querySelector("input, select, textarea");
            if (firstInput) firstInput.focus();
          }, 800);
        }
      });
    });

    // ── Mostra contenuto ────────────────────────────────────
    initImageLightbox(contentEl);
    loadingEl.style.display = "none";
    contentEl.style.display = "";

    initNav();
    initReveal();
    if (typeof initMagneticButtons === "function") initMagneticButtons();

    requestAnimationFrame(() => requestAnimationFrame(scrollToCurrentHash));
  } catch (err) {
    console.error("Errore caricamento servizio:", err);
    loadingEl.style.display = "none";
    notfoundEl.style.display = "";
    initNav();
  }
});

window.addEventListener("load", scrollToCurrentHash);

// ============================================================
// Lightbox immagini — mostra l'immagine intera a schermo pieno
// (mobile + desktop). Chiusura: X, click sullo sfondo, ESC.
// ============================================================
function initImageLightbox(scope) {
  let lb = document.getElementById("img-lightbox");

  if (!lb) {
    lb = document.createElement("div");
    lb.id = "img-lightbox";
    lb.className = "img-lightbox";
    lb.setAttribute("role", "dialog");
    lb.setAttribute("aria-modal", "true");
    lb.setAttribute("aria-label", "Immagine ingrandita");
    lb.innerHTML = `
      <button type="button" class="img-lightbox-close" aria-label="Chiudi immagine">✕</button>
      <figure class="img-lightbox-figure">
        <img class="img-lightbox-img" src="" alt="" />
        <figcaption class="img-lightbox-caption"></figcaption>
      </figure>
    `;
    document.body.appendChild(lb);

    const imgEl = lb.querySelector(".img-lightbox-img");
    const captionEl = lb.querySelector(".img-lightbox-caption");
    const closeBtn = lb.querySelector(".img-lightbox-close");

    const close = () => {
      lb.classList.remove("open");
      document.body.classList.remove("lightbox-open");
      // svuota il src dopo la transizione per liberare memoria
      setTimeout(() => {
        if (!lb.classList.contains("open")) imgEl.src = "";
      }, 350);
    };

    closeBtn.addEventListener("click", close);
    lb.addEventListener("click", (e) => {
      if (e.target === lb || e.target.closest(".img-lightbox-figure") === null)
        close();
    });
    lb.querySelector(".img-lightbox-figure").addEventListener("click", (e) => {
      // click sull'immagine non chiude, click intorno sì
      if (e.target !== imgEl) close();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && lb.classList.contains("open")) close();
    });

    lb._open = (src, caption) => {
      imgEl.src = src;
      imgEl.alt = caption || "";
      captionEl.textContent = caption || "";
      captionEl.style.display = caption ? "" : "none";
      lb.classList.add("open");
      document.body.classList.add("lightbox-open");
      closeBtn.focus();
    };
  }

  (scope || document)
    .querySelectorAll("[data-lightbox-src]")
    .forEach((trigger) => {
      const open = () => {
        const src = trigger.getAttribute("data-lightbox-src");
        if (src) lb._open(src, trigger.getAttribute("data-lightbox-caption"));
      };
      trigger.addEventListener("click", open);
      trigger.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      });
    });
}