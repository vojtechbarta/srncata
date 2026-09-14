// Samostatná Vitest konfigurace jen pro firestore.rules.test.ts a
// storage.rules.test.ts — běží proti opravdovým Firestore/Storage
// emulátorům (ne jen v paměti jako zbytek test suite, viz
// vite.config.ts), potřebuje je spuštěné a nesmí se namíchat do
// běžného `npm test`. Spouští se přes:
//
//   npm run test:rules
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["firestore.rules.test.ts", "storage.rules.test.ts"],
  },
});
