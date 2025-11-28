import { auth, provider, signInWithPopup, signOut } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  getLanguages,
  addLanguage,
  getWordsByLetter,
  searchWordsInLanguage,
  addWord,
  getElements,
  addElementSentence
} from "./data-service.js";

const app = document.getElementById("app");
const btnLogin = document.getElementById("btnLogin");
const btnLogout = document.getElementById("btnLogout");
const navUserEmail = document.getElementById("navUserEmail");
const navBreadcrumb = document.getElementById("navBreadcrumb");

/* ---------------------------------------
   ✅ Utility: Set Breadcrumb
---------------------------------------- */
function setBreadcrumb(text) {
  navBreadcrumb.textContent = text || "";
}

/* ---------------------------------------
   ✅ Utility: Create Search Bar
---------------------------------------- */
function createSearchBar(placeholder, onChange) {
  const wrapper = document.createElement("div");
  wrapper.className = "searchBarWrapper";

  const bar = document.createElement("div");
  bar.className = "searchBar";

  const icon = document.createElement("span");
  icon.className = "searchIcon";
  icon.textContent = "🔍";

  const input = document.createElement("input");
  input.type = "text";
  input.className = "searchInput";
  input.placeholder = placeholder || "Cari…";

  const clearBtn = document.createElement("button");
  clearBtn.className = "searchClear hidden";
  clearBtn.type = "button";
  clearBtn.textContent = "✕";

  bar.appendChild(icon);
  bar.appendChild(input);
  bar.appendChild(clearBtn);
  wrapper.appendChild(bar);

  let timeoutId = null;

  input.addEventListener("input", () => {
    const value = input.value;

    if (value) clearBtn.classList.remove("hidden");
    else clearBtn.classList.add("hidden");

    if (timeoutId) window.clearTimeout(timeoutId);

    timeoutId = window.setTimeout(() => {
      onChange(value);
    }, 200);
  });

  clearBtn.addEventListener("click", () => {
    input.value = "";
    clearBtn.classList.add("hidden");
    onChange("");
    input.focus();
  });

  return wrapper;
}

/* ---------------------------------------
   ✅ AUTH BUTTONS
---------------------------------------- */

btnLogin.onclick = () => {
  signInWithPopup(auth, provider).catch(err => {
    console.error("Login error:", err);
    alert("Gagal log masuk. Sila cuba lagi.");
  });
};

btnLogout.onclick = () => {
  signOut(auth).catch(err => {
    console.error("Logout error:", err);
  });
};

/* ---------------------------------------
   ✅ SCREEN 1 — LANGUAGE LIST PAGE
---------------------------------------- */

async function loadLanguageListPage(user) {
  setBreadcrumb("Bahasa");
  app.innerHTML = "";

  const headerRow = document.createElement("div");
  headerRow.className = "sectionHeader";
  headerRow.innerHTML = `
    <div>
      <h2>Bahasa anda</h2>
      <p>Pilih atau tambah bahasa yang ingin anda pelajari.</p>
    </div>
    <button id="btnAddLanguage" class="btnPrimary">+ Tambah bahasa</button>
  `;

  const searchContainer = document.createElement("div");
  const listContainer = document.createElement("div");
  listContainer.className = "cardGrid";

  app.appendChild(headerRow);
  app.appendChild(searchContainer);
  app.appendChild(listContainer);

  let currentSearch = "";

  async function renderList() {
    listContainer.innerHTML = "";
    const languages = await getLanguages(user.uid, currentSearch);

    if (languages.length === 0) {
      listContainer.innerHTML = `
        <div class="emptyState">
          Tiada bahasa lagi. Tambah satu untuk bermula.
        </div>
      `;
      return;
    }

    languages.forEach(lang => {
      const card = document.createElement("div");
      card.className = "languageCard";
      card.textContent = lang.name;
      card.onclick = () => loadLetterPage(user, lang);
      listContainer.appendChild(card);
    });
  }

  const searchBar = createSearchBar("Cari bahasa…", value => {
    currentSearch = value;
    renderList();
  });

  searchContainer.appendChild(searchBar);

  document.getElementById("btnAddLanguage").onclick = async () => {
    const name = window.prompt("Nama bahasa?");
    if (!name) return;
    await addLanguage(user.uid, name.trim());
    renderList();
  };

  renderList();
}

