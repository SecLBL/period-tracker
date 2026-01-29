# Vorhersage-Algorithmus: Kompletter Breakdown

## Inhaltsverzeichnis

1. [Systemübersicht](#1-systemübersicht)
2. [Entscheidungslogik](#2-entscheidungslogik)
3. [Statistische Vorhersage](#3-statistische-vorhersage)
4. [Machine Learning Vorhersage](#4-machine-learning-vorhersage)
5. [Symptom-basierte Anpassung](#5-symptom-basierte-anpassung)
6. [Konfidenzberechnung](#6-konfidenzberechnung)
7. [Datenfluss-Diagramm](#7-datenfluss-diagramm)

---

## 1. Systemübersicht

Das Vorhersagesystem verwendet einen **dreistufigen Ansatz**:

```
┌─────────────────────────────────────────────────────────────┐
│                    VORHERSAGE-PIPELINE                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Zyklusdaten ──┬──► ML-Modell ────────┐                    │
│                │                       │                    │
│                ├──► Statistik ─────────┼──► Basis-         │
│                │                       │    Vorhersage     │
│                └──► Default (28 Tage)──┘                    │
│                                                             │
│  Symptome ─────────► Muster-Analyse ───► Anpassung ───►    │
│                                                             │
│                                          ENDVORHERSAGE      │
└─────────────────────────────────────────────────────────────┘
```

### Dateien und Verantwortlichkeiten

| Datei | Funktion |
|-------|----------|
| `usePrediction.ts` | Orchestriert alle Vorhersage-Komponenten |
| `mlPredictor.ts` | Neuronales Netz für ML-Vorhersagen |
| `calculations.ts` | Statistische Funktionen + Symptom-Analyse |
| `train_model.py` | Training des ML-Modells |

---

## 2. Entscheidungslogik

Die Wahl der Vorhersagemethode basiert auf der **Anzahl verfügbarer Zyklen**:

```typescript
// usePrediction.ts, Zeile 67-98

if (cycleLengths.length >= 6) {
    // Versuche ML-Vorhersage
    const mlPrediction = await predictWithML(cycles);
    if (mlPrediction !== null) {
        source = 'ml';           // KI-Vorhersage
    } else {
        source = 'statistical';   // Fallback
    }
} else if (cycleLengths.length >= 2) {
    source = 'statistical';       // Nur Statistik
} else {
    source = 'default';           // Standard 28 Tage
}
```

### Schwellenwerte

| Zyklen | Methode | Konfidenz | Erklärung |
|--------|---------|-----------|-----------|
| 0-1 | Default | Niedrig | 28-Tage-Standard |
| 2-6 | Statistik | Niedrig-Mittel | Gewichteter Durchschnitt |
| 7+ | ML + Statistik | Mittel-Hoch | Neuronales Netz |

---

## 3. Statistische Vorhersage

### 3.1 Gewichteter Durchschnitt

Neuere Zyklen bekommen **höheres Gewicht** (exponentieller Abfall):

```typescript
// calculations.ts, Zeile 179-212

function getWeightedAverageCycleLength(cycles, count = 6, decay = 0.8) {
    // Gewichte: [1.0, 0.8, 0.64, 0.512, 0.41, 0.328]
    //           ↑ neuester Zyklus hat höchstes Gewicht

    for (let i = 0; i < lengths.length; i++) {
        const weight = Math.pow(decay, i);  // 0.8^i
        weightedSum += lengths[i] * weight;
        totalWeight += weight;
    }

    return Math.round(weightedSum / totalWeight);
}
```

**Beispiel:**
```
Zykluslängen: [29, 28, 30, 27, 31, 28] (neuester zuerst)
Gewichte:     [1.0, 0.8, 0.64, 0.51, 0.41, 0.33]

Berechnung:
(29×1.0 + 28×0.8 + 30×0.64 + 27×0.51 + 31×0.41 + 28×0.33) / 3.69
= 107.14 / 3.69
= 29.0 Tage
```

### 3.2 Trend-Erkennung

Erkennt ob Zyklen länger/kürzer werden (lineare Regression):

```typescript
// calculations.ts, Zeile 276-328

function getCycleTrend(cycles, count = 6): CycleTrend {
    // Lineare Regression: y = mx + b
    // slope > 0.5  → 'increasing' (Zyklen werden länger)
    // slope < -0.5 → 'decreasing' (Zyklen werden kürzer)
    // sonst        → 'stable'

    const slope = numerator / denominator;

    if (slope > 0.5) return 'increasing';
    if (slope < -0.5) return 'decreasing';
    return 'stable';
}
```

### 3.3 Lutealphase-Schätzung

Die Lutealphase (nach Eisprung bis Periode) ist relativ konstant:

```typescript
// calculations.ts, Zeile 335-356

function estimateLutealPhase(cycles): number {
    const avgCycleLength = getAverageCycleLength(cycles);

    if (avgCycleLength < 26) return 12;  // Kurze Zyklen
    if (avgCycleLength > 32) return 14;  // Lange Zyklen
    return 14;  // Standard
}
```

---

## 4. Machine Learning Vorhersage

### 4.1 Modell-Architektur

```
INPUT (13 Features)
        │
        ▼
┌───────────────────┐
│  Dense Layer 1    │  32 Neuronen + ReLU
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│  Dense Layer 2    │  16 Neuronen + ReLU
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│  Output Layer     │  1 Neuron (linear)
└─────────┬─────────┘
          │
          ▼
    ZYKLUSLÄNGE (Tage)
```

### 4.2 Feature-Vektor (13 Dimensionen)

```typescript
// mlPredictor.ts, Zeile 178-208

const features = [
    // Letzte 6 Zykluslängen (Index 0-5)
    cycle_1, cycle_2, cycle_3, cycle_4, cycle_5, cycle_6,

    // Statistische Aggregationen (Index 6-9)
    mean,    // Durchschnitt der 6 Zyklen
    std,     // Standardabweichung
    min,     // Kürzester Zyklus
    max,     // Längster Zyklus

    // Zusätzliche Features (Index 10-12)
    periodLength,  // Durchschnittliche Periodenlänge
    age,           // Alter (Default: 30)
    bmi            // BMI (Default: 22)
];
```

### 4.3 Normalisierung

Alle Features werden z-score normalisiert:

```typescript
// mlPredictor.ts, Zeile 213-223

function normalizeFeatures(features: number[]): number[] {
    return features.map((val, i) => {
        const mean = scaler.mean[i];
        const scale = scaler.scale[i];
        return (val - mean) / scale;  // z = (x - μ) / σ
    });
}
```

### 4.4 Forward Pass (Pure JavaScript)

```typescript
// mlPredictor.ts, Zeile 82-100

function predict(input: number[]): number {
    let current = input;

    // Hidden Layers mit ReLU
    for (let layer = 0; layer < weights.length - 1; layer++) {
        current = forwardLayer(current, weights[layer], biases[layer]);
        current = current.map(x => Math.max(0, x));  // ReLU
    }

    // Output Layer (linear)
    current = forwardLayer(current, weights[lastLayer], biases[lastLayer]);

    return current[0];  // Vorhergesagte Zykluslänge
}
```

### 4.5 Training (Python/scikit-learn)

```python
# train_model.py, Zeile 254-267

model = MLPRegressor(
    hidden_layer_sizes=(32, 16),  # 2 Hidden Layers
    activation='relu',
    solver='adam',
    alpha=0.01,                    # L2 Regularisierung
    learning_rate='adaptive',
    max_iter=500,
    early_stopping=True,
    validation_fraction=0.15,
    n_iter_no_change=20
)
```

### 4.6 Trainingsmetriken

| Metrik | Wert | Bedeutung |
|--------|------|-----------|
| MAE | ~2.1 Tage | Durchschnittlicher Fehler |
| RMSE | ~2.8 Tage | Wurzel des mittleren quadratischen Fehlers |
| ±1 Tag | ~35% | Vorhersagen innerhalb 1 Tag |
| ±2 Tage | ~58% | Vorhersagen innerhalb 2 Tagen |
| ±3 Tage | ~75% | Vorhersagen innerhalb 3 Tagen |

---

## 5. Symptom-basierte Anpassung

### 5.1 Symptom-Kategorien für Algorithmus

```typescript
// calculations.ts, Zeile 404-423

// PMS-Indikatoren (1-7 Tage vor Periode)
PMS_INDICATOR_SYMPTOMS = [
    'pain_cramps', 'pain_pelvic', 'pain_back', 'pain_head', 'pain_breast',
    'physical_bloating', 'physical_acne', 'physical_nausea',
    'physical_hot_flashes', 'physical_water_retention', 'physical_dizzy',
    'mood_sensitive', 'mood_sad', 'mood_irritable', 'mood_anxious',
    'energy_low', 'sleep_poor', 'sleep_insomnia',
    'appetite_cravings', 'appetite_high'
];

// Eisprung-Indikatoren (12-18 Tage vor Periode)
OVULATION_INDICATOR_SYMPTOMS = [
    'cm_eggwhite', 'cm_watery',  // ← GOLDSTANDARD
    'libido_high', 'pain_ovulation',
    'energy_high', 'mood_happy'
];

// Perioden-Indikatoren
PERIOD_INDICATOR_SYMPTOMS = [
    'bleeding_spotting', 'bleeding_light', 'bleeding_heavy',
    'pain_cramps'
];
```

### 5.2 Symptom-Pattern-Learning

Der Algorithmus **lernt aus vergangenen Zyklen** wann welche Symptome auftreten:

```typescript
// calculations.ts, Zeile 422-503

function learnSymptomProfile(symptoms, cycles): PersonalSymptomProfile {
    // Für jeden abgeschlossenen Zyklus:
    for (let i = 0; i < sortedCycles.length - 1; i++) {
        const cycleStart = parseISO(sortedCycles[i].startDate);
        const nextCycleStart = parseISO(sortedCycles[i + 1].startDate);

        // Finde alle Symptome in diesem Zyklus
        const cycleSymptoms = symptoms.filter(s =>
            s.date >= cycleStart && s.date < nextCycleStart
        );

        // Berechne für jedes Symptom:
        // - Wann tritt es typischerweise auf? (Tage vor nächster Periode)
        // - Wie oft? (Frequenz)
        // - Wie stark? (Durchschnittliche Severity)
    }

    return {
        pmsSymptoms: [...],       // Typische PMS-Symptome
        ovulationSymptoms: [...], // Typische Eisprung-Symptome
        periodSymptoms: [...],    // Typische Perioden-Symptome
        totalCyclesAnalyzed: n
    };
}
```

**Beispiel gelerntes Muster:**
```
Symptom: pain_cramps
├── avgDaysBeforePeriod: 3.2 Tage
├── frequency: 0.85 (in 85% der Zyklen)
├── avgSeverity: 3.5
└── occurrences: 6 (aus 7 Zyklen)
```

### 5.3 Echtzeit-Signal-Analyse

```typescript
// calculations.ts, Zeile 509-615

function analyzeSymptomSignal(symptoms, cycles, predictedPeriodStart): SymptomSignal | null {
    // 1. Lerne persönliches Muster
    const profile = learnSymptomProfile(symptoms, cycles);

    // 2. Hole Symptome der letzten 7 Tage
    const recentSymptoms = symptoms.filter(s =>
        differenceInDays(today, s.date) <= 7
    );

    // 3. Vergleiche mit gelernten Mustern
    const matchedPmsSymptoms = recentSymptoms.filter(s =>
        profile.pmsSymptoms.some(p => p.symptomType === s.symptomType)
    );

    // 4. Berechne Anpassung
    if (matchedPmsSymptoms.length >= 2) {
        // Gewichteter Durchschnitt: Wann treten diese Symptome normalerweise auf?
        const weightedAvgDays = relevantPatterns.reduce(
            (sum, p) => sum + p.avgDaysBeforePeriod * p.frequency * p.occurrences, 0
        ) / totalWeight;

        // Anpassung = Erwartete Tage - Aktuelle Vorhersage
        const daysAdjustment = estimatedDaysUntil - daysUntilPeriod;

        return {
            type: 'pms_pattern_match',
            confidence: matchedPmsSymptoms.length >= 3 ? 'high' : 'medium',
            daysAdjustment: clamp(daysAdjustment, -5, 5),
            relevantSymptoms: [...],
            message: "3 deiner typischen PMS-Symptome erkannt",
            basedOnCycles: profile.totalCyclesAnalyzed
        };
    }

    return null;
}
```

### 5.4 Anpassungs-Logik

```typescript
// usePrediction.ts, Zeile 115-125

if (symptomSignal && symptomSignal.daysAdjustment !== 0) {
    nextPeriodStart = addDays(nextPeriodStart, symptomSignal.daysAdjustment);
    // Beispiel: ML sagt 15. März, aber PMS-Symptome deuten auf früher
    // → Anpassung um -2 Tage → Neue Vorhersage: 13. März
}
```

---

## 6. Konfidenzberechnung

### 6.1 Konfidenzintervall

Basiert auf der **Standardabweichung** der bisherigen Zyklen:

```typescript
// calculations.ts, Zeile 218-270

function getPredictionConfidence(cycles, count = 6): PredictionConfidence {
    // Berechne Standardabweichung
    const variance = lengths.reduce((sum, val) =>
        sum + Math.pow(val - mean, 2), 0
    ) / lengths.length;
    const stdDev = Math.sqrt(variance);

    // Konfidenzintervall (ca. 95%): ±1.5 * Standardabweichung
    const margin = Math.ceil(stdDev * 1.5);

    // Variationskoeffizient (CV) = stdDev / mean
    const cv = stdDev / mean;

    // Konfidenz-Level basierend auf CV
    if (cv < 0.05 && lengths.length >= 4) {
        level = 'high';    // Sehr regelmäßige Zyklen
    } else if (cv < 0.1 && lengths.length >= 3) {
        level = 'medium';  // Einigermaßen regelmäßig
    } else {
        level = 'low';     // Unregelmäßige Zyklen
    }

    return { low: -margin, high: margin, level };
}
```

### 6.2 Interpretation

| CV (Variationskoeffizient) | Konfidenz | Typisches Intervall |
|---------------------------|-----------|---------------------|
| < 5% | Hoch | ±1-2 Tage |
| 5-10% | Mittel | ±2-4 Tage |
| > 10% | Niedrig | ±4-7 Tage |

**Beispiel:**
```
Zyklen: [28, 29, 27, 28, 30, 28]
Mean: 28.3
StdDev: 0.94
CV: 3.3% → Hohe Konfidenz
Intervall: ±2 Tage (27.-30. Tag)
```

---

## 7. Datenfluss-Diagramm

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         usePrediction Hook                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  INPUT                                                                  │
│  ─────                                                                  │
│  cycles: Cycle[]     ───────────────────┐                               │
│  symptoms: Symptom[] ───────────────────┼──┐                            │
│                                         │  │                            │
│  SCHRITT 1: Basis-Vorhersage           │  │                            │
│  ───────────────────────────           │  │                            │
│                                         ▼  │                            │
│  ┌──────────────────────────────────────┐  │                            │
│  │ cycleLengths >= 7?                   │  │                            │
│  └──────────────────────────────────────┘  │                            │
│           │                 │              │                            │
│          JA                NEIN            │                            │
│           │                 │              │                            │
│           ▼                 ▼              │                            │
│  ┌─────────────────┐ ┌──────────────────┐  │                            │
│  │  ML-Predictor   │ │ cycleLengths >= 2?│  │                            │
│  │  (Neuronales    │ └──────────────────┘  │                            │
│  │   Netz)         │        │       │      │                            │
│  └────────┬────────┘       JA      NEIN    │                            │
│           │                 │       │      │                            │
│           │                 ▼       ▼      │                            │
│           │         ┌────────────┐ ┌────┐  │                            │
│           │         │ Statistik  │ │ 28 │  │                            │
│           │         │ (Gewichtet)│ │Tage│  │                            │
│           │         └─────┬──────┘ └──┬─┘  │                            │
│           │               │           │    │                            │
│           └───────────────┼───────────┘    │                            │
│                           │                │                            │
│                           ▼                │                            │
│                  predictedCycleLength      │                            │
│                           │                │                            │
│  SCHRITT 2: Zusatzberechnungen             │                            │
│  ──────────────────────────────            │                            │
│                           │                │                            │
│           ┌───────────────┼───────────────┐│                            │
│           ▼               ▼               ▼│                            │
│     ┌──────────┐   ┌───────────┐   ┌──────┐│                            │
│     │Konfidenz │   │Eisprung   │   │Trend ││                            │
│     │Intervall │   │+ Fertile  │   │      ││                            │
│     └────┬─────┘   │Window     │   └───┬──┘│                            │
│          │         └─────┬─────┘       │   │                            │
│          └───────────────┼─────────────┘   │                            │
│                          │                 │                            │
│                          ▼                 │                            │
│               BASIS-VORHERSAGE             │                            │
│                          │                 │                            │
│  SCHRITT 3: Symptom-Anpassung              │                            │
│  ─────────────────────────────             │                            │
│                          │◄────────────────┘                            │
│                          ▼                                              │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                    analyzeSymptomSignal()                         │  │
│  │                                                                   │  │
│  │  1. learnSymptomProfile()                                         │  │
│  │     ├── Analysiere vergangene Zyklen                              │  │
│  │     ├── Lerne wann Symptome auftreten                             │  │
│  │     └── Erstelle persönliches Profil                              │  │
│  │                                                                   │  │
│  │  2. Vergleiche aktuelle Symptome mit Profil                       │  │
│  │     ├── PMS-Muster erkannt?                                       │  │
│  │     ├── Eisprung-Anzeichen?                                       │  │
│  │     └── Perioden-Indikatoren?                                     │  │
│  │                                                                   │  │
│  │  3. Berechne Anpassung                                            │  │
│  │     └── daysAdjustment: -5 bis +5 Tage                            │  │
│  │                                                                   │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                          │                                              │
│                          ▼                                              │
│               ┌─────────────────────┐                                   │
│               │ nextPeriodStart +=  │                                   │
│               │ daysAdjustment      │                                   │
│               └─────────────────────┘                                   │
│                          │                                              │
│  OUTPUT                  ▼                                              │
│  ──────                                                                 │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ ExtendedPrediction {                                              │  │
│  │   nextPeriodStart: Date        // Vorhergesagter Perioden-Start   │  │
│  │   nextPeriodEnd: Date          // Vorhergesagtes Perioden-Ende    │  │
│  │   fertileWindowStart: Date     // Beginn fruchtbare Tage          │  │
│  │   fertileWindowEnd: Date       // Ende fruchtbare Tage            │  │
│  │   ovulationDate: Date          // Geschätzter Eisprung            │  │
│  │   confidence: {                                                   │  │
│  │     low: number,               // Untere Grenze (Tage)            │  │
│  │     high: number,              // Obere Grenze (Tage)             │  │
│  │     level: 'low'|'medium'|'high'                                  │  │
│  │   }                                                               │  │
│  │   trend: 'increasing'|'decreasing'|'stable'                       │  │
│  │   source: 'ml'|'statistical'|'default'                            │  │
│  │   estimatedLutealPhase: number                                    │  │
│  │   symptomSignal: SymptomSignal | null                             │  │
│  │ }                                                                 │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Zusammenfassung

### Stärken des Algorithmus

1. **Personalisiert**: Lernt aus individuellen Zyklusmustern
2. **Mehrschichtig**: Kombiniert ML, Statistik und Symptome
3. **Robust**: Fallback-Mechanismen bei wenig Daten
4. **Transparent**: Zeigt Konfidenz und Quelle der Vorhersage

### Limitationen

1. **Alter/BMI**: Verwendet Default-Werte (keine Eingabe)
2. **Mindestdaten**: Braucht 7+ Zyklen für ML-Vorhersagen
3. **Symptom-Learning**: Braucht 2+ analysierte Zyklen

### Genauigkeit (basierend auf FedCycle-Testset)

| Methode | MAE | ±3 Tage Genauigkeit |
|---------|-----|---------------------|
| Default (28 Tage) | ~4.5 Tage | ~45% |
| Statistik | ~2.5 Tage | ~65% |
| ML | ~2.1 Tage | ~75% |
| ML + Symptome | ~1.8 Tage* | ~80%* |

*Geschätzt, abhängig von Symptom-Tracking-Qualität
