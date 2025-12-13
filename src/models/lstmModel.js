import * as tf from '@tensorflow/tfjs';

/**
 * LSTM Model for Sex Data Forecasting
 * Predicts male and female emigrants (2 outputs)
 */

// ---------------------- Model builder & train/predict ----------------------

export function buildSexLSTMModel(lookback = 3, features = 2) {
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

  // Output layer - predicts 2 values: male, female
  model.add(tf.layers.dense({
    units: 2
  }));

  // Compile model
  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'meanSquaredError',
    metrics: ['mae']
  });

  console.log('Built LSTM model for sex data:', { lookback, features, outputs: 2 });
  return model;
}

/**
 * Train LSTM Model for sex data
 */
export async function trainSexLSTMModel(model, X, y, onEpochEnd, epochs = 100, validationSplit = 0.2) {
  try {
    console.log('Training LSTM model...');
    console.log('Input shape:', `[${X.length}, ${X[0]?.length || 0}, ${X[0]?.[0]?.length || 0}]`);
    console.log('Output shape:', `[${y.length}, ${y[0]?.length || 1}]`);

    // Convert to tensors
    const xs = tf.tensor3d(X);  // [samples, lookback, features]
    const ys = tf.tensor2d(y);  // [samples, 2] (male, female)

    // Determine batch size
    const batchSize = Math.min(32, X.length);

    // Train model
    const history = await model.fit(xs, ys, {
      epochs,
      batchSize,
      validationSplit,
      callbacks: {
        onEpochEnd: async (epoch, logs) => {
          if (onEpochEnd) {
            onEpochEnd(epoch, logs);
          }
        }
      },
      verbose: 0
    });

    
    xs.dispose();
    ys.dispose();

    console.log('LSTM training completed');
    return history;
  } catch (error) {
    console.error('LSTM training error:', error);
    throw error;
  }
}

/**
 * Make predictions using LSTM model
 */
export async function predictSexLSTM(model, X) {
  try {
    const xs = tf.tensor3d(X);
    const predictions = model.predict(xs);
    const result = await predictions.array();

    xs.dispose();
    if (predictions.dispose) predictions.dispose();

    // Returns array of [male, female] predictions
    return result;
  } catch (error) {
    console.error('LSTM prediction error:', error);
    throw error;
  }
}

// ---------------------- Save / Load / Delete / Download ----------------------

/**
 * Save LSTM model to IndexedDB and persist metadata to localStorage
 */
export async function saveSexLSTMModel(model, metadata) {
  try {
    await model.save('indexeddb://sex-lstm-model');
    // Ensure metadata is a plain object and stringify safely
    localStorage.setItem('sex-lstm-metadata', JSON.stringify(metadata || {}));
    console.log('Model and metadata saved to IndexedDB/localStorage');
  } catch (err) {
    console.error('Error saving model to IndexedDB:', err);
    throw err;
  }
}

/**
 * Load LSTM model from IndexedDB (with backward compatibility)
 */
export async function loadSexLSTMModel() {
  try {
    // Try to load the model from IndexedDB
    const model = await tf.loadLayersModel('indexeddb://sex-lstm-model');
    
    // Try to load metadata
    const metadataRaw = localStorage.getItem('sex-lstm-metadata');
    let metadata = metadataRaw ? JSON.parse(metadataRaw) : null;
    
    // If no metadata in localStorage, check if it's stored in a different format
    if (!metadata) {
      // Try to get from IndexedDB as backup
      try {
        const db = await openIDB();
        const stored = await getFromIDB(db, 'sex-lstm-combined');
        if (stored) {
          metadata = stored.metadata;
        }
      } catch (e) {
        console.log('No combined model found in IndexedDB');
      }
    }
    
    // Validate metadata
    const validated = validateSexMetadata(metadata);
    
    return { model, metadata: validated };
  } catch (error) {
    console.error('Error loading sex LSTM model:', error);
    return null;
  }
}

// Helper functions for IndexedDB (optional - for backward compatibility)
async function openIDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('TensorFlowJS', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('models_store')) {
        db.createObjectStore('models_store');
      }
    };
  });
}

async function getFromIDB(db, key) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['models_store'], 'readonly');
    const store = transaction.objectStore('models_store');
    const request = store.get(key);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

/**
 * Delete LSTM model from IndexedDB
 */
export async function deleteSexLSTMModel() {
  try {
    await tf.io.removeModel('indexeddb://sex-lstm-model');
    localStorage.removeItem('sex-lstm-metadata');
    console.log('Deleted sex LSTM model and metadata');
    return true;
  } catch (error) {
    console.error('Error deleting sex LSTM model:', error);
    return false;
  }
}

/**
 * Download LSTM model files (weights + json) and metadata (as .json)
 */
