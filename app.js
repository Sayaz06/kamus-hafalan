import {
  auth,
  provider,
  signInWithPopup,
  signOut,
} from "./firebase-config.js";

import {
  getLanguages,
  addLanguage,
  getWordsByLetter,
  addWord,
  getElementsForWord,
  addElementHtml,
} from "./data-service.js";

const appEl = document.getElementById("app");
const btnLogin = document.getElementById("btnLogin");
const btnLogout = document.getElementById("btnLogout");
const navUserEmail = document.getElementById("navUserEmail");
const breadcrumbEl = document.getElementById("breadcrumb");
const btnBack = document.getElementById("btnBack");

/* =======================
   STATE
======================= */

let currentUser = null;
let currentLanguage = null;
let currentLetter = null;
let currentWordDoc = null;
let lastEditorHtml = "";
let undoStack = [];
let redoStack = [];

/* =======================
   AUTH HANDLERS
======================= */

auth.onAuthStateChanged((user) => {
  if (user) {
    currentUser = user;
    navUserEmail.textContent = user.email || user.displayName || "Pengguna";
    btnLogin.classList.add("hidden");
    btnLogout.classList.remove("hidden");
    loadLanguageListPage(user);
  } else {
    currentUser = null;
    navUserEmail.textContent = "";
    btnLogin.classList.remove("hidden");
    btnLogout.classList.add("hidden");
    renderLoggedOutLanding();
  }
});

btnLogin.onclick = async () => {
  try {
    await signInWithPopup(auth, provider);
  } catch (err) {
    alert("Log masuk gagal. Sila cuba lagi.");
    console.error(err);
  }
};

btnLogout.onclick = async () => {
  try {
    await signOut(auth);
  } catch (err) {
    console.error(err);
  }
};

/* =======================
   NAV / BREADCRUMB / BACK
======================= */

function setBreadcrumb(text) {
  breadcrumbEl.textContent = text;
}

function showBackButton(show, action = null) {
  if (show) {
    btnBack.classList.remove("hidden");
    btnBack.onclick = action;
  } else {
    btnBack.classList.add("hidden");
    btnBack.onclick = null;
  }
}

/* =======================
   RENDER: LOGGED OUT
======================= */

function renderLoggedOutLanding() {
  showBackButton(false);
  setBreadcrumb("Bahasa");
  appEl.innerHTML = `
    <section class="card">
      <div class="sectionHeader">
        <div>
          <div class="chip">Kamus Hafalan</div>
          <div class="sectionTitle" style="margin-top:0.4rem;">Selamat datang</div>
        </div>
      </div>
      <p class="sectionSubtitle">
        Log masuk dengan Google untuk mula bina kamus hafalan peribadi anda —
        susun mengikut bahasa, huruf, perkataan dan elemen seperti ayat contoh, karangan, nota, dan lain-lain.
      </p>
      <div style="margin-top:0.75rem;">
        <button class="btnPrimary" id="btnLoginInline">Log Masuk Dengan Google</button>
      </div>
    </section>
  `;
  const btnLoginInline = document.getElementById("btnLoginInline");
  if (btnLoginInline) {
    btnLoginInline.onclick = () => btnLogin.click();
  }
}

/* =======================
   PAGE: LANGUAGE LIST
======================= */

async function loadLanguageListPage(user) {
  currentLanguage = null;
  currentLetter = null;
  currentWordDoc = null;

  showBackButton(false);
  setBreadcrumb("Bahasa");

  const languages = await getLanguages(user.uid);
  renderLanguageList(languages);
}

function renderLanguageList(languages) {
  appEl.innerHTML = "";

  const container = document.createElement("section");
  container.className = "card";

  container.innerHTML = `
    <div class="sectionHeader">
      <div>
        <div class="chip">Langkah 1</div>
        <div class="sectionTitle">Pilih bahasa</div>
        <div class="sectionSubtitle">Bahasa menjadi kategori utama hafalan anda.</div>
      </div>
      <button class="btnPrimary" id="btnAddLanguage">Tambah Bahasa</button>
    </div>
    <div class="listGrid" id="languageList"></div>
  `;

  appEl.appendChild(container);

  const languageListEl = document.getElementById("languageList");
  const btnAddLanguage = document.getElementById("btnAddLanguage");

  btnAddLanguage.onclick = async () => {
    const name = window.prompt("Nama bahasa? (contoh: Bahasa Melayu, English)");
    if (!name) return;
    await addLanguage(currentUser.uid, name.trim());
    const updated = await getLanguages(currentUser.uid);
    renderLanguageList(updated);
  };

  if (!languages || languages.length === 0) {
    languageListEl.innerHTML = `
      <div class="emptyState">
        Tiada bahasa lagi. Tekan <strong>Tambah Bahasa</strong> untuk mula.
      </div>
    `;
    return;
  }

  languageListEl.innerHTML = "";
  languages.forEach((lang) => {
    const item = document.createElement("div");
    item.className = "listItem";
    item.innerHTML = `
      <div class="listItemLabel">${lang.name}</div>
      <div class="listItemMeta">Klik untuk pilih huruf pertama.</div>
    `;
    item.onclick = () => loadLetterPage(currentUser, lang);
    languageListEl.appendChild(item);
  });
}

