import * as tf from '@tensorflow/tfjs';

/**
 * Build MLP (Multi-Layer Perceptron) Model for Time Series Forecasting
 * Architecture:
 * - Input: Flattened sequence [lookback * features]
 * - Dense Layer 1: 152 units, Tanh activation, dropout 0.2
 * - Dense Layer 2: 76 units, Tanh activation, dropout 0.2
 * - Dense Output: 1 unit (emigrants prediction)
 * - Loss: MSE (Mean Squared Error)
 * - Optimizer: Adam (lr=0.001)
 * - Metrics: MAE (Mean Absolute Error)
 */
export function buildMLPModel(lookback = 4, features = 2) {
  const model = tf.sequential();

  const inputSize = lookback * features;

  // First Dense layer
  model.add(tf.layers.dense({
    units: 200,
    activation: 'tanh',
    inputShape: [inputSize]
  }));

  model.add(tf.layers.dropout({ rate: 0.2 }));

  // Second Dense layer
  model.add(tf.layers.dense({
    units: 100,
    activation: 'tanh'
  }));

  model.add(tf.layers.dropout({ rate: 0.2 }));

  // Output layer
  model.add(tf.layers.dense({
    units: 1
  }));

  // Compile model
  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'meanSquaredError',
    metrics: ['mae']
  });

  return model;
}

/**
 * Flatten sequences for MLP input
 * MLP expects 2D input: [samples, features]
 * We flatten the 3D sequences to 2D
 */
function flattenSequences(X) {
  return X.map(seq => seq.flat());
}

/**
 * Train MLP Model
 * @param {tf.Sequential} model - The MLP model
 * @param {Array} X - Input sequences (will be flattened)
 * @param {Array} y - Target values
 * @param {Function} onEpochEnd - Callback for epoch progress
 * @param {number} epochs - Number of training epochs (default: 100)
 * @param {number} validationSplit - Validation split ratio (default: 0.2)
 */
export async function trainMLPModel(model, X, y, onEpochEnd, epochs = 100, validationSplit = 0.2) {
  // Flatten sequences for MLP
  const flatX = flattenSequences(X);

  // Validate input
  if (!Array.isArray(flatX) || flatX.length === 0) throw new Error('No training sequences (X) provided. Ensure your dataset is larger than the lookback window.');
  if (!Array.isArray(y) || y.length === 0) throw new Error('No target values (y) provided. Ensure your dataset is larger than the lookback window.');

  // Determine expected input size (lookback * features). Prefer model's input shape when available.
  let inputSize = null;
  try {
    inputSize = model?.inputs?.[0]?.shape?.[1] ?? null;
  } catch (e) {
    inputSize = null;
  }
  if (!inputSize) {
    inputSize = flatX[0].length;
  }

  // Convert to tensors (provide explicit shape to avoid tensor2d flat-array errors)
  const xs = tf.tensor2d(flatX, [flatX.length, inputSize]);
  const ys = tf.tensor2d(y, [y.length, 1]);

  // Determine batch size
  const batchSize = Math.min(32, X.length);

  // Train model
  const history = await model.fit(xs, ys, {
    epochs,
    batchSize,
    validationSplit,
    callbacks: {
      onEpochEnd: async (epoch, logs) => {
        if (onEpochEnd && epoch % 20 === 0) {
          onEpochEnd(epoch, logs);
        }
      }
    }
  });

  // Cleanup tensors
  xs.dispose();
  ys.dispose();

  return history;
}

/**
 * Make predictions using MLP model
 */
export async function predictMLP(model, X) {
  const flatX = flattenSequences(X);
  if (!Array.isArray(flatX) || flatX.length === 0) return [];

  // Determine expected input size (prefer model input shape)
  let inputSize = null;
  try {
    inputSize = model?.inputs?.[0]?.shape?.[1] ?? null;
  } catch (e) {
    inputSize = null;
  }
  if (!inputSize) inputSize = flatX[0].length;

  const xs = tf.tensor2d(flatX, [flatX.length, inputSize]);
  const predictions = model.predict(xs);
  const result = await predictions.array();

  xs.dispose();
  predictions.dispose();

  return result.map(r => r[0]);
}

/**
 * Save MLP model to IndexedDB
 */
export async function saveMLPModel(
  totalModel,
  totalMetadata,
  maleModel,
  maleMetadata,
  femaleModel,
  femaleMetadata
) {
  // Persist each model separately so they can be restored for forecasting
  await totalModel.save('indexeddb://emigrants-mlp-model-total');
  localStorage.setItem('mlp-metadata-total', JSON.stringify(totalMetadata));

  if (maleModel && maleMetadata) {
    await maleModel.save('indexeddb://emigrants-mlp-model-male');
    localStorage.setItem('mlp-metadata-male', JSON.stringify(maleMetadata));
  }

  if (femaleModel && femaleMetadata) {
    await femaleModel.save('indexeddb://emigrants-mlp-model-female');
    localStorage.setItem('mlp-metadata-female', JSON.stringify(femaleMetadata));
  }
}

/**
 * Load MLP model from IndexedDB
 */
export async function loadMLPModel() {
  try {
    const [model, maleModel, femaleModel] = await Promise.all([
      tf.loadLayersModel('indexeddb://emigrants-mlp-model-total'),
      tf.loadLayersModel('indexeddb://emigrants-mlp-model-male').catch(() => null),
      tf.loadLayersModel('indexeddb://emigrants-mlp-model-female').catch(() => null)
    ]);

    const metadata = JSON.parse(localStorage.getItem('mlp-metadata-total'));
    const maleMetadata = JSON.parse(localStorage.getItem('mlp-metadata-male'));
    const femaleMetadata = JSON.parse(localStorage.getItem('mlp-metadata-female'));

    return {
      model,
      metadata,
      maleModel: maleModel || null,
      maleMetadata: maleMetadata || null,
      femaleModel: femaleModel || null,
      femaleMetadata: femaleMetadata || null
    };
  } catch (error) {
    console.error('Error loading MLP model:', error);
    return null;
  }
}

/**
 * Delete MLP model from IndexedDB
 */
export async function deleteMLPModel() {
  try {
    await Promise.all([
      tf.io.removeModel('indexeddb://emigrants-mlp-model-total').catch(() => {}),
      tf.io.removeModel('indexeddb://emigrants-mlp-model-male').catch(() => {}),
      tf.io.removeModel('indexeddb://emigrants-mlp-model-female').catch(() => {})
    ]);
    localStorage.removeItem('mlp-metadata-total');
    localStorage.removeItem('mlp-metadata-male');
    localStorage.removeItem('mlp-metadata-female');
    return true;
  } catch (error) {
    console.error('Error deleting MLP model:', error);
    return false;
  }
}

/**
 * Download MLP model files
 */
export async function downloadMLPModel(model, metadata) {
  // Save model to downloads
  await model.save('downloads://emigrants-mlp-model');

  // Download metadata
  const metadataBlob = new Blob([JSON.stringify(metadata, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(metadataBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'mlp-metadata.json';
  a.click();
  URL.revokeObjectURL(url);
}
