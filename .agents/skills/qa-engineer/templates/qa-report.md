# Raport QA — <obszar / zmiana>

- **Data:** RRRR-MM-DD
- **Tryb:** review / test / verify / full QA
- **Zakres:** <co zostało sprawdzone>
- **Poza zakresem:** <czego nie sprawdzano>
- **Środowisko:** <OS, runtime, wersje narzędzi, commit>
- **Baseline:** <wynik istniejących testów/builda przed zmianami>

## 1. Podsumowanie

<2–5 zdań: najważniejszy wniosek, liczba znalezisk wg severity, czy zmiana może iść dalej.>

## 2. Znaleziska

| ID | Severity | Pewność | Lokalizacja | Problem | Wpływ | Reprodukcja | Propozycja |
|---|---|---|---|---|---|---|---|
| QA-001 | P1 | potwierdzone | `ścieżka/plik.js:123` | <krótki opis> | <kto/co ucierpi> | <kroki lub test> | <kierunek naprawy> |

> Legenda: P0 blocker, P1 poważny, P2 drugorzędny, P3 kosmetyka.
> Pewność: potwierdzone / prawdopodobne / do weryfikacji.

## 3. Testy

### Dodane

| Plik | Przypadki | Status |
|---|---|---|
| `tests/...` | <lista scenariuszy> | pass / fail / nieuruchomione |

### Zmienione

| Plik | Powód zmiany | Status |
|---|---|---|
| `tests/...` | <np. zmiana zamierzonego zachowania> | pass / fail |

### Pokrycie

<Jeśli skonfigurowane: procent dla zmienionych plików / ścieżek. Jeśli nie: „brak konfiguracji coverage”.>

## 4. Wyniki uruchomień

```text
$ <dokładna komenda>
<istotny fragment outputu: liczba testów, błędy, czas>
```

```text
$ <build / lint / typecheck>
<wynik>
```

## 5. Ryzyka rezydualne / niezweryfikowane

- <czego nie dało się uruchomić i dlaczego>
- <obszary bez testów>
- <założenia, które mogą się zmienić>

## 6. Rekomendacje

1. <najpilniejsza poprawka>
2. <uzupełnienie testów>
3. <dług techniczny / follow-up>
