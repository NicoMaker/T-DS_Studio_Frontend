// ============================================================
// render.js — Costruzione delle sezioni dai JSON originali
// ============================================================

// ── Social SVG icons ──────────────────────────────────────────
const SOCIAL_ICONS = {
  instagram: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" width="20" height="20"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/></svg>`,
  linkedin: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" width="20" height="20"><rect x="2" y="2" width="20" height="20" rx="4" stroke="currentColor" stroke-width="1.8"/><path d="M8 10v6M8 8v.01M12 16v-4.5M12 12c0-1.5 1-2 2-2s2 .5 2 2v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  facebook: `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" width="20" height="20"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`,
  behance: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" width="20" height="20"><rect x="2" y="2" width="20" height="20" rx="4" stroke="currentColor" stroke-width="1.8"/><path d="M8 8h5v1.5H8V8zm0 3.5h6.5V13H8v-1.5zm0 3h8.5v1.5H8v-1.5zM16 8h3v1.5h-3V8zm.5 4.5c1.5 0 3 .8 3 2.5 0 2-1.8 3-3.5 3-1.5 0-3-.8-3-2.5h1.5c0 .8.8 1.5 1.5 1.5s1.5-.7 1.5-1.5c0-.8-.8-1.5-1.5-1.5h-.5v-1.5h.5z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
};

const SVG_EXTERNAL = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M7 17L17 7M17 7H9M17 7V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const SOCIAL_PLATFORMS = [
  { key: "instagram", label: "Instagram", icon: SOCIAL_ICONS.instagram },
  { key: "linkedin", label: "LinkedIn", icon: SOCIAL_ICONS.linkedin },
  { key: "facebook", label: "Facebook", icon: SOCIAL_ICONS.facebook },
  { key: "behance", label: "Behance", icon: SOCIAL_ICONS.behance },
];

// ── Cache per i prefissi internazionali caricati da JSON ──
let PREFISSI_INTERNAZIONALI = [];

// Carica i prefissi da data/paesi-telefono.json (se non già caricati)
async function caricaPrefissi() {
  if (PREFISSI_INTERNAZIONALI.length > 0) return;
  try {
    const lista = await SiteData.load("paesi-telefono");
    if (Array.isArray(lista) && lista.length) {
      // Estrae i dial (senza il '+') e li ordina per lunghezza decrescente
      const dials = lista
        .map(p => p.dial.replace('+', ''))
        .filter(d => /^\d+$/.test(d));
      // Ordina per lunghezza decrescente (così i prefissi più lunghi vengono provati prima)
      PREFISSI_INTERNAZIONALI = dials.sort((a, b) => b.length - a.length);
    }
  } catch (err) {
    console.warn("Impossibile caricare i prefissi telefonici, uso fallback limitato.");
    // Fallback minimo (solo Italia)
    PREFISSI_INTERNAZIONALI = ['39'];
  }
}

// ── Marquee ───────────────────────────────────────────────────
function renderMarquee(datiServizi) {
  const parole = (datiServizi.servizi || []).map((s) => s.titolo);
  buildMarquee(parole);
}

