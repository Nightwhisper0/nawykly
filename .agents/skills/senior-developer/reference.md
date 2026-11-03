# Senior Developer — reference

Materiał pomocniczy do [SKILL.md](SKILL.md): rozpoznanie kodu, metoda pracy, testy, refaktoryzacja i weryfikacja.

## 1. Rozpoznanie kodu

### 1.1. Stan repozytorium

```bash
git status
git diff --stat
```

- Sprawdź, czy w drzewie są niezatwierdzone zmiany użytkownika — nie nadpisuj ich i nie cofaj.
- Ustal, czy pracujesz na czystym stanie, czy kontynuujesz czyjąś zmianę.

### 1.2. Stack i skrypty

```bash
ls -la
cat package.json 2>/dev/null
cat pyproject.toml 2>/dev/null
cat requirements.txt 2>/dev/null
cat go.mod 2>/dev/null
```

W `package.json` sprawdź `scripts` i `devDependencies`: runner testów, lint, typecheck, build. W Pythonie sprawdź konfigurację pytest/ruff/mypy.

### 1.3. Docelowy obszar

- Przeczytaj plik, który będziesz zmieniać, oraz jego bezpośrednich sąsiadów.
- Prześledź przepływ danych: wejście → transformacja → wyjście.
- Znajdź wszystkie użycia zmienianych funkcji, komponentów i typów:

```bash
grep -rn "nazwaFunkcji" . --exclude-dir=node_modules --exclude-dir=.git
# lub, jeśli dostępny:
rg "nazwaFunkcji"
```

- Przeczytaj istniejące testy dla tego obszaru — pokazują oczekiwane zachowanie i konwencje.
- Sprawdź, czy plik nie jest generowany lub vendored (wtedy nie edytuj).

### 1.4. Konwencje

Zanotuj przed implementacją:

- język i styl nazewnictwa (`camelCase`, `snake_case`),
- sposób eksportu i organizacji modułów,
- obsługę błędów (wyjątki, kody błędów, fallbacki),
- sposób logowania,
- styl testów i asercji,
- formatowanie (prettier/ruff) i reguły lint.

## 2. Zachowanie istniejących wzorców

- Nowy kod ma wyglądać jak kod wokół niego, nie jak „idealny” kod z innego projektu.
- Nie wprowadzaj równoległego wzorca, jeśli w projekcie już istnieje rozwiązanie tego problemu.
- Nie zmieniaj globalnego stylu (np. cudzysłowów, średników, organizacji importów) w plikach, których zadanie nie dotyczy.
- Jeśli istniejący wzorzec jest wyraźnie szkodliwy, opisz problem i zaproponuj osobny refactor — nie naprawiaj go po cichu w ramach bieżącego zadania.
- Trzymaj się publicznego API modułu; jeśli musisz je zmienić, zaktualizuj wszystkie wywołania i testy oraz zaznacz to w podsumowaniu.

## 3. Metoda małych kroków

### Definicja kroku

Krok to najmniejsza zmiana, która:

- daje się opisać jednym zdaniem,
- pozostawia projekt w stanie kompilowalnym/uruchamialnym,
- ma jasny sposób weryfikacji (test, build, ręczne sprawdzenie).

### Plan

Przed edycją zapisz 3–7 kroków w [templates/implementation-plan.md](templates/implementation-plan.md). Dla każdego wskaż plik i weryfikację. Przykład:

| Krok | Zmiana | Plik | Weryfikacja |
|---|---|---|---|
| 1 | Dodaj test odtwarzający błąd | `tests/streak.test.js` | test failuje z oczekiwanego powodu |
| 2 | Popraw logikę serii | `app.js` | test przechodzi |
| 3 | Uruchom pakiet testów | — | brak regresji |

### Zasady

- Po każdym kroku uruchom targeted test lub kompilację.
- Nie łącz refaktoryzacji z nową funkcją.
- Nie zostawiaj kodu w stanie połowicznie zmienionym na koniec sesji.
- Jeśli krok okaże się większy niż zakładano, podziel go.
- Jeśli test ujawni problem poza zakresem — zapisz go i zaproponuj follow-up; nie rozszerzaj diffu.

