# Marktanalyst

Live-Marktübersicht für Aktien, Rohstoffe, Kryptowährungen, Indizes und Devisen –
mit Charts, technischen Indikatoren, automatisch berechneten Trade-Setups
(Einstiegszone/Stop-Loss/Take-Profit), einer Zukunftsprojektion mit
Unsicherheitsband und aktuellen Schlagzeilen. Keine Anmeldung, kein API-Key, kein
eigener Server zum Betreiben.

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
- **Indikatoren, aufgeteilt in kurzfristig (Trading), mittelfristig (Swing-Trading)
  und langfristig (Investment)**: 15 klassische technische Indikatoren, jeder als
  eigene Karte mit Wert, Bullisch/Bearisch/Neutral-Einstufung, kurzer Begründung
  (inkl. Crossover-Frische, Divergenzen, Bollinger-Squeeze – siehe Methodik unten)
  und seinem Chart (Kurslinie mit Overlay, eigenständiger Oszillator-Bereich oder
  Volumen-Histogramm) **dauerhaft sichtbar direkt darunter** – kein Antippen nötig,
  um nachzuvollziehen, worauf die Einstufung tatsächlich beruht. Gruppiert in drei
  Blöcke mit je eigenem Gesamtfazit.
- **Kursziele**: Tabelle mit Zielkurs + Unsicherheitszone, mit je einer eigenen
  "Gesamt"-Zeile für die drei Indikator-Gruppen. Jede Gruppe zeigt dabei nur die
  Zeiträume, für die sie tatsächlich aussagekräftig ist – kurzfristige (Tages-)
  Indikatoren nur 1 Woche, mittelfristige 1 und 3 Monate, langfristige 3/6/12
  Monate; für alles darüber hinaus wird bewusst keine Zahl gezeigt statt einer
  vorgetäuschten Genauigkeit. Innerhalb der gezeigten Horizonte sind die Zielkurse
  spürbar unterschiedlich und monoton wachsend statt eines nach kurzer Zeit
  eingefrorenen Werts. ATR (nicht richtungsgebend) und Indikatoren ohne verfügbare
  Daten tauchen in der Tabelle gar nicht erst auf.
- **Zukunftsprojektion**: wählbarer Horizont (7/14/30/60/90 Tage), gestrichelte
  Projektionslinie mit gefülltem Unsicherheitsband direkt im Chart, plus Zielwert ±
  Band als Zahl.
- **Fibonacci & Elliott-Wellen**: Retracement-/Extension-Levels (0/23,6/38,2/50/61,8/
  78,6/100 % sowie 127,2/161,8/261,8 %) als Linien im Chart und als Liste, dazu eine
  automatische Zigzag-Schwenkpunkterkennung mit Prüfung der drei harten
  Elliott-Impuls-Regeln (bestanden/nicht bestanden je Regel, nummerierte
  Wellenpunkte 0–5 im Chart).
- Kennzahlen-Panel: Tagesspanne, 52-Wochen-Spanne, Handelsvolumen.
- Alle Schlagzeilen der letzten 48 Stunden mit Original-Link, plus eine automatisch
  aus den Schlagzeilen-Titeln zusammengestellte deutsche Kurzfassung.

Aktualisiert sich automatisch einmal pro Minute, solange die Seite geöffnet ist –
Marktdaten bleiben so laufend aktuell. Watchlist und Favoriten liegen lokal im
`localStorage` deines Browsers.

## Setup

```bash
npm install
npm run dev
```

App läuft dann unter `http://localhost:5173` – alles funktioniert direkt, ohne
Account oder Key irgendwo anzulegen.

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

Auch ohne Key ist es nicht praktikabel, minütlich tausende Symbole abzufragen.
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

### 15 technische Indikatoren, kurz-/mittel-/langfristig getrennt, mit Tap-to-Chart (wichtig)

