import {
  db,
  collection,
  doc,
  getDocs,
  addDoc,
  serverTimestamp,
} from "./firebase-config.js";

// ... fungsi lain (getLanguages, addLanguage, getWordsByLetter, addWord) kekalkan ...

export async function getElementsForWord(userId, languageId, wordId) {
  const elementsRef = collection(
    db,
    "users",
    userId,
    "languages",
    languageId,
    "words",
    wordId,
    "elements"
  );
  const snap = await getDocs(elementsRef);
  const elements = [];
  snap.forEach((d) => {
    elements.push({ id: d.id, ...d.data() });
  });
  return elements;
}

export async function addElementHtml(
  userId,
  languageId,
  wordId,
  title,
  htmlContent,
  type
) {
  const elementsRef = collection(
    db,
    "users",
    userId,
    "languages",
    languageId,
    "words",
    wordId,
    "elements"
  );

  const docRef = await addDoc(elementsRef, {
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
