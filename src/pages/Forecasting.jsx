import React, { useState, useEffect, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import LSTMForecast from '../components/LSTMForecast'
import MLPForecast from '../components/MLPForecast'
import { getSexGroups } from '../services/emigrants_Sex'

export default function Forecasting() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [rawJson, setRawJson] = useState(null)
  const [selectedGroup, setSelectedGroup] = useState('All')

  const getMaleFemaleKeys = useMemo(() => {
    if (!rawJson || rawJson.length === 0) return null
    const row = rawJson[0]
    const keys = Object.keys(row)
    const maleKey = keys.find(k => /^male$/i.test(k))
    const femaleKey = keys.find(k => /^female$/i.test(k))
    return maleKey && femaleKey ? { maleKey, femaleKey } : null
  }, [rawJson])

  const hasMaleFemaleColumns = !!getMaleFemaleKeys

  const chartData = useMemo(() => {
    if (!rawJson) return data

    if (getMaleFemaleKeys) {
      const { maleKey, femaleKey } = getMaleFemaleKeys
      return rawJson
        .map(r => ({
          year: r.year,
          male: Number(r[maleKey]) || 0,
          female: Number(r[femaleKey]) || 0
        }))
        .sort((a, b) => Number(a.year) - Number(b.year))
    }

    return data
  }, [rawJson, getMaleFemaleKeys, data])

  const perGroupData = useMemo(() => {
    if (!rawJson) return null

    if (getMaleFemaleKeys) {
      return {
        male: chartData.map(r => ({ year: r.year, emigrants: r.male })),
        female: chartData.map(r => ({ year: r.year, emigrants: r.female }))
      }
    }

    return null
  }, [rawJson, getMaleFemaleKeys, chartData])

  useEffect(() => {
    const loadData = async () => {
      try {
        const rows = await getSexGroups()

        // Normalize and sort
        const normalized = rows
          .map(r => ({
            year: Number(r.year),
            male: Number(r.male) || 0,
            female: Number(r.female) || 0
          }))
          .filter(r => !Number.isNaN(r.year))
          .sort((a, b) => a.year - b.year)

        setRawJson(normalized)
        setData(normalized)
        setLoading(false)
      } catch (err) {
        console.error(err)
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return <div className="app"><h1>Loading data...</h1></div>
  }

  return (
    <>
      {/* Page Header */}
      <div className="page-heading" style={{ marginBottom: "30px" }}>
        <div className="container">
            <div className="row">
            <div className="col-lg-8">
                <div className="top-text header-text">
                <h6>Forecast Emigration Trends Using AI Models</h6>
                <h2>
                    Leverage LSTM and MLP neural networks to predict future Filipino emigrant counts and reveal insights that support data-driven decision-making.
                </h2>
                </div>
            </div>
            </div>
        </div>
    </div>


      {/* Historical Preview Chart */}
      <section className="container mb-5">
        <div className="card shadow-sm p-4">
          <h4 className="mb-4">Historical Overview (Male & Female)</h4>

          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Legend />

              {hasMaleFemaleColumns ? (
                <>
                  <Line
                    type="monotone"
                    dataKey="male"
                    stroke="#3498db"
                    strokeWidth={2}
                    name="Male"
                  />
                  <Line
                    type="monotone"
                    dataKey="female"
                    stroke="#ff69b4"
                    strokeWidth={2}
                    name="Female"
                  />
                </>
              ) : (
                <Line
                  type="monotone"
                  dataKey="emigrants"
                  stroke="#82ca9d"
                  strokeWidth={2}
                  name="Total Emigrants"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* LSTM Forecast Panel */}
      <section className="container mb-5">
        <div className="card shadow-sm p-4">
          <LSTMForecast
            data={data}
            perGroupData={perGroupData}
            selectedGroup={selectedGroup}
          />
        </div>
      </section>

      {/* MLP Forecast Panel */}
      <section className="container mb-5">
        <div className="card shadow-sm p-4">
          <MLPForecast
            data={data}
            perGroupData={perGroupData}
            selectedGroup={selectedGroup}
          />
        </div>
      </section>
    </>
  );
}