`src/services/indicators.ts` berechnet klassische, weit verbreitete Kennzahlen (reine
Arithmetik über die Kerzenreihe des gewählten Zeitraums – Schlusskurse bzw.
High/Low/Close/Volumen je nach Indikator, kein externer Dienst). Für jeden Indikator
läuft dieselbe Berechnung auf der vollen geladenen Historie (nicht nur den im Chart
sichtbaren letzten ~90 Punkten), damit z.B. ADX genug Kerzen zum Einschwingen hat.
`src/services/indicatorPanel.ts` (`buildIndicatorPanel`) leitet aus jedem Indikator
eine eigene Bullisch/Bearisch/Neutral-Einstufung nach der jeweils gebräuchlichen
Standarddefinition ab, plus die vollständige Zeitreihe zur Visualisierung.

**Tippen zum Nachvollziehen**: In der Vollansicht öffnet ein Antippen eines
Indikators direkt darunter dessen eigenen Chart – Kurslinie mit den Overlay-Linien,
ein eigenständiger Oszillator-Bereich mit den relevanten Schwellen oder beim Volume
Profile ein horizontales Volumen-Histogramm mit hervorgehobenem Point of Control.
Damit lässt sich für jeden einzelnen Indikator sehen, worauf genau seine Einstufung
beruht, statt der Zahl blind vertrauen zu müssen.

**Kurzfristig / mittelfristig / langfristig**: Jeder Indikator ist zusätzlich dem
Horizont zugeordnet, wo er laut gängiger TA-Praxis am besten funktioniert, mit
jeweils eigenem Gesamtfazit:
- **Kurzfristig (Trading, Tage)**: EMA 9/21, Parabolic SAR, RSI, Stochastik, CCI,
  Momentum, ATR, VWAP – reaktive Momentum-/Trading-Werkzeuge.
- **Mittelfristig (Swing-Trading, Wochen)**: MACD, Bollinger-Bänder, Keltner-Kanäle,
  On-Balance Volume – Trendbestätigung und Ausbrüche.
- **Langfristig (Investment, Wochen bis Monate)**: SMA(50), ADX, Volume Profile
  (POC) – Struktur-/Positionswerkzeuge.

Wie jede Kategorisierung ist das eine Vereinfachung, kein Naturgesetz.

**Trend**
- **SMA(50)** (langfristig) – Kurs über/unter einem einzelnen, längeren SMA: die
  klassische Trend-Grunddefinition (kein Crossover zweier SMAs).
- **EMA 9/21** (kurzfristig) – Crossover zweier kurzer EMAs, reagiert deutlich
  schneller als der SMA.
- **MACD(12/26/9)** (mittelfristig) – MACD-Linie (EMA12−EMA26) über/unter ihrer
  EMA9-Signallinie; ein soeben stattgefundenes Crossover wird in der Notiz explizit
  als frisches Kauf-/Verkaufssignal markiert.
- **Parabolic SAR** (kurzfristig) – iterative Trendfolge-Punkte; Kurs über/unter dem
  SAR-Punkt, ein Seitenwechsel im letzten Schritt wird als frische Trendwende
  markiert.
- **ADX(14)** (langfristig) – Trendstärke (ADX) plus Richtung (+DI/−DI); unter 20 =
  Seitwärtsmarkt (keine Richtungsaussage), 20–25 = aufkommender, ab 25 = etablierter
  starker Trend.

**Oszillatoren**
- **RSI(14)** (kurzfristig) – primär Divergenz zwischen Kurs und RSI (Kurs macht ein
  neues Hoch/Tief, RSI bestätigt das nicht – siehe `detectDivergence`), sonst die
  klassischen Überkauft/Überverkauft-Schwellen 70/30.
- **Stochastik(14,3)** (kurzfristig) – Überkauft/Überverkauft bei 80/20, mit Vermerk,
  ob %K bereits zurück über/unter %D dreht (Bestätigung).
- **CCI(20)** (kurzfristig) – ±100 als Schwelle für starken Trend
  (Trendbestätigungs-, keine Gegenbewegungs-Lesart).
- **Momentum(10)** (kurzfristig) – Vorzeichen der Kursdifferenz zu vor 10 Kerzen; ein
  frischer Nulllinien-Crossover wird explizit vermerkt.

**Volatilität**
- **Bollinger-Bänder(20, 2σ)** (mittelfristig) – Kurs an den Außenbändern =
  statistisch überdehnt (Gegenbewegungs-Lesart); zusätzlich Squeeze-Erkennung
  (ungewöhnlich enge Bänder relativ zur eigenen Historie = Ausbruchspotenzial,
  richtungslos).