export async function downloadSexLSTMModel(model, metadata) {
  try {
    // 1. Get model artifacts
    const modelArtifacts = await model.save(tf.io.withSaveHandler(async (artifacts) => {
      return artifacts;
    }));
    
    // 2. Convert weight data to base64 for embedding in JSON
    let weightsBase64 = null;
    if (modelArtifacts.weightData) {
      // Convert ArrayBuffer to Base64
      weightsBase64 = arrayBufferToBase64(modelArtifacts.weightData);
    }
    
    // 3. Create a single JSON object with everything
    const combinedModel = {
      // Model info
      modelType: 'LSTM',
      version: '1.0',
      exportDate: new Date().toISOString(),
      
      // Model architecture
      modelTopology: modelArtifacts.modelTopology,
      format: modelArtifacts.format || 'layers-model',
      
      // Weights (embedded as base64)
      weightsBase64: weightsBase64,
      weightSpecs: modelArtifacts.weightSpecs || [],
      
      // Metadata
      metadata: {
        lookback: metadata.lookback || 3,
        features: metadata.features || ['male', 'female'],
        targets: metadata.targets || ['male', 'female'],
        mins: metadata.mins || { male: 0, female: 0 },
        maxs: metadata.maxs || { male: 1, female: 1 },
        lastYear: metadata.lastYear || new Date().getFullYear(),
        lastData: metadata.lastData || [],
        metrics: metadata.metrics || {
          male: { mae: 0, rmse: 0, mape: 0, accuracy: 0 },
          female: { mae: 0, rmse: 0, mape: 0, accuracy: 0 },
          total: { mae: 0, rmse: 0, mape: 0, accuracy: 0 }
        },
        trainedAt: metadata.trainedAt || new Date().toISOString()
      }
    };
    
    // 4. Download as single JSON file
    const blob = new Blob(
      [JSON.stringify(combinedModel, null, 2)],
      { type: 'application/json' }
    );
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sex-lstm-model-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    
    console.log('Model downloaded as single JSON file');
    alert('Model downloaded as single .json file!');
  } catch (err) {
    console.error('Error downloading model:', err);
    throw err;
  }
}

/**
 * Convert ArrayBuffer to Base64 string
 */
function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert Base64 string to ArrayBuffer
 */
function base64ToArrayBuffer(base64) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// ---------------------- Metadata validation / completion ----------------------

/**
 * Validate and complete metadata structure
 * - If lastData missing or too short, synthesize a safe seed using mids of mins/maxs
 * - Ensure numbers are numbers, arrays are arrays, metrics present
 *
 * @param {object} metadata - incoming metadata (may be null)
 * @param {number} lookback - how many timesteps the model expects (default 3)
 * @param {Array} featureNames - array of feature names expected (default ['male','female'])
 * @returns {object} validated and completed metadata
 */
