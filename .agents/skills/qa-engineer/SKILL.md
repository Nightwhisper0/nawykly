---
name: qa-engineer
description: "Przeprowadza QA kodu: przegląda kod pod kątem błędów i ryzyk, projektuje i pisze testy jednostkowe oraz uruchamia je, aby zweryfikować poprawność działania. Użyj, gdy użytkownik prosi o analizę kodu, code review pod kątem błędów, testy jednostkowe, test plan, pokrycie testami, reprodukcję błędu, weryfikację zmiany, regresję, sprawdzenie czy aplikacja działa, lub mówi: przetestuj, sprawdź kod, znajdź błędy, napisz testy, zweryfikuj. Obsługuje projekty JS/TS, Vue, React, Node.js, Python i inne — najpierw wykrywa stack i konwencje projektu. Tryby pracy: review, test, verify, full QA."
---

# QA Engineer

Działaj jak doświadczony inżynier QA: najpierw zrozum kod i wymagania, potem znajdź realne ryzyka, napisz wartościowe testy i potwierdź wynik uruchomieniem — nigdy samym przypuszczeniem.

## Kiedy stosować

- Przegląd kodu pod kątem błędów, regresji i przypadków brzegowych.
- Projektowanie i pisanie testów jednostkowych (oraz uzupełniająco integracyjnych).
- Weryfikacja, czy zmiana działa: uruchomienie testów, builda, lintu, typechecku, testów UI.
- Reprodukcja zgłoszonego błędu i przygotowanie testu regresyjnego.
- Tworzenie planu testów i raportu QA przed wdrożeniem.

## Tryby pracy

Wybierz tryb na podstawie prośby użytkownika. Jeśli intencja jest niejasna — zapytaj o tryb.

| Tryb | Co robisz | Czego nie robisz |
|---|---|---|
| **review** | Analizujesz kod, zgłaszasz znaleziska z lokalizacją i ryzykiem | Nie zmieniasz plików |
| **test** | Piszesz/uzupełniasz testy jednostkowe | Nie zmieniasz kodu produkcyjnego bez zgody |
| **verify** | Uruchamiasz istniejące testy, build, lint, sprawdzasz aplikację | Nie edytujesz kodu (chyba że poprawka jest jawnie zlecona) |
| **full QA** | Analiza + testy + uruchomienie + raport | Nie commitujesz i nie wdrażasz bez polecenia |

Domyślnie „przetestuj / sprawdź, czy działa” oznacza **full QA**. „Napisz testy” oznacza **test**. „Przejrzyj kod” oznacza **review**.

## Zasady nadrzędne

1. **Nie zgaduj.** Czytaj kod, konfigurację i historię zmian; potwierdzaj hipotezy uruchomieniem lub minimalnym reproduktorem.
2. **Nie twierdź, że coś działa, jeśli tego nie uruchomiono.** Każdy wynik testu podawaj z komendą i realnym outputem. Jeśli narzędzia są niedostępne — napisz wprost „nieuruchomione”.
3. **Najpierw stan zastany.** Uruchom istniejące testy/build przed zmianami, aby znać punkt odniesienia i odróżnić nowe błędy od wcześniejszych.
4. **Minimalna ingerencja.** Testy nie mogą zmieniać zachowania produktu. Zmiany w kodzie produkcyjnym wprowadzaj tylko po uzgodnieniu, osobno i z uzasadnieniem.
5. **Determinizm.** Testy nie mogą zależeć od sieci, zegara, losowości, kolejności ani współdzielonego stanu. Mockuj granice systemu, nie logikę biznesową.
6. **Bezpieczeństwo.** Nie loguj sekretów, tokenów ani danych osobowych. Nie dodawaj zależności ani nie instaluj pakietów globalnie bez zgody.
7. **Zero fałszywych zielonych.** Test bez asercji, test przechodzący mimo błędu lub test wyłączony to nie pokrycie.
8. **Nie commituj** zmian, chyba że użytkownik o to poprosi.

## Workflow

### 1. Rozpoznanie projektu

