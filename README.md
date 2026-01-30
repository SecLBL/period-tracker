# Perioden-Tracker PWA

Eine datenschutzorientierte Progressive Web App zur Zyklusverfolgung mit KI-gestützten Vorhersagen.

## Features

- **Zyklusverfolgung** - Periodenbeginn und -ende erfassen
- **Symptom-Tracking** - 40+ Symptome in 9 Kategorien mit Schweregrad (1-5)
- **KI-Vorhersagen** - Neuronales Netzwerk für präzise Periodenvorhersagen
- **Fruchtbarkeitsfenster** - Berechnung von Eisprung und fruchtbaren Tagen
- **Statistiken** - Zykluslängen-Trends, Durchschnitte, Variabilität
- **100% Privat** - Alle Daten bleiben lokal auf dem Gerät (IndexedDB)
- **Offline-fähig** - Funktioniert ohne Internetverbindung
- **Installierbar** - Als eigenständige App auf Smartphone/Desktop nutzbar
- **Dark Mode** - Systemeinstellung oder manuell umschaltbar
- **Datenexport** - Backup und Wiederherstellung als JSON

## Tech Stack

| Technologie | Verwendung |
|-------------|------------|
| React 19 | UI-Framework |
| TypeScript | Typsicherheit |
| Vite | Build-Tool & Dev-Server |
| Tailwind CSS | Styling |
| Dexie.js | IndexedDB-Wrapper |
| date-fns | Datumsverarbeitung |
| Recharts | Datenvisualisierung |
| vite-plugin-pwa | PWA-Generierung |

## Vorhersage-Algorithmus

Das System verwendet einen mehrstufigen Ansatz:

```
7+ Zyklen  →  ML-Modell (Neuronales Netzwerk)
2-6 Zyklen →  Statistische Analyse (gewichteter Durchschnitt)
0-1 Zyklen →  Standard (28 Tage)
      ↓
Symptom-Anpassungen (Baseline + Gelerntes)
      ↓
Finale Vorhersage mit Konfidenzintervall
```

### ML-Modell

- 2-Layer Neural Network (32 → 16 Neuronen)
- Trainiert auf FedCycle-Datensatz (1.665 Zyklen)
- 13 Input-Features (letzte 6 Zykluslängen + Statistiken)
- MAE: ~3,5 Tage

### Symptom-Analyse

**Baseline-Signale** (funktionieren sofort):
- Fruchtbarkeitsindikatoren (Zervixschleim, Mittelschmerz)
- PMS-Indikatoren (Krämpfe, Stimmung, Blähungen)
- Periodennahe Signale (Schmierblutung)

**Gelernte Muster** (ab 2+ abgeschlossenen Zyklen):
- Persönliche Symptom-Muster werden erkannt
- Timing-Anpassungen basierend auf historischen Daten

## Installation

```bash
# Dependencies installieren
npm install

# Entwicklungsserver starten
npm run dev

# Produktions-Build erstellen
npm run build

# Build lokal testen
npm run preview
```

## Projektstruktur

```
src/
├── components/       # UI-Komponenten
│   ├── Layout.tsx           # Header, Navigation, Dark Mode
│   ├── PredictionView.tsx   # Vorhersage-Anzeige
│   ├── CalendarView.tsx     # Kalender-Übersicht
│   ├── CycleInput.tsx       # Zyklus-Eingabe
│   ├── SymptomTracker.tsx   # Symptom-Erfassung
│   ├── Statistics.tsx       # Statistiken
│   └── ExportImport.tsx     # Daten-Export/Import
├── hooks/
│   ├── useCycles.ts         # Zyklus-Datenverwaltung
│   └── usePrediction.ts     # Vorhersage-Logik
├── utils/
│   ├── calculations.ts      # Berechnungen & Symptom-Analyse
│   ├── mlPredictor.ts       # Neuronales Netzwerk
│   └── database.ts          # IndexedDB-Operationen
├── constants/
│   └── symptoms.ts          # Symptom-Definitionen
└── types/
    └── index.ts             # TypeScript-Interfaces
```

## Datenschutz

- Keine Server-Kommunikation
- Keine Tracking- oder Analytics-Tools
- Alle Daten verbleiben ausschließlich auf dem Gerät
- Export/Import nur lokal als JSON-Datei

## ML-Modell trainieren (optional)

```bash
cd ml
pip install -r requirements.txt
python train_model.py
```

Das trainierte Modell wird nach `public/model/` exportiert.
