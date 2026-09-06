import { initializeApp } from "firebase/app";
import {
  getAuth,
  connectAuthEmulator,
  GoogleAuthProvider,
} from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

// Konfigurace se bere z .env (viz .env.example). Pro lokální vývoj stačí
// libovolné neprázdné hodnoty — appka běží proti Firebase emulátorům a na
// skutečný Firebase projekt se nepřipojuje, dokud VITE_USE_EMULATORS=false.
// `||` (ne `??`): v .env.example jsou prázdné řetězce, ne undefined, a Auth
// SDK si i v emulátoru ověřuje TVAR klíče (musí vypadat jako "AIzaSy…", 39
// znaků) ještě předtím, než se appka stihne přepnout na emulátor.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSy" + "0".repeat(33),
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "demo.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo-srncata",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "demo.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "0",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "demo-app-id",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

const useEmulators = import.meta.env.VITE_USE_EMULATORS !== "false";

if (useEmulators) {
  // Lokální vývoj/test: Firebase Local Emulator Suite (viz README).
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
}
