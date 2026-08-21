# Marktanalyst

Live-Marktübersicht für Aktien, Rohstoffe, Kryptowährungen, Indizes und Devisen –
mit Charts, technischen Indikatoren, automatisch berechneten Trade-Setups
(Einstiegszone/Stop-Loss/Take-Profit) und aktuellen Schlagzeilen. Keine Anmeldung,
kein API-Key, kein eigener Server zum Betreiben.

## Features

**1. Marktübersicht** – Startseite mit:
- Freitextsuche nach einem beliebigen Symbol weltweit (Aktien, ETFs, Krypto, Indizes,
  Devisen, Futures) – Treffer werden automatisch auf deine persönliche Watchlist
  gemerkt, damit sie sofort mit echten Daten geladen sind.
- **Meine Watchlist** – alle gemerkten Symbole, per ☆/★ verwaltbar, lokal gespeichert.
- Fünf Kategorie-Tabellen (Aktien, Rohstoffe, Kryptowährungen, Indizes, Devisen), je
  Top-5-Tagesgewinner aus einer festen Beobachtungsliste, mit Preis in der
  marktüblichen Einheit (z.B. US-Dollar je Feinunze bei Gold, je Barrel bei Rohöl,
  Indexpunkte bei Indizes, Wechselkurs bei Devisen) und Tagesveränderung.

**2. Kurzansicht** (eine Zeile antippen) – einfacher Kurs-Chart mit zwei gleitenden
Durchschnitten (SMA 5/20), Kursziel bis Handelsschluss heute und in 7 Tagen, und die
neueste Schlagzeile als Vorschau.

**3. Vollansicht** (nochmal antippen) –
- Zeitraum wählbar: 1 Tag, 5 Tage, 1 Monat, 3 Monate, 1 Jahr – Chart, Kennzahlen und
  Trade-Setup passen sich dem gewählten Zeitraum an.
- Chart mit SMA 5/20, Bollinger Bändern, eingezeichneter Einstiegszone, Stop-Loss-
  und Take-Profit-Linien, dazu Setup-Richtung (Long/Short), Chance-Risiko-Verhältnis
  (CRV).
- **Marktsignal**: Bullisch/Bearisch/Neutral-Einstufung aus einem Punktesystem über
  RSI(14), SMA5/SMA20-Trendstruktur und Bollinger-Band-Position, mit Begründung je
  Kennzahl sowie RSI- und MACD(12/26/9)-Subcharts.
- Kennzahlen-Panel: Tagesspanne, 52-Wochen-Spanne, Handelsvolumen.
- Alle Schlagzeilen der letzten 48 Stunden mit Original-Link, plus eine automatisch
  aus den Schlagzeilen-Titeln zusammengestellte deutsche Kurzfassung.

Aktualisiert sich automatisch stündlich. Watchlist und Favoriten liegen lokal im
`localStorage` deines Browsers.

## Setup

```bash
npm install
npm run dev
```

App läuft dann unter `http://localhost:5173` – alles funktioniert direkt, ohne Account
oder Key irgendwo anzulegen.

Build für Deployment:

```bash
npm run build
```

## Wie das ohne API-Key funktioniert

Klassische Finanz-APIs (z.B. Twelve Data, Alpha Vantage) verlangen einen kostenlosen,
aber selbst anzulegenden Account samt Key. Um das zu vermeiden, holen drei kleine
**serverlose Funktionen** die Daten server-seitig von öffentlichen, keyless
Yahoo-Finance-Endpunkten – der Browser sieht nur die eigenen `/api/…`-Routen der App,
nie Yahoo direkt:

- `api/quotes.js` – Kurse, Tages-/52-Wochen-Spanne, Volumen und Kurshistorie im
  gewünschten Zeitraster (Intervall + Zeitraum sind Parameter).
- `api/news.js` – aktuelle Presse-Schlagzeilen samt Link, wird geladen sobald du in
  der Übersicht ein Symbol antippst, und für Kurz- wie Vollansicht wiederverwendet.
- `api/search.js` – Freitextsuche nach Symbolen (Ticker, Firmenname, ...).

Lokal übernimmt beim `npm run dev` eine Vite-Middleware (`vite.config.ts`) exakt
dieselbe Logik, sodass du auch ohne Deployment sofort echte Daten siehst.

