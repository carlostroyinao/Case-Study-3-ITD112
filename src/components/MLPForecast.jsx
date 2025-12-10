import React, { useState, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { cleanData, sortData, normalizeData, denormalize, createSequences, calculateMetrics } from '../utils/dataPreparation';
import { buildMLPModel, trainMLPModel, predictMLP, saveMLPModel, loadMLPModel, deleteMLPModel, downloadMLPModel } from '../models/mlpModel';
import './ForecastPanel.css';

export default function MLPForecast({ data }) {
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(null);
  
  // Total model (for metrics display)
  const [metrics, setMetrics] = useState(null);
  const [model, setModel] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [validationResults, setValidationResults] = useState([]);
  
  // Separate male/female models
  const [maleModel, setMaleModel] = useState(null);
  const [femaleModel, setFemaleModel] = useState(null);
  const [maleMetadata, setMaleMetadata] = useState(null);
  const [femaleMetadata, setFemaleMetadata] = useState(null);
  
  const [forecastYears, setForecastYears] = useState(5);
  const [forecasts, setForecasts] = useState([]);

  const LOOKBACK = 3;
  const FEATURES = ['emigrants'];
  const TARGET = 'emigrants';

  // Check if data has male/female columns (case-insensitive)
  const getMaleFemaleKeys = () => {
    if (!data || data.length === 0) return null
    const row = data[0]
    const keys = Object.keys(row)
    // For preprocessed data from App.jsx, keys are already normalized to 'male' and 'female'
    const maleKey = keys.find(k => /^male$/i.test(k))
    const femaleKey = keys.find(k => /^female$/i.test(k))
    return maleKey && femaleKey ? { maleKey, femaleKey } : null
  }

  const maleFemaleKeys = getMaleFemaleKeys();
  const hasMaleFemaleColumns = !!maleFemaleKeys;

  // Generate forecasts using provided models/metadata (used after training and after loading)
  const generateForecasts = async (maleModelArg, femaleModelArg, maleMetaArg, femaleMetaArg, years) => {
    if (!maleModelArg || !femaleModelArg || !maleMetaArg || !femaleMetaArg) return [];

    const maleForecast = [];
    const femaleForecast = [];

    // --- male ---
    {
      const { mins, maxs, lastData, lastYear } = maleMetaArg;
      let currentSequence = lastData.map(row => ({ year: row.year, emigrants: row.emigrants }));
      let currentYear = lastYear;

      for (let i = 0; i < years; i++) {
        const normalized = currentSequence.map(row => ({
          emigrants: (row.emigrants - mins.emigrants) / (maxs.emigrants - mins.emigrants)
        }));
        const input = [normalized.map(r => FEATURES.map(f => r[f]))];

        // eslint-disable-next-line no-await-in-loop
        const normalizedPred = await predictMLP(maleModelArg, input);
        const predictedEmigrants = denormalize(normalizedPred[0], mins[TARGET], maxs[TARGET]);

        currentYear++;
        maleForecast.push({ year: currentYear, emigrants: predictedEmigrants });

        currentSequence = [...currentSequence.slice(1), { year: currentYear, emigrants: predictedEmigrants }];
      }
    }

    // --- female ---
    {
      const { mins, maxs, lastData, lastYear } = femaleMetaArg;
      let currentSequence = lastData.map(row => ({ year: row.year, emigrants: row.emigrants }));
      let currentYear = lastYear;

      for (let i = 0; i < years; i++) {
        const normalized = currentSequence.map(row => ({
          emigrants: (row.emigrants - mins.emigrants) / (maxs.emigrants - mins.emigrants)
        }));
        const input = [normalized.map(r => FEATURES.map(f => r[f]))];

        // eslint-disable-next-line no-await-in-loop
        const normalizedPred = await predictMLP(femaleModelArg, input);
        const predictedEmigrants = denormalize(normalizedPred[0], mins[TARGET], maxs[TARGET]);

        currentYear++;
        femaleForecast.push({ year: currentYear, emigrants: predictedEmigrants });

        currentSequence = [...currentSequence.slice(1), { year: currentYear, emigrants: predictedEmigrants }];
      }
    }

    // combine male+female into unified forecast rows
    const combined = [];
    for (let i = 0; i < years; i++) {
      const year = maleForecast[i]?.year || femaleForecast[i]?.year;
      const male = maleForecast[i]?.emigrants || 0;
      const female = femaleForecast[i]?.emigrants || 0;
      const total = male + female;

      combined.push({
        year: year?.toString(),
        male: Math.round(male),
        female: Math.round(female),
        total: Math.round(total),
        isForecast: true
      });
    }

    return combined;
  };

  const handleTrain = async () => {
    if (!maleFemaleKeys) {
      const availableColumns = data && data.length > 0 ? Object.keys(data[0]).join(', ') : 'No data loaded';
      alert(`No male/female columns detected.\n\nAvailable columns: ${availableColumns}\n\nPlease ensure your data has "Male" and "Female" columns.`);
      return;
    }

    const { maleKey, femaleKey } = maleFemaleKeys

    let maleModelLocal = null;
    let femaleModelLocal = null;
    let maleMetadataLocal = null;
    let femaleMetadataLocal = null;
    let totalValidation = [];
    
    setIsTraining(true);
    setTrainingProgress({ epoch: 0, loss: 0, mae: 0 });
    setMetrics(null);
    setValidationResults([]);
    setForecasts([]);

    try {
      // ---------- 1) Train TOTAL model (male + female) with metrics + validation ----------
      const totalSeries = data.map(row => ({
        year: row.year,
        emigrants: (Number(row[maleKey]) || 0) + (Number(row[femaleKey]) || 0)
      }));

      let cleanedTotal = cleanData(totalSeries);
      cleanedTotal = sortData(cleanedTotal);

      const { normalized: normTotal, mins: minsTotal, maxs: maxsTotal } =
        normalizeData(cleanedTotal, FEATURES);
      const { X: Xtotal, y: yTotal } =
        createSequences(normTotal, LOOKBACK, FEATURES, TARGET);

      if (!Array.isArray(Xtotal) || Xtotal.length === 0 || !Array.isArray(yTotal) || yTotal.length === 0) {
        alert(
          `Not enough data to train MLP model (total). Data points: ${cleanedTotal.length}. Lookback: ${LOOKBACK}.`
        );
        setIsTraining(false);
        return;
      }

      const totalModel = buildMLPModel(LOOKBACK, FEATURES.length);

      const onEpochEnd = (epoch, logs) => {
        setTrainingProgress({
          epoch: epoch + 1,
          loss: logs.loss.toFixed(6),
          mae: logs.mae.toFixed(6),
          val_loss: logs.val_loss?.toFixed(6),
          val_mae: logs.val_mae?.toFixed(6)
        });
      };

      await trainMLPModel(totalModel, Xtotal, yTotal, onEpochEnd, 100, 0.2);

      const normTotalPreds = await predictMLP(totalModel, Xtotal);

      const totalPredictions = normTotalPreds.map(pred =>
        denormalize(pred, minsTotal[TARGET], maxsTotal[TARGET])
      );
      const totalActual = yTotal.map(val =>
        denormalize(val, minsTotal[TARGET], maxsTotal[TARGET])
      );

      // total-series validation (last 20%)
      const trainSizeTotal = Math.floor(totalActual.length * 0.8);
      totalValidation = totalActual.slice(trainSizeTotal).map((actual, index) => ({
        year: cleanedTotal[trainSizeTotal + index + LOOKBACK].year,
        actual: Math.round(actual),
        predicted: Math.round(totalPredictions[trainSizeTotal + index]),
        error: Math.round(totalPredictions[trainSizeTotal + index] - actual)
      }));
      setValidationResults(totalValidation);

      const totalMetrics = calculateMetrics(totalActual, totalPredictions);
      setMetrics(totalMetrics);

      const totalMetadata = {
        modelType: 'MLP',
        lookback: LOOKBACK,
        features: FEATURES,
        target: TARGET,
        mins: minsTotal,
        maxs: maxsTotal,
        lastYear: cleanedTotal[cleanedTotal.length - 1].year,
        lastData: cleanedTotal.slice(-LOOKBACK),
        metrics: totalMetrics,
        validationResults: totalValidation,
        trainedAt: new Date().toISOString()
      };

      setModel(totalModel);
      setMetadata(totalMetadata);

      // ---------- 2) Train MALE model ----------
      const maleSeries = data.map(row => ({
        year: row.year,
        emigrants: Number(row[maleKey]) || 0
      }));

      let cleanedMale = cleanData(maleSeries);
      cleanedMale = sortData(cleanedMale);

      const {
        normalized: normMale,
        mins: minsMale,
        maxs: maxsMale
      } = normalizeData(cleanedMale, FEATURES);
      const { X: Xmale, y: yMale } =
        createSequences(normMale, LOOKBACK, FEATURES, TARGET);

      if (Array.isArray(Xmale) && Xmale.length > 0) {
        maleModelLocal = buildMLPModel(LOOKBACK, FEATURES.length);
        await trainMLPModel(maleModelLocal, Xmale, yMale, null, 80, 0.2);

        maleMetadataLocal = {
          mins: minsMale,
          maxs: maxsMale,
          lastYear: cleanedMale[cleanedMale.length - 1].year,
          lastData: cleanedMale.slice(-LOOKBACK)
        };

        setMaleModel(maleModelLocal);
        setMaleMetadata(maleMetadataLocal);
      } else {
        console.info('Skipping male model training: not enough data.');
      }

      // ---------- 3) Train FEMALE model ----------
      const femaleSeries = data.map(row => ({
        year: row.year,
        emigrants: Number(row[femaleKey]) || 0
      }));

      let cleanedFemale = cleanData(femaleSeries);
      cleanedFemale = sortData(cleanedFemale);

      const {
        normalized: normFemale,
        mins: minsFemale,
        maxs: maxsFemale
      } = normalizeData(cleanedFemale, FEATURES);
      const { X: Xfemale, y: yFemale } =
        createSequences(normFemale, LOOKBACK, FEATURES, TARGET);

      if (Array.isArray(Xfemale) && Xfemale.length > 0) {
        femaleModelLocal = buildMLPModel(LOOKBACK, FEATURES.length);
        await trainMLPModel(femaleModelLocal, Xfemale, yFemale, null, 80, 0.2);

        femaleMetadataLocal = {
          mins: minsFemale,
          maxs: maxsFemale,
          lastYear: cleanedFemale[cleanedFemale.length - 1].year,
          lastData: cleanedFemale.slice(-LOOKBACK)
        };

        setFemaleModel(femaleModelLocal);
        setFemaleMetadata(femaleMetadataLocal);
      } else {
        console.info('Skipping female model training: not enough data.');
      }

      // Save all 3 models (total, male, female) after training completes
      await saveMLPModel(
        totalModel,
        totalMetadata,
        maleModelLocal,
        maleMetadataLocal,
        femaleModelLocal,
        femaleMetadataLocal
      );

      alert(
        `MLP total model trained successfully!\nMAE: ${totalMetrics.mae}\nAccuracy: ${totalMetrics.accuracy}%\nMale/Female models trained for forecasting.`
      );
    } catch (error) {
      console.error('Training error:', error);
      alert('Error training model: ' + error.message);
    } finally {
      setIsTraining(false);
    }
  };

  const handleLoadModel = async () => {
    try {
      const result = await loadMLPModel();
      if (result) {
        setModel(result.model);
        setMetadata(result.metadata);
        setMetrics(result.metadata?.metrics || null);
        setValidationResults(result.metadata?.validationResults || []);
        setMaleModel(result.maleModel || null);
        setFemaleModel(result.femaleModel || null);
        setMaleMetadata(result.maleMetadata || null);
        setFemaleMetadata(result.femaleMetadata || null);
        setIsTraining(false);

        // Auto-generate forecasts if male/female models are present
        if (result.maleModel && result.femaleModel && result.maleMetadata && result.femaleMetadata) {
          const combined = await generateForecasts(
            result.maleModel,
            result.femaleModel,
            result.maleMetadata,
            result.femaleMetadata,
            forecastYears
          );
          setForecasts(combined);
          alert('MLP model loaded successfully! Forecast generated.');
        } else {
          setForecasts([]);
          alert('MLP model loaded successfully! (total + male + female)');
        }
      } else {
        alert('No saved model found. Please train a model first.');
      }
    } catch (error) {
      console.error('Error loading model:', error);
      alert('Error loading model: ' + error.message);
    }
  };

  // --- UPLOAD: load model files from user and save into IndexedDB ---
  const fileInputRef = useRef(null);

  const handleUploadClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleUploadFiles = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const filesArr = Array.from(files);

      // Find model.json files
      const modelJsonFiles = [];
      for (const f of filesArr) {
        if (f.name && f.name.toLowerCase().endsWith('.json')) {
          try {
            const txt = await f.text();
            const parsed = JSON.parse(txt);
            if (parsed && parsed.weightsManifest) {
              modelJsonFiles.push({ file: f, manifest: parsed });
            }
          } catch (err) {
            // ignore invalid json
          }
        }
      }

      if (modelJsonFiles.length === 0) {
        throw new Error('No valid model.json found among uploaded files. Please include at least one model.json that references the weight shard files.');
      }

      const matchFilesForManifest = (manifest) => {
        const expected = (manifest.weightsManifest || []).flatMap(wm => wm.paths || []);
        const ordered = [];
        const missing = [];
        for (const p of expected) {
          const normalized = p.replace(/^\.\/+/, '');
          const basename = normalized.split('/').pop();
          const match = filesArr.find(f => f.name === p) || filesArr.find(f => f.name === normalized) || filesArr.find(f => f.name === basename) || filesArr.find(f => f.name.endsWith(basename));
          if (match) ordered.push(match);
          else missing.push(p);
        }
        return { ordered, missing };
      };

      for (const entry of modelJsonFiles) {
        const modelJsonFile = entry.file;
        const manifestObjLocal = entry.manifest;

        const { ordered, missing } = matchFilesForManifest(manifestObjLocal);
        if (missing.length > 0) {
          const available = filesArr.map(f => f.name).join(', ');
          throw new Error(`Missing weight files referenced by ${modelJsonFile.name}: ${missing.join(', ')}. Uploaded files: ${available}`);
        }

        const filesForLoad = [modelJsonFile, ...ordered];
        const loadedModel = await tf.loadLayersModel(tf.io.browserFiles(filesForLoad));

        // Decide save key by filename hints
        const lower = modelJsonFile.name.toLowerCase();
        let saveKey = 'indexeddb://emigrants-mlp-model-total';
        let storageMetaKey = 'mlp-metadata-total';
        if (lower.includes('male')) {
          saveKey = 'indexeddb://emigrants-mlp-model-male';
          storageMetaKey = 'mlp-metadata-male';
        } else if (lower.includes('female')) {
          saveKey = 'indexeddb://emigrants-mlp-model-female';
          storageMetaKey = 'mlp-metadata-female';
        }

        await loadedModel.save(saveKey);

        // Try to find uploaded metadata file
        const base = modelJsonFile.name.replace(/\.json$/i, '');
        const metaCandidates = filesArr.filter(f => /meta/i.test(f.name) || /metadata/i.test(f.name));
        let matchedMeta = metaCandidates.find(f => f.name.toLowerCase().includes(base.toLowerCase()));
        if (!matchedMeta) {
          matchedMeta = metaCandidates.find(f => saveKey.includes('male') && /male/i.test(f.name)) || metaCandidates.find(f => saveKey.includes('female') && /female/i.test(f.name)) || metaCandidates.find(f => /mlp.*meta/i.test(f.name)) || metaCandidates[0];
        }

        if (matchedMeta) {
          try {
            const txt = await matchedMeta.text();
            const metadataObj = JSON.parse(txt);
            localStorage.setItem(storageMetaKey, JSON.stringify(metadataObj));
          } catch (err) {
            console.warn('Uploaded metadata not valid JSON for', modelJsonFile.name, err);
          }
        }
      }

      alert('Model uploaded and saved to IndexedDB. Loading model...');
      await handleLoadModel();
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to upload model: ' + (err.message || err));
    } finally {
      e.target.value = null;
    }
  };

  const handleDeleteModel = async () => {
    if (!confirm('Are you sure you want to delete the saved MLP model?')) return;

    try {
      await deleteMLPModel();
      setModel(null);
      setMetadata(null);
      setMetrics(null);
      setValidationResults([]);
      setForecasts([]);
      setMaleModel(null);
      setFemaleModel(null);
      setMaleMetadata(null);
      setFemaleMetadata(null);
      alert('MLP model deleted successfully!');
    } catch (error) {
      console.error('Error deleting model:', error);
      alert('Error deleting model: ' + error.message);
    }
  };

  const handleDownloadModel = async () => {
    if (!model || !metadata) {
      alert('No model to download. Please train a model first.');
      return;
    }

    try {
      await downloadMLPModel(model, metadata);
      alert('MLP model files downloaded!');
    } catch (error) {
      console.error('Error downloading model:', error);
      alert('Error downloading model: ' + error.message);
    }
  };

  const handleForecast = async () => {
    if (!maleModel || !femaleModel || !maleMetadata || !femaleMetadata) {
      alert('Please train the MLP models first so male/female forecasts are available.');
      return;
    }

    try {
      const combined = await generateForecasts(
        maleModel,
        femaleModel,
        maleMetadata,
        femaleMetadata,
        forecastYears
      );
      setForecasts(combined);
      alert(`Generated ${forecastYears}-year MLP forecast for male, female, and total.`);
    } catch (error) {
      console.error('Forecasting error:', error);
      alert('Error generating forecast: ' + error.message);
    }
  };

  const chartData = [...(Array.isArray(data) ? data : []), ...forecasts];

  return (
    <div className="forecast-panel mlp-panel">
      
      {/* Title */}
      <h2>MLP Forecasting (Multi-Layer Perceptron)</h2>

      {/* Control Buttons */}
      <div className="control-buttons">
        <button onClick={handleTrain} disabled={isTraining}>
          {isTraining ? "Training..." : "Train MLP Model"}
        </button>
        <button onClick={handleLoadModel} disabled={isTraining}>
          Load Model
        </button>
        <button onClick={handleUploadClick} disabled={isTraining}>
          Upload Model
        </button>
        <button onClick={handleDeleteModel} disabled={isTraining || !model}>
          Delete Model
        </button>
        <button onClick={handleDownloadModel} disabled={isTraining || !model}>
          Download Model
        </button>
      </div>

      {/* Hidden input for uploads */}
      <input
        type="file"
        multiple
        ref={fileInputRef}
        onChange={handleUploadFiles}
        style={{ display: "none" }}
        accept=".json,.bin,application/json,application/octet-stream"
      />

      {/* Training Progress */}
      {isTraining && trainingProgress && (
        <div className="training-progress">
          <h3>Training Progress</h3>
          <p><strong>Epoch:</strong> {trainingProgress.epoch} / 100</p>
          <p><strong>Loss:</strong> {trainingProgress.loss}</p>
          <p><strong>MAE:</strong> {trainingProgress.mae}</p>
          {trainingProgress.val_loss && (
            <>
              <p><strong>Val Loss:</strong> {trainingProgress.val_loss}</p>
              <p><strong>Val MAE:</strong> {trainingProgress.val_mae}</p>
            </>
          )}
        </div>
      )}

      {/* Metrics */}
      {metrics && !isTraining && (
        <div className="metrics">
          <h3>Model Performance</h3>
          <div className="metrics-grid">
            <div className="metric-item">
              <span className="metric-label">MAE</span>
              <span className="metric-value">{metrics.mae}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">RMSE</span>
              <span className="metric-value">{metrics.rmse}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">MAPE</span>
              <span className="metric-value">{metrics.mape}%</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">R²</span>
              <span className="metric-value">{metrics.r2}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Accuracy</span>
              <span className="metric-value">{metrics.accuracy}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Validation Results */}
      {validationResults.length > 0 && (
        <div className="training-results">
          <h3>Testing Results (20% Split)</h3>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Year</th>
                  <th>Actual</th>
                  <th>Predicted</th>
                  <th>Error</th>
                </tr>
              </thead>
              <tbody>
                {validationResults.map((row, i) => (
                  <tr key={i}>
                    <td>{row.year}</td>
                    <td>{row.actual?.toLocaleString()}</td>
                    <td>{row.predicted?.toLocaleString()}</td>
                    <td className={row.error >= 0 ? "error-positive" : "error-negative"}>
                      {row.error > 0 ? "+" : ""}
                      {row.error?.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Forecast Controls */}
      {maleModel && femaleModel && !isTraining && (
        <div className="forecast-controls">
          <h3>Generate MLP Forecast</h3>
          <div className="forecast-input">
            <label>
              Years to forecast:
              <input
                type="number"
                min="1"
                max="10"
                value={forecastYears}
                onChange={(e) => setForecastYears(parseInt(e.target.value) || 1)}
              />
            </label>
            <button onClick={handleForecast}>Generate Forecast</button>
          </div>
        </div>
      )}

      {/* Chart */}
      {(Array.isArray(data) && data.length > 0 || forecasts.length > 0) && (
        <div className="chart-container">
          <h3>MLP: Historical + Forecast by Sex</h3>
          <ResponsiveContainer width="100%" height={450}>
            <LineChart
              data={[
                ...(hasMaleFemaleColumns
                  ? data.map((row) => ({
                      year: row.year,
                      male: Number(row.male) || 0,
                      female: Number(row.female) || 0,
                      total: (Number(row.male) || 0) + (Number(row.female) || 0),
                      isForecast: false,
                    }))
                  : []),
                ...forecasts,
              ]}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis
                label={{ value: "Emigrants", angle: -90, position: "insideLeft" }}
              />
              <Tooltip />
              <Legend />

              {/* TOTAL */}
              <Line
                type="monotone"
                dataKey={(e) => (e.isForecast ? null : e.total)}
                stroke="#2ecc71"
                strokeWidth={2}
                dot={false}
                name="Total (Historical)"
              />
              <Line
                type="monotone"
                dataKey={(e) => (e.isForecast ? e.total : null)}
                stroke="#2ecc71"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="Total (Forecast)"
              />

              {/* MALE */}
              <Line
                type="monotone"
                dataKey={(e) => (e.isForecast ? null : e.male)}
                stroke="#3498db"
                strokeWidth={2}
                dot={false}
                name="Male (Historical)"
              />
              <Line
                type="monotone"
                dataKey={(e) => (e.isForecast ? e.male : null)}
                stroke="#3498db"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="Male (Forecast)"
              />

              {/* FEMALE */}
              <Line
                type="monotone"
                dataKey={(e) => (e.isForecast ? null : e.female)}
                stroke="#ff69b4"
                strokeWidth={2}
                dot={false}
                name="Female (Historical)"
              />
              <Line
                type="monotone"
                dataKey={(e) => (e.isForecast ? e.female : null)}
                stroke="#ff69b4"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="Female (Forecast)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Forecast Table */}
      {forecasts.length > 0 && (
        <div className="forecast-results">
          <h3>MLP Forecast Results</h3>
          <table>
            <thead>
              <tr>
                <th>Year</th>
                <th>Male</th>
                <th>Female</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {forecasts.map((f, i) => (
                <tr key={i}>
                  <td>{f.year}</td>
                  <td>{f.male?.toLocaleString()}</td>
                  <td>{f.female?.toLocaleString()}</td>
                  <td>{f.total?.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Info Box */}
      <div className="info-box enhanced-info">
        <div className="info-header">
          <div className="info-icon">⚙️</div>
          <h4>MLP Model Configuration</h4>
        </div>

        <ul className="info-list">
          <li><span>Architecture:</span> 2 Dense layers (200 and 100 units)</li>
          <li><span>Lookback Window:</span> {LOOKBACK} years</li>
          <li><span>Training:</span> Separate male/female models + combined totals</li>
          <li><span>Target:</span> Next-year emigrant count</li>
          <li><span>Dropout:</span> 0.2</li>
          <li><span>Epochs:</span> 100 (total) | 80 (male/female)</li>
        </ul>
      </div>
    </div>
  );
}