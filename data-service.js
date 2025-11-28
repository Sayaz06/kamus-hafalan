import {
  db,
  collection,
  doc,
  getDocs,
  addDoc,
  serverTimestamp,
} from "./firebase-config.js";

/* =======================
   LANGUAGES
======================= */

export async function getLanguages(userId) {
  const ref = collection(db, "users", userId, "languages");
  const snap = await getDocs(ref);
  const list = [];
  snap.forEach((doc) => {
    list.push({ id: doc.id, ...doc.data() });
  });
  return list;
}

export async function addLanguage(userId, name) {
  const ref = collection(db, "users", userId, "languages");
  await addDoc(ref, {
    name,
    createdAt: serverTimestamp(),
  });
}

/* =======================
   WORDS
======================= */

export async function getWordsByLetter(userId, languageId, letter) {
  const ref = collection(
    db,
    "users",
    userId,
    "languages",
    languageId,
    "words"
  );
  const snap = await getDocs(ref);
  const list = [];
  snap.forEach((doc) => {
    const data = doc.data();
    if (data.word && data.word[0].toUpperCase() === letter.toUpperCase()) {
      list.push({ id: doc.id, ...data });
    }
  });
  return { words: list, total: list.length };
}

export async function addWord(userId, languageId, word) {
  const ref = collection(
    db,
    "users",
    userId,
    "languages",
    languageId,
    "words"
  );
  await addDoc(ref, {
    word,
    letter: word[0].toUpperCase(),
    createdAt: serverTimestamp(),
  });
}

/* =======================
   ELEMENTS
======================= */

export async function getElementsForWord(userId, languageId, wordId) {
  const ref = collection(
    db,
    "users",
    userId,
    "languages",
    languageId,
    "words",
    wordId,
    "elements"
  );
  const snap = await getDocs(ref);
  const list = [];
  snap.forEach((doc) => {
    list.push({ id: doc.id, ...doc.data() });
  });
  return list;
}

export async function addElementHtml(userId, languageId, wordId, title, htmlContent, type) {
  const ref = collection(
    db,
    "users",
    userId,
    "languages",
    languageId,
    "words",
    wordId,
    "elements"
  );
  const docRef = await addDoc(ref, {
    title,
    content: htmlContent,
    type: type || "Umum",
    createdAt: serverTimestamp(),
  });
  return {
    id: docRef.id,
    title,
    content: htmlContent,
    type: type || "Umum",
    createdAt: new Date(),
  };
}
