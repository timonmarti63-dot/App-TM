# Mission Control

Persönliches Dashboard: Zeitplan mit Checkliste, editierbare Business-Sparten und ein
Marktanalyst für Aktien & Rohstoffe mit stündlicher Trend-Prognose.

Reine Browser-App (React + Vite + TypeScript + Tailwind) – kein eigenes Backend, alle
Daten (Zeitplan, Sparten, API-Key) liegen lokal im `localStorage` deines Browsers.

## Features

- **Zeitplan mit Checkliste** – Termine wiederkehrend (bestimmte Wochentage) oder
  einmalig, pro Tag abhakbar, Fortschritt wird pro Datum gespeichert.
- **Sparten** – frei anlegbare, jederzeit editierbare Liste deiner Business-Versuche
  mit Status (Idee / Im Aufbau / Aktiv / Pausiert / Beendet) und Notizen.
- **Marktanalyst** – Top-5-Tagesgewinner getrennt für Aktien und Rohstoffe (aus einer
  festen Beobachtungsliste, siehe unten), inkl. Trend-Prognose bis Handelsschluss
  heute und in 7 Tagen. Aktualisiert sich automatisch stündlich.

## Setup

```bash
npm install
npm run dev
```

App läuft dann unter `http://localhost:5173`.

Build für Deployment (z.B. Vercel, Netlify, GitHub Pages – jeder statische Hoster
reicht, da kein Server nötig ist):

```bash
npm run build
```

Das Ergebnis liegt in `dist/`.

## Marktanalyst einrichten

Kursdaten kommen über die kostenlose API von [twelvedata.com](https://twelvedata.com).

1. Kostenlosen Account auf twelvedata.com anlegen.
2. API-Key kopieren.
3. In der App unter "Marktanalyst" einfügen – der Key bleibt nur lokal im Browser
   gespeichert, es gibt keinen eigenen Server, der ihn sieht.

Die kostenlose Stufe reicht für den stündlichen Refresh dieser App locker aus (ca.
2 Kurs-Batch-Requests + bis zu 10 Zeitreihen-Requests pro Stunde).

### Beobachtungsliste statt "ganzer Markt"

Ein reiner Browser-Client kann nicht stündlich alle 500 S&P-Werte abfragen, ohne die
kostenlosen API-Limits zu sprengen. Deshalb arbeitet der Marktanalyst mit einer festen
Liste ca. 25 liquider US-Standardwerte (`src/data/watchlist.ts`) und ermittelt daraus
die Top-5-Tagesgewinner – das ist keine vollständige Marktabdeckung, aber eine
realistische, verlässliche Annäherung. Die Liste lässt sich in `watchlist.ts` beliebig
anpassen.

Echte Rohstoffbörsen sind über kostenlose Consumer-APIs kaum zugänglich. Rohstoffe
werden deshalb über die liquidesten, börsengehandelten ETFs abgebildet, die dem
jeweiligen Spotpreis sehr eng folgen: Gold (GLD), Silber (SLV), Rohöl WTI (USO),
Erdgas (UNG), Kupfer (CPER), Platin (PPLT).

### Wie die Prognose entsteht (wichtig)

Es gibt keine Methode, die zukünftige Aktienkurse zuverlässig vorhersagt – auch diese
App tut das nicht. "Prognose bis Handelsschluss" und "Prognose in 7 Tagen" sind eine
**statistische Fortschreibung des jüngsten Kursmomentums**: eine lineare Regression
über die letzten ~24 Stundenkurse wird in die Zukunft verlängert
(`src/services/forecast.ts`). Das ist nützlich, um den aktuellen Trend zu sehen – es
ist **keine Anlageberatung und keine Garantie** für den tatsächlichen Kurs, der von
Nachrichten, Marktstimmung u.v.m. abhängt, die dieses Modell nicht kennt.

## Projektstruktur

```
src/
  components/
    dashboard/   Übersichtsseite
    timetable/   Zeitplan + Checkliste
    ventures/    Sparten-Verwaltung
    market/      Marktanalyst (Liste, Sparkline)
    ui.tsx       Wiederverwendbare UI-Bausteine
  services/
    marketData.ts  Twelve-Data API-Client
    forecast.ts     Trend-Prognose (lineare Regression)
  hooks/
    useLocalStorage.ts
    useMarketData.ts  Stündliches Auto-Refresh + Top-5-Ranking
  data/watchlist.ts   Beobachtungsliste Aktien & Rohstoff-ETFs
  lib/time.ts         US-Handelszeiten, Wochentags-Helfer
```