## 4. Implementacja funkcji

- Zacznij od minimalnego pionowego wycinka: wejście → logika → wyjście → test.
- Najpierw ścieżka szczęśliwa, potem walidacja i przypadki brzegowe.
- Dodawaj tylko potrzebne opcje; nie twórz „na przyszłość”.
- Zachowaj spójną obsługę błędów z resztą modułu.
- Jeśli zmieniasz kontrakt (API, propsy, format danych), zaktualizuj konsumentów i testy.
- Nie dodawaj nieużywanych abstrakcji i warstw.

## 5. Bugfix

### Kolejność

1. **Reprodukcja** — test, skrypt lub minimalne kroki; zapisz faktyczny objaw.
2. **Przyczyna** — ustal, dlaczego występuje; nie poprawiaj tylko objawu.
3. **Test regresyjny** — powinien failować przed poprawką.
4. **Minimalna poprawka** — w miejscu przyczyny, nie w przypadkowym miejscu.
5. **Weryfikacja** — test regresyjny, testy powiązane, szerszy pakiet.

### Zasady

- Nie naprawiaj kilku niepowiązanych błędów w jednej zmianie.
- Nie zmieniaj oczekiwanego zachowania bez potwierdzenia, że jest błędne.
- Jeśli błąd wynika z decyzji architektonicznej, zgłoś to zamiast obchodzić problem.

## 6. Testy

### Standardy

- Arrange–Act–Assert; jedna przyczyna niepowodzenia.
- Nazwa opisuje oczekiwane zachowanie: `should ... when ...` lub po polsku `powinien ... gdy ...`.
- Asercje sprawdzają wynik i zachowanie, nie szczegóły implementacji.
- Testy są deterministyczne: brak sieci, zegara i losowości bez mocków.
- Każdy test przygotowuje własny stan i sprząta po sobie.
- Pokryj: happy path, wartości graniczne, niepoprawne wejście, stan pusty, błąd zależności, regresję.

### Przykład JS/Vitest

```js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { streakOf } from './habits.js';

describe('streakOf', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-31T09:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('liczy tylko zaplanowane dni i zatrzymuje się na pierwszej luce', () => {
    const habit = {
      days: [1, 3, 5],
      completions: { '2026-10-30': true, '2026-10-28': true },
    };

    expect(streakOf(habit)).toBe(2);
  });
});
```

### Przykład Vue

```js
import { mount } from '@vue/test-utils';
import HabitCard from './HabitCard.vue';

it('emituje toggle po kliknięciu „Zrobione”', async () => {
  const wrapper = mount(HabitCard, {
    props: { habit: { id: '1', name: 'Spacer', emoji: '🚶' }, done: false },
  });

  await wrapper.get('.done-btn').trigger('click');

  expect(wrapper.emitted('toggle')).toEqual([[expect.objectContaining({ id: '1' })]]);
});
```

### Gdy nie ma runnera testów

- Nie instaluj frameworka bez zgody.
- Zweryfikuj zmianę dostępnymi środkami (headless browser, skrypt, ręczne kroki).
- W podsumowaniu napisz wprost: „brak runnera; testy nieuruchomione” i podaj propozycję konfiguracji jako follow-up.

## 7. Lokalna refaktoryzacja

- **Zachowanie bez zmian.** Nie dodawaj funkcji ani nie zmieniaj kontraktów przy okazji.
- **Zakres.** Tylko pliki i moduły objęte zadaniem.
- **Bezpieczeństwo.** Jeśli brak testów, najpierw dopisz testy charakterystyczne.
- **Kroki.** Jedna zmiana strukturalna na raz (rename, extract, move), po każdej uruchom testy.
- **Narzędzia.** Używaj refaktoryzacji IDE, jeśli są dostępne; ręczne zmiany nazw zawsze poprzedź wyszukaniem użyć.
- **Stop.** Jeśli refactor wymaga zmiany architektury lub wielu modułów — zatrzymaj się i zaproponuj plan principal-level.

