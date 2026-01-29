# Symptom-Kategorien: Biologische Relevanz

## Übersicht

Das System verwendet **9 Kategorien** mit **38 Symptomen**, die biologisch auf die verschiedenen Zyklusphasen abgestimmt sind.

---

## 1. Blutung (bleeding)

| Symptom | Typ | Algorithmus-Relevanz |
|---------|-----|---------------------|
| `bleeding_spotting` | Schmierblutung | **PERIODE-INDIKATOR** - Oft Vorbote der Periode |
| `bleeding_light` | Leichte Blutung | **PERIODE-INDIKATOR** |
| `bleeding_heavy` | Starke Blutung | **PERIODE-INDIKATOR** |

**Biologischer Hintergrund:**
- Schmierblutung 1-2 Tage vor Periode = klassisches Zeichen
- Tritt bei ~30% der Frauen auf

---

## 2. Schmerzen (pain)

| Symptom | Typ | Algorithmus-Relevanz |
|---------|-----|---------------------|
| `pain_cramps` | Krämpfe | **PMS + PERIODE** - Klassisches Anzeichen |
| `pain_pelvic` | Unterleibsschmerzen | **PMS** |
| `pain_back` | Rückenschmerzen | **PMS** |
| `pain_head` | Kopfschmerzen | **PMS** - Hormonell bedingt |
| `pain_ovulation` | Mittelschmerz | **EISPRUNG** - Direkter Indikator! |
| `pain_breast` | Brustspannen | **PMS** - Klassisch durch Progesteron |

**Biologischer Hintergrund:**
- **Mittelschmerz** = Schmerz beim Eisprung, sehr zuverlässig
- **Brustspannen** = Progesteron-Anstieg in Lutealphase
- Krämpfe durch Prostaglandine kurz vor/während Periode

---

## 3. Körperlich (physical)

| Symptom | Typ | Algorithmus-Relevanz |
|---------|-----|---------------------|
| `physical_bloating` | Blähbauch | **PMS** - Klassisch |
| `physical_nausea` | Übelkeit | **PMS** |
| `physical_acne` | Hautunreinheiten | **PMS** - Hormonell (Androgene) |
| `physical_digestion` | Verdauungsprobleme | Neutral |
| `physical_hot_flashes` | Hitzewallungen | **PMS** |
| `physical_chills` | Kältewallungen | **PMS** |
| `physical_water_retention` | Wassereinlagerungen | **PMS** - Klassisch! |
| `physical_dizzy` | Schwindel | **PMS** |

**Biologischer Hintergrund:**
- **Wassereinlagerungen** = Klassisches PMS durch Östrogen/Progesteron
- **Akne** = Androgen-Anstieg vor Periode
- Blähbauch durch Progesteron (verlangsamt Verdauung)

---

## 4. Stimmung (mood)

| Symptom | Typ | Algorithmus-Relevanz |
|---------|-----|---------------------|
| `mood_happy` | Glücklich | **EISPRUNG** - Östrogen-Peak |
| `mood_calm` | Ausgeglichen | **EISPRUNG** |
| `mood_sensitive` | Sensibel | **PMS** |
| `mood_sad` | Traurig | **PMS** |
| `mood_irritable` | Gereizt | **PMS** - Klassisch |
| `mood_anxious` | Ängstlich | **PMS** |

**Biologischer Hintergrund:**
- **Östrogen** (hoch um Eisprung) = Bessere Stimmung
- **Progesteron-Abfall** (vor Periode) = Stimmungstief, Reizbarkeit

---

## 5. Energie (energy)

| Symptom | Typ | Algorithmus-Relevanz |
|---------|-----|---------------------|
| `energy_high` | Viel Energie | **EISPRUNG** - Östrogen-Peak |
| `energy_low` | Wenig Energie | **PMS** - Klassisch |

**Biologischer Hintergrund:**
- Energie-Peak um Eisprung (biologisch sinnvoll für Fortpflanzung)
- Energie-Tief in Lutealphase durch Progesteron

