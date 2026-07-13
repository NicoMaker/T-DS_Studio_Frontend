// ============================================================
// phone-input.js — Campo cellulare con selettore nazione
// - Bandiera + prefisso internazionale selezionabile
// - Nel campo si possono digitare SOLO cifre (e spazi)
// - Espone PhoneInput.getFullNumber() e PhoneInput.isValid()
// - L'elenco paesi/prefissi arriva da data/paesi-telefono.json
// ============================================================

// Paese di riserva, usato solo se data/paesi-telefono.json non si carica
const PHONE_COUNTRY_FALLBACK = {
  iso: "IT",
  nome: "Italia",
  dial: "+39",
  min: 8,
  max: 11,
};

// "Nazione" fittizia per il numero fisso: nessun prefisso internazionale,
// solo un range di cifre ragionevole per un numero di casa.
const PHONE_FISSO = {
  iso: "",
  nome: "telefono fisso",
  dial: "",
  min: 5,
  max: 12,
};

const PhoneInput = {
  paese: PHONE_COUNTRY_FALLBACK, // sostituito appena il JSON è caricato
  paeseMobile: PHONE_COUNTRY_FALLBACK, // ultima nazione scelta per il cellulare
  modalita: "mobile", // "mobile" | "fisso"
  countries: [PHONE_COUNTRY_FALLBACK],
  input: null,

  async init() {
    this.input = document.getElementById("f-telefono");
    const btn = document.getElementById("phone-country-btn");
    const dropdown = document.getElementById("phone-dropdown");
    const dropdownList = document.getElementById("phone-dropdown-list");
    const searchInput = document.getElementById("phone-search");
    const emptyEl = document.getElementById("phone-dropdown-empty");
    const flagEl = document.getElementById("phone-flag");
    const dialEl = document.getElementById("phone-dial");
    if (!this.input || !btn || !dropdown || !dropdownList) return;

    try {
      const lista = await SiteData.load("paesi-telefono");
      if (Array.isArray(lista) && lista.length) this.countries = lista;
      this.countries.sort((a, b) =>
        (a.nome || "").localeCompare(b.nome || "", "it"),
      );
    } catch (err) {
      console.error("Impossibile caricare data/paesi-telefono.json:", err);
    }

    this.paese =
      this.countries.find((c) => c.iso === "IT") || this.countries[0];
    this.paeseMobile = this.paese;

    // Costruisce la lista nazioni
    dropdownList.innerHTML = this.countries
      .map((c) => {
        const chiave = `${c.nome} ${c.dial} ${c.iso}`.toLowerCase();
        return `
    <li role="option" data-iso="${c.iso}" data-search="${chiave}" aria-selected="${c.iso === this.paese.iso}">
      <span class="dd-flag">${flagImgHtml(c.iso, { width: 20, height: 15 })}</span>
      <span>${c.nome}</span>
      <span class="dd-dial">${c.dial}</span>
    </li>`;
      })
      .join("");

    flagEl.innerHTML = flagImgHtml(this.paese.iso, { width: 20, height: 15 });
    dialEl.textContent = this.paese.dial;

    // Filtro ricerca
    const filtraLista = () => {
      const q = searchInput.value.trim().toLowerCase();
      let visibili = 0;
      dropdownList.querySelectorAll("li[data-iso]").forEach((li) => {
        const match = !q || (li.dataset.search || "").includes(q);
        li.style.display = match ? "" : "none";
        if (match) visibili++;
      });
      if (emptyEl) emptyEl.style.display = visibili ? "none" : "";
    };
    if (searchInput) searchInput.addEventListener("input", filtraLista);

    const chiudi = () => {
      dropdown.classList.remove("open");
      btn.setAttribute("aria-expanded", "false");
      if (searchInput) searchInput.value = "";
      filtraLista();
    };

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const open = dropdown.classList.toggle("open");
      btn.setAttribute("aria-expanded", String(open));
      if (open && searchInput) {
        setTimeout(() => searchInput.focus(), 0);
      }
    });

    dropdown.addEventListener("click", (e) => {
      const li = e.target.closest("li[data-iso]");
      if (!li) return;
      const paese = this.countries.find((c) => c.iso === li.dataset.iso);
      if (paese) {
        this.paese = paese;
        this.paeseMobile = paese;
        flagEl.innerHTML = flagImgHtml(paese.iso, { width: 20, height: 15 });
        dialEl.textContent = paese.dial;
        dropdownList
          .querySelectorAll("li")
          .forEach((el) => el.setAttribute("aria-selected", String(el === li)));
        this.input.dispatchEvent(new Event("input"));
      }
      chiudi();
      this.input.focus();
    });

    document.addEventListener("click", (e) => {
      if (!dropdown.contains(e.target)) chiudi();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") chiudi();
    });

    if (searchInput) {
      searchInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") e.preventDefault();
      });
    }

    // ── Link "Non hai un cellulare? Usa un fisso" ──
    const typeLink = document.getElementById("phone-type-link");
    const phoneField = document.getElementById("phone-field");
    const phoneLabel = document.getElementById("phone-label");

    const impostaModalita = (tipo) => {
      this.modalita = tipo;
      if (tipo === "fisso") {
        this.paese = PHONE_FISSO;
        if (phoneField) phoneField.classList.add("solo-numero");
        if (phoneLabel) phoneLabel.textContent = "Telefono fisso *";
        this.input.placeholder = "0541 123456";
        if (typeLink) typeLink.textContent = "← Usa invece il cellulare";
      } else {
        this.paese = this.paeseMobile;
        if (phoneField) phoneField.classList.remove("solo-numero");
        if (phoneLabel) phoneLabel.textContent = "Cellulare *";
        this.input.placeholder = "333 123 4567";
        if (typeLink)
          typeLink.textContent = "Non hai un cellulare? Usa un fisso";
      }
      if (typeLink) typeLink.dataset.tipo = tipo;
      this.input.dispatchEvent(new Event("input"));
    };

    if (typeLink) {
      typeLink.addEventListener("click", () => {
        const nuovo = typeLink.dataset.tipo === "mobile" ? "fisso" : "mobile";
        impostaModalita(nuovo);
      });
    }

    // ── SOLO CIFRE: blocca spazi, lettere, simboli ──
    this.input.addEventListener("beforeinput", (e) => {
      if (e.inputType.startsWith("insert") && e.data) {
        // Permetti solo cifre (0-9)
        if (!/^\d$/.test(e.data)) {
          e.preventDefault();
        }
      }
    });

    // Pulisce incolla / autocompletamento: rimuove tutto tranne le cifre
    this.input.addEventListener("input", () => {
      const soloCifre = this.input.value.replace(/\D/g, "");
      if (soloCifre !== this.input.value) {
        this.input.value = soloCifre;
      }

      // Limita alla lunghezza massima del paese (conta solo le cifre)
      const cifre = this.getDigits();
      if (cifre.length > this.paese.max) {
        let rimaste = this.paese.max;
        this.input.value = this.input.value
          .replace(/\d/g, (d) => (rimaste-- > 0 ? d : ""))
          .trimEnd();
      }
    });
  },

  getDigits() {
    return this.input ? this.input.value.replace(/\D/g, "") : "";
  },

  // Numero completo con prefisso, es. "+393391234567"
  getFullNumber() {
    return this.paese.dial + this.getDigits();
  },

  isValid() {
    const n = this.getDigits().length;
    return n >= this.paese.min && n <= this.paese.max;
  },

  messaggioErrore() {
    if (!this.getDigits().length)
      return "Il numero di telefono è obbligatorio.";
    if (!this.paese.iso)
      return `Numero fisso non valido: servono da ${this.paese.min} a ${this.paese.max} cifre.`;
    return `Numero non valido per ${this.paese.nome}: servono da ${this.paese.min} a ${this.paese.max} cifre.`;
  },
};