**Wichtig für den Betrieb:** Diese Yahoo-Finance-Schnittstellen sind inoffiziell und
nicht dokumentiert – sie werden von vielen Open-Source-Finanztools genutzt, können
sich aber theoretisch jederzeit ändern oder Anfragen blockieren. Falls das passiert,
zeigt die App eine Fehlermeldung statt falscher Daten. Ein Deployment braucht eine
Hosting-Plattform, die serverlose Functions unterstützt (z.B. Vercel, Netlify) – ein
reines statisches Hosting (z.B. GitHub Pages) reicht dafür **nicht** aus, weil die
`/api/…`-Routen dort nicht ausgeführt würden.

### Beobachtungsliste statt "ganzer Markt"

Auch ohne Key ist es nicht praktikabel, stündlich tausende Symbole abzufragen.
Deshalb arbeitet jede Kategorie mit einer festen Liste (`src/data/watchlist.ts`):
ca. 25 liquide US-Standardwerte, 6 Rohstoff-Futures, 6 Kryptowährungen, 6 Indizes und
6 Devisenpaare – jeweils die Top 5 nach Tagesveränderung. Über die Suche lässt sich
aber jedes beliebige weitere Symbol nachschlagen und dauerhaft zur eigenen Watchlist
hinzufügen.

Rohstoffe werden über die jeweils meistgehandelten **Terminkontrakte (Futures)**
abgebildet – echte, an der Börse gehandelte Preise in ihrer marktüblichen Einheit,
kein ETF-Näherungswert: Gold (`GC=F`, USD/Feinunze), Silber (`SI=F`, USD/Feinunze),
Rohöl WTI (`CL=F`, USD/Barrel), Erdgas (`NG=F`, USD/MMBtu), Kupfer (`HG=F`,
USD/Pfund), Platin (`PL=F`, USD/Feinunze).

### Wie Prognose, Einstiegszone, Stop-Loss und CRV entstehen (wichtig)

Es gibt keine Methode, die zukünftige Kurse zuverlässig vorhersagt – auch diese App
tut das nicht, und nichts davon ist eine Anlageberatung. Alle Werte in
`src/services/forecast.ts` sind rein statistisch und beziehen sich immer auf den
gerade gewählten Zeitraum (1T/5T/1M/3M/1J):

- **Kursziel heute / in 7 Tagen**: eine lineare Regression über die Kurse des
  gewählten Zeitraums, in die Zukunft verlängert (Fortschreibung des jüngsten
  Kursmomentums). Die Steigung wird dabei anhand der tatsächlichen Kerzengröße
  (5-Minuten- bis Wochenkerzen) auf eine Stunden-/Tagesrate umgerechnet, damit ein
  1-Jahres-Chart nicht dieselbe Rohsteigung wie ein 1-Tages-Chart bekommt.
- **Einstiegszone**: ein flacher Rücksetzer-Bereich entgegen der jüngsten
  Kursrichtung, in Höhe der durchschnittlichen Handelsspanne (High-Low) der letzten
  24 Kerzen – eine ATR-ähnliche Volatilitätskennzahl.
- **Stop-Loss**: ein weiterer Abstand jenseits der Einstiegszone, in derselben
  Volatilitätslogik.
- **Setup-Richtung (Long/Short)**: Vorzeichen der Regressions-Steigung im gewählten
  Zeitraum – das kann von der Tagesveränderung in der Übersicht abweichen.
- **CRV (Chance-Risiko-Verhältnis)**: Abstand zum Kursziel geteilt durch Abstand zum
  Stop-Loss.
- **SMA 5 / SMA 20**: einfache gleitende Durchschnitte über die letzten 5 bzw. 20
  Kerzen des gewählten Zeitraums, als Trendlinien im Chart.

Reale Kurse hängen von Nachrichten, Marktstimmung u.v.m. ab, die dieses Modell nicht
kennt – die Zahlen sind eine nachvollziehbare Illustration von Trend und Volatilität,
keine verlässliche Vorhersage und keine Handelsempfehlung.

### Technische Indikatoren & Marktsignal

`src/services/indicators.ts` berechnet klassische, weit verbreitete Kennzahlen (reine
Arithmetik über die Kursreihe des gewählten Zeitraums, kein externer Dienst):

- **RSI(14)** – Wilder-Glättung von Kursgewinnen/-verlusten, 0-100.
- **MACD(12/26/9)** – Differenz aus EMA12 und EMA26, plus EMA9 der Differenz als
  Signallinie.
- **Bollinger Bänder(20, 2σ)** – SMA20 ± 2 Populations-Standardabweichungen.

