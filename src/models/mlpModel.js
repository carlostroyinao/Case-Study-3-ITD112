import * as tf from '@tensorflow/tfjs';

/**
 * MLP Model for Sex Data Forecasting
 * Predicts male and female emigrants (2 outputs)
 */
export function buildSexMLPModel(lookback = 3, features = 2) {
  const model = tf.sequential();

  const inputSize = lookback * features;

  // First Dense layer
  model.add(tf.layers.dense({
    units: 50,
    activation: 'tanh',
    inputShape: [inputSize]
  }));

  model.add(tf.layers.dropout({ rate: 0.2 }));

  // Second Dense layer
  model.add(tf.layers.dense({
    units: 50,
    activation: 'tanh'
  }));

  model.add(tf.layers.dropout({ rate: 0.2 }));

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

  console.log('Built MLP model for sex data:', { lookback, features, outputs: 2 });
  return model;
}

/**
 * Flatten sequences for MLP input
 */
function flattenSexSequences(X) {
  return X.map(seq => seq.flat());
}

/**
 * Train MLP Model for sex data
 */
export async function trainSexMLPModel(model, X, y, onEpochEnd, epochs = 100, validationSplit = 0.2) {
  try {
    console.log('Training MLP model...');
    
    // Flatten sequences for MLP
    const flatX = flattenSexSequences(X);
    console.log('Flattened input shape:', `[${flatX.length}, ${flatX[0]?.length || 0}]`);
    console.log('Output shape:', `[${y.length}, ${y[0]?.length || 1}]`);

    // Convert to tensors
    const xs = tf.tensor2d(flatX);
    const ys = tf.tensor2d(y);  

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

    // Cleanup tensors
    xs.dispose();
    ys.dispose();

    console.log('MLP training completed');
    return history;
  } catch (error) {
    console.error('MLP training error:', error);
    throw error;
  }
}

/**
 * Make predictions using MLP model
 */
export async function predictSexMLP(model, X) {
  try {
    const flatX = flattenSexSequences(X);
    const xs = tf.tensor2d(flatX);
    const predictions = model.predict(xs);
    const result = await predictions.array();

    xs.dispose();
    predictions.dispose();

    // Returns array of [male, female] predictions
    return result;
  } catch (error) {
    console.error('MLP prediction error:', error);
    throw error;
  }
}

// ====================== Save/Load/Delete ======================

/**
 * Save MLP model to IndexedDB
 */
export async function saveSexMLPModel(model, metadata) {
  await model.save('indexeddb://sex-mlp-model');
  localStorage.setItem('sex-mlp-metadata', JSON.stringify(metadata));
}

/**
 * Load MLP model from IndexedDB
 */
export async function loadSexMLPModel() {
  try {
    const model = await tf.loadLayersModel('indexeddb://sex-mlp-model');
    const metadataRaw = localStorage.getItem('sex-mlp-metadata');
    const metadata = metadataRaw ? JSON.parse(metadataRaw) : null;
    return { model, metadata };
  } catch (error) {
    console.error('Error loading sex MLP model:', error);
    return null;
  }
}

/**
 * Delete MLP model from IndexedDB
 */
export async function deleteSexMLPModel() {
  try {
    await tf.io.removeModel('indexeddb://sex-mlp-model');
    localStorage.removeItem('sex-mlp-metadata');
    return true;
  } catch (error) {
    console.error('Error deleting sex MLP model:', error);
    return false;
  }
}

// ====================== Single File Download/Upload ======================

/**
 * Download MLP model as a single .json file containing everything
 */
