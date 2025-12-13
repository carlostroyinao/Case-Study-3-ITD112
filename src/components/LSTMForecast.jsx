import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  cleanSexData,
  sortData,
  normalizeSexData,
  denormalize,
  createSexSequences,
  calculateSexMetrics
} from '../utils/dataPreparation';
import {
  buildSexLSTMModel,
  trainSexLSTMModel,
  predictSexLSTM,
  saveSexLSTMModel,
  loadSexLSTMModel,
  deleteSexLSTMModel,
  downloadSexLSTMModel,
  uploadSexLSTMModel
} from '../models/lstmModel';
import './ForecastPanel.css';

export default function SexLSTM({ data }) {
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(null);
  const [metrics, setMetrics] = useState({ male: null, female: null });
  const [model, setModel] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [forecastYears, setForecastYears] = useState(5);
  const [forecasts, setForecasts] = useState([]);
  const [validationResults, setValidationResults] = useState([]);

  const LOOKBACK = 3;
  const FEATURES = ['male', 'female'];
  const TARGETS = ['male', 'female'];

  const handleTrain = async () => {
    setIsTraining(true);
    setTrainingProgress({ epoch: 0, loss: 0, mae: 0 });
    setMetrics({ male: null, female: null });
    setValidationResults([]);
    setForecasts([]);

    try {
      console.log('Starting LSTM training with data:', data.length, 'records');

      // 1. Data Preparation
      let cleanedData = cleanSexData(data);
      cleanedData = sortData(cleanedData);

      console.log('Cleaned data:', cleanedData);

      if (cleanedData.length < LOOKBACK + 5) {
        throw new Error(
          `Not enough data for training. Need at least ${LOOKBACK + 5} records, but have ${cleanedData.length}.`
        );
      }

      // 2. Normalization
      const { normalized, mins, maxs } = normalizeSexData(cleanedData, FEATURES);
      console.log('Normalization mins/maxs:', { mins, maxs });

      // 3. Create sequences
      const { X, y } = createSexSequences(normalized, LOOKBACK, FEATURES, TARGETS);

      if (X.length === 0 || y.length === 0) {
        throw new Error('Could not create training sequences. Check data format.');
      }

      // 4. Build model
      const newModel = buildSexLSTMModel(LOOKBACK, FEATURES.length);

      // 5. Train model
      const onEpochEnd = (epoch, logs) => {
        setTrainingProgress({
          epoch: epoch + 1,
          loss: logs.loss?.toFixed(6) || '0.000000',
          mae: logs.mae?.toFixed(6) || '0.000000',
          val_loss: logs.val_loss?.toFixed(6),
          val_mae: logs.val_mae?.toFixed(6)
        });
      };

      await trainSexLSTMModel(newModel, X, y, onEpochEnd, 100, 0.2);

      // 6. Make predictions (normalized)
      const normalizedPredictions = await predictSexLSTM(newModel, X);

      // 7. Denormalize predictions for each target
      const predictions = normalizedPredictions.map(pred => ({
        male: denormalize(pred[0], mins.male, maxs.male),
        female: denormalize(pred[1], mins.female, maxs.female)
      }));

      // 8. Calculate actual values
      const actualValues = y.map(val => ({
        male: denormalize(val[0], mins.male, maxs.male),
        female: denormalize(val[1], mins.female, maxs.female)
      }));

      // 9. Create validation results (last 20%)
      const trainSize = Math.floor(actualValues.length * 0.8);
      const resultsData = actualValues.slice(trainSize).map((actual, index) => ({
        year: cleanedData[trainSize + index + LOOKBACK].year,
        actualMale: Math.round(actual.male),
        predictedMale: Math.round(predictions[trainSize + index].male),
        errorMale: Math.round(
          predictions[trainSize + index].male - actual.male
        ),
        actualFemale: Math.round(actual.female),
        predictedFemale: Math.round(predictions[trainSize + index].female),
        errorFemale: Math.round(
          predictions[trainSize + index].female - actual.female
        )
      }));
      setValidationResults(resultsData);

      // 10. Calculate metrics on ALL data (training + validation)
      const maleActual = actualValues.map(v => v.male);
      const malePred = predictions.map(p => p.male);
      const maleMetrics = calculateSexMetrics(maleActual, malePred);

      const femaleActual = actualValues.map(v => v.female);
      const femalePred = predictions.map(p => p.female);
      const femaleMetrics = calculateSexMetrics(femaleActual, femalePred);

      setMetrics({
        male: maleMetrics,
        female: femaleMetrics
      });

      // 11. Save metadata
      const newMetadata = {
        modelType: 'LSTM',
        lookback: LOOKBACK,
        features: FEATURES,
        targets: TARGETS,
        mins,
        maxs,
        lastYear: cleanedData[cleanedData.length - 1].year,
        lastData: cleanedData.slice(-LOOKBACK),
        metrics: { male: maleMetrics, female: femaleMetrics },
        trainedAt: new Date().toISOString()
      };

      // 12. Save model
      await saveSexLSTMModel(newModel, newMetadata);

      setModel(newModel);
      setMetadata(newMetadata);

      alert(
        `LSTM model trained successfully!\nMale Accuracy: ${maleMetrics.accuracy}%\nFemale Accuracy: ${femaleMetrics.accuracy}%`
      );
    } catch (error) {
      console.error('Training error:', error);
      alert('Error training model: ' + error.message);
    } finally {
      setIsTraining(false);
    }
  };

  const handleUploadModel = async () => {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.multiple = false;

      input.onchange = async e => {
        try {
          setIsTraining(true);

          const file = e.target.files[0];

          if (!file) {
            return;
          }

          const result = await uploadSexLSTMModel([file]);

          setModel(result.model);
          setMetadata(result.metadata);
          setMetrics(result.metadata.metrics || { male: null, female: null });
          setForecasts([]);
          setValidationResults([]);

          alert('LSTM model uploaded successfully!');
        } catch (err) {
          alert('Error uploading model: ' + err.message);
        } finally {
          setIsTraining(false);
        }
      };

      input.click();
    } catch (err) {
      alert('Upload error: ' + err.message);
    }
  };

  const handleLoadModel = async () => {
    try {
      const result = await loadSexLSTMModel();
      if (result) {
        setModel(result.model);
        setMetadata(result.metadata);
        setMetrics(result.metadata.metrics || { male: null, female: null });
        alert('LSTM model loaded successfully!');
      } else {
        alert('No saved LSTM model found. Please train a model first.');
      }
    } catch (error) {
      console.error('Error loading model:', error);
      alert('Error loading model: ' + error.message);
    }
  };

  const handleDeleteModel = async () => {
    if (!confirm('Are you sure you want to delete the saved LSTM model?')) return;

    try {
      await deleteSexLSTMModel();
      setModel(null);
      setMetadata(null);
      setMetrics({ male: null, female: null });
      setForecasts([]);
      setValidationResults([]);
      alert('LSTM model deleted successfully!');
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
      await downloadSexLSTMModel(model, metadata);
      alert('LSTM model files downloaded!');
    } catch (error) {
      console.error('Error downloading model:', error);
      alert('Error downloading model: ' + error.message);
    }
  };

  const handleForecast = async () => {
    if (!model || !metadata) {
      alert('Please train or load a model first.');
      return;
    }

    try {
      setIsTraining(true);
      const { mins, maxs, lastData } = metadata;

      if (!lastData || lastData.length === 0) {
        throw new Error(
          'Model metadata is missing historical data needed for forecasting.'
        );
      }

      let currentSequence = lastData.map(row => ({
        year: row.year || metadata.lastYear - lastData.length + 1,
        male: row.male || 0,
        female: row.female || 0
      }));

      const predictions = [];
      let currentYear = metadata.lastYear;

      for (let i = 0; i < forecastYears; i++) {
        const normalized = currentSequence.map(row => ({
          male:
            (row.male - (mins?.male || 0)) /
            (((maxs?.male || 1) - (mins?.male || 0)) || 1),
          female:
            (row.female - (mins?.female || 0)) /
            (((maxs?.female || 1) - (mins?.female || 0)) || 1)
        }));

        const input = [normalized.map(row => FEATURES.map(f => row[f]))];

        // eslint-disable-next-line no-await-in-loop
        const normalizedPred = await predictSexLSTM(model, input);
        const predictedMale = denormalize(
          normalizedPred[0][0],
          mins?.male || 0,
          maxs?.male || 1
        );
        const predictedFemale = denormalize(
          normalizedPred[0][1],
          mins?.female || 0,
          maxs?.female || 1
        );

        currentYear++;
        predictions.push({
          year: currentYear.toString(),
          male: Math.round(predictedMale),
          female: Math.round(predictedFemale),
          total: Math.round(predictedMale + predictedFemale),
          isForecast: true
        });

        currentSequence = [
          ...currentSequence.slice(1),
          {
            year: currentYear,
            male: predictedMale,
            female: predictedFemale
          }
        ];
      }

      setForecasts(predictions);
      alert(`Generated ${forecastYears} year LSTM forecast!`);
    } catch (error) {
      console.error('Forecasting error:', error);
      alert('Error generating forecast: ' + error.message);
    } finally {
      setIsTraining(false);
    }
  };

  // Prepare chart data
  const historicalData = data.map(d => ({
    ...d,
    year: d.year.toString(),
    yearNum: typeof d.year === 'number' ? d.year : parseInt(d.year, 10) || 0,
    isForecast: false,
    total: (d.male || 0) + (d.female || 0)
  }));

  const forecastData = forecasts.map(f => ({
    ...f,
    year: f.year.toString(),
    yearNum: typeof f.year === 'string' ? parseInt(f.year, 10) || 0 : f.year,
    isForecast: true
  }));

  const chartData = [...historicalData, ...forecastData]
    .sort((a, b) => a.yearNum - b.yearNum)
    .map(({ yearNum, ...rest }) => rest);

  return (
    <div className="forecast-panel lstm-panel">
      {/* Title */}
      <h2>LSTM Forecasting for Sex Data</h2>
      <p>
        Predicts <strong>male</strong> and <strong>female</strong> emigrants using a
        Long Short-Term Memory (LSTM) model.
      </p>

      {/* Buttons */}
      <div className="control-buttons">
        <button onClick={handleTrain} disabled={isTraining}>
          {isTraining ? 'Training...' : 'Train LSTM Model'}
        </button>
        <button onClick={handleLoadModel} disabled={isTraining}>
          Load Model
        </button>
        <button onClick={handleUploadModel} disabled={isTraining}>
          Upload Model
        </button>
        <button onClick={handleDeleteModel} disabled={isTraining || !model}>
          Delete Model
        </button>
        <button onClick={handleDownloadModel} disabled={isTraining || !model}>
          Download Model
        </button>
      </div>

      {/* TRAINING STATUS */}
      {isTraining && trainingProgress && (
        <div className="training-progress">
          <h3>Training Progress</h3>
          <p>
            <strong>Epoch:</strong> {trainingProgress.epoch} / 100
          </p>
          <p>
            <strong>Loss:</strong> {trainingProgress.loss}
          </p>
          <p>
            <strong>MAE:</strong> {trainingProgress.mae}
          </p>
          {trainingProgress.val_loss && (
            <>
              <p>
                <strong>Val Loss:</strong> {trainingProgress.val_loss}
              </p>
              <p>
                <strong>Val MAE:</strong> {trainingProgress.val_mae}
              </p>
            </>
          )}
        </div>
      )}

      {/* METRICS + VALIDATION */}
      {(metrics.male || metrics.female || (model && !isTraining)) && (
        <>
          <div className="metrics">
            <h3>LSTM Model Performance Metrics</h3>

            <h4>Male Emigrants</h4>
            <div className="metrics-grid">
              <div className="metric-item">
                <span className="metric-label">MAE</span>
                <span className="metric-value">
                  {metrics.male?.mae ?? 'N/A'}
                </span>
              </div>
              <div className="metric-item">
                <span className="metric-label">RMSE</span>
                <span className="metric-value">
                  {metrics.male?.rmse ?? 'N/A'}
                </span>
              </div>
              <div className="metric-item">
                <span className="metric-label">MAPE</span>
                <span className="metric-value">
                  {metrics.male?.mape != null
                    ? `${metrics.male.mape}%`
                    : 'N/A'}
                </span>
              </div>
              <div className="metric-item">
                <span className="metric-label">R²</span>
                <span className="metric-value">
                  {metrics.male?.r2 ?? 'N/A'}
                </span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Accuracy</span>
                <span className="metric-value">
                  {metrics.male?.accuracy != null
                    ? `${metrics.male.accuracy}%`
                    : 'N/A'}
                </span>
              </div>
            </div>

            <h4>Female Emigrants</h4>
            <div className="metrics-grid">
              <div className="metric-item">
                <span className="metric-label">MAE</span>
                <span className="metric-value">
                  {metrics.female?.mae ?? 'N/A'}
                </span>
              </div>
              <div className="metric-item">
                <span className="metric-label">RMSE</span>
                <span className="metric-value">
                  {metrics.female?.rmse ?? 'N/A'}
                </span>
              </div>
              <div className="metric-item">
                <span className="metric-label">MAPE</span>
                <span className="metric-value">
                  {metrics.female?.mape != null
                    ? `${metrics.female.mape}%`
                    : 'N/A'}
                </span>
              </div>
              <div className="metric-item">
                <span className="metric-label">R²</span>
                <span className="metric-value">
                  {metrics.female?.r2 ?? 'N/A'}
                </span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Accuracy</span>
                <span className="metric-value">
                  {metrics.female?.accuracy != null
                    ? `${metrics.female.accuracy}%`
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {validationResults.length > 0 && (
            <div className="training-results">
              <h3>Testing Results (20% Split)</h3>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Year</th>
                      <th>Actual Male</th>
                      <th>Predicted Male</th>
                      <th>Error (Male)</th>
                      <th>Actual Female</th>
                      <th>Predicted Female</th>
                      <th>Error (Female)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validationResults.map((row, i) => (
                      <tr key={i}>
                        <td>{row.year}</td>
                        <td>{row.actualMale?.toLocaleString() ?? 'N/A'}</td>
                        <td>{row.predictedMale?.toLocaleString() ?? 'N/A'}</td>
                        <td
                          className={
                            row.errorMale >= 0
                              ? 'error-positive'
                              : 'error-negative'
                          }
                        >
                          {row.errorMale >= 0 ? '+' : ''}
                          {row.errorMale?.toLocaleString() ?? 'N/A'}
                        </td>
                        <td>{row.actualFemale?.toLocaleString() ?? 'N/A'}</td>
                        <td>{row.predictedFemale?.toLocaleString() ?? 'N/A'}</td>
                        <td
                          className={
                            row.errorFemale >= 0
                              ? 'error-positive'
                              : 'error-negative'
                          }
                        >
                          {row.errorFemale >= 0 ? '+' : ''}
                          {row.errorFemale?.toLocaleString() ?? 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* FORECAST CONTROLS */}
      {model && !isTraining && (
        <div className="forecast-controls">
          <h3>Generate LSTM Forecast</h3>
          <div className="forecast-input">
            <label>
              Years to forecast:
              <input
                type="number"
                min="1"
                max="10"
                value={forecastYears}
                onChange={e =>
                  setForecastYears(parseInt(e.target.value, 10) || 1)
                }
              />
            </label>
            <button onClick={handleForecast}>Generate Forecast</button>
          </div>
        </div>
      )}

      {/* CHART + FORECAST TABLE */}
      {chartData.length > 0 && (
        <div className="chart-container">
          <h3>Historical + LSTM Forecast: Male, Female & Total Emigrants</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" tick={{ fontSize: 12 }} />
              <YAxis
                tick={{ fontSize: 12 }}
                label={{
                  value: 'Number of Emigrants',
                  angle: -90,
                  position: 'insideLeft',
                  offset: 0,
                  style: { fontSize: 14, fontWeight: 'bold' }
                }}
              />
              <Tooltip
                formatter={value => [value.toLocaleString(), 'Emigrants']}
                labelFormatter={label => `Year: ${label}`}
              />
              <Legend verticalAlign="top" height={36} />

              {/* Historical Male */}
              <Line
                type="monotone"
                dataKey={entry => (entry.isForecast ? null : entry.male)}
                stroke="#3498db"
                strokeWidth={2}
                name="Male (Historical)"
                dot={{ r: 3 }}
                connectNulls={false}
              />

              {/* Historical Female */}
              <Line
                type="monotone"
                dataKey={entry => (entry.isForecast ? null : entry.female)}
                stroke="#ff69b4"
                strokeWidth={2}
                name="Female (Historical)"
                dot={{ r: 3 }}
                connectNulls={false}
              />

              {/* Historical Total */}
              <Line
                type="monotone"
                dataKey={entry => (entry.isForecast ? null : entry.total)}
                stroke="#4cb112ff"
                strokeWidth={2}
                name="Total (Historical)"
                dot={{ r: 3 }}
                connectNulls={false}
              />

              {/* Forecast Male */}
              <Line
                type="monotone"
                dataKey={entry => (entry.isForecast ? entry.male : null)}
                stroke="#3498db"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Male (LSTM Forecast)"
                dot={{ r: 4, fill: '#3498db' }}
                connectNulls={false}
              />

              {/* Forecast Female */}
              <Line
                type="monotone"
                dataKey={entry => (entry.isForecast ? entry.female : null)}
                stroke="#ff69b4"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Female (LSTM Forecast)"
                dot={{ r: 4, fill: '#ff69b4' }}
                connectNulls={false}
              />

              {/* Forecast Total */}
              <Line
                type="monotone"
                dataKey={entry => (entry.isForecast ? entry.total : null)}
                stroke="#4cb112ff"
                strokeWidth={2}
                name="Total (Calculated Forecast)"
                dot={{ r: 4, fill: '#4cb112ff' }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>

          {forecasts.length > 0 && (
            <div className="forecast-results">
              <h3>LSTM Forecast Results</h3>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Year</th>
                      <th>Predicted Male</th>
                      <th>Predicted Female</th>
                      <th>Calculated Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {forecasts.map((f, i) => (
                      <tr key={i}>
                        <td>{f.year}</td>
                        <td>{f.male.toLocaleString()}</td>
                        <td>{f.female.toLocaleString()}</td>
                        <td>{f.total.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* INFO SECTION */}
      <div className="info-box enhanced-info">
        <div className="info-header">
          <div className="info-icon">⚙️</div>
          <h4>LSTM Model Configuration for Sex Data</h4>
        </div>
        <ul className="info-list">
          <li>
            <span>Architecture:</span> 2 Dense / LSTM-style layers (50 units each)
          </li>
          <li>
            <span>Lookback Window:</span> {LOOKBACK} years
          </li>
          <li>
            <span>Input Features:</span> Male and Female emigrants per year
          </li>
          <li>
            <span>Outputs:</span> Next-year Male &amp; Female emigrant counts
          </li>
          <li>
            <span>Regularization:</span> Dropout 0.2
          </li>
          <li>
            <span>Epochs:</span> 100 &nbsp;·&nbsp; Validation split 20%
          </li>
          <li>
            <span>Loss:</span> Mean Squared Error (MSE)
          </li>
          <li>
            <span>Scaling:</span> Min–Max normalization per feature
          </li>
        </ul>
      </div>
    </div>
  );
}
