// ============================================================
// progetti-filter.js — Ricerca + filtro categorie con select
// ============================================================

function initFilterGrid({
  grid,
  searchInput,
  catWrap,
  emptyEl,
  cardSelector,
  categorie,
}) {
  if (!grid || !searchInput) return;

  const getCards = () => grid.querySelectorAll(cardSelector);

  const elencoCategorie =
    categorie && categorie.length
      ? categorie
      : [...new Set([...getCards()].map((c) => c.dataset.cat).filter(Boolean))];

  let categoriaAttiva = "Tutti";

  function applyFilter() {
    const query = searchInput.value.toLowerCase().trim();
    let visibili = 0;

    getCards().forEach((card) => {
      const cat = card.dataset.cat || "";
      const searchData = (card.dataset.search || "").toLowerCase();
      const matchCat = categoriaAttiva === "Tutti" || cat === categoriaAttiva;
      const matchSearch = !query || searchData.includes(query);
      const visibile = matchCat && matchSearch;
      card.classList.toggle("hidden", !visibile);
      if (visibile) visibili++;
    });

    if (emptyEl) emptyEl.style.display = visibili === 0 ? "" : "none";
  }

  // ── Creazione del select per le categorie ──
  if (catWrap) {
    // Svuota il contenitore
    catWrap.innerHTML = "";

    const select = document.createElement("select");
    select.id = "categoria-select";
    select.setAttribute("aria-label", "Filtra per categoria");

    // Opzione "Tutti"
    const allOpt = document.createElement("option");
    allOpt.value = "Tutti";
    allOpt.textContent = "Tutte le categorie";
    select.appendChild(allOpt);

    // Opzioni per ogni categoria
    elencoCategorie.forEach((cat) => {
      const opt = document.createElement("option");
      opt.value = cat;
      opt.textContent = cat;
      select.appendChild(opt);
    });

    // Evento change
    select.addEventListener("change", () => {
      categoriaAttiva = select.value;
      applyFilter();
    });

    catWrap.appendChild(select);
  }

  // ── Ricerca con scroll intelligente (solo desktop) ──
  let eraVuoto = true;
  let scrollCooldown = false;
  const isMobile = () => window.innerWidth < 640 || "ontouchstart" in window;

  searchInput.addEventListener("input", () => {
    const vuoto = !searchInput.value.trim();

    if (!isMobile() && eraVuoto && !vuoto && !scrollCooldown) {
      scrollCooldown = true;
      const target = grid.closest("section") || grid;
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      setTimeout(() => {
        scrollCooldown = false;
      }, 600);
    }

    eraVuoto = vuoto;
    applyFilter();
  });

  // Riapplica al resize
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(applyFilter, 200);
  });

  applyFilter();
}