---

## 6. Schlaf (sleep)

| Symptom | Typ | Algorithmus-Relevanz |
|---------|-----|---------------------|
| `sleep_good` | Gut geschlafen | Positiv |
| `sleep_poor` | Schlecht geschlafen | **PMS** |
| `sleep_insomnia` | Schlaflosigkeit | **PMS** - Häufig vor Periode |

**Biologischer Hintergrund:**
- Progesteron beeinflusst Körpertemperatur
- Erhöhte Temperatur in Lutealphase → Schlechterer Schlaf

---

## 7. Appetit (appetite)

| Symptom | Typ | Algorithmus-Relevanz |
|---------|-----|---------------------|
| `appetite_high` | Viel Appetit | **PMS** |
| `appetite_low` | Wenig Appetit | Neutral |
| `appetite_cravings` | Heißhunger | **PMS** - Klassisch! |

**Biologischer Hintergrund:**
- **Heißhunger** (v.a. auf Süßes/Kohlenhydrate) = Klassisches PMS
- Körper bereitet sich auf mögliche Schwangerschaft vor → Mehr Kalorien

---

## 8. Zervixschleim (cervical_mucus)

| Symptom | Typ | Algorithmus-Relevanz |
|---------|-----|---------------------|
| `cm_dry` | Trocken | Unfruchtbar |
| `cm_sticky` | Klebrig | Unfruchtbar |
| `cm_creamy` | Cremig | Übergang |
| `cm_watery` | Wässrig | **EISPRUNG** - Sehr fruchtbar |
| `cm_eggwhite` | Spinnbar | **EISPRUNG** - GOLDSTANDARD! |

**Biologischer Hintergrund:**
- **Spinnbarer Schleim** = Höchste Fruchtbarkeit, Eisprung steht bevor
- **Goldstandard** der natürlichen Familienplanung
- Östrogen macht Schleim dünnflüssig und spinnbar

### Zervixschleim-Zyklus:
```
Periode → Trocken → Klebrig → Cremig → Wässrig → SPINNBAR → Cremig → Trocken → Periode
                                                   ↑
                                               EISPRUNG
```

---

## 9. Libido

| Symptom | Typ | Algorithmus-Relevanz |
|---------|-----|---------------------|
| `libido_high` | Hohe Libido | **EISPRUNG** - Biologisch sinnvoll! |
| `libido_low` | Niedrige Libido | Lutealphase |

**Biologischer Hintergrund:**
- Libido-Peak um Eisprung = Evolutionär sinnvoll
- Testosteron + Östrogen Peak

---

## Algorithmus-Zuordnung

### PMS-Indikatoren (1-7 Tage vor Periode)

```typescript
PMS_INDICATOR_SYMPTOMS = [
    // Schmerzen
    'pain_cramps', 'pain_pelvic', 'pain_back', 'pain_head', 'pain_breast',

    // Körperlich
    'physical_bloating', 'physical_acne', 'physical_nausea',
    'physical_hot_flashes', 'physical_water_retention', 'physical_dizzy',

    // Stimmung
    'mood_sensitive', 'mood_sad', 'mood_irritable', 'mood_anxious',

    // Energie & Schlaf
    'energy_low', 'sleep_poor', 'sleep_insomnia',

    // Appetit
    'appetite_cravings', 'appetite_high'
];
```

### Eisprung-Indikatoren (12-18 Tage vor Periode)

```typescript
OVULATION_INDICATOR_SYMPTOMS = [
    // Zervixschleim (Goldstandard!)
    'cm_eggwhite', 'cm_watery',

    // Andere Indikatoren
    'libido_high', 'pain_ovulation',
    'energy_high', 'mood_happy'
];
```

### Perioden-Indikatoren

```typescript
PERIOD_INDICATOR_SYMPTOMS = [
    'bleeding_spotting', 'bleeding_light', 'bleeding_heavy',
    'pain_cramps'
];
```

---