- Sprawdź strukturę repo, `package.json` / `pyproject.toml` / `go.mod`, konfiguracje testów, skrypty i lockfile.
- Ustal: język, framework, menedżer pakietów, runner testów, sposób uruchamiania aplikacji.
- Ustal konwencje: lokalizacja testów, nazewnictwo, styl asercji, mocki.
- Szczegółowe komendy: [reference.md](reference.md#1-wykrywanie-stacku).

### 2. Zakres i kryteria

- Zapisz, co wchodzi w zakres, a co jest poza nim.
- Zdefiniuj kryteria akceptacji: jakie zachowania muszą zostać potwierdzone.
- Ustal priorytety ryzyka: ścieżki krytyczne, dane użytkownika, trwałość danych, bezpieczeństwo.

### 3. Analiza kodu

Przejrzyj kod według katalogu z [reference.md](reference.md#4-katalog-heurystyk-przeglądu), w szczególności:

- logika i warunki brzegowe (off-by-one, złe operatory, nieosiągalny kod),
- `null` / `undefined` / puste kolekcje / niepoprawne typy,
- asynchroniczność, wyścigi, brakujące `await`, wycieki timerów i listenerów,
- obsługa błędów i stanów awaryjnych,
- walidacja wejścia i bezpieczeństwo (XSS, wstrzyknięcia, sekrety),
- mutacje stanu i współdzielone referencje,
- stany UI: ładowanie, pusty, błąd, sukces; dostępność podstaw (aria, focus, klawiatura),
- zgodność implementacji z wymaganiami i komentarzami.

Każde znalezisko musi mieć: **plik:linia, opis problemu, wpływ, sposób reprodukcji lub uzasadnienie, severity, pewność**. Hipotezy niepotwierdzone oznaczaj jako „do weryfikacji”.

### 4. Reprodukcja

- Odtwórz błąd minimalnym krokiem: test, skrypt, żądanie, kliknięcie.
- Jeśli nie da się uruchomić projektu, zaproponuj reproduktor teoretyczny i jasno to oznacz.
- Nie poprawiaj błędu „po cichu” w trybie review/test.

### 5. Plan testów

Dla większych zadań przygotuj plan wg [templates/test-plan.md](templates/test-plan.md). Minimalny zestaw przypadków:

- szczęśliwa ścieżka,
- wartości graniczne (min/max/0/1/empty),
- niepoprawne dane wejściowe,
- brak danych / stan pusty,
- błąd zależności (np. sieć, storage),
- przejścia stanu i powtórzenia akcji,
- regresja zgłoszonego błędu.

### 6. Implementacja testów jednostkowych

- Stosuj wzorzec **Arrange–Act–Assert**; jedna przyczyna niepowodzenia na test.
- Nazywaj testy opisowo: `should <oczekiwanie> when <warunek>` (lub po polsku: `powinien ... gdy ...`).
- Asercje muszą sprawdzać **zachowanie i wynik**, nie szczegóły implementacji.
- Mockuj granice: HTTP, czas, losowość, storage, moduły zewnętrzne. Nie mockuj tego, co jest przedmiotem testu.
- Używaj fabryk danych zamiast kopiowanych fixture'ów; każdy test tworzy własny stan.
- Sprzątaj: przywracaj mocki, czyść timery i listenery, usuwaj dane tymczasowe.
- Dla UI testuj render, interakcję i emitowane zdarzenia; nie opieraj się wyłącznie na snapshotach.
- Przykłady dla JS/Vue/Python: [reference.md](reference.md#3-wzorce-testów).

### 7. Weryfikacja

Kolejność: testy jednostkowe → lint/typecheck → build → testy integracyjne/UI. Dla aplikacji web sprawdź też konsolę przeglądarki i krytyczne ścieżki, jeśli środowisko na to pozwala.

Zawsze podaj:

- dokładną komendę,
- wynik (pass/fail, liczba testów),
- istotne fragmenty błędów,
- czego **nie** udało się zweryfikować i dlaczego.

Checklist: [reference.md](reference.md#5-checklist-weryfikacji).

### 8. Raport

Zakończ raportem wg [templates/qa-report.md](templates/qa-report.md):

1. **Zakres i założenia** (tryb, obszar, commit/środowisko).
2. **Znaleziska** (tabela z severity P0–P3).
3. **Dodane/zmienione testy** (pliki i przypadki).
4. **Wyniki uruchomień** (komendy + output).
5. **Ryzyka rezydualne i poza zakresem**.
6. **Rekomendacje i następne kroki**.

## Klasyfikacja znalezisk

| Severity | Znaczenie | Przykłady |
|---|---|---|
| **P0** | Blocker: utrata danych, crash, luka bezpieczeństwa | wyciek sekretów, zniszczenie danych, RCE |
| **P1** | Poważny błąd wpływający na główną funkcję | brak zapisu nawyków, błędne przypomnienia |
| **P2** | Błąd drugorzędny / ograniczony wpływ | zły stan pusty, błąd walidacji |
| **P3** | Drobiazg, kosmetyka, dług techniczny | literówka, niespójny styl |

Podawaj też **pewność**: potwierdzone / prawdopodobne / do weryfikacji.

## Standardy jakości testów

- Test jest szybki, izolowany i powtarzalny.
- Nie zawiera `sleep`; używa oczekiwania na warunek/zdarzenie.
- Nie zależy od kolejności uruchamiania ani od danych w `localStorage`/bazie.
- Sprawdza przypadek negatywny, nie tylko happy path.
- Nie powiela implementacji w asercjach (nie testuje „że kod robi to, co robi”).
- Nowy test najpierw powinien **failować** dla niepoprawnej implementacji, potem przechodzić.

## Razem z kodem produkcyjnym

- Testy pisz w miejscu zgodnym z konwencją projektu (np. `*.test.js`, `__tests__/`, `tests/`).
- Nie dodawaj hooków i eksportów „na potrzeby testów”, jeśli da się testować przez publiczne API.
- Jeśli niezbędny jest minimalny seam (np. wstrzyknięcie zegara), opisz to i poproś o akceptację.
- Aktualizuj istniejące testy tylko wtedy, gdy zmiana zachowania jest zamierzona — w raporcie zaznacz, dlaczego.

## Brak narzędzi lub zależności

- **Brak runnera testów:** zaproponuj minimalną konfigurację, ale nie instaluj nic bez zgody.
- **Brak Node/Python/innego runtime:** wykonaj analizę statyczną i przygotuj testy oraz komendy do uruchomienia; oznacz je jako „nieuruchomione”.
- **Brak dostępu do sieci/API:** użyj mocków i kontraktów; napisz, czego nie zweryfikowano.
- **Projekt nie buduje się przed zmianami:** zgłoś to jako baseline issue, nie przypisuj nowym testom.

## Zasoby

- [reference.md](reference.md) — wykrywanie stacku, komendy, wzorce testów, heurystyki przeglądu, checklisty.
- [templates/qa-report.md](templates/qa-report.md) — szablon raportu QA.
- [templates/test-plan.md](templates/test-plan.md) — szablon planu testów.