/* =======================
   PAGE: LETTER LIST
======================= */

function loadLetterPage(user, language) {
  currentLanguage = language;
  currentLetter = null;
  currentWordDoc = null;

  showBackButton(true, () => loadLanguageListPage(user));
  setBreadcrumb(`${language.name} → Huruf`);

  appEl.innerHTML = "";

  const card = document.createElement("section");
  card.className = "card";
  card.innerHTML = `
    <div class="sectionHeader">
      <div>
        <div class="chip">Langkah 2</div>
        <div class="sectionTitle">Pilih huruf</div>
        <div class="sectionSubtitle">
          Semua perkataan untuk bahasa <strong>${language.name}</strong> akan dikumpulkan mengikut huruf pertama.
        </div>
      </div>
      <button class="btnSecondary" id="btnBackToLanguage">Tukar Bahasa</button>
    </div>

    <div class="listGrid" id="letterList"></div>
  `;

  appEl.appendChild(card);

  const btnBackToLanguage = document.getElementById("btnBackToLanguage");
  btnBackToLanguage.onclick = () => loadLanguageListPage(user);

  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const letterListEl = document.getElementById("letterList");
  letterListEl.innerHTML = "";

  letters.forEach((letter) => {
    const item = document.createElement("div");
    item.className = "listItem";
    item.innerHTML = `
      <div class="listItemLabel">${letter}</div>
      <div class="listItemMeta">Perkataan bermula dengan "${letter}".</div>
    `;
    item.onclick = () => loadWordListPage(user, language, letter);
    letterListEl.appendChild(item);
  });
}

/* =======================
   PAGE: WORD LIST
======================= */

async function loadWordListPage(user, language, letter) {
  currentLanguage = language;
  currentLetter = letter;
  currentWordDoc = null;

  showBackButton(true, () => loadLetterPage(user, language));
  setBreadcrumb(`${language.name} → ${letter} → Perkataan`);

  const { words, total } = await getWordsByLetter(user.uid, language.id, letter);

  appEl.innerHTML = "";

  const card = document.createElement("section");
  card.className = "card";

  card.innerHTML = `
    <div class="sectionHeader">
      <div>
        <div class="chip">Langkah 3</div>
        <div class="sectionTitle">Perkataan huruf "${letter}"</div>
        <div class="sectionSubtitle">
          Bahasa <strong>${language.name}</strong> •
          <span id="wordCount">${total}</span> perkataan.
        </div>
      </div>
      <button class="btnPrimary" id="btnAddWord">Tambah Perkataan</button>
    </div>

    <div class="searchRow">
      <div class="searchInputWrapper">
        <input
          id="wordSearchInput"
          class="searchInput"
          type="text"
          placeholder="Cari perkataan dalam huruf ini..."
        />
        <span class="searchIcon">🔍</span>
      </div>
    </div>

    <div class="listGrid" id="wordList"></div>
  `;

  appEl.appendChild(card);

  const wordListEl = document.getElementById("wordList");
  const wordSearchInput = document.getElementById("wordSearchInput");
  const btnAddWord = document.getElementById("btnAddWord");
  const wordCountEl = document.getElementById("wordCount");

  function renderWordList(filterText = "") {
    wordListEl.innerHTML = "";

    const filtered = words.filter((w) => {
      if (!filterText) return true;
      return w.word.toLowerCase().includes(filterText.toLowerCase());
    });

    wordCountEl.textContent = filtered.length;

    if (filtered.length === 0) {
      wordListEl.innerHTML = `
        <div class="emptyState">
          Tiada perkataan ditemui. Cuba tambah <strong>perkataaan baharu</strong> atau ubah carian.
        </div>
      `;
      return;
    }

    filtered.forEach((w) => {
      const item = document.createElement("div");
      item.className = "listItem";

      item.innerHTML = `
        <div class="wordListItemMain">
          <div class="wordLabel">${w.word}</div>
          <div class="wordMeta">
            <span>${w.elementCount || 0} elemen</span>
          </div>
        </div>
      `;

      item.onclick = () => loadWordDetailPage(user, language, w);
      wordListEl.appendChild(item);
    });
  }

  renderWordList("");

  wordSearchInput.addEventListener("input", () => {
    renderWordList(wordSearchInput.value);
  });

  btnAddWord.onclick = async () => {
    const newWord = window.prompt(`Perkataan baru untuk huruf "${letter}"?`);
    if (!newWord) return;
    const wordTrimmed = newWord.trim();
    if (!wordTrimmed) return;

    await addWord(user.uid, language.id, wordTrimmed);
    const updated = await getWordsByLetter(user.uid, language.id, letter);
    words.splice(0, words.length, ...updated.words);
    wordCountEl.textContent = updated.total;
    renderWordList(wordSearchInput.value);
  };
}

