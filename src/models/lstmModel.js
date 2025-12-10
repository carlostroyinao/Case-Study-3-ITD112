import * as tf from '@tensorflow/tfjs';

/**
 * Build LSTM Model for Time Series Forecasting
 * Architecture:
 * - Input: [lookback, features] e.g., [8, 2] for 8 years × 2 features
 * - LSTM Layer 1: 80 units with dropout 0.1
 * - LSTM Layer 2: 40 units with dropout 0.1
 * - Dense Output: 1 unit (emigrants prediction)
 * - Loss: MSE (Mean Squared Error)
 * - Optimizer: Adam (lr=0.001)
 * - Metrics: MAE (Mean Absolute Error)
 */
export function buildLSTMModel(lookback = 6, features = 2) {
  const model = tf.sequential();

  // First LSTM layer
  model.add(tf.layers.lstm({
    units: 50,
    returnSequences: true,
    inputShape: [lookback, features],
    dropout: 0
  }));

  // Second LSTM layer
  model.add(tf.layers.lstm({
    units: 50,
    dropout: 0
  }));

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
 * Train LSTM Model
 * @param {tf.Sequential} model - The LSTM model
 * @param {Array} X - Input sequences
 * @param {Array} y - Target values
 * @param {Function} onEpochEnd - Callback for epoch progress
 * @param {number} epochs - Number of training epochs (default: 100)
 * @param {number} validationSplit - Validation split ratio (default: 0.2)
 */
export async function trainLSTMModel(model, X, y, onEpochEnd, epochs = 100, validationSplit = 0.2) {
  // Validate input
  if (!Array.isArray(X) || X.length === 0) throw new Error('No training sequences (X) provided. Ensure your dataset is larger than the lookback window.');
  if (!Array.isArray(y) || y.length === 0) throw new Error('No target values (y) provided. Ensure your dataset is larger than the lookback window.');

  // Convert to tensors (ensure correct shapes)
  // X should be an array of shape [samples, lookback, features]
  const samples = Array.isArray(X) ? X.length : 0;
  const lookback = samples > 0 && Array.isArray(X[0]) ? X[0].length : 0;
  const features = lookback > 0 && Array.isArray(X[0][0]) ? X[0][0].length : 0;

  if (!samples || !lookback || !features) {
    throw new Error(`Invalid training sequences (X) shape. Expected [samples, lookback, features]. Got samples=${samples}, lookback=${lookback}, features=${features}`);
  }

  const xs = tf.tensor3d(X, [samples, lookback, features]);
  // y should be a flat array of numbers -> make explicit 2D shape [samples, 1]
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
 * Make predictions using LSTM model
 */
export async function predictLSTM(model, X) {
  if (!Array.isArray(X) || X.length === 0) return [];

  // Determine samples/lookback/features for tensor creation
  const samples = Array.isArray(X) ? X.length : 0;
  const lookback = samples > 0 && Array.isArray(X[0]) ? X[0].length : 0;
  const features = lookback > 0 && Array.isArray(X[0][0]) ? X[0][0].length : 0;

  if (!samples || !lookback || !features) {
    throw new Error(`Invalid prediction sequences (X) shape. Expected [samples, lookback, features]. Got samples=${samples}, lookback=${lookback}, features=${features}`);
  }

  const xs = tf.tensor3d(X, [samples, lookback, features]);
  const predictions = model.predict(xs);
  const result = await predictions.array();

  xs.dispose();
  predictions.dispose();

  return result.map(r => r[0]);
}

/**
 * Save LSTM model to IndexedDB
 */
export async function saveLSTMModel(
  totalModel,
  totalMetadata,
  maleModel,
  maleMetadata,
  femaleModel,
  femaleMetadata
) {
  // Persist each model separately so they can be restored for forecasting
  await totalModel.save('indexeddb://emigrants-lstm-model-total');
  localStorage.setItem('lstm-metadata-total', JSON.stringify(totalMetadata));

  if (maleModel && maleMetadata) {
    await maleModel.save('indexeddb://emigrants-lstm-model-male');
    localStorage.setItem('lstm-metadata-male', JSON.stringify(maleMetadata));
  }

  if (femaleModel && femaleMetadata) {
    await femaleModel.save('indexeddb://emigrants-lstm-model-female');
    localStorage.setItem('lstm-metadata-female', JSON.stringify(femaleMetadata));
  }
}

/**
 * Load LSTM model from IndexedDB
 */
export async function loadLSTMModel() {
  try {
    const [model, maleModel, femaleModel] = await Promise.all([
      tf.loadLayersModel('indexeddb://emigrants-lstm-model-total'),
      tf.loadLayersModel('indexeddb://emigrants-lstm-model-male').catch(() => null),
      tf.loadLayersModel('indexeddb://emigrants-lstm-model-female').catch(() => null)
    ]);

    const metadata = JSON.parse(localStorage.getItem('lstm-metadata-total'));
    const maleMetadata = JSON.parse(localStorage.getItem('lstm-metadata-male'));
    const femaleMetadata = JSON.parse(localStorage.getItem('lstm-metadata-female'));

    return {
      model,
      metadata,
      maleModel: maleModel || null,
      maleMetadata: maleMetadata || null,
      femaleModel: femaleModel || null,
      femaleMetadata: femaleMetadata || null
    };
  } catch (error) {
    console.error('Error loading LSTM model:', error);
    return null;
  }
}

/**
 * Delete LSTM model from IndexedDB
 */
export async function deleteLSTMModel() {
  try {
    await Promise.all([
      tf.io.removeModel('indexeddb://emigrants-lstm-model-total').catch(() => {}),
      tf.io.removeModel('indexeddb://emigrants-lstm-model-male').catch(() => {}),
      tf.io.removeModel('indexeddb://emigrants-lstm-model-female').catch(() => {})
    ]);
    localStorage.removeItem('lstm-metadata-total');
    localStorage.removeItem('lstm-metadata-male');
    localStorage.removeItem('lstm-metadata-female');
    return true;
  } catch (error) {
    console.error('Error deleting LSTM model:', error);
    return false;
  }
}

/**
 * Download LSTM model files
 */
export async function downloadLSTMModel(model, metadata) {
  // Save model to downloads
  await model.save('downloads://emigrants-lstm-model');

  // Download metadata
  const metadataBlob = new Blob([JSON.stringify(metadata, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(metadataBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'lstm-metadata.json';
  a.click();
  URL.revokeObjectURL(url);
}
