/**
 * Data preparation utilities for Sex Data Forecasting
 */

/**
 * Clean and filter sex data from Firebase
 * @param {Array} data 
 * @returns {Array} 
 */
export function cleanSexData(data) {
  if (!Array.isArray(data) || data.length === 0) {
    return [];
  }

  return data
    .filter(row => 
      row && 
      row.year && 
      typeof row.male === 'number' && 
      typeof row.female === 'number' &&
      row.male >= 0 &&
      row.female >= 0
    )
    .map(row => ({
      year: parseInt(row.year),
      male: Math.max(0, row.male),
      female: Math.max(0, row.female),
      total: Math.max(0, row.male) + Math.max(0, row.female)
    }))
    .sort((a, b) => a.year - b.year); // Sort by year ascending
}

/**
 * Sort data by year
 */
export function sortData(data) {
  return [...data].sort((a, b) => a.year - b.year);
}

/**
 * Normalize data using min-max scaling
 */
export function normalizeSexData(data, features) {
  if (data.length === 0) return { normalized: [], mins: {}, maxs: {} };

  const mins = {};
  const maxs = {};
  
  // Calculate min and max for each feature
  features.forEach(feature => {
    const values = data.map(row => row[feature]);
    mins[feature] = Math.min(...values);
    maxs[feature] = Math.max(...values);
  });

  // Normalize data (0 to 1)
  const normalized = data.map(row => {
    const normalizedRow = { ...row };
    features.forEach(feature => {
      const range = maxs[feature] - mins[feature];
      normalizedRow[feature] = range === 0 ? 0 : (row[feature] - mins[feature]) / range;
    });
    return normalizedRow;
  });

  return { normalized, mins, maxs };
}

/**
 * Denormalize a value
 */
export function denormalize(value, min, max) {
  return value * (max - min) + min;
}

/**
 * Create sequences for time series prediction
 * Returns 2 outputs: [male, female] (not 3)
 */
export function createSexSequences(data, lookback, features, target = ['male', 'female']) {
  const X = [];
  const y = [];

  // We need at least lookback + 1 samples to create sequences
  for (let i = 0; i < data.length - lookback; i++) {
    // Input sequence (lookback years)
    const sequence = data.slice(i, i + lookback);
    
    // Prepare input features
    const inputSequence = sequence.map(row => 
      features.map(feature => row[feature])
    );
    
    // Target values (next year's male and female)
    const targetRow = data[i + lookback];
    const targetValues = target.map(t => targetRow[t]);
    
    X.push(inputSequence);
    y.push(targetValues);
  }

  console.log(`Created sequences: ${X.length} samples, X shape: [${X.length}, ${lookback}, ${features.length}], y shape: [${y.length}, ${target.length}]`);
  
  return { X, y };
}

/**
 * Calculate performance metrics on ALL data
 */
export function calculateSexMetrics(actual, predicted) {
  if (actual.length !== predicted.length || actual.length === 0) {
    return { mae: 0, rmse: 0, mape: 0, r2: 0, accuracy: 0 };
  }

  const n = actual.length;
  
  // MAE
  const mae = actual.reduce((sum, val, i) => 
    sum + Math.abs(val - predicted[i]), 0) / n;
  
  // RMSE
  const rmse = Math.sqrt(
    actual.reduce((sum, val, i) => 
      sum + Math.pow(val - predicted[i], 2), 0) / n
  );
  
  // MAPE - handle zero values
  let mapeSum = 0;
  let validMapeCount = 0;
  
  for (let i = 0; i < n; i++) {
    if (actual[i] !== 0) {
      mapeSum += Math.abs((actual[i] - predicted[i]) / actual[i]);
      validMapeCount++;
    }
  }
  
  const mape = validMapeCount > 0 ? (mapeSum / validMapeCount) * 100 : 0;
  
  // R²
  const meanActual = actual.reduce((sum, val) => sum + val, 0) / n;
  const ssTotal = actual.reduce((sum, val) => sum + Math.pow(val - meanActual, 2), 0);
  const ssResidual = actual.reduce((sum, val, i) => 
    sum + Math.pow(val - predicted[i], 2), 0);
  const r2 = ssTotal === 0 ? 1 : 1 - (ssResidual / ssTotal);
  
  // ACCURACY - robust calculation
  let accuracy;
  
  if (n < 2) {
    accuracy = 0;
  } else if (mape > 500 || validMapeCount < n * 0.3) {
    // If MAPE is too high or too few valid values, use R² based accuracy
    accuracy = Math.max(0, Math.min(100, r2 * 100));
  } else {
    // Normal MAPE-based accuracy with safety limits
    const clampedMape = Math.min(mape, 100);
    accuracy = Math.max(0, Math.min(100, 100 - clampedMape));
  }
  
  // Final clamp
  accuracy = Math.max(0, Math.min(100, accuracy));

  return {
    mae: Math.round(mae),
    rmse: Math.round(rmse),
    mape: mape.toFixed(2),
    r2: r2.toFixed(4),
    accuracy: accuracy.toFixed(2)
  };
}