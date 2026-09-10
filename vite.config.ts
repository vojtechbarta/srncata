import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
// defineConfig z 'vitest/config' (ne 'vite') — jinak TypeScript nezná
// klíč "test" níže (typy pro Vitest se sem přimíchají jen takhle).
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    // jsdom (ne node) — testy na LPIS potřebují DOMParser pro rozparsování
    // WFS odpovědi (viz src/lib/lpis.ts), stejný jako appka v prohlížeči.
    environment: 'jsdom',
    // firestore.rules.test.ts (npm run test:rules) a e2e/*.spec.ts (npm
    // run test:e2e) vyžadují běžící emulátor/Playwright, ne Vitest — bez
    // nich by jen spadly na chybě připojení nebo na chybějícím `test`
    // z @playwright/test, tak jsou z běžného `npm test` vyloučené.
    exclude: ['**/node_modules/**', 'firestore.rules.test.ts', 'e2e/**'],
  },
})
