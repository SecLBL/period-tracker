#!/usr/bin/env python3
"""
Cycle Length Prediction Model Training Script

Trains a neural network on the FedCycle dataset to predict cycle lengths.
Uses scikit-learn MLPRegressor and exports weights as JSON for browser use.

Dataset: FedCycleData071012.xls (1665 cycles from 159 persons)
"""

import os
import sys
import json
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.neural_network import MLPRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error

# Configuration
DATASET_PATH = "/home/lbl/Desktop/Coding/Period Data/FedCycleData071012 (2).xls"
OUTPUT_DIR = "../public/model"
SEQUENCE_LENGTH = 6  # Number of previous cycles to use as features
RANDOM_STATE = 42


def load_and_preprocess_data(filepath: str) -> pd.DataFrame:
    """Load the FedCycle dataset and preprocess it."""
    print(f"Loading dataset from {filepath}...")

    # The file is actually CSV despite .xls extension
    df = pd.read_csv(filepath, encoding='utf-8-sig')

    print(f"Raw dataset shape: {df.shape}")
    print(f"Columns: {list(df.columns)}")
    print("\nFirst few rows:")
    print(df.head())

    return df


def prepare_features_per_person(person_df: pd.DataFrame, sequence_length: int = 6) -> tuple:
    """
    Prepare features for a single person's cycle history.
    """
    X_samples = []
    y_samples = []

    # Get cycle lengths (convert to numeric, coerce errors to NaN)
    cycle_lengths = pd.to_numeric(person_df['LengthofCycle'], errors='coerce').dropna().values

    if len(cycle_lengths) < sequence_length + 1:
        return np.array([]), np.array([])

    # Check for period lengths if available
    period_lengths = None
    if 'LengthofMenses' in person_df.columns:
        period_lengths = pd.to_numeric(person_df['LengthofMenses'], errors='coerce').dropna().values

    # Get optional features (convert to numeric)
    age = None
    if 'Age' in person_df.columns:
        age_val = pd.to_numeric(person_df['Age'].iloc[0], errors='coerce')
        if not pd.isna(age_val):
            age = float(age_val)

    bmi = None
    if 'BMI' in person_df.columns:
        bmi_val = pd.to_numeric(person_df['BMI'].iloc[0], errors='coerce')
        if not pd.isna(bmi_val):
            bmi = float(bmi_val)

    # Create sliding window samples
    for i in range(len(cycle_lengths) - sequence_length):
        prev_cycles = cycle_lengths[i:i + sequence_length].astype(float)
        target = float(cycle_lengths[i + sequence_length])

        # Skip invalid data
        if target < 15 or target > 60:
            continue
        if any(c < 15 or c > 60 for c in prev_cycles):
            continue

        # Build feature vector
        features = list(prev_cycles)
        features.append(float(np.mean(prev_cycles)))
        features.append(float(np.std(prev_cycles)))
        features.append(float(np.min(prev_cycles)))
        features.append(float(np.max(prev_cycles)))

        # Add period length
        if period_lengths is not None and len(period_lengths) > i + sequence_length:
            prev_periods = period_lengths[i:i + sequence_length].astype(float)
            # Filter out unreasonable values
            valid_periods = prev_periods[(prev_periods > 0) & (prev_periods < 15)]
            if len(valid_periods) > 0:
                features.append(float(np.mean(valid_periods)))
            else:
                features.append(5.0)
        else:
            features.append(5.0)

        features.append(age if age is not None else 30.0)
        features.append(bmi if bmi is not None else 22.0)

        X_samples.append(features)
        y_samples.append(target)

    return np.array(X_samples), np.array(y_samples)


def prepare_dataset(df: pd.DataFrame) -> tuple:
    """Prepare the full dataset from all persons."""
    X_all = []
    y_all = []

    # Find ID column
    id_column = None
    for col in ['ClientID', 'ID', 'Client', 'Person', 'Subject']:
        if col in df.columns:
            id_column = col
            break

    if id_column is None:
        for col in df.columns:
            if 'id' in col.lower() or 'client' in col.lower():
                id_column = col
                break

    if id_column is None:
        print("Warning: No ID column found. Treating entire dataset as one person.")
        X, y = prepare_features_per_person(df, SEQUENCE_LENGTH)
        return X, y

    print(f"Using '{id_column}' as person identifier")

    unique_persons = df[id_column].unique()
    print(f"Found {len(unique_persons)} unique persons")

    for person_id in unique_persons:
        person_df = df[df[id_column] == person_id].copy()
        if 'CycleNumber' in person_df.columns:
            person_df = person_df.sort_values('CycleNumber')

        X_person, y_person = prepare_features_per_person(person_df, SEQUENCE_LENGTH)

        if len(X_person) > 0:
            X_all.extend(X_person)
            y_all.extend(y_person)

    return np.array(X_all), np.array(y_all)