export async function downloadSexMLPModel(model, metadata) {
  try {
    // 1. Get model artifacts
    const modelArtifacts = await model.save(tf.io.withSaveHandler(async (artifacts) => {
      return artifacts;
    }));
    
    // 2. Convert weight data to base64 for embedding in JSON
    let weightsBase64 = null;
    if (modelArtifacts.weightData) {
      weightsBase64 = arrayBufferToBase64(modelArtifacts.weightData);
    }
    
    // 3. Create a single JSON object with everything
    const combinedModel = {
      // Model info
      modelType: 'MLP',
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
    downloadFile(
      JSON.stringify(combinedModel, null, 2),
      `sex-mlp-model-${new Date().toISOString().split('T')[0]}.json`,
      'application/json'
    );
    
    console.log('MLP model downloaded as single JSON file');
    alert('MLP model downloaded as single .json file!');
  } catch (err) {
    console.error('Error downloading MLP model:', err);
    throw err;
  }
}

/**
 * Upload MLP model from a single .json file
 */
export async function uploadSexMLPModel(files) {
  try {
    console.log("Uploading MLP model...");
    
    // Get the first file (only one file expected)
    const file = files[0];
    
    if (!file) {
      throw new Error('No file selected.');
    }
    
    // Read the file
    const text = await file.text();
    const combined = JSON.parse(text);
    
    console.log("Loaded combined MLP model file:", {
      hasModelTopology: !!combined.modelTopology,
      hasWeightsBase64: !!combined.weightsBase64,
      hasMetadata: !!combined.metadata,
      modelType: combined.modelType || 'unknown'
    });
    
    // Check if this is an MLP model
    if (combined.modelType !== 'MLP' && combined.modelType !== 'LSTM') {
      console.warn('Model type is not MLP or LSTM, but will attempt to load anyway');
    }
    
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
    
    console.log("MLP model loaded successfully");
    
    // 4. Extract and validate metadata
    const metadata = combined.metadata || {};
    const validated = validateSexMetadata(metadata);
    
    console.log("Validated metadata:", validated);
    
    // 5. Save to IndexedDB and localStorage
    await saveSexMLPModel(model, validated);
    
    return { model, metadata: validated };
  } catch (err) {
    console.error("Error uploading MLP model:", err);
    throw err;
  }
}

/**
 * Validate and complete metadata structure for MLP
 */
export function validateSexMetadata(metadata = {}) {
  try {
    const nowYear = new Date().getFullYear();
    
    // Normalize basic fields
    const modelType = metadata.modelType || 'MLP';
    const lookback = Number(metadata.lookback) || 3;
    const features = Array.isArray(metadata.features) && metadata.features.length > 0 ? metadata.features : ['male', 'female'];
    const targets = Array.isArray(metadata.targets) && metadata.targets.length > 0 ? metadata.targets : ['male', 'female'];
    
    // Ensure mins/maxs have numeric entries for each feature
    const mins = {};
    const maxs = {};
    features.forEach((f) => {
      const rawMin = metadata.mins?.[f];
      const rawMax = metadata.maxs?.[f];
      const parsedMin = (rawMin === undefined || rawMin === null) ? 0 : Number(rawMin);
      const parsedMax = (rawMax === undefined || rawMax === null) ? (parsedMin + 1) : Number(rawMax);
      
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
    
    // Normalize lastData entries
    lastData = lastData.map((entry, idx) => {
      const safeEntry = {};
      features.forEach((f) => {
        const raw = entry?.[f];
        safeEntry[f] = (raw === undefined || raw === null) ? null : Number(raw);
        if (Number.isNaN(safeEntry[f])) safeEntry[f] = null;
      });
      safeEntry.year = entry?.year ? (Number(entry.year) || null) : (lastYear - (lastData.length - idx - 1));
      return safeEntry;
    });
    
    // If lastData is missing or shorter than lookback, synthesize seed values
    if (!Array.isArray(lastData) || lastData.length < lookback) {
      const synthesized = [];
      for (let i = 0; i < lookback; i++) {
        const row = { year: lastYear - (lookback - i - 1) };
        features.forEach((f) => {
          const mid = (mins[f] + maxs[f]) / 2;
          row[f] = Number.isFinite(mid) ? mid : 0;
        });
        synthesized.push(row);
      }
      console.warn('Metadata lastData missing — synthesizing seed lastData for forecasting', { synthesized });
      lastData = synthesized;
    } else {
      // Replace nulls with midpoint
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
    
    // Ensure metrics exist
    const safeMetrics = metadata.metrics || {
      male: { mae: 0, rmse: 0, mape: 0, accuracy: 0 },
      female: { mae: 0, rmse: 0, mape: 0, accuracy: 0 },
      total: { mae: 0, rmse: 0, mape: 0, accuracy: 0 }
    };
    
    // Return completed metadata
    return {
      modelType,
      lookback,
      features,
      targets,
      mins,
      maxs,
      lastYear,
      lastData,
      metrics: safeMetrics,
      trainedAt: metadata.trainedAt || new Date().toISOString()
    };
  } catch (err) {
    console.error('validateSexMetadata error:', err);
    // Fallback minimal metadata
    return {
      modelType: 'MLP',
      lookback: 3,
      features: ['male', 'female'],
      targets: ['male', 'female'],
      mins: { male: 0, female: 0 },
      maxs: { male: 1, female: 1 },
      lastYear: new Date().getFullYear(),
      lastData: Array.from({ length: 3 }, (_, i) => ({ 
        year: new Date().getFullYear() - 2 + i, 
        male: 0.5, 
        female: 0.5 
      })),
      metrics: {
        male: { mae: 0, rmse: 0, mape: 0, accuracy: 0 },
        female: { mae: 0, rmse: 0, mape: 0, accuracy: 0 },
        total: { mae: 0, rmse: 0, mape: 0, accuracy: 0 }
      },
      trainedAt: new Date().toISOString()
    };
  }
}

// ====================== Helper Functions ======================

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

/**
 * Helper function to download a file
 */
function downloadFile(content, filename, mimeType) {
  const blob = new Blob(
    [content instanceof ArrayBuffer ? new Uint8Array(content) : content],
    { type: mimeType }
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}