## 8. Weryfikacja

| Stack | Testy | Lint / typy | Build |
|---|---|---|---|
| Node/Vitest | `CI=1 npm test` lub `npx vitest run` | `npx tsc --noEmit`, `npx eslint .` | `npm run build` |
| Jest | `npx jest --ci` | `npx tsc --noEmit`, `npx eslint .` | `npm run build` |
| Python | `python -m pytest -q` | `ruff check .`, `mypy .` | — |
| Go | `go test ./...` | `go vet ./...` | `go build ./...` |
| Web bez builda | headless Chrome / testy manualne | — | — |

Zasady raportowania:

- podaj dokładną komendę i wynik (liczba testów, pass/fail),
- oddziel błędy istniejące przed zmianą od nowych,
- nie pisz „wszystko działa”, jeśli uruchomiono tylko część sprawdzeń,
- jeśli komenda wymaga watch mode, użyj flagi CI/`--run`.

## 9. Zależności

Przed dodaniem zależności wypełnij krótkie uzasadnienie:

1. Jaką lukę zamyka?
2. Dlaczego istniejące biblioteki lub rozwiązanie natywne nie wystarczają?
3. Jaki jest koszt utrzymania, bezpieczeństwa, licencji i rozmiaru?
4. Czy da się ją łatwo usunąć?
5. Kto zaakceptuje dodanie?

Zasady:

- jedna zależność na raz,
- wersja przypięta zgodnie z polityką projektu,
- lockfile zaktualizowany,
- brak instalacji globalnych,
- brak aktualizacji niezwiązanych pakietów.

## 10. Git i higiena zmian

- `git status` przed pracą; nie nadpisuj niezatwierdzonych zmian.
- `git diff` przed podsumowaniem; sprawdź, czy każda zmiana jest zamierzona.
- Nie używaj `git reset --hard`, `git checkout --`, `git clean -fd` bez wyraźnego polecenia.
- Nie commituj, nie pushuj i nie zmieniaj historii bez polecenia.
- Nie dodawaj plików tymczasowych, logów, zrzutów ani sekretów do repozytorium.

## 11. Typowe pułapki

- Zmiana zachowania „przy okazji” refaktoryzacji.
- Reformatowanie całego pliku i ukrywanie realnego diffu.
- Dodanie zależności dla jednej funkcji, którą można napisać w 20 liniach.
- Test, który przechodzi niezależnie od implementacji (brak asercji).
- Poprawka objawu zamiast przyczyny.
- Rozszerzanie zakresu, bo „skoro już tu jestem”.
- Ignorowanie istniejących testów i konwencji.
- Zostawienie debugowych logów i martwego kodu.
- Zmiana publicznego API bez aktualizacji konsumentów.
- Zignorowanie pre-existing failure i przypisanie go nowej zmianie.

## 12. Kontekst tego repozytorium (stan na listopad 2026)

- Aplikacja to prototyp Vue 3 ładowany globalnie z CDN; brak `package.json`, builda i runnera testów.
- Nie wprowadzaj Vite/npm „przy okazji” — to decyzja architektoniczna wymagająca `principal-developer`.
- Zmiany w `app.js`, `index.html`, `styles.css` utrzymuj w istniejącym stylu (globalny `createApp`, bez SFC).
- Weryfikacja bez runnera: headless Chrome (`--dump-dom`, `--screenshot`) oraz ręczne sprawdzenie kluczowych ścieżek.
- Obszary wymagające szczególnej ostrożności: `localStorage`, logika serii (`streakOf`), przypomnienia (`checkReminders`), walidacja formularza, dostępność i responsywność.
- Jeśli zadanie wymaga testów jednostkowych w tym repo, najpierw zaproponuj minimalne narzędzie i poczekaj na zgodę.
