# ML Model Training

This directory contains the training script for the cycle length prediction model.

## Requirements

- Python 3.9+ (tested with 3.14)
- The FedCycle dataset (`FedCycleData071012.xls`)

## Setup

1. Create a virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

2. Update the `DATASET_PATH` in `train_model.py` if needed.

3. Run the training script:
   ```bash
   python train_model.py
   ```

4. The trained model will be exported to `../public/model/`:
   - `model.json` - Model architecture and weights
   - `scaler.json` - Feature normalization parameters
   - `training_metrics.json` - Training evaluation metrics

## Model Details

- **Input Features** (13 total):
  - Last 6 cycle lengths
  - Statistical summaries (mean, std, min, max)
  - Period length
  - Age (default: 30)
  - BMI (default: 22)

- **Output**: Predicted next cycle length (days)

- **Architecture**: MLPRegressor with 2 hidden layers (32, 16 neurons), ReLU activation

- **Dataset**: FedCycle dataset (1665 cycles from 159 persons)

## Current Performance

- **MAE**: ~3.5 days
- **Within 2 days**: ~43%
- **Within 3 days**: ~58%

Note: Cycle length prediction is inherently limited by natural biological variability.
The model provides a personalized estimate based on past patterns.
