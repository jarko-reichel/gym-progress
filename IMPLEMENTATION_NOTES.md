# Implementačné poznámky — Gym Progress

Dokument zhŕňa technické rozhodnutia, výzvy a obmedzenia aplikácie. Určený pre posudzovateľa a ako kontext pre ďalší vývoj.

## 1. Architektonické rozhodnutia

### Vrstvená architektúra

Aplikácia je rozdelená do nezávislých vrstiev, ktoré spolu komunikujú jednosmerne:

```
screens / components  (UI)
        │
        ▼
     hooks  (useExercises, useWorkouts, useSettings …)
        │
        ▼
  repositories  (exerciseRepo, setRepo, workoutRepo, prRepo, settingsRepo, templateRepo)
        │
        ▼
     Dexie  (IndexedDB)

      domain/…  (oneRm, volume, personalRecords, streak, exportImport)
```

`domain/` nemá žiadne závislosti na React alebo Dexie — je to čistý TypeScript, pokrytý unit testami. UI hooky používajú doménové funkcie a volajú repositories, ktoré sú jediným miestom, ktoré pristupuje priamo k Dexie.

### Dexie + liveQuery namiesto TanStack Query pre dáta

Zvažované boli dve možnosti:

1. **TanStack Query + manuálne invalidácie** — znamená pri každom zápise volať `queryClient.invalidateQueries(...)`.
2. **Dexie liveQuery cez `useLiveQuery`** — auto-reagujúce hooky. Zmena v danej tabuľke automaticky re-renderuje všetky komponenty, ktoré z nej čerpajú.

Zvolená je druhá cesta — menej boilerplate, žiadne zabudnuté invalidácie. TanStack Query je stále nainštalovaný a pripravený pre budúce async operácie (napr. remote sync).

### TypeScript strict + `noUncheckedIndexedAccess`

Projekt má prísny typový režim vrátane `noUncheckedIndexedAccess: true`, vďaka ktorému kompilátor núti spracovať `undefined` pri `array[i]` prístupe. To eliminuje celú triedu runtime chýb za cenu o niečo viac boilerplate (`const s = sets[i]!` v testoch, `?.` v produkčnom kóde).

## 2. Výzvy a ich riešenia

### Type inference `useLiveQuery`

`useLiveQuery(fn, deps, defaultValue)` zo `dexie-react-hooks` odvodí návratový typ ako uniu `T | Default`. Default `[]` sa typuje ako `never[]`, čo následne poisťuje celý kód za `|` (`Exercise[] | never[]`) a spôsobuje desiatky chýb pri `.map` / `.filter`.

**Riešenie:** vytvoriť typovaný prázdny pole-konstant (`const EMPTY_SETS: SetEntry[] = []`) a odovzdať ho ako default. Inferencia vtedy vráti `SetEntry[]`.

### Deklarované runtime zlyhania `page.evaluate` počas seed demo skriptu

`scripts/take_screenshots.ts` pôvodne obsahoval komplexný `seedDemo` flow: mazal IndexedDB, opätovne načítal stránku a cez `indexedDB.open` vložil niekoľko workoutov. Playwright zlyhal s `Execution context was destroyed`, pretože Service Worker z produkčného buildu vyvolával prekrývajúce sa navigácie.

**Riešenie:** skript prepísaný tak, aby používal UI flow rovnako ako E2E testy, a je odporúčané spúšťať ho oproti dev serveru (bez SW). Náhradou za seededný graf je `04_active_workout.png` generovaný cez 3 reálne série. Full-history snímku s grafom progresu by bolo nutné realizovať priamo vo vývojovom móde cez Playwright Devtools protocol (mimo scope tejto práce).

### Race condition pri rýchlom pridávaní sérií

Pôvodný E2E test `02_add_workout` klikal na tlačidlo `add-set-btn` v tesnej slučke. Medzi `setRepo.create()` a `useLiveQuery` prepínaním existuje async okno, v ktorom SetForm zatiaľ nestihol resetovať inputy, a Playwright `fill(...)` sa mohol namapovať do ešte neresetovaného stavu.

