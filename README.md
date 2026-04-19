# Gym Progress

Progresívna webová aplikácia (PWA) pre záznam, analýzu a vizualizáciu silového tréningu. Ukladá dáta lokálne v prehliadači (IndexedDB), funguje offline, podporuje inštaláciu na domovskú obrazovku a je plne lokalizovaná do slovenčiny.

Bakalárska práca · Univerzita Konštantína Filozofa v Nitre · Fakulta prírodných vied a informatiky.

## Funkcie

- **Zaznamenávanie tréningov** — workout, cvik, série (váha × opakovania × RPE)
- **Automatický výpočet odhadu 1RM** — Epley, Brzycki, Le Suer (prepínateľné v nastaveniach)
- **Vizualizácie** — graf progresu 1RM, týždenný objem podľa svalovej partie, rekordy
- **Personálne rekordy (PR)** — automatická detekcia po každej sérii (1RM, best set, objem)
- **Šablóny tréningov** — rýchly štart opakujúceho sa workoutu
- **Export / import** — JSON a CSV (stĺpce oddelené `;`, UTF-8 BOM)
- **Offline-first** — Service Worker + IndexedDB, dáta sa synchronizujú s UI v reálnom čase
- **Tmavý režim**, prepínateľný manuálne alebo podľa OS
- **PWA inštalácia** na mobil aj desktop

## Technológie

| Vrstva | Technológia |
| --- | --- |
| UI | React 19, Tailwind CSS 3, shadcn/ui princípy, lucide-react ikony |
| Routing | React Router v6 |
| Stav | Zustand (UI state), Dexie liveQuery (dáta) |
| Perzistencia | Dexie.js 4 nad IndexedDB |
| Grafy | Recharts 2 (LineChart, BarChart) |
| Build | Vite 5, TypeScript 5.5 (strict + noUncheckedIndexedAccess) |
| PWA | vite-plugin-pwa (Workbox) |
| Testy | Jest 29 (unit, jsdom + fake-indexeddb), Playwright 1.47 (E2E) |

## Predpoklady

- Node.js ≥ 20.x
- npm ≥ 10.x

## Inštalácia

```bash
cd Gym-Progress
npm install --legacy-peer-deps
```

## Spustenie

```bash
# Vývojový režim (HMR, http://localhost:5173)
npm run dev

# Produkčný build
npm run build

# Náhľad produkčného buildu (http://localhost:4173)
npm run preview
```

Pri prvom štarte sa automaticky vytvorí katalóg 20 cvikov v slovenčine.

## Testovanie

```bash
# Unit testy (Jest)
npm test

# Pokrytie
npm run test:coverage

# E2E testy (Playwright) — automaticky spustí preview server
npm run test:e2e
```

E2E testy pokrývajú päť hlavných scenárov:

1. Prvé otvorenie — overenie navigácie a seed cvikov
2. Vytvorenie tréningu, pridanie cviku, tri série + výpočet 1RM
3. Graf progresu po viacerých sessionoch
4. Offline zápis série (IndexedDB ako zdroj pravdy)
5. Export a import JSON zachová počty záznamov

## Screenshoty

```bash
# Najprv spustite dev server alebo preview, potom:
BASE_URL=http://localhost:5173 npm run screenshots
```

Screenshoty sa ukladajú do `screenshots/` (10 obrázkov — dashboard light/dark, new workout, active workout, exercises, exercise detail, settings, offline, install prompt, mobile view).

## Architektúra

```
src/
├── db/               # Dexie schéma, seedy, repositories
│   ├── schema.ts
│   ├── seed.ts
│   └── repositories/
├── domain/           # Čistá doménová logika (testovateľná bez DOM)
│   ├── oneRm.ts
│   ├── volume.ts
│   ├── personalRecords.ts
│   ├── streak.ts
│   └── exportImport.ts
├── hooks/            # React hooky nad Dexie liveQuery
├── state/            # Zustand store (UI, toast)
├── screens/          # Routované obrazovky
├── components/       # Layout, UI primitívy, ErrorBoundary, ThemeManager
├── i18n/             # Slovenské preklady
└── utils/            # uuid, pomocné funkcie
```

Diagramy (use case, class, sequence) sú v `diagrams/` ako Mermaid. Viac v [IMPLEMENTATION_NOTES.md](IMPLEMENTATION_NOTES.md).

## Licencia

MIT — voľne použiteľné na nekomerčné aj komerčné účely.