## Hybrid-Algorithmus: Baseline + Lernen

Der Algorithmus verwendet einen **zweistufigen Ansatz**:

### Stufe 1: Baseline (sofort aktiv, ohne Lernen)

Wissenschaftlich validierte Indikatoren wirken **sofort** ohne vorherige Daten:

```typescript
// Fruchtbarkeitsindikatoren (Goldstandard der NFP)
BASELINE_FERTILITY_INDICATORS = [
  'cm_eggwhite',      // Spinnbarer Zervixschleim = höchste Fruchtbarkeit
  'cm_watery',        // Wässriger Schleim = hohe Fruchtbarkeit
  'pain_ovulation',   // Mittelschmerz = direkter Eisprung-Indikator
];

// Direkte Perioden-Vorboten
BASELINE_PERIOD_INDICATORS = [
  'bleeding_spotting',  // Schmierblutung oft 1-2 Tage vor Periode
];

// Typische PMS-Symptome (bei ≥2 Symptomen in später Lutealphase)
BASELINE_PMS_INDICATORS = [
  'pain_cramps', 'pain_breast', 'physical_bloating',
  'mood_irritable', 'appetite_cravings'
];
```

**Beispiel für neue Nutzerin (Tag 1):**
```
Nutzerin trägt "Spinnbarer Zervixschleim" ein
→ App zeigt SOFORT: "Fruchtbarer Zervixschleim erkannt -
   dies ist der zuverlässigste Fruchtbarkeitsindikator (Goldstandard der NFP)."
```

### Stufe 2: Personalisiertes Lernen (ab 2 Zyklen)

Nach ausreichend Daten **verbessert** der Algorithmus die Vorhersagen:

```
Beispiel nach 5 Zyklen:

Nutzerin A:
├── PMS beginnt typischerweise 5 Tage vor Periode
├── Hauptsymptome: Kopfschmerzen, Blähbauch, Heißhunger
└── Schmierblutung 1 Tag vor Periode
    → Vorhersage kann um bis zu ±5 Tage angepasst werden

Nutzerin B:
├── PMS beginnt typischerweise 3 Tage vor Periode
├── Hauptsymptome: Brustspannen, Stimmungsschwankungen
└── Keine Schmierblutung
    → Vorhersage basiert auf individuellen Mustern
```

---

## Symptom-Gewichtung

| Symptom-Typ | Gewichtung | Stufe | Grund |
|-------------|------------|-------|-------|
| `cm_eggwhite` | Sehr hoch | Baseline | Objektiv messbar, wissenschaftlich validiert |
| `cm_watery` | Hoch | Baseline | Objektiv messbar |
| `pain_ovulation` | Hoch | Baseline | Spezifisch für Eisprung |
| `bleeding_spotting` | Hoch | Baseline | Direkter Perioden-Vorbote |
| `pain_cramps` | Mittel | Baseline | Klassisches PMS |
| `pain_breast` | Mittel | Baseline | Progesteron-Indikator |
| `physical_bloating` | Mittel | Baseline | Häufiges PMS-Symptom |
| `mood_irritable` | Mittel | Lernen | Subjektiv, individuell |
| `appetite_cravings` | Mittel | Baseline | Klassisches PMS |

---

## Signal-Rückgabe

Der Algorithmus gibt ein `SymptomSignal` zurück mit:

| Feld | Beschreibung |
|------|-------------|
| `type` | `fertile_window`, `period_imminent`, `pms_pattern_match`, `ovulation_pattern_match` |
| `confidence` | `low`, `medium`, `high` |
| `daysAdjustment` | Anpassung der Vorhersage (-5 bis +5 Tage) |
| `basedOnCycles` | `0` = Baseline, `>0` = Anzahl gelernter Zyklen |
| `message` | Menschenlesbare Erklärung |

**Wichtig:** `basedOnCycles: 0` bedeutet, dass die Erkennung auf wissenschaftlichem Vorwissen basiert, nicht auf individuellen Daten.
