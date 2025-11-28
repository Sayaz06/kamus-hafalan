// ============================================================
// main.js — Kamus Hafalan (berdasarkan pattern Stress Planner)
// ============================================================

import { auth, db, provider } from "./firebase.js";
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";

import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

// ============================================================
// PART 1 — UI ELEMENTS + GLOBAL STATE
// ============================================================

const authSection = document.getElementById("authSection");
const appSection = document.getElementById("appSection");
const userInfo = document.getElementById("userInfo");
const logoutBtn = document.getElementById("logoutBtn");
const googleLoginBtn = document.getElementById("googleLoginBtn");

const tabLanguagesBtn = document.getElementById("tabLanguagesBtn");
const tabWordsBtn = document.getElementById("tabWordsBtn");
const tabElementsBtn = document.getElementById("tabElementsBtn");

const languagesView = document.getElementById("languagesView");
const wordsView = document.getElementById("wordsView");
const elementsView = document.getElementById("elementsView");

// Languages
const addLanguageForm = document.getElementById("addLanguageForm");
const languageName = document.getElementById("languageName");
const languageList = document.getElementById("languageList");

// Words
const wordsHeader = document.getElementById("wordsHeader");
const wordsContext = document.getElementById("wordsContext");
const letterList = document.getElementById("letterList");
const addWordForm = document.getElementById("addWordForm");
const wordText = document.getElementById("wordText");
const wordList = document.getElementById("wordList");

// Elements
const elementsHeader = document.getElementById("elementsHeader");
const elementsContext = document.getElementById("elementsContext");
const addElementForm = document.getElementById("addElementForm");
const elementTitle = document.getElementById("elementTitle");
const elementTemplate = document.getElementById("elementTemplate");
const elementContent = document.getElementById("elementContent");
const elementList = document.getElementById("elementList");

// Theme
const themeToggle = document.getElementById("themeToggle");

// State
let currentUser = null;
let currentLanguage = null; // {id, name}
let currentLetter = null;   // "A", "B", ...
let currentWord = null;     // {id, word}

// ============================================================
// PART 2 — AUTH
// ============================================================

googleLoginBtn.addEventListener("click", async () => {
  try {
    await signInWithPopup(auth, provider);
  } catch (err) {
    console.error("Login error:", err);
    alert("Log masuk gagal. Sila cuba lagi.");
  }
});

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
});

onAuthStateChanged(auth, (user) => {
  currentUser = user;
  if (user) {
    userInfo.textContent = `Logged in as: ${user.email}`;
    authSection.style.display = "none";
    appSection.style.display = "block";

    loadLanguages();
    showLanguagesView();
  } else {
    userInfo.textContent = "Not logged in";
    authSection.style.display = "block";
    appSection.style.display = "none";
  }
});

// ============================================================
// PART 3 — VIEW SWITCHING (TAB NAV)
// ============================================================

function showLanguagesView() {
  languagesView.style.display = "block";
  wordsView.style.display = "none";
  elementsView.style.display = "none";
}

function showWordsView() {
  languagesView.style.display = "none";
  wordsView.style.display = "block";
  elementsView.style.display = "none";
}

function showElementsView() {
  languagesView.style.display = "none";
  wordsView.style.display = "none";
  elementsView.style.display = "block";
}

tabLanguagesBtn.addEventListener("click", showLanguagesView);
tabWordsBtn.addEventListener("click", () => {
  if (!currentLanguage) {
    alert("Pilih bahasa dahulu.");
    return;
  }
  showWordsView();
});
tabElementsBtn.addEventListener("click", () => {
  if (!currentWord) {
    alert("Pilih perkataan dahulu.");
    return;
  }
  showElementsView();
});

// ============================================================
// PART 4 — LANGUAGES CRUD
// ============================================================