`src/services/signal.ts` (`computeMarketSignal`) wertet daraus ein
Bullisch/Bearisch/Neutral-Signal mit Punktesystem aus: RSI < 30 bzw. > 70 (±1), Kurs
über/unter SMA5 bei gleichzeitigem SMA5/SMA20-Crossover (±2), Kurs am unteren/oberen
Bollinger-Band (±1) – ab Score ±2 gilt Bullisch/Bearisch, sonst Neutral. Das ist an
ein klassisches, öffentlich bekanntes Trader-Schema angelehnt (Golden-Cross-Logik,
RSI-Überkauft/-Überverkauft, Band-Extreme), verwendet aber SMA5/SMA20 statt SMA50/200
– bei den hier geladenen Zeitreihen (bis zu ~90-260 Kerzen, je nach Zeitraum) wäre ein
200er-Fenster oft noch gar nicht berechenbar. Wie bei allen anderen Werten hier gilt:
eine regelbasierte Kennzahlen-Auswertung, keine Analyse durch Menschen und keine
Anlageberatung.

### Schlagzeilen & Zusammenfassung

Die Kurzansicht zeigt bereits die neueste Schlagzeile als Teaser; die Vollansicht
listet alle Meldungen der letzten 48 Stunden (Titel, Quelle, Original-Link, Alter) –
gibt es keine so aktuellen, zeigt sie stattdessen die neuesten verfügbaren mit
entsprechendem Hinweis. Die "Zusammenfassung" darüber ist **kein von einem Menschen
oder einer KI geschriebener Analysebericht**, sondern ein regelbasiert aus den
Schlagzeilen-Titeln zusammengesetzter Textblock (`src/lib/report.ts`,
`buildHeadlineSummary`) – transparent als das gekennzeichnet, was er ist: eine
Bündelung der Titel, keine inhaltliche Einordnung.

## Projektstruktur

```
api/
  quotes.js        Serverlose Function – Kurse/Historie/Kennzahlen, ohne API-Key
  news.js           Serverlose Function – Schlagzeilen, ohne API-Key
  search.js         Serverlose Function – Symbolsuche, ohne API-Key
  _lib/yahoo.js     Fetch- & Parse-Logik für alle drei Yahoo-Finance-Endpunkte
src/
  components/market/
    SymbolTable.tsx    Kategorie-/Watchlist-Tabelle (Level 1)
    SymbolPreview.tsx   Kurzansicht: Chart + Prognose + 1 Schlagzeile (Level 2)
    SymbolFull.tsx      Vollansicht: Zeitraum, SL/TP-Chart, Kennzahlen,
                        Schlagzeilen + Zusammenfassung (Level 3)
    SymbolSearch.tsx    Freitextsuche mit Live-Vorschlägen
    PriceChart.tsx      Chart-Basis (Kurs, SMA 5/20, Bollinger, optional Entry/SL/TP)
    RsiChart.tsx / MacdChart.tsx  Indikator-Subcharts (nur Vollansicht)
    ChartLegend.tsx
    ui.tsx              Wiederverwendbare UI-Bausteine
  services/
    marketData.ts   Client für /api/quotes, Zeitraum-Definitionen
    newsData.ts      Client für /api/news
    searchData.ts    Client für /api/search
    indicators.ts     SMA/EMA/RSI/MACD/Bollinger – reine Arithmetik
    signal.ts          Bullisch/Bearisch/Neutral-Punktesystem
    forecast.ts         Trend-Prognose, Einstiegszone, Stop-Loss, CRV, bindet
                        indicators.ts + signal.ts ein
  hooks/
    useMarketData.ts         Stündliches Auto-Refresh der ganzen Watchlist
    useSymbolTimeframeData.ts On-Demand-Refetch für den Zeitraum-Umschalter
    useSymbolNews.ts          Lädt Schlagzeilen einmal je Symbol
    useFavorites.ts            Persönliche Watchlist (localStorage)
    useLocalStorage.ts
  data/watchlist.ts   Beobachtungslisten je Kategorie + Einheiten-Metadaten
  lib/
    time.ts      US-Handelszeiten, relative Zeitangaben
    report.ts     2-Tage-Filter + regelbasierte Schlagzeilen-Zusammenfassung
    symbolMeta.ts  Leitet Anzeige-Metadaten aus Suchtreffern ab
    format.ts      Preis-/Prozent-/Volumen-Formatierung
vite.config.ts    Spiegelt api/quotes.js, api/news.js, api/search.js als Dev-Middleware
```
