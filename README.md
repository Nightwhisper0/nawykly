# Nawykly

Statyczny prototyp aplikacji webowej w **Vue 3** do przypominania o formowaniu nawyków. Aplikacja nie ma backendu ani bazy danych — cała logika działa w przeglądarce, a kontener Docker służy wyłącznie do serwowania plików statycznych przez Nginx.

Wygląd oparto na folderze `nawyklybrand`, przede wszystkim na planszy `nawykly - brand.svg`: terakota `#AD5228`, glina `#C97A4A`, umber `#7A4A2E`, piasek `#D8C7A5`, krem `#E7DEC2`, taupe `#B9A78F` i ciepła czerń `#211D17`. Paleta nawyków i konfetti jest celowo ciepła, bez zieleni. Typografia łączy **Archivo** (tytuły) z **Hubot Sans** (tekst), a znak marki to botaniczny, kwiatowy motyw wyciągnięty z planszy brandingowej. Układ czerpie też z `inspo.png` i `inspo2.png` — duży obraz/3D na wejściu, spokojna edytorska siatka i dużo oddechu.

> **Status:** prototyp edukacyjny. Dane użytkownika, lokalne konto i lista znajomych są przechowywane wyłącznie w `localStorage` przeglądarki. Logowanie jest symulacją lokalną — nie ma backendu, haseł w chmurze ani prawdziwej weryfikacji konta. Model 3D, Three.js i jego addony są lokalnymi assetami w `assets/`, więc viewer nie zależy od CDN.

## Spis treści

