/**
 * ML-based cycle length prediction using a simple neural network.
 *
 * Uses pre-trained weights exported from scikit-learn MLPRegressor.
 * No TensorFlow.js dependency - pure JavaScript implementation.
 */

import type { Cycle, ScalerParams } from '../types';
import {
  getCycleLengths,
  getAverageCycleLength,
  getAveragePeriodLength,
  getCycleVariance
} from './calculations';

// Model architecture type
interface ModelConfig {
  architecture: {
    input_size: number;
    hidden_layers: number[];
    output_size: number;
    activation: string;
  };
  weights: number[][][];
  biases: number[][];
}

// Model state
let modelConfig: ModelConfig | null = null;
let scaler: ScalerParams | null = null;
let modelLoading: Promise<void> | null = null;
let modelLoadError: Error | null = null;

// Model paths
const MODEL_PATH = '/model/model.json';
const SCALER_PATH = '/model/scaler.json';

// Feature configuration (must match training script)
const SEQUENCE_LENGTH = 6;
const DEFAULT_AGE = 30;
const DEFAULT_BMI = 22;

/**
 * ReLU activation function.
 */
function relu(x: number): number {
  return Math.max(0, x);
}

/**
 * Apply activation function to array.
 */
function applyActivation(values: number[], activation: string): number[] {
  if (activation === 'relu') {
    return values.map(relu);
  }
  // Identity for output layer or unsupported activation
  return values;
}

/**
 * Matrix-vector multiplication: result = weights^T * input + bias
 */
function forwardLayer(input: number[], weights: number[][], bias: number[]): number[] {
  const outputSize = bias.length;
  const result: number[] = new Array(outputSize).fill(0);

  for (let j = 0; j < outputSize; j++) {
    let sum = bias[j];
    for (let i = 0; i < input.length; i++) {
      sum += input[i] * weights[i][j];
    }
    result[j] = sum;
  }

  return result;
}

/**
 * Forward pass through the neural network.
 */
function predict(input: number[]): number {
  if (!modelConfig) {
    throw new Error('Model not loaded');
  }

  let current = input;

  // Process hidden layers with activation
  for (let layer = 0; layer < modelConfig.weights.length - 1; layer++) {
    current = forwardLayer(current, modelConfig.weights[layer], modelConfig.biases[layer]);
    current = applyActivation(current, modelConfig.architecture.activation);
  }

  // Output layer (no activation for regression)
  const lastLayer = modelConfig.weights.length - 1;
  current = forwardLayer(current, modelConfig.weights[lastLayer], modelConfig.biases[lastLayer]);

  return current[0];
}

/**
 * Load the model weights and scaler parameters.
 */
export async function loadModel(): Promise<void> {
  if (modelLoading) {
    return modelLoading;
  }

  if (modelConfig && scaler) {
    return;
  }

  if (modelLoadError) {
    throw modelLoadError;
  }

  modelLoading = (async () => {
    try {
      console.log('[ML] Loading cycle prediction model...');

      const [modelResponse, scalerResponse] = await Promise.all([
        fetch(MODEL_PATH).then(r => {
          if (!r.ok) throw new Error(`Failed to load model: ${r.status}`);
          return r.json();
        }),
        fetch(SCALER_PATH).then(r => {
          if (!r.ok) throw new Error(`Failed to load scaler: ${r.status}`);
          return r.json();
        })
      ]);

      modelConfig = modelResponse as ModelConfig;
      scaler = scalerResponse as ScalerParams;

      console.log('[ML] Model loaded successfully');
      console.log('[ML] Architecture:', modelConfig.architecture);

    } catch (error) {
      modelLoadError = error instanceof Error ? error : new Error(String(error));
      console.warn('[ML] Failed to load model:', modelLoadError.message);
      throw modelLoadError;
    } finally {
      modelLoading = null;
    }
  })();

  return modelLoading;
}

/**
 * Check if the ML model is loaded and ready.
 */
export function isModelReady(): boolean {
  return modelConfig !== null && scaler !== null;
}

/**
 * Check if model loading failed.
 */
export function hasModelError(): boolean {
  return modelLoadError !== null;
}

/**
 * Reset model state (useful for retrying after error).
 */
export function resetModel(): void {
  modelConfig = null;
  scaler = null;
  modelLoading = null;
  modelLoadError = null;
}

/**
 * Prepare features from cycle history for the ML model.
 */
export function prepareFeatures(cycles: Cycle[]): number[] | null {
  const cycleLengths = getCycleLengths(cycles, SEQUENCE_LENGTH);

  if (cycleLengths.length < SEQUENCE_LENGTH) {
    return null;
  }

  const recentCycles = cycleLengths.slice(0, SEQUENCE_LENGTH);
  while (recentCycles.length < SEQUENCE_LENGTH) {
    recentCycles.push(getAverageCycleLength(cycles));
  }

  const mean = recentCycles.reduce((a, b) => a + b, 0) / recentCycles.length;
  const std = getCycleVariance(cycles, SEQUENCE_LENGTH);
  const min = Math.min(...recentCycles);
  const max = Math.max(...recentCycles);
  const periodLength = getAveragePeriodLength(cycles);

  const features = [
    ...recentCycles,
    mean,
    std,
    min,
    max,
    periodLength,
    DEFAULT_AGE,
    DEFAULT_BMI
  ];

  return features;
}

/**
 * Normalize features using the scaler parameters.
 */
function normalizeFeatures(features: number[]): number[] {
  if (!scaler) {
    throw new Error('Scaler not loaded');
  }

  return features.map((val, i) => {
    const mean = scaler!.mean[i];
    const scale = scaler!.scale[i];
    return (val - mean) / scale;
  });
}

/**
 * Make a cycle length prediction using the ML model.
 */
export async function predictWithML(cycles: Cycle[]): Promise<number | null> {
  try {
    if (!isModelReady()) {
      await loadModel();
    }

    if (!modelConfig || !scaler) {
      return null;
    }

    const features = prepareFeatures(cycles);
    if (!features) {
      console.log('[ML] Not enough cycles for ML prediction');
      return null;
    }

    const normalizedFeatures = normalizeFeatures(features);
    const prediction = predict(normalizedFeatures);
    const predictedLength = Math.round(prediction);

    if (predictedLength < 18 || predictedLength > 45) {
      console.warn('[ML] Prediction outside reasonable range:', predictedLength);
      return null;
    }

    console.log('[ML] Predicted cycle length:', predictedLength);
    return predictedLength;

  } catch (error) {
    console.error('[ML] Prediction error:', error);
    return null;
  }
}

/**
 * Get minimum cycles needed for ML prediction.
 */
export function getMinCyclesForML(): number {
  return SEQUENCE_LENGTH + 1;
}
