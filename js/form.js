// ============================================================
// form.js — Validazione live e invio del form contatti
// Email: accetta SOLO indirizzi email validi
// Telefono: gestito da phone-input.js (solo cifre + prefisso)
// ============================================================

const FormContatti = {
  form: null,
  API_URL: "/api/contatti",

  // Dopo quanti millisecondi la scritta di esito ("mail inviata" / errore)
  // sparisce da sola dalla pagina.
  ESITO_TIMEOUT_MS: 30000,
  _esitoTimer: null,
  _esitoFadeTimer: null,

  // Programma la scomparsa automatica del messaggio di esito dopo 30 secondi
  nascondiEsitoDopo(esito) {
    clearTimeout(this._esitoTimer);
    clearTimeout(this._esitoFadeTimer);
    this._esitoTimer = setTimeout(() => {
      esito.classList.add("nascosto"); // fade-out morbido (CSS)
      this._esitoFadeTimer = setTimeout(() => {
        esito.className = "form-esito";
        esito.textContent = "";
      }, 700); // attende la fine della transizione
    }, this.ESITO_TIMEOUT_MS);
  },

  // Regex email rigorosa (nome@dominio.tld)
  EMAIL_REGEX: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,

  init() {
    this.form = document.getElementById("form-contatti");
    if (!this.form) return;

    PhoneInput.init();

    // Validazione live quando l'utente esce dal campo
    ["nome", "cognome", "email", "servizio", "messaggio"].forEach((campo) => {
      const el = this.form.elements[campo];
      if (!el) return;
      el.addEventListener("blur", () => this.validaCampo(campo));
      el.addEventListener("input", () => this.pulisciErrore(campo));
    });

    const tel = document.getElementById("f-telefono");
    tel.addEventListener("blur", () => this.validaCampo("telefono"));
    tel.addEventListener("input", () => this.pulisciErrore("telefono"));

    // Blocca caratteri non ammessi nell'email in tempo reale:
    // si può digitare SOLO ciò che è valido in un indirizzo email
    // (lettere, numeri, . _ % + - e una sola @). Niente spazi o simboli strani.
    const email = document.getElementById("f-email");
    const EMAIL_CHARS = /^[a-zA-Z0-9._%+-@]+$/;
    email.addEventListener("beforeinput", (e) => {
      if (e.inputType.startsWith("insert") && e.data) {
        if (!EMAIL_CHARS.test(e.data)) {
          e.preventDefault();
          return;
        }
        // Una sola @ ammessa nell'indirizzo
        if (e.data.includes("@") && email.value.includes("@")) {
          e.preventDefault();
        }
      }
    });
    // Ripulisce anche testo incollato con caratteri non ammessi
    email.addEventListener("input", () => {
      const pulito = email.value.replace(/[^a-zA-Z0-9._%+@-]/g, "");
      if (pulito !== email.value) email.value = pulito;
    });

    this.form.addEventListener("submit", (e) => this.invia(e));
  },

  // ── Validazione singolo campo ──
  validaCampo(campo) {
    const el = this.form.elements[campo];
    const valore = el ? String(el.value).trim() : "";
    let errore = "";

    switch (campo) {
      case "nome":
        if (!valore) errore = "Il nome è obbligatorio.";
        break;
      case "cognome":
        if (!valore) errore = "Il cognome è obbligatorio.";
        break;
      case "email":
        if (!valore) errore = "L'email è obbligatoria.";
        else if (!this.EMAIL_REGEX.test(valore))
          errore = "Inserisci un indirizzo email valido (es. nome@esempio.it).";
        break;
      case "telefono":
        if (!PhoneInput.isValid()) errore = PhoneInput.messaggioErrore();
        break;
      case "servizio":
        if (!valore) errore = "Scegli il servizio che ti interessa.";
        break;
      case "messaggio":
        if (!valore) errore = "Scrivici due righe sul tuo progetto.";
        else if (valore.length < 10)
          errore = "Il messaggio è troppo corto (minimo 10 caratteri).";
        break;
    }

    this.mostraErrore(campo, errore);
    return !errore;
  },

  mostraErrore(campo, errore) {
    const span = this.form.querySelector(`[data-error-for="${campo}"]`);
    const wrapper = span ? span.closest(".form-field") : null;
    if (span) span.textContent = errore;
    if (wrapper) wrapper.classList.toggle("invalid", Boolean(errore));
  },

  pulisciErrore(campo) {
    this.mostraErrore(campo, "");
  },

  validaTutto() {
    const campi = [
      "nome",
      "cognome",
      "email",
      "telefono",
      "servizio",
      "messaggio",
    ];
    let ok = true;
    campi.forEach((c) => {
      if (!this.validaCampo(c)) ok = false;
    });
    return ok;
  },

  // ── Invio ──
  async invia(e) {
    e.preventDefault();
    const esito = document.getElementById("form-esito");
    clearTimeout(this._esitoTimer);
    clearTimeout(this._esitoFadeTimer);
    esito.className = "form-esito";
    esito.textContent = "";

    if (!this.validaTutto()) {
      const primoErrore = this.form.querySelector(
        ".form-field.invalid input, .form-field.invalid select, .form-field.invalid textarea",
      );
      if (primoErrore) primoErrore.focus();
      return;
    }

    const btn = document.getElementById("btn-invia");
    btn.classList.add("loading");

    const payload = {
      nome: this.form.elements.nome.value.trim(),
      cognome: this.form.elements.cognome.value.trim(),
      email: this.form.elements.email.value.trim(),
      telefono: PhoneInput.getFullNumber(),
      prefisso: PhoneInput.paese.dial,
      // Il numero fisso non ha una nazione selezionabile: essendo un
      // numero di rete fissa italiano, la bandiera mostrata è quella IT.
      nazione: PhoneInput.modalita === "fisso" ? "IT" : PhoneInput.paese.iso,
      // "mobile" | "fisso" — serve al backend per scrivere nell'email
      // "Cellulare" oppure "Telefono fisso" accanto alla bandiera.
      tipoTelefono: PhoneInput.modalita,
      servizio: this.form.elements.servizio.value,
      messaggio: this.form.elements.messaggio.value.trim(),
    };

    try {
      const res = await fetch(this.API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const dati = await res.json();

      if (res.ok && dati.ok) {
        esito.classList.add("ok");
        esito.textContent =
          dati.message || "Richiesta inviata! Ti risponderemo al più presto.";
        this.form.reset();
        document.getElementById("f-telefono").value = "";
      } else {
        esito.classList.add("errore");
        esito.textContent =
          (dati.errori && dati.errori.join(" ")) ||
          "Si è verificato un errore. Riprova o chiamaci direttamente.";
      }
    } catch (err) {
      console.error("Errore invio form:", err);
      esito.classList.add("errore");
      esito.textContent =
        "Impossibile contattare il server. Controlla la connessione o chiamaci al telefono.";
    } finally {
      btn.classList.remove("loading");
      esito.scrollIntoView({ behavior: "smooth", block: "nearest" });
      // La scritta di esito ("Richiesta inviata!" o errore) sparisce
      // automaticamente dopo 30 secondi.
      if (esito.textContent) this.nascondiEsitoDopo(esito);
    }
  },
};
