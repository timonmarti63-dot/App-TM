# Mission Control

Persönliches Dashboard: Zeitplan mit Checkliste, editierbare Business-Sparten und ein
Marktanalyst für Aktien & Rohstoffe mit stündlicher Trend-Prognose.

Keine Anmeldung, kein API-Key, kein eigener Server zum Betreiben – die App braucht nur
`npm install` und läuft.

## Features

- **Zeitplan mit Checkliste** – Termine wiederkehrend (bestimmte Wochentage) oder
  einmalig, pro Tag abhakbar, Fortschritt wird pro Datum gespeichert.
- **Sparten** – frei anlegbare, jederzeit editierbare Liste deiner Business-Versuche
  mit Status (Idee / Im Aufbau / Aktiv / Pausiert / Beendet) und Notizen.
- **Marktanalyst** – Top-5-Tagesgewinner getrennt für Aktien und Rohstoffe (aus einer
  festen Beobachtungsliste, siehe unten), inkl. Trend-Prognose bis Handelsschluss
  heute und in 7 Tagen. Aktualisiert sich automatisch stündlich – **ohne API-Key**.

Zeitplan- und Sparten-Daten liegen lokal im `localStorage` deines Browsers.

## Setup

```bash
npm install
npm run dev
```

App läuft dann unter `http://localhost:5173` – der Marktanalyst funktioniert direkt,
ohne Account oder Key irgendwo anzulegen.

Build für Deployment:

```bash
npm run build
```

## Wie der Marktanalyst ohne API-Key funktioniert

Klassische Finanz-APIs (z.B. Twelve Data, Alpha Vantage) verlangen einen kostenlosen,
aber selbst anzulegenden Account samt Key. Um das zu vermeiden, holt eine kleine
**serverlose Funktion** (`api/quotes.js`) die Kursdaten server-seitig von der
öffentlichen, keyless Chart-API von Yahoo Finance – der Browser sieht nur die eigene
`/api/quotes`-Route der App, nie Yahoo direkt. Lokal übernimmt beim `npm run dev` eine
Vite-Middleware (`vite.config.ts`) exakt dieselbe Logik, sodass du auch ohne Deployment
sofort echte Daten siehst.

**Wichtig für den Betrieb:** Diese Yahoo-Finance-Schnittstelle ist inoffiziell und nicht
dokumentiert – sie wird von vielen Open-Source-Finanztools genutzt, kann sich aber
theoretisch jederzeit ändern oder Anfragen blockieren. Falls das passiert, zeigt die App
eine Fehlermeldung statt falscher Daten. Ein Deployment mit dieser `api/`-Function
braucht eine Hosting-Plattform, die serverlose Functions unterstützt (z.B. Vercel,
Netlify) – ein reines statisches Hosting (z.B. GitHub Pages) reicht dafür **nicht**
mehr aus, weil `/api/quotes` dort nicht ausgeführt würde.

### Beobachtungsliste statt "ganzer Markt"

Auch ohne Key ist es nicht praktikabel, stündlich alle 500 S&P-Werte abzufragen.
Deshalb arbeitet der Marktanalyst mit einer festen Liste ca. 25 liquider
US-Standardwerte (`src/data/watchlist.ts`) und ermittelt daraus die
Top-5-Tagesgewinner – das ist keine vollständige Marktabdeckung, aber eine
realistische, verlässliche Annäherung. Die Liste lässt sich in `watchlist.ts` beliebig
anpassen.

Echte Rohstoffbörsen sind über kostenlose Consumer-Schnittstellen kaum zugänglich.
Rohstoffe werden deshalb über die liquidesten, börsengehandelten ETFs abgebildet, die
dem jeweiligen Spotpreis sehr eng folgen: Gold (GLD), Silber (SLV), Rohöl WTI (USO),
Erdgas (UNG), Kupfer (CPER), Platin (PPLT).

### Wie die Prognose entsteht (wichtig)

Es gibt keine Methode, die zukünftige Aktienkurse zuverlässig vorhersagt – auch diese
App tut das nicht. "Prognose bis Handelsschluss" und "Prognose in 7 Tagen" sind eine
**statistische Fortschreibung des jüngsten Kursmomentums**: eine lineare Regression
über die letzten ~24-30 Stundenkurse wird in die Zukunft verlängert
(`src/services/forecast.ts`). Das ist nützlich, um den aktuellen Trend zu sehen – es
ist **keine Anlageberatung und keine Garantie** für den tatsächlichen Kurs, der von
Nachrichten, Marktstimmung u.v.m. abhängt, die dieses Modell nicht kennt.

## Projektstruktur

```
api/
  quotes.js       Serverlose Function (Vercel) – Kursdaten ohne API-Key
  _lib/yahoo.js    Fetch- & Parse-Logik für die Yahoo-Finance-Chart-API
src/
  components/
    dashboard/   Übersichtsseite
    timetable/   Zeitplan + Checkliste
    ventures/    Sparten-Verwaltung
    market/      Marktanalyst (Liste, Sparkline)
    ui.tsx       Wiederverwendbare UI-Bausteine
  services/
    marketData.ts  Client für die eigene /api/quotes-Route
    forecast.ts     Trend-Prognose (lineare Regression)
  hooks/
    useLocalStorage.ts
    useMarketData.ts  Stündliches Auto-Refresh + Top-5-Ranking
  data/watchlist.ts   Beobachtungsliste Aktien & Rohstoff-ETFs
  lib/time.ts         US-Handelszeiten, Wochentags-Helfer
vite.config.ts         Spiegelt api/quotes.js als Dev-Middleware für npm run dev
```
