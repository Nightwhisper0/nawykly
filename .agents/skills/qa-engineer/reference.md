# QA Engineer — reference

Materiał pomocniczy do [SKILL.md](SKILL.md). Zawiera komendy, wzorce testów i katalog heurystyk przeglądu.

## 1. Wykrywanie stacku

Zacznij od inwentaryzacji, nie od założeń:

```bash
ls -la
cat package.json 2>/dev/null
cat pyproject.toml 2>/dev/null
cat requirements.txt 2>/dev/null
cat go.mod 2>/dev/null
```

Sprawdź też konfiguracje i skrypty:

```bash
ls vitest.config.* jest.config.* playwright.config.* cypress.config.* 2>/dev/null
ls .github/workflows 2>/dev/null
grep -n '"scripts"' -A 20 package.json 2>/dev/null
```

| Sygnał | Stack | Domyślny runner |
|---|---|---|
| `package.json` + `vite` + `vue` | Vue 3 | Vitest + `@vue/test-utils` |
| `package.json` + `react` | React | Vitest/Jest + Testing Library |
| `package.json` + `express`/`fastify` | Node.js API | Vitest/Jest + supertest |
| `pyproject.toml` / `pytest.ini` | Python | pytest |
| `go.mod` | Go | `go test` |
| brak runnera | dowolny | najpierw zapytaj o zgodę na konfigurację |

Ustal konwencje projektu: gdzie leżą testy, jak nazywane są pliki, czy używa się mocków, jaki jest styl asercji.

## 2. Uruchamianie

### Node.js / JS / TS

```bash
npm ci                                  # tylko jeśli brak node_modules i jest lockfile
CI=1 npm test                           # wymusza tryb jednorazowy zamiast watch
npx vitest run                          # bezpośrednio Vitest
npx vitest run --coverage
npx jest --ci --coverage
npx tsc --noEmit                        # typecheck
npx eslint .                            # lint
npm run build                           # build aplikacji
```

Uwaga: `npm test` często uruchamia tryb watch — w QA zawsze używaj `CI=1` lub flagi `--run`.

### Python

```bash
python -m pytest -q
python -m pytest -q --cov=. --cov-report=term-missing
ruff check .
mypy .
```

### Go

```bash
go test ./...
go vet ./...
```

### Aplikacje webowe / UI

Jeśli jest skonfigurowany Playwright/Cypress — użyj go. Jeśli nie, można wykonać podstawową weryfikację headless (Chrome/Edge):

```bash
chrome --headless=new --disable-gpu --dump-dom "file:///ścieżka/index.html"
chrome --headless=new --disable-gpu --window-size=1280,900 \
  --screenshot="/tmp/qa.png" "file:///ścieżka/index.html"
```

Sprawdź: konsolę (błędy JS), żądania sieciowe, render kluczowych widoków, zachowanie po odświeżeniu.

## 3. Wzorce testów

### 3.1. Czysta logika — Vitest/Jest

```js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isScheduledOn, completionRate } from './habits.js';

describe('isScheduledOn', () => {
  it('zwraca true, gdy dzień należy do harmonogramu', () => {
    // Arrange
    const habit = { days: [1, 3, 5] };
    const wednesday = new Date('2026-10-28T12:00:00');

    // Act
    const result = isScheduledOn(habit, wednesday);

    // Assert
    expect(result).toBe(true);
  });

  it('zwraca false dla dnia spoza harmonogramu', () => {
    const habit = { days: [1, 3, 5] };
    const sunday = new Date('2026-11-01T12:00:00');
    expect(isScheduledOn(habit, sunday)).toBe(false);
  });
});

describe('completionRate', () => {
  it('zwraca 0 dla pustej listy zamiast NaN', () => {
    expect(completionRate([])).toBe(0);
  });

  it('zaokrągla wynik do pełnych procentów', () => {
    expect(completionRate([true, true, false])).toBe(67);
  });
});
```

### 3.2. Czas i losowość — determinizm

