import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBJI8GAiri7BMdnY9GYDjBUvHW4Y4kZjpI",
  authDomain: "wordnest-dc197.firebaseapp.com",
  projectId: "wordnest-dc197",
  storageBucket: "wordnest-dc197.firebasestorage.app",
  messagingSenderId: "772317278184",
  appId: "1:772317278184:web:b23971bcd9e135a1557e5d",
  measurementId: "G-1X2QYKHB28"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

export { auth, provider, signInWithPopup, signOut, db };
