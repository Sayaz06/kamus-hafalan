import { db } from "./firebase-config.js";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// LANGUAGES

export async function getLanguages(userId, searchTerm = "") {
  const ref = collection(db, "users", userId, "languages");
  const snapshot = await getDocs(ref);
  const list = [];
  snapshot.forEach(d => {
    const data = d.data();
    const name = (data.name || "").toLowerCase();
    if (!searchTerm || name.includes(searchTerm.toLowerCase())) {
      list.push({ id: d.id, ...data });
    }
  });
  list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  return list;
}

export async function addLanguage(userId, name) {
  const ref = collection(db, "users", userId, "languages");
  const docRef = await addDoc(ref, {
    name,
    createdAt: serverTimestamp()
  });
  return docRef.id;
}

// WORDS

export async function getWordsByLetter(userId, languageId, letter, searchTerm = "") {
  const ref = collection(db, "users", userId, "languages", languageId, "words");
  const snapshot = await getDocs(ref);
  const list = [];
  snapshot.forEach(d => {
    const data = d.data();
    const sameLetter = (data.letter || "").toUpperCase() === letter.toUpperCase();
    if (!sameLetter) return;
    const w = (data.word || "").toLowerCase();
    if (!searchTerm || w.includes(searchTerm.toLowerCase())) {
      list.push({ id: d.id, ...data });
    }
  });
  list.sort((a, b) => (a.word || "").localeCompare(b.word || ""));
  return list;
}

export async function searchWordsInLanguage(userId, languageId, searchTerm) {
  const ref = collection(db, "users", userId, "languages", languageId, "words");
  const snapshot = await getDocs(ref);
  const list = [];
  snapshot.forEach(d => {
    const data = d.data();
    const w = (data.word || "").toLowerCase();
    if (w.includes(searchTerm.toLowerCase())) {
      list.push({ id: d.id, ...data });
    }
  });
  list.sort((a, b) => (a.word || "").localeCompare(b.word || ""));
  return list;
}

export async function addWord(userId, languageId, word) {
  const ref = collection(db, "users", userId, "languages", languageId, "words");
  const letter = (word[0] || "").toUpperCase();
  const docRef = await addDoc(ref, {
    word,
    letter,
    createdAt: serverTimestamp()
  });
  return docRef.id;
}

export async function getWord(userId, languageId, wordId) {
  const ref = doc(db, "users", userId, "languages", languageId, "words", wordId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

// ELEMENTS (Ayat biasa sahaja untuk V1)

export async function getElements(userId, languageId, wordId, searchTerm = "") {
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
  const snapshot = await getDocs(ref);
  const list = [];
  snapshot.forEach(d => {
    const data = d.data();
    const title = (data.title || "").toLowerCase();
    const content = (data.content || "").toLowerCase();
    if (
      !searchTerm ||
      title.includes(searchTerm.toLowerCase()) ||
      content.includes(searchTerm.toLowerCase())
    ) {
      list.push({ id: d.id, ...data });
    }
  });
  list.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
  return list;
}

export async function addElementSentence(userId, languageId, wordId, title, content) {
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
    type: "sentence",
    title,
    content,
    createdAt: serverTimestamp()
  });
  return docRef.id;
}