def export_model_weights(model: MLPRegressor, scaler: StandardScaler, output_dir: str, metrics: dict):
    """Export model weights and scaler as JSON for browser use."""
    os.makedirs(output_dir, exist_ok=True)

    # Extract weights and biases from MLPRegressor
    weights = []
    biases = []

    for i, (coef, intercept) in enumerate(zip(model.coefs_, model.intercepts_)):
        weights.append(coef.tolist())
        biases.append(intercept.tolist())

    # Model configuration
    model_config = {
        "architecture": {
            "input_size": model.n_features_in_,
            "hidden_layers": list(model.hidden_layer_sizes),
            "output_size": 1,
            "activation": model.activation
        },
        "weights": weights,
        "biases": biases
    }

    model_path = os.path.join(output_dir, 'model.json')
    with open(model_path, 'w') as f:
        json.dump(model_config, f, indent=2)
    print(f"Model saved to {model_path}")

    # Scaler parameters
    scaler_params = {
        'mean': scaler.mean_.tolist(),
        'scale': scaler.scale_.tolist(),
        'feature_names': [
            'cycle_1', 'cycle_2', 'cycle_3', 'cycle_4', 'cycle_5', 'cycle_6',
            'mean', 'std', 'min', 'max',
            'period_length', 'age', 'bmi'
        ]
    }

    scaler_path = os.path.join(output_dir, 'scaler.json')
    with open(scaler_path, 'w') as f:
        json.dump(scaler_params, f, indent=2)
    print(f"Scaler saved to {scaler_path}")

    # Save metrics
    metrics_path = os.path.join(output_dir, 'training_metrics.json')
    with open(metrics_path, 'w') as f:
        json.dump(metrics, f, indent=2)
    print(f"Metrics saved to {metrics_path}")


def main():
    """Main training pipeline."""
    print("=" * 60)
    print("CYCLE LENGTH PREDICTION MODEL TRAINING")
    print("=" * 60)

    if not os.path.exists(DATASET_PATH):
        print(f"Error: Dataset not found at {DATASET_PATH}")
        sys.exit(1)

    # Load data
    df = load_and_preprocess_data(DATASET_PATH)

    # Prepare features
    print("\nPreparing features...")
    X, y = prepare_dataset(df)

    if len(X) == 0:
        print("Error: No valid samples could be created from the dataset")
        sys.exit(1)

    print(f"Total samples: {len(X)}")
    print(f"Feature vector size: {X.shape[1]}")
    print(f"Target range: {y.min():.0f} - {y.max():.0f} days")
    print(f"Target mean: {y.mean():.1f} days")

    # Split data
    X_train, X_temp, y_train, y_temp = train_test_split(
        X, y, test_size=0.3, random_state=RANDOM_STATE
    )
    X_val, X_test, y_val, y_test = train_test_split(
        X_temp, y_temp, test_size=0.5, random_state=RANDOM_STATE
    )

    print(f"\nData split:")
    print(f"  Train: {len(X_train)} samples")
    print(f"  Validation: {len(X_val)} samples")
    print(f"  Test: {len(X_test)} samples")

    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_val_scaled = scaler.transform(X_val)
    X_test_scaled = scaler.transform(X_test)

    # Train model
    print("\nTraining model...")
    model = MLPRegressor(
        hidden_layer_sizes=(32, 16),
        activation='relu',
        solver='adam',
        alpha=0.01,  # L2 regularization
        learning_rate='adaptive',
        learning_rate_init=0.001,
        max_iter=500,
        early_stopping=True,
        validation_fraction=0.15,
        n_iter_no_change=20,
        random_state=RANDOM_STATE,
        verbose=True
    )

    model.fit(X_train_scaled, y_train)

    # Evaluate
    print("\n" + "=" * 50)
    print("TEST SET RESULTS")
    print("=" * 50)

    predictions = model.predict(X_test_scaled)
    mae = mean_absolute_error(y_test, predictions)
    mse = mean_squared_error(y_test, predictions)
    rmse = np.sqrt(mse)

    within_1_day = np.mean(np.abs(predictions - y_test) <= 1) * 100
    within_2_days = np.mean(np.abs(predictions - y_test) <= 2) * 100
    within_3_days = np.mean(np.abs(predictions - y_test) <= 3) * 100

    print(f"MAE: {mae:.2f} days")
    print(f"RMSE: {rmse:.2f} days")
    print(f"Within 1 day: {within_1_day:.1f}%")
    print(f"Within 2 days: {within_2_days:.1f}%")
    print(f"Within 3 days: {within_3_days:.1f}%")
    print("=" * 50)

    metrics = {
        'mae': float(mae),
        'mse': float(mse),
        'rmse': float(rmse),
        'within_1_day': float(within_1_day),
        'within_2_days': float(within_2_days),
        'within_3_days': float(within_3_days)
    }

    # Export model
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(script_dir, OUTPUT_DIR)
    export_model_weights(model, scaler, output_dir, metrics)

    print(f"\n{'=' * 60}")
    print("TRAINING COMPLETE")
    print(f"Model exported to: {output_dir}")
    print(f"{'=' * 60}")


if __name__ == '__main__':
    main()
