// ============================================================
// progetti-filter.js — Ricerca + filtro categorie riutilizzabile
// Usato sia nella sezione "I Nostri Lavori" della home, sia nei
// "Progetti correlati" della pagina di dettaglio servizio.
// ============================================================

/**
 * Collega ricerca testuale + pillole categoria a una griglia di card.
 * Ogni card deve avere data-cat="Categoria" e data-search="testo utile".
 *
 * @param {Object} opts
 * @param {HTMLElement} opts.grid          - contenitore delle card
 * @param {HTMLInputElement} opts.searchInput
 * @param {HTMLElement} [opts.catWrap]     - contenitore delle pillole categoria
 * @param {HTMLElement} [opts.emptyEl]     - messaggio "nessun risultato"
 * @param {string} opts.cardSelector       - selettore delle singole card
 * @param {string[]} [opts.categorie]      - elenco categorie (auto se omesso)
 */
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

  if (catWrap && elencoCategorie.length) {
    catWrap.innerHTML = ["Tutti", ...elencoCategorie]
      .map(
        (c, i) =>
          `<button type="button" class="cat-pill${i === 0 ? " active" : ""}" data-cat="${c}">${c}</button>`,
      )
      .join("");

    catWrap.addEventListener("click", (e) => {
      const btn = e.target.closest(".cat-pill");
      if (!btn) return;
      categoriaAttiva = btn.dataset.cat;
      catWrap
        .querySelectorAll(".cat-pill")
        .forEach((b) => b.classList.toggle("active", b === btn));
      applyFilter();
    });
  }

  // ── Ricerca "automatica": appena inizi a scrivere, la pagina scorre
  // da sola all'inizio della sezione risultati (utile soprattutto da
  // mobile, dove la tastiera copre la griglia). Scorre una sola volta
  // per digitazione (non ad ogni tasto), quando il campo passa da
  // vuoto a pieno.
  let eraVuoto = true;
  searchInput.addEventListener("input", () => {
    const vuoto = !searchInput.value.trim();
    if (eraVuoto && !vuoto) {
      const target = grid.closest("section") || grid;
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    eraVuoto = vuoto;
    applyFilter();
  });
  applyFilter();
}