```js
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-31T09:00:00'));
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

it('przypomina o nawyku o właściwej godzinie', () => {
  const reminders = checkReminders(habits, new Date());
  expect(reminders).toHaveLength(1);
});
```

Zasady:

- nie używaj `sleep`; steruj czasem przez fake timers,
- mockuj `Math.random`, `Date`, `crypto.randomUUID`, jeśli wpływają na wynik,
- testy stref czasowych uruchamiaj z jawną strefą lub na danych w UTC.

### 3.3. Komponent Vue — `@vue/test-utils`

```js
import { mount } from '@vue/test-utils';
import HabitCard from './HabitCard.vue';

it('emituje toggle po kliknięciu przycisku „Zrobione”', async () => {
  const habit = { id: '1', name: 'Trening', emoji: '🏋️', color: '#5F9C31' };
  const wrapper = mount(HabitCard, {
    props: { habit, done: false },
  });

  await wrapper.get('button.done-btn').trigger('click');

  expect(wrapper.emitted('toggle')).toEqual([[habit]]);
  expect(wrapper.text()).toContain('Trening');
});
```

- testuj zachowanie widoczne dla użytkownika (tekst, klasy stanu, emitowane zdarzenia),
- używaj `await nextTick()` po zmianie stanu,
- nie opieraj się wyłącznie na snapshotach,
- dla `v-model` sprawdzaj aktualizację i emitowane zdarzenia.

### 3.4. Python — pytest

```python
from datetime import date
import pytest
from habits import is_scheduled_on, completion_rate


@pytest.mark.parametrize(
    "weekday, expected",
    [(0, True), (2, True), (5, False)],
)
def test_is_scheduled_on(weekday, expected):
    habit = {"days": [0, 2, 4]}
    day = date(2026, 10, 26 + weekday)  # poniedziałek + offset
    assert is_scheduled_on(habit, day) is expected


def test_completion_rate_returns_zero_for_empty_list():
    assert completion_rate([]) == 0
```

### 3.5. Testy regresyjne

Dla zgłoszonego błędu:

1. Napisz test odtwarzający błąd (musi failować).
2. Potwierdź, że failuje z właściwego powodu.
3. Dopiero potem popraw kod (jeśli poprawka jest w zakresie).
4. Test musi przejść; uruchom cały pakiet, aby wykluczyć regresje.

## 4. Katalog heurystyk przeglądu

### 4.1. Logika i dane

- operatory: `==` vs `===`, `||` vs `??`, priorytety, negacje,
- off-by-one i granice pętli, `<=` vs `<`,
- `null` / `undefined` / `NaN`, puste tablice i obiekty,
- mutacja współdzielonych tablic/obiektów (`sort`, `splice`, spread),
- konwersje typów, `parseInt` bez podstawy, porównania liczb zmiennoprzecinkowych,
- strefy czasowe, zmiana czasu, daty lokalne vs UTC,
- `switch` bez `default`, nieosiągalny kod, brak zwrotu.

### 4.2. Asynchroniczność

- brakujące `await` / nieobsłużone `Promise`,
- wyścigi przy równoległych żądaniach lub szybkich kliknięciach,
- `setInterval`/`setTimeout` bez czyszczenia,
- listenery dodawane wielokrotnie bez usuwania,
- stan aktualizowany po odmontowaniu komponentu,
- błędy połykane w `catch` bez logu i fallbacku.

### 4.3. Wejście i walidacja

- brak walidacji długości, typu, zakresu, formatu,
- pola wymagane traktowane jak opcjonalne,
- dane z `localStorage`/API bez walidacji i migracji,
- niebezpieczne renderowanie: `v-html`, `innerHTML`, URL-e użytkownika,
- wstrzyknięcia: SQL, shell, template injection,
- sekrety w kodzie, logach lub repo.

### 4.4. Stan i UI

- brak stanów: loading / empty / error / success,
- niespójne disabled i podwójne wysłanie formularza,
- brak kluczy `v-for` lub klucze indeksowe przy zmiennej liście,
- computed z efektami ubocznymi, watcher bez warunku stopu,
- mutowanie propsów,
- dostępność: przyciski zamiast `div`, brak `aria-label`, focus po zamknięciu modala, obsługa klawiatury,
- responsywność: przepełnienia, ucięte teksty, poziomy scroll.

