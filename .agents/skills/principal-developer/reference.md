# Principal Developer — reference

Materiał pomocniczy do [SKILL.md](SKILL.md): frameworks, checklisty i przykłady decyzji architektonicznych.

## 1. Zbieranie ograniczeń

### Biznes i produkt

- Jaki problem biznesowy rozwiązujemy i jak mierzymy sukces?
- Jaki jest koszt błędu i koszt opóźnienia?
- Czy istnieją wymagania regulacyjne lub umowne?
- Jakie są non-goals?

### Skala i użytkownicy

- ilu użytkowników teraz i za 12/24 miesiące?
- jaki ruch, rozmiar danych, wzorce dostępu?
- jakie SLO (dostępność, latency, RTO/RPO)?
- czy występują piki sezonowe?

### Zespół i organizacja

- ilość osób, kompetencje, doświadczenie z technologią,
- kto utrzymuje system i dyżuruje,
- struktura zespołów (prawo Conwaya),
- tempo zmian i liczba zespołów współdzielących kod.

### Czas i budżet

- twarde terminy, budżet wdrożenia i budżet operacyjny,
- koszt zatrudnienia i szkoleń,
- koszt migracji i utrzymania dwóch ścieżek przez okres przejściowy.

### Stack i dane

- obecne języki, frameworki, bazy, kolejki, chmura,
- krytyczne integracje i ich kontrakty,
- własność danych i systemy źródłowe,
- jakość danych i potrzeba migracji,
- ograniczenia licencyjne i vendor lock-in.

### Operacje i bezpieczeństwo

- dojrzałość CI/CD, IaC, monitoringu i on-callu,
- model zagrożeń, dane osobowe, sekrety, audit,
- polityka backupów i disaster recovery,
- środowiska i sposób testowania.

### Pytania, które trzeba zadać, gdy brakuje danych

1. Jaki jest realistyczny horyzont skali — 6, 12 czy 36 miesięcy?
2. Kto będzie utrzymywał rozwiązanie i jakim zespołem dysponuje?
3. Co jest nieodwracalne: dane, kontrakty, integracje, doświadczenie użytkownika?
4. Czy istnieje twardy deadline i co się stanie, jeśli zostanie przekroczony?
5. Jakie założenie, jeśli okaże się fałszywe, najbardziej zmieni rekomendację?

## 2. Klasyfikacja decyzji

### One-way door vs two-way door

| Typ | Cechy | Wymagany rygor |
|---|---|---|
| **One-way door** | migracja danych, publiczne API, wybór bazy, model własności danych, platforma chmurowa | pełna analiza, POC, plan wyjścia, ADR, akceptacja interesariuszy |
| **Two-way door** | wewnętrzna biblioteka, struktura modułu, feature flag, lokalny wzorzec | szybka decyzja, time-box, test i ewentualny rollback |

Zasada: przy two-way door podejmuj decyzję szybko; przy one-way door zbieraj dowody i projektuj wyjście awaryjne.

### Architecture significance

Zmiana jest istotna architektonicznie, gdy dotyka:

- granic modułów lub zespołów,
- własności i przepływu danych,
- kontraktów zewnętrznych,
- modelu wdrożenia i skalowania,
- bezpieczeństwa lub zgodności,
- kosztu operacyjnego w sposób trwały.

Jeśli żaden punkt nie występuje — prawdopodobnie nie potrzebujesz procesu principal-level.

## 3. Frameworki decyzyjne

### 3.1. Ważona macierz decyzyjna

1. Wybierz 5–7 kryteriów, nadaj wagi sumujące się do 100%.
2. Oceń każdą opcję w skali 1–5; uzasadnij skrajne oceny.
3. Policz wynik ważony, ale **nie traktuj go jako wyroczni** — zapisz kompromisy jakościowe.
4. Sprawdź, czy wynik nie jest wrażliwy na zmianę jednej wagi (analiza wrażliwości).
5. Rekomendacja musi być spójna z wynikiem lub jawnie go uzasadniać.

Szablon: [templates/decision-matrix.md](templates/decision-matrix.md).

### 3.2. ATAM-lite

Dla decyzji architektonicznych:

1. Zidentyfikuj scenariusze jakościowe (np. „awaria bazy nie zatrzymuje zapisu nawyków”).
2. Wskaż punkty wrażliwości i kompromisy (np. spójność vs dostępność).
3. Oceń ryzyka i punkty bez decyzji.
4. Zapisz, które scenariusze są krytyczne dla biznesu.

### 3.3. Pre-mortem

Załóż, że decyzja poniosła porażkę za 12 miesięcy. Odpowiedz:

- co poszło nie tak,
- które założenie było fałszywe,
- jaki sygnał można było zauważyć wcześniej,
- jaka mitygacja kosztowałaby najmniej.

### 3.4. Cost of delay

Jeśli opcje różnią się czasem dostarczenia, porównaj:

- koszt opóźnienia biznesowego,
- koszt utrzymania dwóch ścieżek,
- koszt przejścia później (dług techniczny, migracja).

### 3.5. TCO (Total Cost of Ownership)

Licz co najmniej:

