# Plan implementacji — <zadanie>

- **Tryb:** feature / bugfix / tests / local refactor
- **Data:** RRRR-MM-DD
- **Zakres uzgodniony z:** <użytkownik / ticket / specyfikacja>
- **Kryteria akceptacji:**
  - <obserwowalne kryterium 1>
  - <obserwowalne kryterium 2>

## 1. Rozpoznanie

- **Docelowe pliki:** <ścieżki>
- **Powiązane moduły:** <ścieżki>
- **Istniejące testy:** <ścieżki lub „brak”>
- **Wzorce do zachowania:** <nazewnictwo, obsługa błędów, styl testów>
- **Skrypty projektu:** <test / lint / typecheck / build>

## 2. Zakres

### W zakresie

- <...>

### Poza zakresem

- <...>

## 3. Kroki

| # | Krok | Pliki | Weryfikacja |
|---|---|---|---|
| 1 | <najmniejsza zmiana> | <...> | <test/komenda> |
| 2 | <...> | <...> | <...> |
| 3 | <...> | <...> | <...> |

> Po każdym kroku projekt ma pozostać kompilowalny i uruchamialny.

## 4. Testy

| Scenariusz | Poziom | Plik | Oczekiwany wynik |
|---|---|---|---|
| <happy path> | jednostkowy | <...> | pass |
| <edge case> | jednostkowy | <...> | pass |
| <regresja> | jednostkowy | <...> | fail przed poprawką, pass po |

## 5. Zależności

- [ ] Brak nowych zależności.
- [ ] Jeśli nowa zależność jest konieczna: <uzasadnienie + zgoda>.

## 6. Ryzyka

| Ryzyko | Prawdopodobieństwo | Wpływ | Mitygacja |
|---|---|---|---|
| <ryzyko> | | | |

## 7. Weryfikacja końcowa

- [ ] Targeted testy.
- [ ] Pełny pakiet testów.
- [ ] Lint / typecheck.
- [ ] Build lub sprawdzenie manualne.
- [ ] Diff ograniczony do zakresu.