- **ATR(14)** (kurzfristig) – Wilder-geglättete durchschnittliche Handelsspanne.
  Reines Volatilitätsmaß ohne Richtung – fließt bewusst **nicht** in ein Gesamtfazit
  ein; Notiz nennt zusätzlich die verbreitete 1,5×ATR-Stop-Loss-Faustregel.
- **Keltner-Kanäle(20, 2×ATR10)** (mittelfristig) – Kurs über/unter dem Kanal =
  Ausbruchssignal (Breakout-Lesart, bewusst anders interpretiert als die
  Bollinger-Bänder).

**Volumen**
- **VWAP** (kurzfristig) – bei Intraday-Zeitrastern (1T/5T) ein echter **Session-VWAP
  mit täglichem Reset** (wie im klassischen Daytrading-Einsatz definiert); bei
  Tages-/Wochenkerzen ein Anchored-VWAP über das ganze Fenster, da ein täglicher
  Reset dort bedeutungslos wäre.
- **On-Balance Volume** (mittelfristig) – primär Divergenz zwischen Kurs und OBV
  (Kurs steigt, OBV bestätigt nicht – klassisches Warnsignal), sonst die prozentuale
  OBV-Änderung der letzten 20 Kerzen als Trendbestätigung (nicht der absolute
  OBV-Stand, der als reine Kennzahl unbegrenzt ist).
- **Volume Profile (POC)** (langfristig) – verteilt das Volumen auf Preiszonen; Kurs
  über/unter dem Point of Control als Unterstützungs-/Widerstandszone.
- Bei Symbolen ohne Handelsvolumen-Daten (z.B. viele Indizes/Devisen) zeigen alle drei
  Volumen-Indikatoren transparent "keine Daten verfügbar" statt eine Richtung zu
  erfinden.

**Gesamtfazit**: für jede der drei Gruppen der einfache Durchschnitt über die
Indikatoren dieser Gruppe, die tatsächlich eine Richtung liefern (+1 je Bullisch, −1
je Bearisch, 0 je Neutral) – ATR und Indikatoren ohne verfügbare Daten zählen nicht
mit. Score über +0,15 gilt als Bullisch, unter −0,15 als Bearisch, dazwischen
Neutral. Das ist eine transparente Mehrheits-/Durchschnittsauswertung regelbasierter
Kennzahlen – **kein KI-/ML-Modell, keine Gewichtung nach historischer Trefferquote
und keine Anlageberatung.** Einzelne Indikatoren widersprechen sich in der Praxis
häufig; das Gesamtfazit fasst das lediglich numerisch zusammen.

### Kursziele – je Indikator und gesamt, nur für aussagekräftige Zeiträume (wichtig)

`src/services/priceTargets.ts` (`buildPriceTargets`) übersetzt die **stetige
Signalstärke** jedes Indikators aus dem Indikatoren-Panel (`strength`, -1..+1 – nicht
nur die 3-stufige Bullisch/Bearisch/Neutral-Einstufung) in eine Kurszielzone
(Zielkurs + Unsicherheitsband). Angezeigt in der Tabelle **"Kursziele"**, getrennt
nach den drei Indikator-Gruppen kurz-/mittel-/langfristig (siehe oben), jeweils mit
einer eigenen "Gesamt"-Zeile plus einer Zeile je Einzelindikator dieser Gruppe.

- **Zwei Filter, bevor überhaupt eine Zahl entsteht**:
  1. Nur Indikatoren mit `directional === true` bekommen eine Zeile – ATR liefert
     bewusst nie eine Richtung, und Volumen-Indikatoren ohne verfügbare
     Handelsvolumen-Daten (z.B. bei Devisen) haben schlicht keinen Wert, aus dem sich
     ein Kursziel ableiten ließe. Beide tauchen in der Tabelle deshalb gar nicht auf,
     statt einer erfundenen Zahl.
  2. Jede Horizont-Gruppe bekommt nur die Zeiträume, für die sie tatsächlich
     aussagekräftig ist: **kurzfristig (Trading) nur 1 Woche**, **mittelfristig
     (Swing-Trading) 1 und 3 Monate**, **langfristig (Investment) 3, 6 und 12
     Monate**. Ein Indikator, der nicht mehr als ein paar Tage vorausschauen kann
     (z.B. RSI, Parabolic SAR), bekommt also nur eine Zahl bei 1 Woche und sonst
     keine – eine 12-Monats-Zahl daraus abzuleiten würde eine Genauigkeit vortäuschen,
     die die Kennzahl nicht hat.
