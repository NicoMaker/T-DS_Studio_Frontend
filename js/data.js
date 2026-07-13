// ============================================================
// data.js — Caricamento centralizzato dei file JSON
// ============================================================

const SiteData = {
  async load(nome) {
    // "no-cache" obbliga il browser a rivalidare il file col server:
    // se i JSON vengono aggiornati (progetti, servizi, ecc.) le pagine
    // mostrano subito i dati nuovi invece di una copia vecchia in cache.
    const res = await fetch(`data/${nome}.json`, { cache: "no-cache" });
    if (!res.ok)
      throw new Error(
        `Impossibile caricare data/${nome}.json (HTTP ${res.status})`,
      );
    return res.json();
  },

  async loadAll() {
    const [site, servizi, progetti, video] = await Promise.all([
      this.load("site"),
      this.load("servizi"),
      this.load("progetti"),
      this.load("video"),
    ]);
    return { site, servizi, progetti, video };
  },
};