/* ---------------------------------------
   ✅ SCREEN 2 — LETTER PAGE (A–Z)
---------------------------------------- */

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

async function loadLetterPage(user, language) {
  setBreadcrumb(language.name);
  app.innerHTML = "";

  const headerRow = document.createElement("div");
  headerRow.className = "sectionHeader";
  headerRow.innerHTML = `
    <div>
      <h2>${language.name}</h2>
      <p>Pilih huruf atau cari perkataan secara terus.</p>
    </div>
  `;

  const searchContainer = document.createElement("div");
  const lettersContainer = document.createElement("div");
  lettersContainer.className = "lettersGrid";

  const resultsContainer = document.createElement("div");
  resultsContainer.className = "cardGrid";

  // ✅ Generate A–Z buttons
  LETTERS.forEach(letter => {
    const btn = document.createElement("button");
    btn.className = "letterButton";
    btn.textContent = letter;
    btn.onclick = () => loadWordListPage(user, language, letter);
    lettersContainer.appendChild(btn);
  });

  app.appendChild(headerRow);
  app.appendChild(searchContainer);
  app.appendChild(lettersContainer);
  app.appendChild(resultsContainer);

  let currentSearch = "";

  async function renderSearchResults() {
    resultsContainer.innerHTML = "";

    if (!currentSearch) {
      resultsContainer.innerHTML = `
        <div class="subtleInfo">
          Gunakan carian untuk terus lompat ke perkataan. Atau pilih huruf di atas.
        </div>
      `;
      return;
    }

    const words = await searchWordsInLanguage(user.uid, language.id, currentSearch);

    if (words.length === 0) {
      resultsContainer.innerHTML = `
        <div class="emptyState">
          Tiada perkataan ditemui untuk carian ini.
        </div>
      `;
      return;
    }

    words.forEach(w => {
      const card = document.createElement("div");
      card.className = "wordCard";
      card.textContent = w.word;
      card.onclick = () => loadWordListPage(user, language, w.letter, w);
      resultsContainer.appendChild(card);
    });
  }

  const searchBar = createSearchBar("Cari perkataan dalam bahasa ini…", value => {
    currentSearch = value;
    renderSearchResults();
  });

  searchContainer.appendChild(searchBar);

  renderSearchResults();
}

/* ---------------------------------------
   ✅ SCREEN 3 — WORD LIST PAGE
---------------------------------------- */

async function loadWordListPage(user, language, letter, preselectWord = null) {
  setBreadcrumb(`${language.name} • ${letter.toUpperCase()}`);
  app.innerHTML = "";

  const headerRow = document.createElement("div");
  headerRow.className = "sectionHeader";
  headerRow.innerHTML = `
    <div>
      <h2>${language.name} • Huruf ${letter.toUpperCase()}</h2>
      <p>Senarai perkataan bagi huruf ini.</p>
    </div>
    <button id="btnAddWord" class="btnPrimary">+ Tambah perkataan</button>
  `;

  const searchContainer = document.createElement("div");
  const listContainer = document.createElement("div");
  listContainer.className = "cardGrid";

  app.appendChild(headerRow);
  app.appendChild(searchContainer);
  app.appendChild(listContainer);

  let currentSearch = "";

  async function renderList() {
    listContainer.innerHTML = "";

    const words = await getWordsByLetter(
      user.uid,
      language.id,
      letter,
      currentSearch
    );

    if (words.length === 0) {
      listContainer.innerHTML = `
        <div class="emptyState">
          Tiada perkataan untuk huruf ini lagi.
        </div>
      `;
      return;
    }

    words.forEach(w => {
      const card = document.createElement("div");
      card.className = "wordCard";
      card.textContent = w.word;
      card.onclick = () => loadWordDetailPage(user, language, w);
      listContainer.appendChild(card);
    });
  }

  const searchBar = createSearchBar("Cari perkataan…", value => {
    currentSearch = value;
    renderList();
  });

  searchContainer.appendChild(searchBar);

  document.getElementById("btnAddWord").onclick = async () => {
    const word = window.prompt("Perkataan?");
    if (!word) return;

    await addWord(user.uid, language.id, word.trim());
    renderList();
  };

  await renderList();

  // ✅ If user came from search, open the word directly
  if (preselectWord) {
    loadWordDetailPage(user, language, preselectWord);
  }
}