- **Signalstärke statt nur 3 Stufen**: jeder Indikator berechnet zusätzlich zu seinem
  Rating, *wie weit* er von seiner Schwelle entfernt ist (z.B. wie weit RSI unter 30
  liegt, wie groß der SMA5/SMA20-Abstand ist) – normiert auf ein Vielfaches der
  ATR-Quote (ATR/Kurs) des Symbols, nicht auf einen fixen Prozentsatz. Das ist
  wichtig: bei einem 1-Jahres-Chart sind zweistellige prozentuale Kursabstände normal,
  bei einem 1-Tages-Chart wären dieselben Prozente extrem. Ohne diese
  volatilitätsadaptive Normierung liefen bei stark bewegten Symbolen fast alle
  distanzbasierten Indikatoren gleichzeitig in die Kappung bei ±1 und zeigten
  identische Kursziele, obwohl ihre zugrunde liegenden Werte unterschiedlich stark
  ausschlugen.
- **Tägliche Drift-Annahme**: eine maximale Signalstärke (±1) entspricht der Annahme,
  der Kurs drifte täglich um die Hälfte seiner Tages-Volatilität in diese Richtung,
  schwächere Signale entsprechend weniger; Neutral ergibt Drift 0 – das Kursziel
  bleibt dort exakt beim aktuellen Kurs, deshalb zeigen alle neutral eingestuften
  Indikatoren denselben (unveränderten) Zielkurs.
- **Fortschreibung mit eigener, langsamerer Dämpfung**: gedämpfte Trendfortschreibung
  (Holt-Damped-Trend, `src/services/damping.ts`) wie bei der Zukunftsprojektion, aber
  mit einer eigenen Halbwertszeit von 90 Tagen statt der ~7 Tage der 7-90-Tage-
  Zukunftsprojektion. **Das war ein konkreter Bug**: mit der schnelleren Dämpfung war
  die Drift nach spätestens ~2 Monaten bereits vollständig ausgeklungen – bei einem
  bis zu 12 Monate reichenden Horizont waren die 3-/6-/12-Monats-Zielkurse dadurch
  praktisch identisch (nur das Unsicherheitsband wuchs noch weiter). Mit der
  90-Tage-Halbwertszeit sind stattdessen alle Horizonte einer Gruppe spürbar und
  monoton unterschiedlich (bei voller Signalstärke ±1 z.B. ~18/43/68/90 % der
  asymptotischen Maximalbewegung nach 1/3/6/12 Monaten).
- **Unsicherheitszone**: wächst weiterhin mit der Wurzel der Zeit – die Bandbreite
  unterscheidet sich also zusätzlich zum ebenfalls unterschiedlichen Zielkurs selbst.
- **Drei "Gesamt"-Zeilen**: je eine für die kurz-, mittel- und langfristige Gruppe,
  jeweils aus dem Durchschnitts-`strength`-Wert der richtungsgebenden Indikatoren
  dieser Gruppe (`consensusShort.avgStrength` / `consensusMedium.avgStrength` /
  `consensusLong.avgStrength`) – rechnerisch identisch mit dem Mittelwert der
  Einzel-Kursziele dieser Gruppe, weil die gedämpfte Drift linear in ihrer
  Eingangs-Steigung ist. Ein einzelner Konsens über alle 15 zusammen würde die drei
  unterschiedlichen Anwendungsfälle (Trading/Swing-Trading/Investment) sonst
  vermischen.

Wie überall in dieser App: eine transparente statistische Heuristik auf Basis der
bereits angezeigten Indikator-Einstufungen – **kein KI-/ML-Modell, keine
Wahrscheinlichkeitsangabe und keine Anlageberatung.** Bei teils widersprüchlichen
Indikatoren sind stark abweichende Zielkurse zwischen den Zeilen normal.

