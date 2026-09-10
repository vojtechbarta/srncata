// E2E testy proti appce běžící na Vite dev serveru + Firestore/Auth
// emulátorech — spustit přes:
//
//   npm run test:e2e
//
// (wrapper `firebase emulators:exec` v tom skriptu emulátory sám
// nastartuje a po doběhnutí zase ukončí; tenhle config jen navíc
// spustí/počká na `npm run dev` a před prvním testem zavolá
// e2e/global-setup.ts, co emulátor naplní daty.) Spouštět NIKDY přímo
// `playwright test` bez toho wrapperu — bez emulátorů appka nikoho
// nepřihlásí a všechny testy spadnou na timeoutu.
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  // Jediný lokální Firestore/Auth emulátor pod sebou — moc paralelních
  // workerů (realtime listenery + přihlašování současně) ho uměl na
  // chvíli přehltit a způsobit ojedinělé timeouty, co s appkou samotnou
  // nesouvisí. 2 je dost na rozumnou rychlost bez toho.
  workers: 2,
  retries: process.env.CI ? 1 : 1,
  reporter: [["list"]],
  globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL: "http://localhost:5173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
