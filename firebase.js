// ============================================================
// firebase.js — Kamus Hafalan (ikut pattern Stress app)
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBJI8GAiri7BMdnY9GYDjBUvHW4Y4kZjpI",
  authDomain: "wordnest-dc197.firebaseapp.com",
  projectId: "wordnest-dc197",
  storageBucket: "wordnest-dc197.firebasestorage.app",
  messagingSenderId: "772317278184",
  appId: "1:772317278184:web:b23971bcd9e135a1557e5d",
  measurementId: "G-1X2QYKHB28"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