// ── Servizi ──────────────────────────────────────────────────
function renderServizi(dati) {
  const grid = document.getElementById("servizi-grid");
  const titolo = document.getElementById("servizi-titolo");
  const sotto = document.getElementById("servizi-sottotitolo");
  if (!grid) return;

  if (titolo && dati.titolo) titolo.textContent = dati.titolo;
  if (sotto && dati.sottotitolo) sotto.textContent = dati.sottotitolo;

  grid.innerHTML = (dati.servizi || [])
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
        <ul class="servizio-dettagli">
          ${(s.dettagli || []).map((d) => `<li>${d}</li>`).join("")}
        </ul>
        <span class="servizio-cta">
          Scopri i dettagli
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </span>
      </a>`;
    })
    .join("");

  const select = document.getElementById("f-servizio");
  if (select) {
    (dati.servizi || []).forEach((s) => {
      const opt = document.createElement("option");
      opt.value = s.titolo;
      opt.textContent = s.titolo;
      select.appendChild(opt);
    });
    const altro = document.createElement("option");
    altro.value = "Altro";
    altro.textContent = "Altro / non so ancora";
    select.appendChild(altro);
  }
}

// ── Progetti ─────────────────────────────────────────────────
function renderProgetti(dati) {
  const grid = document.getElementById("progetti-grid");
  const titolo = document.getElementById("progetti-titolo");
  const sotto = document.getElementById("progetti-sottotitolo");
  if (!grid) return;

  if (titolo && dati.titolo) titolo.textContent = dati.titolo;
  if (sotto && dati.sottotitolo) sotto.textContent = dati.sottotitolo;

  grid.innerHTML = (dati.progetti || [])
    .map((p, i) => {
      const linkValido = isUrlValida(p.link);
      const codiceValido = isUrlValida(p.codice);
      const isBehance = linkValido && /behance\.net/i.test(p.link);
      const labelLink = isBehance ? "Guarda su Behance" : "Apri il sito";

      const testoRicerca =
        `${p.titolo} ${p.categoria || ""} ${p.descrizione || ""} ` +
        `${(p.dettagli || []).join(" ")} ${(p.tecnologie || []).join(" ")} ${p.anno || ""}`;

      return `
      <article
        class="progetto-card reveal reveal-delay-${i % 3}"
        style="--card-accent:${p.colore || "var(--accent)"}"
        data-cat="${p.categoria || ""}"
        data-search="${testoRicerca.replace(/"/g, "&quot;").toLowerCase()}"
      >
        <div class="progetto-media">
          <img
            src="${p.immagine}"
            alt="${p.titolo}"
            loading="lazy"
            onerror="this.onerror=null;this.src='${p.immagine_placeholder || ""}'"
          />
        </div>
        <div class="progetto-body">
          <div class="progetto-meta">
            <span>${p.categoria || ""}</span>
            <span class="anno">${p.anno || ""}</span>
          </div>
          <h3>${p.titolo}</h3>
          <p>${p.descrizione || ""}</p>

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
              aria-controls="progetto-extra-${p.id || i}"
            >
              <span class="progetto-toggle-label">Più informazioni</span>
              <span class="progetto-plus" aria-hidden="true">+</span>
            </button>

            <div class="progetto-extra" id="progetto-extra-${p.id || i}">
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
                    ? `<div class="progetto-tags">
                        ${p.tecnologie.map((t) => `<span class="tag">${t}</span>`).join("")}
                      </div>`
                    : ""
                }
              </div>
            </div>
          </div>
        </div>
      </article>`;
    })
    .join("");

  initProgettiToggle(grid);
}

// Apertura/chiusura del pannello "Più informazioni"
function initProgettiToggle(grid) {
  if (grid.dataset.toggleInit) return;
  grid.dataset.toggleInit = "true";

  grid.addEventListener("click", (e) => {
    const btn = e.target.closest(".progetto-toggle");
    if (!btn || !grid.contains(btn)) return;

    const card = btn.closest(".progetto-card, .project-card");
    if (!card) return;
    const aperta = card.classList.toggle("open");
    btn.setAttribute("aria-expanded", String(aperta));
    btn.querySelector(".progetto-toggle-label").textContent = aperta
      ? "Meno informazioni"
      : "Più informazioni";
  });
}

function isUrlValida(link) {
  if (!link || typeof link !== "string") return false;
  return /^(https?:\/\/|\/)/i.test(link.trim());
}

// ── Video ────────────────────────────────────────────────────
function renderVideo(dati) {
  const grid = document.getElementById("video-grid");
  const titolo = document.getElementById("video-titolo");
  const sotto = document.getElementById("video-sottotitolo");
  if (!grid) return;

  if (titolo && dati.titolo) titolo.textContent = dati.titolo;
  if (sotto && dati.sottotitolo) sotto.textContent = dati.sottotitolo;

  const lista = dati.video || [];
  if (!lista.length) {
    document.getElementById("video").style.display = "none";
    return;
  }

  grid.innerHTML = lista
    .map((v, i) => {
      let frame = "";
      if (v.tipo === "youtube" && v.id) {
        frame = `<iframe
          src="https://www.youtube-nocookie.com/embed/${v.id}"
          title="${v.titolo || "Video"}"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen></iframe>`;
      } else if (v.tipo === "mp4" && v.src) {
        frame = `<video controls preload="metadata" ${v.poster ? `poster="${v.poster}"` : ""}>
          <source src="${v.src}" type="video/mp4" />
          Il tuo browser non supporta il video.
        </video>`;
      } else {
        return "";
      }

      return `
      <article class="video-card reveal reveal-delay-${i % 3}">
        <div class="video-frame">${frame}</div>
        <div class="video-body">
          <h3>${v.titolo || ""}</h3>
          <p>${v.descrizione || ""}</p>
        </div>
      </article>`;
    })
    .join("");
}

// ── Utilità per numeri e icone ──────────────────────────────
// Formatta un numero di telefono usando i prefissi caricati da JSON
function formatNumeroVisuale(numero) {
  if (!numero) return '';
  let num = String(numero).replace(/\s+/g, '');
  let prefisso = '';
  let resto = num;

  // Se inizia con '00' o '+' estraiamo il prefisso internazionale
  if (num.startsWith('+')) {
    num = num.substring(1);
  } else if (num.startsWith('00')) {
    num = num.substring(2);
  }

  // Cerca il prefisso più lungo che corrisponde all'inizio di num
  let trovato = false;
  for (const p of PREFISSI_INTERNAZIONALI) {
    if (num.startsWith(p)) {
      prefisso = '+' + p;
      resto = num.substring(p.length);
      trovato = true;
      break;
    }
  }
  if (!trovato) {
    // Se non riconosciamo il prefisso, restituiamo il numero così com'è
    return numero;
  }

  // Formatta il resto in gruppi di 3 da sinistra
  const gruppi = [];
  for (let i = 0; i < resto.length; i += 3) {
    gruppi.push(resto.slice(i, i + 3));
  }
  if (gruppi.length > 1 && gruppi[gruppi.length - 1].length < 3) {
    const ultimo = gruppi.pop();
    gruppi[gruppi.length - 1] += ultimo;
  }
  return prefisso + ' ' + gruppi.join(' ');
}

function flagImgHtml(iso, opts = {}) {
  if (!iso || iso.length !== 2) return "";
  const { width = 20, height = 15, className = "flag-icon" } = opts;
  const code = iso.toLowerCase();
  return `<img src="https://flagcdn.com/${code}.svg" alt="${iso.toUpperCase()}" class="${className}" width="${width}" height="${height}" loading="lazy" />`;
}

function renderPiva(piva) {
  const match = String(piva).match(/^([A-Za-z]{2})(.*)$/);
  if (!match) return `P.IVA ${piva}`;
  const iso = match[1].toUpperCase();
  const flagHtml = flagImgHtml(iso, { width: 18, height: 13 });
  return `<span class="team-piva-flag" aria-hidden="true">${flagHtml || iso}</span> P.IVA ${match[2]}`;
}

function contattoTeam(c, icona, valore) {
  if (!c || !c.url) return "";
  const iconaHtml = icona.trim().startsWith("<svg")
    ? icona
    : `<span class="material-icons" aria-hidden="true">${icona}</span>`;
  return `<a class="team-contatto-riga" href="${c.url}" target="_blank" rel="noopener" title="${c.label || ""}" aria-label="${c.label || ""}">
    ${iconaHtml}
    <span class="team-contatto-testo">${valore || c.label || ""}</span>
  </a>`;
}

// ── Team ──────────────────────────────────────────────────────
// NOTA: renderTeam ora è asincrona per caricare i prefissi se necessario
async function renderTeam(site) {
  // Carica i prefissi se non già disponibili
  await caricaPrefissi();

  const grid = document.getElementById("team-grid");
  const sotto = document.getElementById("team-sottotitolo");
  if (!grid) return;

  const azienda = site.azienda || {};
  if (sotto && azienda.descrizione) sotto.textContent = azienda.descrizione;

  let html = (site.team || [])
    .map((m, i) => {
      return `
      <article class="team-card reveal reveal-delay-${i % 3}">
        <div class="team-foto">
          <img src="${m.foto}" alt="${m.nome}" loading="lazy" />
        </div>
        <div class="team-body">
          <h3>${m.nome}</h3>
          <div class="team-ruolo">${m.ruolo || ""}</div>
          ${m.piva ? `<div class="team-piva">${renderPiva(m.piva)}</div>` : ""}
          <div class="team-contatti-list">
            ${contattoTeam(m.contatti && m.contatti.whatsapp, "chat", formatNumeroVisuale(m.contatti && m.contatti.whatsapp && m.contatti.whatsapp.numero))}
            ${contattoTeam(m.contatti && m.contatti.telefono, "call", formatNumeroVisuale(m.contatti && m.contatti.telefono && m.contatti.telefono.numero))}
            ${contattoTeam(m.contatti && m.contatti.email, "email", m.contatti && m.contatti.email && m.contatti.email.indirizzo)}
          </div>
        </div>
      </article>
    `;
    })
    .join("");

  // ── Card aziendale ──
  if (azienda.contattiAzienda) {
    const ca = azienda.contattiAzienda;
    const contattiAzienda = [
      ca.whatsapp &&
        contattoTeam(
          ca.whatsapp,
          "chat",
          formatNumeroVisuale(ca.whatsapp.numero),
        ),
      ca.telefono &&
        contattoTeam(
          ca.telefono,
          "call",
          formatNumeroVisuale(ca.telefono.numero),
        ),
      ca.email && contattoTeam(ca.email, "email", ca.email.indirizzo),
    ].filter(Boolean);

    const delayIndex = (site.team || []).length % 3;

    let fotoHtml;
    if (azienda.foto) {
      fotoHtml = `<img src="${azienda.foto}" alt="${azienda.nome || "Azienda"}" loading="lazy" />`;
    } else {
      fotoHtml = `<span style="background: var(--accent); display: grid; place-items: center; font-size: 2.2rem; color: #fff; font-weight: 800; width: 100%; height: 100%; border-radius: 50%;">${(azienda.nome || "A").trim().charAt(0)}.</span>`;
    }

    html += `
      <article class="team-card azienda reveal reveal-delay-${delayIndex}" style="border-color: var(--line-strong);">
        <div class="team-foto">
          ${fotoHtml}
        </div>
        <div class="team-body">
          <h3>${azienda.nome || "Azienda"}</h3>
          <div class="team-ruolo">${ca.ruolo || "Contatti generali"}</div>
          <div class="team-contatti-list">
            ${contattiAzienda.join("")}
          </div>
        </div>
      </article>
    `;
  }

  grid.innerHTML = html;
}

// ── Footer social ────────────────────────────────────────────
function renderFooterSocial(site) {
  const wrap = document.getElementById("footer-social");
  if (!wrap) return;
  const social = (site && site.social) || {};

  wrap.innerHTML = SOCIAL_PLATFORMS.filter((p) => social[p.key])
    .map((p) => `
      <a
        href="${social[p.key]}"
        target="_blank"
        rel="noopener"
        class="footer-social-link"
        aria-label="${p.label}"
        title="${p.label}"
      >
        ${p.icon}
        <span class="footer-social-label">${p.label}</span>
      </a>
    `)
    .join("");
}