### Wie die Zukunftsprojektion entsteht (statt eines ML-Modells)

Ein Machine-Learning-Modell wie Prophet läuft nur in Python und würde die
Zero-Setup-Architektur dieser App aufgeben. Stattdessen nutzt
`src/services/projection.ts` eine transparente statistische Heuristik:

- **Mittelwert-Linie**: dieselbe Regressions-Steigung wie bei den Kurszielen, aber
  **gedämpft** (`src/services/damping.ts`, Holt-Damped-Trend-Prinzip) – die Steigung
  klingt mit der Zeit exponentiell ab, statt sich unbegrenzt linear
  fortzuschreiben. Ohne diese Dämpfung würde eine kurze, verrauschte Steigung aus
  z.B. 5 Tagen Historie bei einem 90-Tage-Horizont zu unplausibel großen Ausschlägen
  führen (in einem Test: +32% in 30 Tagen für einen als "bearisch" markierten
  Titel) – mit Dämpfung konvergiert die Projektion stattdessen gegen einen
  begrenzten Wert.
- **Unsicherheitsband**: wächst mit der Wurzel der Zeit (`Volatilität × √Tage`) –
  eine Random-Walk-Näherung dafür, dass sich zufällige Kursschwankungen über die
  Zeit aufsummieren.

Explizit **kein KI-/ML-Modell**, keine Bayes'sche Trend-/Saisonalitätszerlegung wie
Prophet, keine kalibrierte Wahrscheinlichkeit – eine nachvollziehbare Illustration,
keine Vorhersage.

### Fibonacci-Levels & Elliott-Wellen (wichtig)

`src/services/fibonacci.ts` und `src/services/elliott.ts` sind zwei klassische
Chart-Werkzeuge der technischen Analyse – **geometrische/regelbasierte Hilfsmittel,
keine Vorhersagen und keine Anlageberatung.** Beide laufen auf demselben
Kerzenfenster wie das angezeigte Chart (bis zu ~90 Kerzen des gewählten Zeitraums).

- **Fibonacci-Retracement/-Extension** (`computeFibonacci`): sucht das höchste Hoch
  und tiefste Tief im Zeitraum anhand der echten Kerzen-Höchst-/Tiefstwerte (nicht
  nur Schlusskurse) und berechnet die Standard-Ratios dazwischen –
  Retracements bei 0/23,6/38,2/50/61,8/78,6/100 %, Extensions bei 127,2/161,8/
  261,8 %. Die Trendrichtung ergibt sich daraus, welcher der beiden Extrempunkte
  zeitlich zuerst auftrat. Diese Levels markieren häufig beobachtete
  Reaktionszonen aus der Trader-Praxis – kein Beweis, dass der Kurs dort tatsächlich
  reagiert.
- **Elliott-Wellen-Strukturprüfung** (`analyzeElliott`): ein Zigzag-Algorithmus
  folgt dem Trend, bis der Kurs um einen (an die jüngste Volatilität angepassten)
  Schwellenwert vom letzten Extrempunkt abweicht, und markiert diesen als
  Schwenkpunkt – objektiv und reproduzierbar, aber wie jeder Zigzag empfindlich auf
  den Schwellenwert. Aus den letzten 6 Schwenkpunkten (Start der Welle 1 bis Ende
  der Welle 5) prüft die App nur die drei **harten** Elliott-Regeln: Welle 2
  retraced nicht über den Beginn von Welle 1 hinaus, Welle 3 ist nie die kürzeste
  von 1/3/5, Welle 4 überschneidet nicht das Kursgebiet von Welle 1. Das ist eine
  objektive Strukturprüfung, **keine vollständige Elliott-Wellen-Analyse** – eine
  vollständige Analyse würde zusätzlich Fibonacci-Längenverhältnisse zwischen
  Wellen, Wellengrad-Verschachtelung und das Alternations-Prinzip einbeziehen und
  erfordert in der Praxis erhebliche subjektive Interpretation. Werden zu wenige
  oder nicht sauber alternierende Schwenkpunkte gefunden (z.B. bei kurzen
  Zeiträumen wie 1 Tag), zeigt die App das transparent an, statt eine Struktur zu
  erzwingen.

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
  quotes.js        Serverlose Function – Kurse/Historie (inkl. Volumen)/Kennzahlen,
                   ohne API-Key
  news.js           Serverlose Function – Schlagzeilen, ohne API-Key
  search.js         Serverlose Function – Symbolsuche, ohne API-Key
  _lib/yahoo.js     Fetch- & Parse-Logik für alle drei Yahoo-Finance-Endpunkte
