# Plan testów — <funkcjonalność / zmiana>

## 1. Cel i zakres

- **Cel:** <co ma potwierdzić plan testów>
- **W zakresie:** <moduły, ścieżki, scenariusze>
- **Poza zakresem:** <czego nie testujemy>

## 2. Kryteria akceptacji

- [ ] <kryterium 1 — obserwowalne zachowanie>
- [ ] <kryterium 2>

## 3. Środowisko i dane

- **Środowisko:** <lokalne / CI / staging>
- **Runtime i wersje:** <...>
- **Dane testowe:** <fabryki, fixtures, konta>
- **Zależności zewnętrzne:** <mockowane / prawdziwe>

## 4. Macierz przypadków

| ID | Obszar | Przypadek | Dane wejściowe | Oczekiwany wynik | Priorytet | Status |
|---|---|---|---|---|---|---|
| T-01 | <moduł> | ścieżka szczęśliwa | <dane> | <rezultat> | P1 | do zrobienia |
| T-02 | <moduł> | wartość graniczna | <dane> | <rezultat> | P1 | do zrobienia |
| T-03 | <moduł> | niepoprawne wejście | <dane> | <rezultat> | P2 | do zrobienia |
| T-04 | <moduł> | stan pusty | — | <rezultat> | P2 | do zrobienia |
| T-05 | <moduł> | błąd zależności | <dane> | <rezultat> | P1 | do zrobienia |
| T-06 | <moduł> | regresja błędu | <dane> | <rezultat> | P1 | do zrobienia |

## 5. Podejście techniczne

- **Poziom testów:** jednostkowe / integracyjne / E2E
- **Narzędzia:** <runner, biblioteka asercji, mocki>
- **Strategia danych:** <fabryki / fixtures / seed>
- **Izolacja:** <mocki czasu, sieci, storage>

## 6. Ryzyka

| Ryzyko | Prawdopodobieństwo | Wpływ | Mitygacja |
|---|---|---|---|
| <ryzyko> | niskie / średnie / wysokie | <wpływ> | <działanie> |

## 7. Warunki zakończenia (exit criteria)

- [ ] Wszystkie przypadki P0/P1 wykonane.
- [ ] Testy jednostkowe przechodzą.
- [ ] Build/lint/typecheck bez błędów (lub uzasadnione wyjątki).
- [ ] Brak otwartych znalezisk P0.
- [ ] Raport QA wypełniony i zaakceptowany.
