# CLAUDE.md

## Testy před commitem

Po dokončení každé úlohy, před vytvořením gitového commitu, vždy spusť celou
testovací sadu:

```bash
npm test            # unit testy (Vitest) — src/lib/*.test.ts
npm run test:rules  # testy firestore.rules — potřebuje Firebase CLI, spustí si vlastní emulátor
npm run test:e2e    # e2e testy v prohlížeči (Playwright) — taky přes emulátor
```

Commituj jen když všechny tři projdou. Pokud něco spadne, oprav to (nebo se
zeptej, než budeš pokračovat) — nikdy necommituj se selhávajícími testy.

Když změna nemá šanci ovlivnit danou vrstvu (např. úprava jen textu v
`README.md`), lze příslušnou sadu vynechat, ale v případě pochybností je
bezpečnější spustit všechny tři.
