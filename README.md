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
  festen Beobachtungsliste, siehe unten) mit echten Preisen in der marktüblichen
  Einheit (z.B. US-Dollar je Feinunze bei Gold, je Barrel bei Rohöl). Für jeden Titel:
  Kursziel bis Handelsschluss heute und in 7 Tagen, dazu eine daraus abgeleitete
  Einstiegszone, ein Stop-Loss und das Chance-Risiko-Verhältnis (CRV) – als Chart mit
  Einstiegsband/SL/TP-Linien und als Tabelle. Aktualisiert sich automatisch stündlich
  – **ohne API-Key**.

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

Rohstoffe werden über die jeweils meistgehandelten **Terminkontrakte (Futures)**
abgebildet – das sind echte, an der Börse gehandelte Preise in ihrer marktüblichen
Einheit, kein ETF-Näherungswert: Gold (`GC=F`, USD/Feinunze), Silber (`SI=F`,
USD/Feinunze), Rohöl WTI (`CL=F`, USD/Barrel), Erdgas (`NG=F`, USD/MMBtu), Kupfer
(`HG=F`, USD/Pfund), Platin (`PL=F`, USD/Feinunze). Das ist der Preis des aktuell
nächstfälligen Kontrakts, kein Sofort-Spotpreis – für die tägliche Einordnung macht das
praktisch keinen Unterschied.

### Wie Prognose, Einstiegszone, Stop-Loss und CRV entstehen (wichtig)

Es gibt keine Methode, die zukünftige Kurse zuverlässig vorhersagt – auch diese App tut
das nicht, und nichts davon ist eine Anlageberatung. Alle Werte in `src/services/forecast.ts`
sind rein statistisch:

- **Kursziel heute / in 7 Tagen**: eine lineare Regression über die letzten ~24-30
  Stundenkurse, in die Zukunft verlängert (Fortschreibung des jüngsten Kursmomentums).
- **Einstiegszone**: ein flacher Rücksetzer-Bereich entgegen der jüngsten Kursrichtung,
  in Höhe der durchschnittlichen Handelsspanne (High-Low) der letzten 24 Kerzen – eine
  ATR-ähnliche Volatilitätskennzahl.
- **Stop-Loss**: ein weiterer Abstand jenseits der Einstiegszone, in derselben
  Volatilitätslogik.
- **Setup-Richtung (Long/Short)**: Vorzeichen der Regressions-Steigung der letzten
  Stunden – das kann von der oben gezeigten Tagesveränderung abweichen, wenn ein
  Titel den Tag zwar im Plus verbringt, der kurzfristige Trend aber gerade dreht.
- **CRV (Chance-Risiko-Verhältnis)**: Abstand zum Kursziel geteilt durch Abstand zum
  Stop-Loss.

Reale Kurse hängen von Nachrichten, Marktstimmung u.v.m. ab, die dieses Modell nicht
kennt – die Zahlen sind eine nachvollziehbare Illustration von Trend und Volatilität,
keine verlässliche Vorhersage und keine Handelsempfehlung.

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
    market/      Marktanalyst (Liste, Chart mit Entry/SL/TP)
    ui.tsx       Wiederverwendbare UI-Bausteine
  services/
    marketData.ts  Client für die eigene /api/quotes-Route
    forecast.ts     Trend-Prognose, Einstiegszone, Stop-Loss, CRV
  hooks/
    useLocalStorage.ts
    useMarketData.ts  Stündliches Auto-Refresh + Top-5-Ranking
  data/watchlist.ts   Beobachtungsliste Aktien & Rohstoff-Futures
  lib/time.ts         US-Handelszeiten, Wochentags-Helfer
vite.config.ts         Spiegelt api/quotes.js als Dev-Middleware für npm run dev
```
