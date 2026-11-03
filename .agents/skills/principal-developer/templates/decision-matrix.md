# Macierz decyzyjna — <temat>

- **Data:** RRRR-MM-DD
- **Właściciel:** <osoba / zespół>
- **Tryb:** advisory / design
- **Horyzont decyzji:** <6 / 12 / 24 miesiące>

## 1. Ograniczenia (bramka)

| Ograniczenie | Typ | Wpływ na opcje |
|---|---|---|
| <np. budżet 50 tys. PLN> | twarde | eliminuje opcję C |
| <np. zespół 3 os. bez ops> | twarde | preferuje rozwiązania managed |
| <np. deadline 6 tygodni> | miękkie | wpływa na wagę time-to-market |

> Opcja naruszająca ograniczenie twarde nie może zostać rekomendowana bez jawnego wyjątku i akceptacji.

## 2. Kryteria i wagi

| Kryterium | Waga | Skala | Uzasadnienie wagi |
|---|---|---|---|
| Time-to-market | 30% | 1–5 | <dlaczego> |
| Utrzymywalność | 25% | 1–5 | <dlaczego> |
| Koszt TCO | 20% | 1–5 | <dlaczego> |
| Skalowalność | 15% | 1–5 | <dlaczego> |
| Ryzyko / odwracalność | 10% | 1–5 | <dlaczego> |
| **Suma** | **100%** | | |

## 3. Opcje

| ID | Nazwa | Opis w jednym zdaniu | Effort | Główny kompromis |
|---|---|---|---|---|
| A | <minimalna zmiana> | <...> | S / M / L | <...> |
| B | <zbalansowana> | <...> | S / M / L | <...> |
| C | <strategiczna> | <...> | S / M / L | <...> |

## 4. Ocena

| Kryterium | Waga | A ocena | A ważone | B ocena | B ważone | C ocena | C ważone |
|---|---|---|---|---|---|---|---|
| Time-to-market | 30% | | | | | | |
| Utrzymywalność | 25% | | | | | | |
| Koszt TCO | 20% | | | | | | |
| Skalowalność | 15% | | | | | | |
| Ryzyko / odwracalność | 10% | | | | | | |
| **Suma** | **100%** | | **<...>** | | **<...>** | | **<...>** |

Skala: 1 = bardzo słabo, 3 = akceptowalnie, 5 = bardzo dobrze. Wartość ważona = ocena × waga.

## 5. Kompromisy jakościowe

- **A:** zyskujemy <...>, ale tracimy <...>; sensowna, dopóki <warunek>.
- **B:** zyskujemy <...>, ale tracimy <...>; sensowna, dopóki <warunek>.
- **C:** zyskujemy <...>, ale tracimy <...>; sensowna, dopóki <warunek>.

## 6. Analiza wrażliwości

- Zmiana wagi <kryterium> o ±10 pkt <zmienia / nie zmienia> rankingu.
- Najbardziej niepewne założenie: <...>; jego zmiana wpływa na <...>.

## 7. Rekomendacja

**Opcja <X>** — ponieważ <2–3 zdania>. Pewność: wysoka / średnia / niska.

Odrzucone opcje: <dlaczego w tym kontekście>.

## 8. Warunki zmiany rekomendacji

- jeśli <warunek 1>,
- jeśli <warunek 2>,
- jeśli <warunek 3>.

## 9. Ryzyka rezydualne

| Ryzyko | Prawdopodobieństwo | Wpływ | Mitygacja | Trigger |
|---|---|---|---|---|
| <ryzyko> | | | | |

## 10. Decyzja i następny krok

- [ ] Rekomendacja zaakceptowana przez <interesariusz>.
- [ ] ADR utworzony: <link>.
- [ ] Plan wdrożenia zatwierdzony przed zmianami w kodzie.