- licencje i infrastruktura,
- koszt wdrożenia i integracji,
- koszt utrzymania i on-call,
- szkolenia i rekrutacja,
- koszt wyjścia / migracji,
- koszt ryzyka (incydenty, audyty).

## 4. Architektura — checklist

### Granice i zależności

- [ ] Czy moduły odpowiadają zdolnościom biznesowym?
- [ ] Czy zależności są jednokierunkowe i jawne?
- [ ] Czy istnieje cykl zależności? Jeśli tak — czy jest uzasadniony?
- [ ] Czy kontrakty między modułami są wersjonowane?

### Dane

- [ ] Czy każde dane mają jednego właściciela?
- [ ] Czy transakcje nie przekraczają granic modułów w sposób niejawny?
- [ ] Czy model spójności (strong/eventual) jest świadomy?
- [ ] Czy migracje i backup są zaprojektowane?

### Niezawodność

- [ ] Czy zidentyfikowano failure modes i blast radius?
- [ ] Czy timeouts, retry, idempotencja i circuit breaker są spójne?
- [ ] Czy system degraduje się kontrolowanie?
- [ ] Czy rollback jest możliwy bez utraty danych?

### Obserwowalność

- [ ] logi strukturalne z korelacją,
- [ ] metryki biznesowe i techniczne,
- [ ] tracing na granicach modułów,
- [ ] alerty oparte na SLO, nie na pojedynczych błędach.

### Rozwój i dostarczanie

- [ ] Czy build i testy mieszczą się w rozsądnym czasie?
- [ ] Czy wdrożenie jest powtarzalne (CI/CD, IaC)?
- [ ] Czy feature flags pozwalają rozdzielić deploy od release?
- [ ] Czy środowiska są zbliżone do produkcji?

### Zespół

- [ ] Czy architektura mieści się w kompetencjach zespołu?
- [ ] Czy jeden zespół może wdrożyć zmianę bez koordynacji z wieloma innymi?
- [ ] Czy on-call jest realny przy założonym SLO?

### Wzorce — kiedy i kiedy nie

| Wzorzec | Kiedy sensowny | Kiedy nie |
|---|---|---|
| Modularny monolit | mały/średni zespół, niejasne granice, szybki start | konieczna niezależna skalowalność modułów |
| Mikroserwisy | wiele zespołów, niezależne wdrożenia, wyraźne granice | brak dojrzałości ops, mały zespół, wspólna baza |
| Event-driven | luźne powiązania, asynchroniczne procesy, wiele odbiorców | potrzebna natychmiastowa spójność i proste przepływy |
| Serverless | zmienny ruch, mało stanu, szybkie prototypy | długie procesy, zimne starty, przewidywalne obciążenie |
| Hexagonal / ports & adapters | izolacja domeny od infrastruktury | proste CRUD-y bez logiki domenowej |
| CQRS | różne modele odczytu i zapisu, duża skala odczytu | proste aplikacje, brak realnej potrzeby |

## 5. Wybór technologii

### Rubryka oceny

| Kryterium | Pytania |
|---|---|
| Dopasowanie | czy rozwiązuje problem lepiej niż alternatywy? |
| Dojrzałość | stabilność API, LTS, historia błędów, wydania bezpieczeństwa |
| Ekosystem | biblioteki, integracje, narzędzia, wsparcie |
| Zespół | czy znamy technologię? ile kosztuje nauka? |
| TCO | licencje, infra, utrzymanie, on-call |
| Lock-in | jak trudno się wycofać? jaki jest koszt wyjścia? |
| Bezpieczeństwo | model zagrożeń, podatności, zgodność |
| Wydajność | wystarczająca przy realistycznym obciążeniu |
| Zatrudnienie | dostępność specjalistów na rynku |
| Wsparcie | vendor, społeczność, SLA |

### Zasady wyboru

- Preferuj technologię, którą zespół potrafi utrzymać, nad tę, która wygrywa benchmarkiem.
- Wymagaj **planu wyjścia** dla każdej zależności krytycznej.
- Zrób **time-boxed POC** z kryteriami sukcesu zapisanymi przed startem.
- Sprawdź koszt nie tylko licencji, ale i operacji oraz migracji.
- Unikaj wyboru technologii wyłącznie na podstawie popularności.

## 6. Refaktoryzacja i migracje

### Analiza wpływu

1. **Mapa zależności:** kto importuje/woła zmieniany moduł (statycznie i runtime).
2. **Zakres danych:** jakie dane i kontrakty się zmieniają; czy potrzebna migracja.
3. **Blast radius:** które zespoły, usługi i ścieżki użytkownika ucierpią.
4. **Testy charakterystyczne:** pokryj obecne zachowanie przed zmianą.
5. **Seams:** znajdź miejsca wstrzyknięcia (interfejsy, adaptery, flagi).
6. **Rollback:** czy można wrócić bez utraty danych?
7. **Kolejność:** najpierw przygotowanie, potem przełączenie, na końcu sprzątanie.

### Strategie

