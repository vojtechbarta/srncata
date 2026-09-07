import { initializeApp } from "firebase/app";
import {
  getAuth,
  connectAuthEmulator,
  GoogleAuthProvider,
} from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

// Konfigurace se bere z .env (viz .env.example). V emulátorovém režimu
// (VITE_USE_EMULATORS=true, výchozí pro lokální vývoj) IGNORUJEME hodnoty
// z .env úplně a natvrdo použijeme "demo-srncata" — i když .env má kvůli
// budoucímu ostrému nasazení vyplněný skutečný produkční projectId
// (zachran-srnce-msk), appka by se pod ním v emulátoru připojila do JINÉHO
// (prázdného) datového prostoru, než kam sahá `npm run emulators`/`npm run
// seed` (--project demo-srncata) — pak appka nikoho nenajde v týmu, přitom
// nejde o chybu přihlášení, jen o mismatch projektů uvnitř emulátoru.
const useEmulators = import.meta.env.VITE_USE_EMULATORS !== "false";

const firebaseConfig = useEmulators
  ? {
      apiKey: "AIzaSy" + "0".repeat(33),
      authDomain: "demo.firebaseapp.com",
      projectId: "demo-srncata",
      storageBucket: "demo.appspot.com",
      messagingSenderId: "0",
      appId: "demo-app-id",
    }
  : {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    };

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

if (useEmulators) {
  // Lokální vývoj/test: Firebase Local Emulator Suite (viz README).
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
}