async function loadLanguages() {
  if (!currentUser) return;

  languageList.innerHTML = "<li>Loading...</li>";

  try {
    const ref = collection(db, "users", currentUser.uid, "languages");
    const q = query(ref, orderBy("createdAt", "desc"));
    const snap = await getDocs(q);

    if (snap.empty) {
      languageList.innerHTML = "<li>Tiada bahasa lagi. Tambah satu untuk mula.</li>";
      return;
    }

    languageList.innerHTML = "";
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      const li = document.createElement("li");

      const btn = document.createElement("button");
      btn.textContent = data.name;
      btn.onclick = () => {
        currentLanguage = { id: docSnap.id, name: data.name };
        currentLetter = null;
        currentWord = null;
        setupLettersView();
        showWordsView();
      };

      li.appendChild(btn);
      languageList.appendChild(li);
    });
  } catch (err) {
    console.error("Error load languages:", err);
    languageList.innerHTML = "<li>Gagal load bahasa.</li>";
  }
}

addLanguageForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentUser) {
    alert("Sila login dahulu.");
    return;
  }
  const name = languageName.value.trim();
  if (!name) return;

  try {
    const ref = collection(db, "users", currentUser.uid, "languages");
    await addDoc(ref, {
      name,
      createdAt: serverTimestamp(),
    });
    languageName.value = "";
    await loadLanguages();
  } catch (err) {
    console.error("Error add language:", err);
    alert("Gagal tambah bahasa.");
  }
});

// ============================================================
// PART 5 — LETTERS + WORDS CRUD
// ============================================================

function setupLettersView() {
  wordsHeader.textContent = `Perkataan — ${currentLanguage.name}`;
  wordsContext.textContent = "Pilih huruf untuk lihat / tambah perkataan.";

  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  letterList.innerHTML = "";

  letters.forEach((letter) => {
    const btn = document.createElement("button");
    btn.textContent = letter;
    btn.style.marginRight = "4px";
    btn.onclick = () => {
      currentLetter = letter;
      loadWordsForLetter();
    };
    letterList.appendChild(btn);
  });

  wordList.innerHTML = "";
  wordText.value = "";
}

async function loadWordsForLetter() {
  if (!currentUser || !currentLanguage || !currentLetter) return;

  wordsContext.textContent = `Bahasa: ${currentLanguage.name} • Huruf: ${currentLetter}`;

  wordList.innerHTML = "<li>Loading...</li>";

  try {
    const ref = collection(
      db,
      "users",
      currentUser.uid,
      "languages",
      currentLanguage.id,
      "words"
    );
    const q = query(ref, orderBy("createdAt", "desc"));
    const snap = await getDocs(q);

    const list = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      if (
        data.word &&
        data.word[0].toUpperCase() === currentLetter.toUpperCase()
      ) {
        list.push({ id: docSnap.id, ...data });
      }
    });

    if (list.length === 0) {
      wordList.innerHTML = "<li>Tiada perkataan untuk huruf ini.</li>";
      currentWord = null;
      return;
    }

    wordList.innerHTML = "";
    list.forEach((w) => {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.textContent = w.word;
      btn.onclick = () => {
        currentWord = { id: w.id, word: w.word };
        loadElementsForWord();
        showElementsView();
      };
      li.appendChild(btn);
      wordList.appendChild(li);
    });
  } catch (err) {
    console.error("Error load words:", err);
    wordList.innerHTML = "<li>Gagal load perkataan.</li>";
  }
}

addWordForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentUser || !currentLanguage || !currentLetter) {
    alert("Pilih bahasa dan huruf dahulu.");
    return;
  }

  const word = wordText.value.trim();
  if (!word) return;

  try {
    const ref = collection(
      db,
      "users",
      currentUser.uid,
      "languages",
      currentLanguage.id,
      "words"
    );
    await addDoc(ref, {
      word,
      letter: word[0].toUpperCase(),
      createdAt: serverTimestamp(),
    });

    wordText.value = "";
    await loadWordsForLetter();
  } catch (err) {
    console.error("Error add word:", err);
    alert("Gagal tambah perkataan.");
  }
});

