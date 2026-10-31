# Nawykly 🌱

Prototyp strony internetowej w **Vue 3** do przypominania o formowaniu nowych nawyków.

## Uruchomienie

Aplikacja nie wymaga builda ani instalacji zależności (Node.js nie jest potrzebny).

1. Otwórz plik `index.html` w przeglądarce (najlepiej Chrome, Edge lub Firefox).
2. Do działania wymagany jest dostęp do internetu (Vue ładowany jest z CDN `unpkg.com`).

Opcjonalnie możesz wystawić lokalny serwer:

```bash
npx serve .
# lub
python -m http.server 8080
```

## Funkcjonalności prototypu

- **Dzisiaj** — lista nawyków zaplanowanych na dany dzień, pasek postępu, zaznaczanie wykonania (serie 🔥 liczone automatycznie).
- **Nawyki** — dodawanie, edycja i usuwanie nawyków: nazwa, emoji, kolor, godzina przypomnienia, dni tygodnia.
- **Historia** — statystyki (łączna liczba wykonanych nawyków, najlepsza seria), wykres ostatnich 7 dni i mapa aktywności z 10 tygodni.
- **Przypomnienia** — co 20 sekund aplikacja sprawdza godzinę; o ustawionej porze wyświetla toast w aplikacji oraz (po udzieleniu zgody) powiadomienie systemowe przeglądarki.
- **Zapis lokalny** — dane przechowywane w `localStorage` (klucz `nawykly.habits.v1`). Przy pierwszym uruchomieniu ładowane są dane demo.

## Struktura plików

```
index.html  — szablon aplikacji (Vue CDN)
styles.css  — style (dark theme, responsywność)
app.js      — logika aplikacji (Vue 3, global build)
```

## Jak przetestować przypomnienie

1. Otwórz `index.html`.
2. Kliknij 🔔 w prawym górnym rogu i zezwól na powiadomienia.
3. W zakładce **Nawyki** dodaj/edytuj nawyk i ustaw godzinę przypomnienia na ~1–2 minuty do przodu.
4. Pozostaw kartę otwartą — po nadejściu ustawionej godziny pojawi się toast i powiadomienie systemowe.