/* ---------------------------------------
   ✅ SCREEN 4 — WORD DETAIL PAGE
---------------------------------------- */

async function loadWordDetailPage(user, language, wordDoc) {
  setBreadcrumb(`${language.name} • ${wordDoc.word}`);
  app.innerHTML = "";

  const headerRow = document.createElement("div");
  headerRow.className = "sectionHeader";
  headerRow.innerHTML = `
    <div>
      <h2>${wordDoc.word}</h2>
      <p>Tambah ayat, karangan dan lain-lain untuk perkataan ini.</p>
    </div>
    <button id="btnAddSentence" class="btnPrimary">+ Tambah ayat biasa</button>
  `;

  const searchContainer = document.createElement("div");
  const listContainer = document.createElement("div");
  listContainer.className = "elementsList";

  app.appendChild(headerRow);
  app.appendChild(searchContainer);
  app.appendChild(listContainer);

  let currentSearch = "";

  async function renderList() {
    listContainer.innerHTML = "";

    const elements = await getElements(
      user.uid,
      language.id,
      wordDoc.id,
      currentSearch
    );

    if (elements.length === 0) {
      listContainer.innerHTML = `
        <div class="emptyState">
          Tiada elemen lagi untuk perkataan ini. Tambah satu untuk bermula.
        </div>
      `;
      return;
    }

    elements.forEach(el => {
      const card = document.createElement("div");
      card.className = "elementCard";

      const typeLabel = el.type === "sentence" ? "Ayat biasa" : el.type;

      card.innerHTML = `
        <div class="elementHeader">
          <span class="elementType">${typeLabel}</span>
          <h3 class="elementTitle">${el.title || "(Tiada tajuk)"}</h3>
        </div>
        <p class="elementContent">${(el.content || "").replace(/\n/g, "<br>")}</p>
      `;

      listContainer.appendChild(card);
    });
  }

  const searchBar = createSearchBar("Cari dalam elemen…", value => {
    currentSearch = value;
    renderList();
  });

  searchContainer.appendChild(searchBar);

  document.getElementById("btnAddSentence").onclick = async () => {
    const title = window.prompt("Tajuk ayat?");
    if (!title) return;

    const content = window.prompt("Isi ayat / perenggan?");
    if (!content) return;

    await addElementSentence(
      user.uid,
      language.id,
      wordDoc.id,
      title.trim(),
      content.trim()
    );

    renderList();
  };

  renderList();
}

/* ---------------------------------------
   ✅ AUTH STATE LISTENER (FINAL PART)
---------------------------------------- */

onAuthStateChanged(auth, user => {
  if (user) {
    // ✅ User logged in
    btnLogin.classList.add("hidden");
    btnLogout.classList.remove("hidden");
    navUserEmail.textContent = user.email || "";

    // ✅ Load first screen
    loadLanguageListPage(user);

  } else {
    // ✅ User logged out
    btnLogin.classList.remove("hidden");
    btnLogout.classList.add("hidden");
    navUserEmail.textContent = "";
    setBreadcrumb("");

    app.innerHTML = `
      <div class="centerBox">
        <h2>Selamat Datang</h2>
        <p>Sila log masuk untuk mula membina Kamus Hafalan anda.</p>
      </div>
    `;
  }
});