**Riešenie:** test čaká `toHaveCount(i+1)` po každom pridaní. V produkčnom UI situácia nenastáva, keďže reálny používateľ neklikne dvakrát v rámci jedného animation frame.

### Grafy v Recharts s reaktívnym datasetom

Recharts renderuje `<LineChart data={...}>` / `<BarChart data={...}>` synchronne. Pri prvom načítaní je pole prázdne, čo by spôsobilo prázdny SVG bez osí. Preto skrývame graf podmienene (`if (data.length === 0) return <EmptyState />`) až do chvíle, keď liveQuery prinesie aspoň 2 body.

### PWA manifest + ikony

Vlastný generátor `scripts/generate_icons.mjs` vytvorí 192×192 a 512×512 PNG bez externej závislosti (čistý Node zlib + PNG encoder). Pôvodne skript zlyhával kvôli URL-encoded diakritike v ceste (`%C3%A1`), riešenie: `fileURLToPath(import.meta.url)` namiesto `.pathname`.

## 3. Pokrytie testami

### Unit testy (`tests/unit/`)

Pokryté sú čisté doménové moduly:

| Modul | Scenáre |
| --- | --- |
| `oneRm.ts` | Epley/Brzycki/LeSuer presnosť, 1 rep = váha, 0 váhy = 0, cap pri 15+ reps |
| `volume.ts` | setVolume, totalVolume, weekly bucket rozdelenie |
| `personalRecords.ts` | detekcia prvého 1RM, vyššieho 1RM, lepšieho best setu |
| `streak.ts` | aktívna streak dnes, streak včera, dlhší interval = 0 |
| `exportImport.ts` | JSON round-trip, CSV `;` + BOM, validácia schema verzie |

### E2E testy (`tests/e2e/`)

5 scenárov v Playwright, spúšťané proti produkčnému buildu cez `vite preview`. Pokrývajú najkritickejšie používateľské toky.

## 4. Obmedzenia

- **Žiadna synchronizácia do cloudu** — dáta sú čisto lokálne (IndexedDB). Prenos medzi zariadeniami cez export/import JSON.
- **Žiadna multi-užívateľská podpora** — aplikácia predpokladá jedného používateľa na inštanciu prehliadača.
- **1RM je odhad**, nie meranie — vzorce sú presné ±5 % pre 1–10 reps, mimo rozsahu klesá presnosť.
- **Chart tooltipy v SK locale** — Recharts formátovače jazyk preberajú z bundlu, nie z Dexie settings.
- **Detekcia inštalovateľnosti PWA** je podmienená browserom — `beforeinstallprompt` funguje na Chromium, iOS Safari vyžaduje návod „Add to Home Screen".

## 5. Možné rozšírenia

1. **Cloud sync** — Firebase / Supabase backend, konfliktná stratégia založená na `updatedAt` a `deleted` flagoch.
2. **Rest-timer** a superseries — časovač oddychu a podpora supersetov.
3. **Import z iných appiek** — Strong, Hevy (mapovanie ich CSV na našu schému).
4. **Graf silových kriviek** — pomer 1RM medzi bench/squat/deadlift ako jeden pohľad.
5. **AI odporúčania** — na základe histórie predvyplniť ďalšiu váhu pre progresívnu záťaž (lineárne alebo RPE-based).
6. **Voice input** — pre pridávanie série počas tréningu bez dotyku displeja (Web Speech API).

## 6. Štruktúra commitov

Projekt má 3 zmysluplné commity:

1. `feat: initial project setup and data layer` — Vite/TS/Tailwind/PWA konfigurácia, Dexie schéma a repositories, doménová vrstva.
2. `feat: workout tracking MVP + dashboard` — všetky obrazovky, i18n, grafy, theme, export/import, seed.
3. `test: add unit and E2E test suites + screenshots` — Jest konfig a unit testy, Playwright konfig a 5 E2E scenárov, screenshot skript, dokumentácia a diagramy.