src/
  components/market/
    SymbolTable.tsx    Kategorie-/Watchlist-Tabelle (Level 1)
    SymbolPreview.tsx   Kurzansicht: Chart + Prognose + 1 Schlagzeile (Level 2)
    SymbolFull.tsx      Vollansicht: Zeitraum, SL/TP-Chart, Indikatoren-Panel,
                        Projektion, Fibonacci/Elliott, Kennzahlen, Schlagzeilen
                        (Level 3)
    SymbolSearch.tsx    Freitextsuche mit Live-Vorschlägen
    PriceChart.tsx      Chart-Basis (Kurs, SMA 5/20, Bollinger, optional
                        Entry/SL/TP, optional Projektion+Band)
    StructureChart.tsx  Chart mit Fibonacci-Levels + nummerierten Elliott-Wellenpunkten
    IndicatorPanelCard.tsx  15 Indikatoren in 3 Tiers (kurz-/mittel-/langfristig) als
                            Card-Grid, Chart je Indikator dauerhaft sichtbar
    IndicatorMiniChart.tsx  Chart für genau einen Indikator
                            (Kurs-Overlay/Oszillator/Volumen-Histogramm)
    PriceTargetsCard.tsx  Kursziel-Tabelle je Indikator + je Tier gesamt, Spalten
                          variieren je Tier (1 Woche / 1+3 / 3+6+12 Monate)
    ChartLegend.tsx
    ui.tsx              Wiederverwendbare UI-Bausteine
  services/
    marketData.ts   Client für /api/quotes, Zeitraum-Definitionen
    newsData.ts      Client für /api/news
    searchData.ts    Client für /api/search
    indicators.ts     SMA/EMA/RSI/MACD/Bollinger/ATR/ADX/Parabolic SAR/
                      Stochastik/CCI/Momentum/Keltner/sessionVwap/OBV/Volume Profile
                      – reine Arithmetik
    indicatorPanel.ts  Bullisch/Bearisch/Neutral + Chart-Zeitreihe je Indikator,
                       Tier-Zuordnung kurz-/mittel-/langfristig, je Tier ein Gesamtfazit
    priceTargets.ts     Kurszielzonen je Indikator + je Tier gesamt, nur für die
                        je Tier aussagekräftigen Zeiträume (1 Woche/1+3/3+6+12 Monate)
    damping.ts          Gedämpfte Trendfortschreibung (Holt-Damped-Trend)
    projection.ts        Zukunftsprojektion + Unsicherheitsband
    fibonacci.ts           Fibonacci-Retracement/-Extension-Levels
    elliott.ts               Zigzag-Schwenkpunkte + Elliott-Impuls-Regelcheck
    forecast.ts           Trend-Prognose, Einstiegszone, Stop-Loss, CRV,
                          bindet indicators/indicatorPanel/priceTargets/damping/
                          projection/fibonacci/elliott ein
  hooks/
    useMarketData.ts            Stündliches Auto-Refresh der ganzen Watchlist
    useSymbolTimeframeData.ts    On-Demand-Refetch für den Zeitraum-Umschalter
    useSymbolNews.ts              Lädt Schlagzeilen einmal je Symbol
    useFavorites.ts                Persönliche Watchlist (localStorage)
    useLocalStorage.ts
  data/watchlist.ts   Beobachtungslisten je Kategorie + Einheiten-Metadaten
  lib/
    time.ts      US-Handelszeiten, relative Zeitangaben
    report.ts     2-Tage-Filter + regelbasierte Schlagzeilen-Zusammenfassung
    symbolMeta.ts  Leitet Anzeige-Metadaten aus Suchtreffern ab
    format.ts      Preis-/Prozent-/Volumen-Formatierung
vite.config.ts    Spiegelt api/quotes.js, api/news.js, api/search.js als Dev-Middleware
```
