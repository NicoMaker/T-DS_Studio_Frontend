// ============================================================
// main.js — Entry point del sito
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {
  // initNav() viene chiamata dopo il rendering, non qui

  try {
    const { site, servizi, progetti, video } = await SiteData.loadAll();

    window.API_URL = site.azienda.apiUrl || "/api/contatti";

    renderMarquee(servizi);
    renderServizi(servizi);
    renderProgetti(progetti);
    renderVideo(video);
    await renderTeam(site); // <-- ora è asincrona
    renderFooterSocial(site);

    initFilterGrid({
      grid: document.getElementById("progetti-grid"),
      searchInput: document.getElementById("progetti-search"),
      catWrap: document.getElementById("progetti-categorie"),
      emptyEl: document.getElementById("progetti-empty"),
      cardSelector: ".progetto-card",
    });

    FormContatti.init();

    // Ora che marquee/grid hanno la loro altezza reale, corregge l'eventuale
    // scroll all'ancora (#servizi, #team, ecc.) fatto in anticipo dal browser
    requestAnimationFrame(() => requestAnimationFrame(scrollToCurrentHash));
  } catch (err) {
    console.error("Errore nel caricamento dei dati del sito:", err);
  } finally {
    // Ora le sezioni sono state generate, possiamo inizializzare la navigazione
    initNav();
    initReveal();
    initCounters();
    initParallax();
    initMagneticButtons();
    initHeroGlow();
    // Non chiude subito il loader: aspetta anche che la sequenza
    // video + scritta del loader sia finita (vedi animations.js).
    markSiteDataReady();
  }
});

// Ulteriore correzione di sicurezza a caricamento completato (font/immagini
// possono ancora spostare leggermente il layout dopo il primo controllo)
window.addEventListener("load", scrollToCurrentHash);