1. [Czym jest aplikacja](#1-czym-jest-aplikacja)
2. [Architektura i sposób działania](#2-architektura-i-sposób-działania)
3. [Uruchomienie lokalne bez Dockera](#3-uruchomienie-lokalne-bez-dockera)
4. [Docker — szybki start](#4-docker--szybki-start)
5. [Docker — budowa i uruchomienie krok po kroku](#5-docker--budowa-i-uruchomienie-krok-po-kroku)
6. [Co zawiera obraz i dlaczego](#6-co-zawiera-obraz-i-dlaczego)
7. [Konfiguracja Nginx](#7-konfiguracja-nginx)
8. [Codzienna eksploatacja](#8-codzienna-eksploatacja)
9. [Zmiana portu, domeny i konsekwencje dla danych](#9-zmiana-portu-domeny-i-konsekwencje-dla-danych)
10. [Bezpieczeństwo](#10-bezpieczeństwo)
11. [Produkcja i dalszy rozwój](#11-produkcja-i-dalszy-rozwój)
12. [Rozwiązywanie problemów](#12-rozwiązywanie-problemów)
13. [Powiadomienia systemowe z dźwiękiem](#13-powiadomienia-systemowe-z-dźwiękiem)
14. [Struktura repozytorium](#14-struktura-repozytorium)
15. [Ograniczenia prototypu](#15-ograniczenia-prototypu)

## 1. Czym jest aplikacja

Nawykly pomaga budować codzienne nawyki:

- **Dzisiaj** — lista nawyków zaplanowanych na dany dzień, postęp dnia, zaznaczanie wykonania i serie. Po ukończeniu 100% nawyków pojawia się banner „Gratulacje, każdego dnia o krok bliżej” z 4-sekundową animacją konfetti rozproszonego po całym ekranie, delikatnie opadającego w palecie marki, oraz z 10-procentowym przyciemnieniem tła.
- **Bonsai 3D** — na początku strony znajduje się interaktywny model `assets/bonsai.glb`. Można go obracać przeciąganiem, przybliżać scrollem/pinch, zatrzymać auto-obrót, zresetować kamerę i obsłużyć klawiaturą. Ładowanie pokazuje progres, a przy braku WebGL/modelu pojawia się fallback.
- **Nawyki** — dodawanie, edycja i usuwanie nawyków: nazwa, kolor, godzina przypomnienia, dni tygodnia. Bez emoji i zbędnych piktogramów.
- **Postępy** — statystyki, wykres ostatnich 7 dni i mapa regularności z 10 tygodni.
- **Znajomi** — osobna zakładka z bazą znajomych, porównaniem regularności, miejscem w kręgu, dodawaniem osób i lekką akcją „Wyzwij”.
- **Konto** — lokalne logowanie i rejestracja, personalizacja imienia w widoku znajomych; bez prawdziwego backendu.
- **Przypomnienia** — systemowe powiadomienie przeglądarki z dźwiękiem oraz toast w aplikacji. Włączasz je bannerem lub dzwonkiem; nie ma już przycisku „Test”.
- **Dane lokalne** — zapis w `localStorage`; przy pierwszym uruchomieniu ładowane są dane demo.

Aplikacja składa się z czterech plików runtime: `index.html`, `styles.css`, `app.js` i `bonsai.js`, a także z katalogu `assets/` zawierającego `brand-mark.svg`, `bonsai.glb` oraz lokalny vendor Three.js (`assets/vendor/`). Nie wymaga kompilacji ani `node_modules`.

## 2. Architektura i sposób działania

```text
┌──────────────────────────────────────────────┐
│ Przeglądarka                                 │
│                                              │
│  index.html  ── szablon Vue + struktura UI    │
│  styles.css  ── system wizualny marki         │
│  app.js      ── logika Vue 3 (global build)   │
│  bonsai.js   ── scena Three.js i sterowanie  │
│  assets/brand-mark.svg ── botaniczne logo     │
│  assets/bonsai.glb     ── model 3D (36 MB)    │
│  assets/vendor/        ── Three.js lokalnie   │
│  localStorage ── nawyki, konto, znajomi      │
│  Notification API + Web Audio ── przypomnienia│
│                                              │
│  CDN: Vue (unpkg), Archivo (Google),         │
│       Hubot Sans (jsDelivr)                  │
└───────────────────────┬──────────────────────┘
                        │ HTTP GET (pliki statyczne)
┌───────────────────────▼──────────────────────┐
│ Kontener Docker                              │
│  Nginx (non-root, UID 101) na porcie 8080    │
│  /usr/share/nginx/html                       │
│    ├── index.html                            │
│    ├── styles.css                            │
│    ├── app.js                                │
│    ├── bonsai.js                             │
│    └── assets/                               │
│        ├── brand-mark.svg                    │
│        ├── bonsai.glb                        │
│        └── vendor/                           │
└──────────────────────────────────────────────┘
```

Kluczowe cechy:

- **Brak backendu** — Nginx tylko serwuje pliki; nie ma API, sesji ani bazy danych.
- **Brak stanu po stronie serwera** — restart lub usunięcie kontenera nie usuwa nawyków użytkownika; dane żyją w przeglądarce.
- **Zależności CDN po stronie klienta** — kontener nie pobiera ich w runtime, ale przeglądarka musi mieć dostęp do Vue (krytyczny dla UI) oraz fontów (fallback typografii). Three.js, `GLTFLoader` i `OrbitControls` są serwowane lokalnie z `assets/vendor/`, więc 3D nie zależy od zewnętrznego CDN.
- **WebGL** — scena 3D wymaga WebGL. Jeśli przeglądarka go nie udostępnia, model nie wystartuje, ale cała aplikacja nawykowa pozostaje użyteczna; viewer pokaże fallback.
- **Vue global build** — `vue.global.prod.js` zawiera kompilator szablonów; szablon z `index.html` jest kompilowany w przeglądarce. Dlatego nie ma etapu builda, ale też nie da się zastosować ścisłego CSP bez `unsafe-eval`.

### 2.1. Start aplikacji

1. Przeglądarka pobiera `index.html`, `styles.css`, `app.js`, `bonsai.js`, lokalny vendor Three.js oraz Vue z CDN.
2. Vue montuje aplikację do `#app`.
3. Moduł `bonsai.js` importuje Three.js z lokalnego vendora i rozpoczyna ładowanie `assets/bonsai.glb`; na stage’u widać progres, a po załadowaniu model jest gotowy do obrotu i zoomu.
4. `loadHabits()`, `loadFriends()` i `loadUser()` odczytują dane z `localStorage`; jeśli ich brak, generowane są dane demo.
5. Widoki korzystają z computed properties, a zmiany `habits` i `friends` są zapisywane przez deep watcher.
6. Co 20 sekund `checkReminders()` sprawdza, czy któryś nawyk powinien wywołać przypomnienie. Co 30 sekund odświeżany jest reaktywny zegar aplikacji, żeby zmiana dnia nie wymagała przeładowania strony.
7. O ustawionej godzinie pojawia się toast, systemowe powiadomienie (jeśli włączone) i dźwięk Web Audio.
8. Gdy model 3D przekroczy 45 sekund ładowania albo WebGL zawiedzie, viewer pokazuje komunikat zastępczy, nie blokując aplikacji.

### 2.2. Model danych

Nawyk w `localStorage` ma postać:

```json
{
  "id": "abc123",
  "name": "Poranna medytacja",
  "color": "#AD5228",
  "reminderTime": "07:00",
  "days": [0, 1, 2, 3, 4, 5, 6],
  "completions": { "2026-10-31": true },
  "archived": false,
  "createdAt": "2026-10-31T08:00:00.000Z"
}
```

- `days` — indeksy JS: `0` = niedziela, `1` = poniedziałek, …, `6` = sobota.
- `completions` — mapa `YYYY-MM-DD → true`; seria liczona jest tylko po dniach zaplanowanych.
- `loadHabits()` normalizuje rekordy i odrzuca uszkodzone wpisy; pusta tablica `[]` jest respektowana jako świadomy stan „brak nawyków”.
- Klucze `localStorage`:
  - `nawykly.habits.v2` — tablica nawyków,
  - `nawykly.notifications.v1` — preferencja powiadomień (`"1"` / `"0"`),
  - `nawykly.user.v1` — lokalne konto (`name`, `email`, `provider`),
  - `nawykly.friends.v1` — lista znajomych i ich postępy.

Dane są przypisane do **originu** (`scheme + host + port`). Zmiana portu lub domeny oznacza inną przeglądarkową bazę `localStorage`.

### 2.3. Przypomnienia — przepływ

1. `setInterval` uruchamia `checkReminders()` co 20 s.
2. Dla każdego nawyku sprawdzane jest: czy ma godzinę, czy dziś jest w `days`, czy nie jest ukończony i czy nie było już przypomnienia tego dnia.
3. Przypomnienie odpala się w oknie do 2 minut po ustawionej godzinie, żeby throttling karty nie gubił terminu.
4. Zawsze pojawia się toast w aplikacji (fallback). Jeśli powiadomienia są włączone: odtwarzany jest chime i wysyłane jest systemowe `Notification` z `requireInteraction`.
5. Kliknięcie powiadomienia przywraca fokus na kartę i zamyka powiadomienie.

Włączenie powiadomień nie wysyła już powiadomienia testowego — dzwonek tylko włącza lub wyłącza kanał, a krótki chime potwierdza dźwięk. Ograniczenia: powiadomienia działają przy otwartej karcie (także w tle); po zamknięciu przeglądarki potrzebny byłby Service Worker + Push API i backend. Godziny przypomnień są interpretowane w strefie czasowej przeglądarki użytkownika, a nie kontenera.

### 2.4. Widoki i skróty

- `index.html` — widok „Dzisiaj”.
- `index.html?view=habits` — widok „Nawyki”.
- `index.html?view=progress` — widok „Postępy” (`?view=history` działa jako alias).
- `index.html?view=friends` — widok „Znajomi”.
- `index.html?view=habits&modal=1` — kreator nawyku otwarty od razu.
- `index.html?auth=1` — modal logowania otwarty od razu.

### 2.5. Bonsai 3D

- **Plik:** `assets/bonsai.glb` — glTF 2.0, jeden mesh, ok. 36 MB (geometria + trzy tekstury PBR).
- **Biblioteki:** Three.js `0.170.0`, `GLTFLoader`, `OrbitControls` i `BufferGeometryUtils` są zwendorowane w `assets/vendor/`. Import mapa w `index.html` wskazuje lokalne pliki, więc viewer nie zależy od jsDelivr.
- **Sterowanie:** przeciągnięcie obraca kamerę, scroll/pinch przybliża, przyciski zatrzymują auto-obrót i resetują widok. Po fokusie na stage’u działają strzałki, `+`/`-`, `Home` i spacja.
- **Trwałość sceny:** sekcja „Dzisiaj” używa `v-show`, więc canvas nie jest niszczony przy przejściu do innej zakładki; po powrocie model jest od razu gotowy.
- **Ładowanie:** pasek progresu jest oparty na `ProgressEvent` z loadera. Po 45 sekundach bez sukcesu pojawia się fallback; przy braku WebGL, otwarciu przez `file://` lub błędzie modelu również. Fallback ma przycisk ponownego załadowania.
- **Wydajność:** pixel ratio jest ograniczony do 1.8, cienie są wyłączone, a renderer pauzuje renderowanie, gdy stage jest poza viewportem (IntersectionObserver).

## 3. Uruchomienie lokalne bez Dockera

Aplikację trzeba otworzyć przez serwer HTTP (`http://localhost…`), nie przez `file://` — przeglądarki blokują wtedy wczytanie `bonsai.glb`. Potrzebny jest internet do Vue i fontów z CDN oraz nowoczesna przeglądarka z WebGL. Model i Three.js są lokalne.

Najprościej:

```bash
# w katalogu projektu
python -m http.server 8080
# lub, jeśli masz Node.js:
npx serve .
```

Następnie otwórz `http://localhost:8080`.

Otwarcie `index.html` bezpośrednio przez `file://` nie jest zalecane: przeglądarka zablokuje wczytanie `assets/bonsai.glb`, a powiadomienia i `localStorage` mogą działać z ograniczeniami. Do pełnych testów używaj `http://localhost`.

## 4. Docker — szybki start

Wymagania:

- Docker Engine lub Docker Desktop,
- Docker Compose v2 (`docker compose`, nie stary `docker-compose`).

Sprawdź środowisko:

```bash
docker --version
docker compose version
```

Z katalogu projektu:

```bash
docker compose up --build -d
docker compose ps
```

Otwórz **http://localhost:8080**.

Zatrzymanie:

```bash
docker compose down
```

Podgląd logów:

```bash
docker compose logs -f --tail=100
```

Compose domyślnie wiąże port tylko do `127.0.0.1`, uruchamia kontener jako non-root, z read-only rootfs i healthcheckiem.

> Wybierz jedną metodę uruchomienia: Compose **albo** ręczny `docker run`. Obie używają nazwy `nawykly` i portu 8080, więc uruchomione równocześnie będą kolidować.

## 5. Docker — budowa i uruchomienie krok po kroku

### 5.1. Zbudowanie obrazu

Build wymaga dostępu do Docker Hub (obraz bazowy `nginxinc/nginx-unprivileged`). Z katalogu projektu:

```bash
docker build -t nawykly:local .
```

Build kopiuje `assets/bonsai.glb` (ok. 36 MB), więc pierwszy build i transfer obrazu są wyraźnie większe niż w wersji bez 3D. Sam model jest już skompresowanym plikiem GLB — nie ma sensu gzipować go ponownie.

Docker wysyła kontekst builda, filtrowany przez `.dockerignore`. Dzięki temu katalog `nawyklybrand/`, duże pliki designu (`moodboard.svg.png`, `testy_acc.svg`), `.git`, `.agents` i README nie trafiają do kontekstu ani do obrazu. Katalog `assets/` celowo pozostaje w kontekście, bo zawiera runtime’owy model 3D i znak marki.

### 5.2. Uruchomienie bez Compose

Obraz nasłuchuje na porcie **8080** (nie 80). Mapowanie ma postać `HOST:CONTAINER`.

```bash
docker run -d \
  --name nawykly \
  --restart unless-stopped \
  -p 127.0.0.1:8080:8080 \
  --read-only \
  --tmpfs /tmp:size=16m,mode=1777 \
  --cap-drop ALL \
  --security-opt no-new-privileges:true \
  nawykly:local
```

> W PowerShell użyj jednej linii lub znaku backtick `` ` `` do łamania linii. W CMD użyj `^`.

Flagi mają znaczenie:

- `--read-only` — rootfs tylko do odczytu; Nginx nie zapisuje nic poza `/tmp`.
- `--tmpfs /tmp:...` — zapisywalny `/tmp` dla PID-a i plików tymczasowych Nginx.
- `--cap-drop ALL` — bez zbędnych capabilities; port 8080 nie wymaga uprawnień roota.
- `--security-opt no-new-privileges:true` — blokada eskalacji uprawnień.

### 5.3. Weryfikacja

```bash
docker ps
curl -i http://localhost:8080/healthz
docker inspect --format '{{.State.Health.Status}}' nawykly
```

Oczekiwane:

- `curl` zwraca `HTTP/1.1 200 OK` i treść `ok`,
- health status to `healthy` (po kilku sekundach od startu).

> W PowerShell używaj `curl.exe` — alias `curl` może wskazywać na `Invoke-WebRequest` z innymi flagami.

Sprawdzenie składni konfiguracji Nginx:

```bash
docker run --rm nawykly:local nginx -t
```

Sprawdzenie zawartości obrazu:

```bash
docker run --rm --entrypoint sh nawykly:local \
  -c "ls -la /usr/share/nginx/html"
```

### 5.4. Aktualizacja po zmianie plików

Po zmianie `index.html`, `styles.css` lub `app.js` zbuduj obraz ponownie:

```bash
docker compose up -d --build
```

Następnie odśwież przeglądarkę twardo (`Ctrl+Shift+R` / `Cmd+Shift+R`). `index.html` jest zawsze rewalidowany, ale CSS i JS mają cache 1 godzinę (nazwy nie zawierają hashów).

### 5.5. Zatrzymanie i usunięcie

```bash
docker stop nawykly
docker rm nawykly
docker rmi nawykly:local
```

Dla Compose:

```bash
docker compose down
docker rmi nawykly:local   # opcjonalnie
```

Kontener nie używa wolumenów, więc nie ma danych serwerowych do usunięcia.

## 6. Co zawiera obraz i dlaczego

| Plik / element | Rola |
|---|---|
| `Dockerfile` | Buduje obraz z `nginxinc/nginx-unprivileged:1.30-alpine` i kopiuje runtime + `assets/` |
| `nginx.conf` | Konfiguracja serwera: port 8080, cache, gzip, nagłówki, `/healthz`, MIME dla `.glb` |
| `compose.yaml` | Uruchomienie z hardeningiem, healthcheckiem i mapowaniem portu |
| `.dockerignore` | Wyklucza pliki deweloperskie, `nawyklybrand/` i stare źródła designu |
| `index.html`, `styles.css`, `app.js`, `bonsai.js` | Pliki aplikacji kopiowane do `/usr/share/nginx/html` |
| `assets/brand-mark.svg` | Wektorowy znak botaniczny używany w nagłówku, loaderze i stopce |
| `assets/bonsai.glb` | Model 3D ładowany przez `bonsai.js` (ok. 36 MB) |
| `assets/vendor/` | Lokalne Three.js, GLTFLoader, OrbitControls i BufferGeometryUtils |

Decyzje projektowe:

- **Brak multi-stage builda** — aplikacja jest w pełni statyczna i nie ma etapu kompilacji. Dodawanie stage’a Node/Vite tylko zwiększyłoby złożoność bez korzyści.
- **Obraz unprivileged** — Nginx działa jako UID/GID 101 i nasłuchuje na 8080; nie wymaga roota.
- **Brak wolumenów** — serwer jest bezstanowy. Trwałość danych zapewnia `localStorage` w przeglądarce.
- **Bez zmiennych środowiskowych** — do startu nie są potrzebne żadne sekrety ani konfiguracja; kontener można uruchomić w dowolnym środowisku.
- **Model 3D w obrazie** — `bonsai.glb` jest kopiowany razem z aplikacją, żeby viewer nie zależał od zewnętrznego hostingu assetów. To on odpowiada za większość rozmiaru obrazu.
- **Tylko runtime** — do obrazu nie trafiają testy, dokumentacja, `.git`, `nawyklybrand/` ani stare pliki inspiracji.

Zawartość aplikacji w obrazie:

```text
/usr/share/nginx/html/index.html
/usr/share/nginx/html/styles.css
/usr/share/nginx/html/app.js
/usr/share/nginx/html/bonsai.js
/usr/share/nginx/html/assets/brand-mark.svg
/usr/share/nginx/html/assets/bonsai.glb
/usr/share/nginx/html/assets/vendor/
/etc/nginx/conf.d/default.conf
```

## 7. Konfiguracja Nginx

`nginx.conf` zastępuje domyślny `conf.d/default.conf` w obrazie bazowym:

- **`listen 8080`** — port kontenera; mapowanie hosta to `8080:8080`.
- **`root /usr/share/nginx/html`** — katalog z plikami aplikacji.
- **`/healthz`** — lekki endpoint `200 ok` dla `HEALTHCHECK`.
- **`gzip`** — kompresja HTML, CSS, JS, JSON i SVG.
- **Cache**:
  - `index.html` → `expires -1` (zawsze rewalidacja),
  - `*.css`, `*.js` → `expires 1h` (ETag rewaliduje po wygaśnięciu),
  - `*.svg`, `*.woff2` → `expires 1h`,
  - `/assets/bonsai.glb` → `expires 1h` z MIME `model/gltf-binary`.
  Brak hashów w nazwach oznacza, że po wdrożeniu trzeba odświeżyć stronę twardo. Runtime’owe `styles.css`, `app.js` i `bonsai.js` są podpięte z parametrem `?v=…`; po zmianie podnieś wersję w `index.html`, inaczej przeglądarka może użyć starego cache. GLB nie jest gzipowany, bo to już skompresowany kontener.
- **Nagłówki bezpieczeństwa**:
  - `X-Content-Type-Options: nosniff`,
  - `X-Frame-Options: DENY`,
  - `Referrer-Policy: strict-origin-when-cross-origin`,
  - `Permissions-Policy` blokuje kamerę, mikrofon i geolokalizację.
- **SPA fallback** — `try_files $uri $uri/ /index.html;`.
- **Blokada plików ukrytych** — `location ~ /\. { deny all; }`.

### Dlaczego nie ma CSP?

Global build Vue kompiluje szablon z `index.html` w przeglądarce za pomocą `new Function()`. Ścisłe `Content-Security-Policy` bez `unsafe-eval` zablokowałoby aplikację. Można dodać CSP z `unsafe-eval` i `unsafe-inline`, ale daje to fałszywe poczucie bezpieczeństwa. Lepszym kierunkiem jest przejście na build Vite z prekompilowanymi szablonami i dopiero wtedy wprowadzenie restrykcyjnego CSP.

HSTS należy dodawać na poziomie reverse proxy obsługującego HTTPS, nie w tym kontenerze HTTP.

## 8. Codzienna eksploatacja

| Cel | Komenda |
|---|---|
| Start / przebudowa | `docker compose up -d --build` |
| Status i health | `docker compose ps` |
| Logi na żywo | `docker compose logs -f --tail=100` |
| Restart | `docker compose restart` |
| Stop | `docker compose down` |
| Healthcheck ręcznie | `curl -fsS http://localhost:8080/healthz` |
| Wejście do kontenera | `docker exec -it nawykly sh` |
| Zużycie zasobów | `docker stats nawykly` |
| Sprawdzenie konfiguracji | `docker compose config` |
| Test Nginx w obrazie | `docker run --rm nawykly:local nginx -t` |
| Rozmiar obrazu | `docker image ls nawykly` |

Kontener ma read-only rootfs. Nie edytuj plików wewnątrz działającego kontenera — zmiany należy wprowadzać w repozytorium i przebudować obraz.

## 9. Zmiana portu, domeny i konsekwencje dla danych

Port kontenera pozostaje `8080`. Zmienia się tylko lewa strona mapowania:

```yaml
ports:
  - "127.0.0.1:9090:8080"
```

Aplikacja będzie dostępna pod `http://localhost:9090`.

Ważne: `localStorage` jest przypisany do originu. Następujące adresy to **różne originy** i mają osobne dane:

- `http://localhost:8080`
- `http://127.0.0.1:8080`
- `http://localhost:9090`
- `https://nawykly.example.com`

Po zmianie portu lub domeny użytkownik zobaczy pusty stan i dane demo. Nie ma obecnie eksportu/importu ani backendu synchronizującego dane. W produkcji zaplanuj migrację danych lub dodaj funkcję eksportu do JSON.

## 10. Bezpieczeństwo

Zastosowane zabezpieczenia:

- obraz bazowy **non-root** (UID 101),
- **read-only rootfs** + zapisy tylko w `/tmp`,
- **`cap_drop: ALL`**,
- **`no-new-privileges:true`**,
- brak sekretów, backendu, bazy i wolumenów,
- nagłówki bezpieczeństwa w Nginx,
- port domyślnie wystawiony tylko na `127.0.0.1`,
- log rotation w Compose (10 MB × 3).

Zalecenia produkcyjne:

1. **Pinuj obraz bazowy po digest**, nie tylko po tagu:

   ```bash
   docker buildx imagetools inspect nginxinc/nginx-unprivileged:1.30-alpine
   ```

   Następnie w `Dockerfile` użyj:

   ```dockerfile
   FROM nginxinc/nginx-unprivileged@sha256:<DIGEST>
   ```

2. **Skanuj obraz**:

   ```bash
   docker scout cves nawykly:local
   # lub
   trivy image nawykly:local
   ```

3. **Nie wystawiaj 8080 publicznie**. Postaw reverse proxy z TLS (Caddy, Traefik, Nginx) i przekierowuj na `127.0.0.1:8080`.
4. **Dodaj HSTS na proxy** po włączeniu HTTPS.
5. **Aktualizuj bazę** regularnie i przebudowuj obraz w CI.
6. **Nie montuj gniazda Dockera** (`/var/run/docker.sock`) do tego kontenera.
7. Pamiętaj, że powiadomienia przeglądarki poza `localhost` wymagają HTTPS.

## 11. Produkcja i dalszy rozwój

Aktualna aplikacja jest prototypem. Przed wdrożeniem publicznym warto zaplanować:

- **Reverse proxy + HTTPS** — np. Caddy:

  ```caddyfile
  nawykly.example.com {
      reverse_proxy 127.0.0.1:8080
  }
  ```

- **Vendorowanie CDN-ów** — Vue i fonty nadal pochodzą z zewnętrznych serwerów. Three.js wraz z addonami jest już lokalny w `assets/vendor/`. W sieci izolowanej należy dodatkowo pobrać Vue i fonty do obrazu i zmienić odwołania w `index.html` / `styles.css`.
- **Optymalizacja modelu 3D** — obecny `bonsai.glb` ma ok. 36 MB (trzy duże tekstury PBR). W produkcji warto przepuścić go przez `gltf-transform` / Draco lub Meshopt, zmniejszyć tekstury i dodać wersję progresywną. To największy pojedynczy koszt transferu.
- **Build Vite** — pozwoli na hashowane nazwy plików, `Cache-Control: immutable`, prekompilację szablonów i ścisłe CSP.
- **Uwierzytelnianie i backend** — prawdziwe konta, synchronizacja między urządzeniami, zaproszenia do znajomych, akceptacja i wspólny ranking. Obecna wersja symuluje konto i znajomych lokalnie.
- **Eksport/import danych** — obecnie dane są uwięzione w `localStorage` jednej przeglądarki.
- **CI/CD** — build, test konfiguracji Nginx, skan obrazu i publikacja podpisanych obrazów.
- **Obserwowalność** — logi dostępowe, healthcheck, zewnętrzny uptime monitoring; aplikacja nie eksponuje metryk.
- **Skalowanie** — Nginx jest bezstanowy, więc można uruchomić wiele replik za load balancerem. Dane użytkowników i tak pozostają w przeglądarkach, więc repliki nie wymagają sticky sessions. Przy skalowaniu przez `docker compose up --scale` usuń `container_name` z `compose.yaml` — stała nazwa koliduje z wieloma kontenerami.

Przykładowe limity zasobów (Compose):

```yaml
deploy:
  resources:
    limits:
      cpus: "0.50"
      memory: 128M
```

Budowa wieloarchitekturowej wersji:

```bash
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t registry.example.com/nawykly:1.0.0 \
  --push .
```

## 12. Rozwiązywanie problemów

| Objaw | Prawdopodobna przyczyna | Rozwiązanie |
|---|---|---|
| `Cannot connect to the Docker daemon` | Docker Desktop/daemon nie działa | Uruchom Docker Desktop lub `sudo systemctl start docker` |
| `port is already allocated` | Port 8080 zajęty | Zmień mapowanie na `127.0.0.1:9090:8080` lub zatrzymaj proces |
| Kontener od razu się zatrzymuje | Błąd konfiguracji Nginx | `docker logs nawykly`, `docker run --rm nawykly:local nginx -t` |
| Status `unhealthy` | `/healthz` nie odpowiada | `docker exec nawykly wget -qO- http://127.0.0.1:8080/healthz`, sprawdź logi |
| `403 Forbidden` | Brak `index.html` lub złe uprawnienia | `docker exec nawykly ls -la /usr/share/nginx/html` |
| Pusta strona | Zablokowane CDN lub błąd JS | Otwórz DevTools → Console/Network; sprawdź unpkg (Vue), jsDelivr (fonty), `app.js` i `bonsai.js` |
| Stare CSS/JS po zmianie | Cache 1h i brak hashów | Twarde odświeżenie, przebudowa obrazu, ewentualnie wyczyść cache |
| Model 3D się nie pojawia | Brak WebGL, otwarcie przez `file://`, brak pliku lub zły MIME GLB | Otwórz przez HTTP; sprawdź `#bonsai-stage[data-error]`, Network (`assets/bonsai.glb`) i `chrome://gpu`; nagłówek powinien mieć `Content-Type: model/gltf-binary` |
| Model ładuje się długo | 36 MB tekstur PBR i wolne łączenie | Poczekaj na progres; po pierwszym pobraniu cache powinien pomóc, docelowo zoptymalizuj GLB |
| `Read-only file system` | Brak `tmpfs /tmp` przy ręcznym `docker run` | Dodaj `--tmpfs /tmp:size=16m,mode=1777` lub użyj Compose |
| `permission denied` przy `docker` (Linux) | Użytkownik poza grupą `docker` | Dodaj do grupy `docker` i zaloguj się ponownie |
| Powiadomienia nie działają | Brak zgody, HTTP poza localhost, karta zamknięta | Zezwól na powiadomienia, użyj HTTPS/localhost, pozostaw kartę otwartą |
| Brak dźwięku | Tryb „Nie przeszkadzać”, brak interakcji ze stroną | Wyłącz DND, kliknij stronę, aby odblokować audio; dzwonek włącza kanał przypomnień |
| `docker compose` nieznane | Brak pluginu Compose v2 | Zainstaluj Docker Desktop lub plugin `docker-compose-plugin` |

Diagnostyka w jednym miejscu:

```bash
docker compose ps
docker compose logs --tail=200
docker inspect --format '{{json .State.Health}}' nawykly
curl -i http://localhost:8080/healthz
docker compose config
```

## 13. Powiadomienia systemowe z dźwiękiem

### Włączenie

1. Otwórz aplikację przez `http://localhost:8080` (lub HTTPS).
2. Kliknij banner **„Włącz przypomnienia”** albo dzwonek w nagłówku.
3. Zezwól na powiadomienia. Krótki chime potwierdzi, że kanał dźwiękowy działa; nie jest wysyłane osobne powiadomienie testowe.

### Jak to działa

- O ustawionej godzinie aplikacja tworzy systemowe `Notification` z `requireInteraction` i `silent: false`.
- Dodatkowo odtwarza trójdźwiękowy chime przez **Web Audio API** — bez plików i zależności.
- Toast w aplikacji pozostaje fallbackiem i pozwala oznaczyć nawyk jako zrobiony.

### Ograniczenia platformy

- Przeglądarka wymaga **jednorazowej zgody** — nie można wysłać powiadomienia bez interakcji użytkownika.
- Powiadomienia działają przy otwartej aplikacji (także w tle). Po zamknięciu przeglądarki potrzebny byłby Service Worker + Push API i backend.
- Tryb „Nie przeszkadzać” może wyciszyć dźwięk systemowy. Własny chime wymaga wcześniejszej interakcji ze stroną (polityka autoplay).
- Notification API nie obsługuje własnego pliku dźwięku — dlatego chime jest syntezowany przez Web Audio.
- Na Chrome for Android powiadomienia wymagają Service Workera; prototyp jest przygotowany pod desktop.
- Poza `localhost` wymagany jest HTTPS.
- Docker nie zmienia tych zasad — to ograniczenia przeglądarki, nie kontenera.

## 14. Struktura repozytorium

```text
.
├── index.html          # szablon aplikacji (Vue + struktura widoków + import map)
├── styles.css          # system wizualny marki, layout, viewer 3D
├── app.js              # logika Vue 3, localStorage, przypomnienia
├── bonsai.js           # Three.js: scena, GLTFLoader, OrbitControls, fallback
├── assets/
│   ├── brand-mark.svg  # botaniczny znak marki
│   ├── bonsai.glb      # interaktywny model 3D (36 MB)
│   └── vendor/         # Three.js, GLTFLoader, OrbitControls lokalnie
├── Dockerfile          # obraz Nginx non-root
├── nginx.conf          # konfiguracja serwera statycznego i MIME GLB
├── compose.yaml        # uruchomienie z hardeningiem
├── .dockerignore       # filtr kontekstu builda
├── README.md           # ten dokument
├── moodboard.svg.png   # stary kierunek wizualny (nie trafia do obrazu)
├── testy_acc.svg       # wcześniejsze źródło designu (nie trafia do obrazu)
├── nawyklybrand/       # brand board, inspiracje i źródłowy bonsai.glb (nie trafia do obrazu)
└── .agents/            # skille deweloperskie (nie trafiają do obrazu)
```

## 15. Ograniczenia prototypu

- Brak prawdziwego backendu, uwierzytelniania i bazy danych. Logowanie oraz baza znajomych są lokalną symulacją w `localStorage`.
- Konto nie jest weryfikowane — hasło nie jest wysyłane ani przechowywane; służy tylko do wejścia w lokalny profil.
- Znajomi są listą demonstracyjną; nie ma wysyłania zaproszeń, powiadomień społecznościowych ani synchronizacji między urządzeniami.
- Dane tylko w `localStorage`; brak synchronizacji i backupu po stronie serwera.
- Zewnętrzne CDN (Vue, fonty) są wymagane w przeglądarce; Three.js i model są lokalne.
- **3D:** model ma ok. 36 MB i wymaga WebGL; na słabszych telefonach pierwsze ładowanie może być wolne. Nie ma animacji szkieletowych — interakcja to obrót, zoom, reset i auto-obrót.
- **3D:** viewer nie wczyta modelu, gdy strona jest otwarta przez `file://`; użyj serwera HTTP lub Dockera.
- Brak automatycznych testów i runnera; weryfikacja odbywa się przez przeglądarkę i przegląd kodu.
- Brak ścisłego CSP z powodu global build Vue (runtime compiler).
- Powiadomienia działają tylko przy otwartej karcie.
- Nazwy assetów nie są hashowane; po wdrożeniu wymagane twarde odświeżenie.
- Interfejs celowo ogranicza emoji i stawia na monogramy, typografię oraz spokojny, motywujący język.

Projekt edukacyjny — przed publikacją dodaj licencję i politykę prywatności.

<!-- Testowy commit: dołączenie do projektu. -->