// ============================================================
// PART 6 — ELEMENTS (AYAT / NOTA) CRUD
// ============================================================

function applyTemplateToContent(template) {
  if (template === "sentence") {
    elementContent.value =
`Ayat:
Maksud:
Catatan:`;
  } else if (template === "paragraph") {
    elementContent.value =
`Perenggan 1:
Perenggan 2:
Perenggan 3:
Penutup:`;
  } else if (template === "note") {
    elementContent.value =
`Definisi:
Contoh:
Catatan:`;
  }
}

elementTemplate.addEventListener("change", () => {
  const val = elementTemplate.value;
  if (!val) return;
  applyTemplateToContent(val);
});

async function loadElementsForWord() {
  if (!currentUser || !currentLanguage || !currentWord) return;

  elementsHeader.textContent = `Elemen — ${currentWord.word}`;
  elementsContext.textContent = `Bahasa: ${currentLanguage.name} • Huruf: ${currentWord.word[0].toUpperCase()}`;

  elementList.innerHTML = "<li>Loading...</li>";

  try {
    const ref = collection(
      db,
      "users",
      currentUser.uid,
      "languages",
      currentLanguage.id,
      "words",
      currentWord.id,
      "elements"
    );
    const q = query(ref, orderBy("createdAt", "desc"));
    const snap = await getDocs(q);

    if (snap.empty) {
      elementList.innerHTML = "<li>Tiada elemen lagi. Tambah satu di atas.</li>";
      return;
    }

    elementList.innerHTML = "";
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      const li = document.createElement("li");

      const title = document.createElement("div");
      title.textContent = data.title || "(Tiada tajuk)";
      title.style.fontWeight = "bold";

      const meta = document.createElement("div");
      meta.style.fontSize = "0.85rem";
      meta.style.opacity = "0.8";
      meta.textContent = data.type ? data.type : "Umum";

      const content = document.createElement("pre");
      content.textContent = data.content || "";
      content.style.whiteSpace = "pre-wrap";
      content.style.marginTop = "4px";

      li.appendChild(title);
      li.appendChild(meta);
      li.appendChild(content);
      elementList.appendChild(li);
    });
  } catch (err) {
    console.error("Error load elements:", err);
    elementList.innerHTML = "<li>Gagal load elemen.</li>";
  }
}

addElementForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentUser || !currentLanguage || !currentWord) {
    alert("Pilih bahasa, huruf dan perkataan dahulu.");
    return;
  }

  const title = elementTitle.value.trim();
  const content = elementContent.value.trim();
  const template = elementTemplate.value;

  if (!title || !content) {
    alert("Sila isi tajuk dan isi elemen.");
    return;
  }

  let type;
  if (template === "sentence") type = "Ayat";
  else if (template === "paragraph") type = "Karangan";
  else if (template === "note") type = "Nota";
  else type = "Umum";

  try {
    const ref = collection(
      db,
      "users",
      currentUser.uid,
      "languages",
      currentLanguage.id,
      "words",
      currentWord.id,
      "elements"
    );
    await addDoc(ref, {
      title,
      content,
      type,
      createdAt: serverTimestamp(),
    });

    elementTitle.value = "";
    elementContent.value = "";
    elementTemplate.value = "";

    await loadElementsForWord();
  } catch (err) {
    console.error("Error add element:", err);
    alert("Gagal simpan elemen.");
  }
});

// ============================================================
// PART 7 — THEME TOGGLE (REUSE PATTERN STRESS APP)
// ============================================================

// Load saved theme
const savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark") {
  document.body.classList.add("dark");
  themeToggle.textContent = "Light Mode";
}

// Toggle theme on click
themeToggle.addEventListener("click", () => {
  const isDark = document.body.classList.toggle("dark");

  if (isDark) {
    localStorage.setItem("theme", "dark");
    themeToggle.textContent = "Light Mode";
  } else {
    localStorage.setItem("theme", "light");
    themeToggle.textContent = "Dark Mode";
  }
});
