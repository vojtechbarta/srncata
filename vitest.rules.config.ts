// Samostatná Vitest konfigurace jen pro firestore.rules.test.ts — ten
// běží proti opravdovému Firestore emulátoru (ne jen v paměti jako
// zbytek test suite, viz vite.config.ts), potřebuje ho spuštěný a nesmí
// se namíchat do běžného `npm test`. Spouští se přes:
//
//   npm run test:rules
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["firestore.rules.test.ts"],
  },
});