/* =======================
   PAGE: WORD DETAIL (ELEMENT LIST)
======================= */

async function loadWordDetailPage(user, language, wordDoc) {
  currentLanguage = language;
  currentLetter = wordDoc.letter;
  currentWordDoc = wordDoc;

  showBackButton(true, () => loadWordListPage(user, language, wordDoc.letter));
  setBreadcrumb(`${language.name} → ${wordDoc.letter} → ${wordDoc.word}`);

  const elements = await getElementsForWord(
    user.uid,
    language.id,
    wordDoc.id
  );

  appEl.innerHTML = "";

  const card = document.createElement("section");
  card.className = "card";

  card.innerHTML = `
    <div class="wordDetailHeader">
      <div class="wordDetailTitleRow">
        <div>
          <div class="chip">Langkah 4</div>
          <div class="wordDetailTitle">${wordDoc.word}</div>
        </div>
        <div class="wordDetailMeta">
          Bahasa <strong>${language.name}</strong> • Huruf "${wordDoc.letter}"
        </div>
      </div>
      <div class="wordDetailActions">
        <button class="btnPrimary" id="btnAddElement">Tambah Elemen</button>
      </div>
    </div>

    <div>
      <div class="sectionSubtitle" style="margin-bottom: 0.35rem;">
        Elemen ialah ayat contoh, perenggan karangan, nota ringkas atau apa sahaja yang membantu anda hafal perkataan ini.
      </div>
      <div class="elementList" id="elementList"></div>
    </div>
  `;

  appEl.appendChild(card);

  const elementListEl = document.getElementById("elementList");
  const btnAddElement = document.getElementById("btnAddElement");

  function renderElementList() {
    elementListEl.innerHTML = "";

    if (!elements || elements.length === 0) {
      elementListEl.innerHTML = `
        <div class="emptyState">
          Tiada elemen lagi. Tekan <strong>Tambah Elemen</strong> untuk mula menulis.
        </div>
      `;
      return;
    }

    elements.forEach((el) => {
      const item = document.createElement("div");
      item.className = "elementItem";

      const createdDate = el.createdAt
        ? new Date(el.createdAt.toDate ? el.createdAt.toDate() : el.createdAt)
        : null;

      const createdStr = createdDate
        ? createdDate.toLocaleString("ms-MY", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "";

      const previewHtml = el.content || "";

      item.innerHTML = `
        <div class="elementItemTitleRow">
          <div class="elementItemTitle">${el.title || "(Tiada tajuk)"}</div>
          <div class="elementItemMeta">
            ${el.type ? `<span>${el.type}</span>` : ""}
            ${createdStr ? `<span>• ${createdStr}</span>` : ""}
          </div>
        </div>
        <div class="elementItemBody">${previewHtml}</div>
      `;

      elementListEl.appendChild(item);
    });
  }

  renderElementList();

  btnAddElement.onclick = () => {
    openElementEditorPage(user, language, wordDoc, (savedElement) => {
      if (savedElement) {
        elements.push(savedElement);
        renderElementList();
      }
    });
  };
}

/* =======================
   PAGE: ELEMENT EDITOR (PREMIUM)
======================= */

function openElementEditorPage(user, language, wordDoc, onSaved) {
  currentLanguage = language;
  currentLetter = wordDoc.letter;
  currentWordDoc = wordDoc;

  showBackButton(true, () =>
    loadWordDetailPage(user, language, wordDoc)
  );
  setBreadcrumb(`${language.name} → ${wordDoc.letter} → ${wordDoc.word} → Elemen Baharu`);

  // reset editor state
  lastEditorHtml = "";
  undoStack = [];
  redoStack = [];

  appEl.innerHTML = "";

  const card = document.createElement("section");
  card.className = "card";

  card.innerHTML = `
    <div class="editorPage">
      <div class="editorHeader">
        <div class="chip">Elemen baharu</div>
        <input
          id="editorTitleInput"
          class="editorTitleInput"
          type="text"
          placeholder="Tajuk elemen (contoh: Ayat contoh 1, Nota ringkas, Karangan pendek)"
        />
        <div class="editorContext">
          Perkataan: <strong>${wordDoc.word}</strong> • Bahasa <strong>${language.name}</strong> • Huruf "${wordDoc.letter}"
        </div>
      </div>

      <div class="editorToolbarRow">
        <select id="editorTemplateSelect" class="editorTemplateSelect">
          <option value="">Pilih template (optional)</option>
          <option value="sentence">Ayat Biasa</option>
          <option value="paragraph">Perenggan Karangan</option>
          <option value="note">Nota Ringkas</option>
        </select>

        <div class="editorToolbar">
          <button class="editorToolbarButton" data-cmd="bold"><strong>B</strong></button>
          <button class="editorToolbarButton" data-cmd="italic"><em>I</em></button>
          <button class="editorToolbarButton" data-cmd="underline"><u>U</u></button>
          <span style="width:1px;height:18px;background:rgba(148,163,184,0.5);margin:0 0.15rem;"></span>
          <button class="editorToolbarButton" data-block="h1">H1</button>
          <button class="editorToolbarButton" data-block="h2">H2</button>
          <button class="editorToolbarButton" data-block="h3">H3</button>
          <button class="editorToolbarButton" data-block="quote">Quote</button>
          <button class="editorToolbarButton" data-block="hr">Garis</button>
          <span style="width:1px;height:18px;background:rgba(148,163,184,0.5);margin:0 0.15rem;"></span>
          <button class="editorToolbarButton" data-cmd="insertUnorderedList">• Bullet</button>
          <button class="editorToolbarButton" data-cmd="insertOrderedList">1. Number</button>
          <button class="editorToolbarButton" data-highlight="toggle">Highlight</button>
          <span style="width:1px;height:18px;background:rgba(148,163,184,0.5);margin:0 0.15rem;"></span>
          <button class="editorToolbarButton" data-undo="true">Undo</button>
          <button class="editorToolbarButton" data-redo="true">Redo</button>
        </div>
      </div>

      <div class="editorSurface">
        <div id="editorContent" class="editorContent" contenteditable="true"></div>
      </div>

      <div class="editorFooterRow">
        <div class="editorHint">
          Tip: pilih template untuk jana rangka, kemudian ubah isi ikut gaya anda. Boleh guna <strong>B</strong>, <em>I</em>, underline, senarai, dan highlight.
        </div>
        <div style="display:flex;gap:0.4rem;flex-wrap:wrap;">
          <button class="btnSecondary" id="btnCancelEditor">Batal</button>
          <button class="btnPrimary" id="btnSaveElement">Simpan Elemen</button>
        </div>
      </div>
    </div>
  `;

  const editorTitleInput = document.getElementById("editorTitleInput");
  const editorTemplateSelect = document.getElementById("editorTemplateSelect");
  const editorContent = document.getElementById("editorContent");
  const btnCancelEditor = document.getElementById("btnCancelEditor");
  const btnSaveElement = document.getElementById("btnSaveElement");
  const toolbarButtons = card.querySelectorAll(".editorToolbarButton");

  // ===== Template auto-fill =====

  editorTemplateSelect.addEventListener("change", () => {
    const val = editorTemplateSelect.value;
    if (!val) return;

    let htmlTemplate = "";

    if (val === "sentence") {
      htmlTemplate = `
<h2>Ayat Contoh</h2>
<p><strong>Ayat 1:</strong> ...</p>
<p><strong>Ayat 2:</strong> ...</p>
<p><strong>Maksud:</strong> ...</p>
<p><strong>Catatan:</strong> ...</p>
      `.trim();
      if (!editorTitleInput.value) {
        editorTitleInput.value = "Ayat contoh";
      }
    } else if (val === "paragraph") {
      htmlTemplate = `
<h2>Perenggan Karangan</h2>
<p><strong>Perenggan 1:</strong> ...</p>
<p><strong>Perenggan 2:</strong> ...</p>
<p><strong>Perenggan 3:</strong> ...</p>
<p><strong>Penutup:</strong> ...</p>
      `.trim();
      if (!editorTitleInput.value) {
        editorTitleInput.value = "Karangan pendek";
      }
    } else if (val === "note") {
      htmlTemplate = `
<h2>Nota Ringkas</h2>
<p><strong>Definisi:</strong> ...</p>
<ul>
  <li><strong>Contoh 1:</strong> ...</li>
  <li><strong>Contoh 2:</strong> ...</li>
</ul>
<p><strong>Catatan lain:</strong> ...</p>
      `.trim();
      if (!editorTitleInput.value) {
        editorTitleInput.value = "Nota ringkas";
      }
    }

    editorContent.innerHTML = htmlTemplate;
    pushUndoState();
    editorContent.focus();
  });

  // ===== Toolbar actions =====

  toolbarButtons.forEach((btn) => {
    const cmd = btn.getAttribute("data-cmd");
    const block = btn.getAttribute("data-block");
    const isUndo = btn.hasAttribute("data-undo");
    const isRedo = btn.hasAttribute("data-redo");
    const isHighlight = btn.getAttribute("data-highlight");

    btn.addEventListener("click", () => {
      editorContent.focus();

      if (isUndo) {
        applyUndo();
        return;
      }
      if (isRedo) {
        applyRedo();
        return;
      }
      if (isHighlight) {
        toggleHighlight();
        pushUndoState();
        return;
      }

      if (cmd) {
        document.execCommand(cmd, false, null);
        pushUndoState();
        return;
      }

      if (block === "h1" || block === "h2" || block === "h3") {
        document.execCommand("formatBlock", false, block.toUpperCase());
        pushUndoState();
        return;
      }

      if (block === "quote") {
        document.execCommand("formatBlock", false, "BLOCKQUOTE");
        pushUndoState();
        return;
      }

      if (block === "hr") {
        document.execCommand("insertHorizontalRule", false, null);
        pushUndoState();
        return;
      }
    });
  });

  // ===== Undo/Redo stack =====

  function pushUndoState() {
    const html = editorContent.innerHTML;
    if (html === lastEditorHtml) return;
    undoStack.push(html);
    if (undoStack.length > 50) undoStack.shift();
    redoStack = [];
    lastEditorHtml = html;
  }

  function applyUndo() {
    if (undoStack.length === 0) return;
    const current = editorContent.innerHTML;
    redoStack.push(current);
    const prev = undoStack.pop();
    editorContent.innerHTML = prev;
    lastEditorHtml = prev;
  }

  function applyRedo() {
    if (redoStack.length === 0) return;
    const current = editorContent.innerHTML;
    undoStack.push(current);
    const next = redoStack.pop();
    editorContent.innerHTML = next;
    lastEditorHtml = next;
  }

  editorContent.addEventListener("input", () => {
    pushUndoState();
  });

  // ===== Highlight toggle =====

  function toggleHighlight() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    if (range.collapsed) return;

    const span = document.createElement("span");
    span.className = "highlight";
    span.appendChild(range.extractContents());
    range.insertNode(span);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  // ===== Save / Cancel =====

  btnCancelEditor.onclick = () => {
    const confirmLeave = window.confirm(
      "Batal dan kembali tanpa menyimpan elemen ini?"
    );
    if (!confirmLeave) return;
    loadWordDetailPage(user, language, wordDoc);
  };

  btnSaveElement.onclick = async () => {
    const title = editorTitleInput.value.trim();
    const htmlContent = editorContent.innerHTML.trim();

    if (!title) {
      alert("Sila isi tajuk elemen.");
      editorTitleInput.focus();
      return;
    }
    if (!htmlContent) {
      alert("Sila tulis isi elemen sebelum simpan.");
      editorContent.focus();
      return;
    }

    const type = mapTemplateToType(editorTemplateSelect.value);

    try {
      const saved = await addElementHtml(
        user.uid,
        language.id,
        wordDoc.id,
        title,
        htmlContent,
        type
      );

      if (onSaved) onSaved(saved);
      loadWordDetailPage(user, language, wordDoc);
    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan elemen. Sila cuba lagi.");
    }
  };

  // Initial undo state
  pushUndoState();
}

function mapTemplateToType(templateValue) {
  if (templateValue === "sentence") return "Ayat";
  if (templateValue === "paragraph") return "Karangan";
  if (templateValue === "note") return "Nota";
  return "Umum";
}

/* =======================
   INITIAL
======================= */

renderLoggedOutLanding();