### 4.5. Trwałość i integracje

- zapis bez obsługi błędu (quota, tryb prywatny),
- brak wersjonowania kluczy i migracji danych,
- częściowy zapis i brak transakcji,
- ponowna próba bez idempotencji,
- różnice między środowiskami (dev/prod).

## 5. Checklist weryfikacji

- [ ] Baseline: istniejące testy uruchomione przed zmianami (wynik zapisany).
- [ ] Nowe testy failują dla błędnej implementacji (jeśli to możliwe).
- [ ] Cały pakiet testów przechodzi.
- [ ] Lint / typecheck / build przechodzą (lub wyjaśniono, dlaczego nie).
- [ ] Pokrycie obejmuje zmienione ścieżki (jeśli coverage jest skonfigurowany).
- [ ] Brak zmian produkcyjnych poza uzgodnionymi.
- [ ] Brak sekretów i danych wrażliwych w testach/logach.
- [ ] Sprawdzono stany: pusty, błędny, sukces, powtórzenie akcji.
- [ ] Raport zawiera komendy, realny output i ryzyka rezydualne.

## 6. Testy niestabilne (flaky)

| Przyczyna | Rozwiązanie |
|---|---|
| Czas rzeczywisty | fake timers / wstrzyknięty zegar |
| Sieć i zewnętrzne API | mocki, contract tests |
| Losowość | seed lub mock `Math.random` |
| Wspólny stan między testami | fabryka danych, `beforeEach`, sprzątanie |
| Kolejność testów | brak zależności i globalnych mutacji |
| Animacje / opóźnienia | oczekiwanie na warunek, nie `sleep` |
| Porty i zasoby | dynamiczny port, unikalne katalogi |
| Strefa/locale | jawna strefa i locale w testach |

## 7. Priorytetyzacja i raportowanie

- **P0** — natychmiast: crash, utrata danych, bezpieczeństwo.
- **P1** — blokuje główną funkcję lub powoduje błędne dane.
- **P2** — ograniczony wpływ, obejście istnieje.
- **P3** — kosmetyka, dług techniczny.

Każde znalezisko opisuj w formacie:

```text
[P1][potwierdzone] app.js:315 — streakOf liczy niezaplanowane dni
Wpływ: seria zawyżona po zmianie harmonogramu.
Reprodukcja: ustaw dni [1], dodaj ukończenie na wtorek; seria pokazuje 2.
Oczekiwane: seria liczy tylko dni zaplanowane.
Propozycja: iterować po dniach harmonogramu wstecz, zatrzymać na pierwszym brakującym.
```

## 8. Kontekst tego repozytorium (Nawykly)

To prototyp Vue 3 ładowany globalnie z CDN, bez builda i bez `package.json`/runnera testów. Przy pełnym QA:

- **Nie instaluj** Node.js ani pakietów bez zgody użytkownika; brak środowiska odnotuj w raporcie.
- Logika w `app.js` jest w obiekcie aplikacji Vue; najłatwiej testować funkcje czyste po ich wydzieleniu lub przez testy UI w przeglądarce.
- Obszary wysokiego ryzyka:
  - `dateKey` — lokalna strefa czasowa i formatowanie,
  - `streakOf` — zliczanie serii z pominięciem niezaplanowanych dni,
  - `checkReminders` — dopasowanie godziny, unikanie duplikatów, pomijanie ukończonych,
  - walidacja w `saveHabit` (pusta nazwa, brak dni),
  - `loadHabits` — uszkodzony JSON w `localStorage`,
  - pierścień postępu i stany 0% / 100%,
  - powiadomienia: brak wsparcia `Notification`, odmowa zgody.
- Weryfikację UI można prowadzić przez headless Chrome (DOM, zrzuty, próbkowanie pikseli) — bez dodatkowych zależności.