- **Strangler fig:** nowa ścieżka obok starej, stopniowe przełączanie ruchu.
- **Branch by abstraction:** abstrakcja nad starą i nową implementacją.
- **Feature flags:** oddzielenie deploy od release; konieczna higiena flag.
- **Expand–migrate–contract:** rozszerz kontrakt, migruj dane, usuń stare.
- **Parallel run:** porównuj wyniki starej i nowej ścieżki przed przełączeniem.

### Plan migracji danych

- backup i punkt przywracania,
- migracja przyrostowa + backfill,
- weryfikacja spójności (counts, checksums, sampling),
- okres podwójnego zapisu (jeśli konieczny) i jego koszt,
- kryteria odcięcia i usunięcia starej ścieżki.

## 7. Ryzyka

### Rejestr ryzyk

| Pole | Opis |
|---|---|
| Ryzyko | krótki, konkretny opis |
| Prawdopodobieństwo | niskie / średnie / wysokie |
| Wpływ | biznesowy i techniczny |
| Mitygacja | działanie zmniejszające ryzyko |
| Trigger | sygnał, że ryzyko się materializuje |
| Właściciel | kto monitoruje |

### Kluczowe sygnały wczesnego ostrzegania

- rosnący czas wdrożenia lub liczba incydentów,
- spadek pokrycia testami krytycznych ścieżek,
- wzrost liczby wyjątków i obejść,
- rosnący koszt infrastruktury bez wzrostu ruchu,
- rosnąca liczba zależności synchronicznych,
- rotacja w zespole odpowiedzialnym za system.

## 8. Komunikacja decyzji

- **ADR** dla każdej decyzji istotnej architektonicznie.
- Krótkie podsumowanie dla interesariuszy: problem, wybór, koszt, ryzyko, data przeglądu.
- Decision log: lista decyzji z datą, statusem, właścicielem i linkiem do ADR.
- Decyzje odrzucone również zapisuj — oszczędzają czas przy kolejnej analizie.

Szablon: [templates/adr.md](templates/adr.md).

## 9. Skrócone przykłady

### 9.1. Monolit vs mikroserwisy dla zespołu 5 osób

**Ograniczenia:** MVP w 4 miesiące, zespół 5 osób bez doświadczenia ops, niejasne granice domen, przewidywany ruch 10 tys. użytkowników.

**Opcje:**
- A. Modularny monolit — szybki start, proste wdrożenie; ryzyko „wielkiej kuli błota” przy braku dyscypliny granic.
- B. Mikroserwisy — niezależne wdrożenia; wysoki koszt ops, rozproszone transakcje, wolniejszy start.

**Rekomendacja:** A, z jasnymi granicami modułów i kontraktami; ponowna ocena po 12 miesiącach lub przy wzroście do 3+ zespołów.

**Ryzyka:** erozja granic — mitygacja: architecture tests, code ownership; brak skalowania — mitygacja: stateless API i poziome skalowanie.

### 9.2. Build vs buy dla płatności

**Ograniczenia:** wymagana zgodność PCI, mały zespół, 6 tygodni do startu, obsługa wielu metod płatności.

**Opcje:**
- A. Integracja dostawcy — szybko, zgodność po stronie vendora; koszt transakcyjny i lock-in.
- B. Własna implementacja — pełna kontrola; wysoki koszt zgodności, bezpieczeństwa i utrzymania.

**Rekomendacja:** A z warstwą abstrakcji i planem migracji do drugiego dostawcy.

**Ryzyka:** zależność od jednego vendora — mitygacja: adapter i testy kontraktowe; wzrost kosztów — mitygacja: klauzule i monitorowanie.

### 9.3. Refactor vs rewrite modułu raportowego

**Ograniczenia:** moduł krytyczny, brak testów, 8000 linii, 3 zespoły korzystają z API, brak okna na długie wdrożenie.

**Opcje:**
- A. Refaktoryzacja inkrementalna — niskie ryzyko, wolniejsze tempo; wymaga testów charakterystycznych.
- B. Przepisanie — czystszy projekt; wysokie ryzyko regresji i długi okres podwójnego utrzymania.

**Rekomendacja:** A ze strangler fig i feature flagami; wydzielenie nowego API za adapterem, stopniowa migracja konsumentów.

**Ryzyka:** regresje — mitygacja: testy charakterystyczne i parallel run; przeciągająca się migracja — mitygacja: kamienie decyzyjne i deadline wyłączenia starej ścieżki.

## 10. Definition of Done dla fazy projektowej

- [ ] Ograniczenia zapisane jako fakty / założenia / pytania.
- [ ] Problem i kryteria (z wagami) jawnie zdefiniowane.
- [ ] Co najmniej dwie realne opcje, w tym minimalna zmiana.
- [ ] Kompromisy i koszty opisane dla każdej opcji.
- [ ] Jedna rekomendacja z poziomem pewności.
- [ ] Warunki zmiany rekomendacji wskazane.
- [ ] Ryzyka z mitygacjami i triggerami.
- [ ] Plan wdrożenia z rollbackiem (jeśli dotyczy).
- [ ] ADR przygotowany.
- [ ] Brak zmian w kodzie przed jawną akceptacją.