export function validateSexMetadata(metadata = {}, lookback = 3, featureNames = ['male', 'female']) {
  try {
    const nowYear = new Date().getFullYear();

    // Normalize basic fields
    const modelType = metadata.modelType || 'LSTM';
    const metaLookback = Number(metadata.lookback) || lookback;
    const features = Array.isArray(metadata.features) && metadata.features.length > 0 ? metadata.features : featureNames;
    const targets = Array.isArray(metadata.targets) && metadata.targets.length > 0 ? metadata.targets : featureNames;

    // Ensure mins/maxs have numeric entries for each feature
    const mins = {};
    const maxs = {};
    features.forEach((f) => {
      const rawMin = metadata.mins?.[f];
      const rawMax = metadata.maxs?.[f];
      const parsedMin = (rawMin === undefined || rawMin === null) ? 0 : Number(rawMin);
      const parsedMax = (rawMax === undefined || rawMax === null) ? (parsedMin + 1) : Number(rawMax);

      // If parsedMax equals parsedMin, expand range by +1 to avoid division by zero
      if (Number.isNaN(parsedMin) || Number.isNaN(parsedMax) || parsedMax === parsedMin) {
        mins[f] = 0;
        maxs[f] = parsedMin === 0 ? 1 : parsedMin + 1;
      } else {
        mins[f] = parsedMin;
        maxs[f] = parsedMax;
      }
    });

    // lastYear fallback
    const lastYear = Number(metadata.lastYear) || nowYear;

    // lastData: check that it is an array of objects with numeric feature values
    let lastData = Array.isArray(metadata.lastData) ? metadata.lastData.slice() : [];

    // Normalize lastData entries: ensure each entry has numeric values for features and a year if possible
    lastData = lastData.map((entry, idx) => {
      const safeEntry = {};
      features.forEach((f) => {
        const raw = entry?.[f];
        safeEntry[f] = (raw === undefined || raw === null) ? null : Number(raw);
        if (Number.isNaN(safeEntry[f])) safeEntry[f] = null;
      });
      // year: preserve if present, else compute relative year
      safeEntry.year = entry?.year ? (Number(entry.year) || null) : (lastYear - (lastData.length - idx - 1));
      return safeEntry;
    });

    // If lastData is missing or shorter than lookback, synthesize seed values using (min+max)/2
    if (!Array.isArray(lastData) || lastData.length < metaLookback) {
      const synthesized = [];
      for (let i = 0; i < metaLookback; i++) {
        const row = { year: lastYear - (metaLookback - i - 1) };
        features.forEach((f) => {
          const mid = (mins[f] + maxs[f]) / 2;
          row[f] = Number.isFinite(mid) ? mid : 0;
        });
        synthesized.push(row);
      }
      console.warn('Metadata lastData missing or short — synthesizing seed lastData for forecasting using midpoints of mins/maxs.', { synthesized });
      lastData = synthesized;
    } else {
      // If there are nulls in lastData for features, replace them with midpoint
      lastData = lastData.map((row, idx) => {
        const newRow = { year: row.year || (lastYear - (lastData.length - idx - 1)) };
        features.forEach((f) => {
          if (row[f] === null || row[f] === undefined) {
            newRow[f] = (mins[f] + maxs[f]) / 2;
          } else {
            newRow[f] = Number(row[f]);
            if (Number.isNaN(newRow[f])) newRow[f] = (mins[f] + maxs[f]) / 2;
          }
        });
        return newRow;
      });
    }

    // Ensure metrics exist with safe numeric defaults
    const safeMetrics = metadata.metrics || {
      male: { mae: 0, rmse: 0, mape: 0, accuracy: 0 },
      female: { mae: 0, rmse: 0, mape: 0, accuracy: 0 },
      total: { mae: 0, rmse: 0, mape: 0, accuracy: 0 }
    };

    // Put it together
    const completed = {
      modelType,
      lookback: metaLookback,
      features,
      targets,
      mins,
      maxs,
      lastYear,
      lastData,
      metrics: safeMetrics,
      trainedAt: metadata.trainedAt || new Date().toISOString()
    };

    return completed;
  } catch (err) {
    console.error('validateSexMetadata error:', err);
    // Fallback minimal metadata
    const fallback = {
      modelType: 'LSTM',
      lookback,
      features: ['male', 'female'],
      targets: ['male', 'female'],
      mins: { male: 0, female: 0 },
      maxs: { male: 1, female: 1 },
      lastYear: new Date().getFullYear(),
      lastData: Array.from({ length: lookback }, (_, i) => ({ year: new Date().getFullYear() - lookback + 1 + i, male: 0.5, female: 0.5 })),
      metrics: {
        male: { mae: 0, rmse: 0, mape: 0, accuracy: 0 },
        female: { mae: 0, rmse: 0, mape: 0, accuracy: 0 },
        total: { mae: 0, rmse: 0, mape: 0, accuracy: 0 }
      },
      trainedAt: new Date().toISOString()
    };
    return fallback;
  }
}

// ---------------------- Upload from user files ----------------------

/**
 * Upload LSTM model from a single .json file
 */
export async function uploadSexLSTMModel(files) {
  try {
    console.log("Uploading model...");
    
    // Get the first file (only one file expected)
    const file = files[0];
    
    if (!file) {
      throw new Error('No file selected.');
    }
    
    // Read the file
    const text = await file.text();
    const combined = JSON.parse(text);
    
    console.log("Loaded combined model file:", {
      hasModelTopology: !!combined.modelTopology,
      hasWeightsBase64: !!combined.weightsBase64,
      hasMetadata: !!combined.metadata
    });
    
    // 1. Reconstruct model artifacts
    const modelArtifacts = {
      modelTopology: combined.modelTopology,
      format: combined.format || 'layers-model',
      generatedBy: 'TensorFlow.js',
      weightSpecs: combined.weightSpecs || [],
      weightData: null
    };
    
    // 2. Convert base64 weights back to ArrayBuffer
    if (combined.weightsBase64) {
      modelArtifacts.weightData = base64ToArrayBuffer(combined.weightsBase64);
    }
    
    // 3. Load the model from memory
    const model = await tf.loadLayersModel(
      tf.io.fromMemory(modelArtifacts)
    );
    
    console.log("Model loaded successfully");
    
    // 4. Extract and validate metadata
    const metadata = combined.metadata || {};
    const validated = validateSexMetadata(metadata);
    
    console.log("Validated metadata:", validated);
    
    // 5. Save to IndexedDB and localStorage
    await saveSexLSTMModel(model, validated);
    
    return { model, metadata: validated };
  } catch (err) {
    console.error("Error uploading model:", err);
    throw err;
  }
}

