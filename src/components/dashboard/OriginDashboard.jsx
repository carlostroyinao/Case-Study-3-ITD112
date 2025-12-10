import React, { useEffect, useState } from "react";
import { getOriginGroups } from "../../services/emigrants_Origin";
import {
  BarChart,
  Bar,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

const OriginDashboard = () => {
  const [originGroups, setOriginGroups] = useState([]);
  const [chartType, setChartType] = useState("histogram"); // 'histogram' | 'line'
  const [filteredYear, setFilteredYear] = useState("All");
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");

  const placeholders = {
    regionI: "Region I",
    regionII: "Region II",
    regionIII: "Region III",
    regionIVA: "Region IV-A",
    regionIVB: "Region IV-B",
    regionV: "Region V",
    regionVI: "Region VI",
    regionVII: "Region VII",
    regionVIII: "Region VIII",
    regionIX: "Region IX",
    regionX: "Region X",
    regionXI: "Region XI",
    regionXII: "Region XII",
    regionXIII: "Region XIII",
    armm: "ARMM",
    car: "CAR",
    ncr: "NCR",
  };

  const regionKeys = Object.keys(placeholders);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getOriginGroups();
        console.log("OriginDashboard data:", data);
        setOriginGroups(data);
      } catch (error) {
        console.error("Error fetching origin data:", error);
      }
    };
    fetchData();
  }, []);

  const years = Array.from(new Set(originGroups.map((item) => item.year))).sort();

  const filteredData = originGroups.filter((row) => {
    const matchSpecificYear =
      filteredYear === "All" || row.year === Number(filteredYear);
    const matchRange =
      (!yearFrom || row.year >= Number(yearFrom)) &&
      (!yearTo || row.year <= Number(yearTo));
    return matchSpecificYear && matchRange;
  });

  const chartData = filteredData
    .slice()
    .sort((a, b) => a.year - b.year)
    .map((row) => ({
      year: row.year,
      ...row,
    }));

  const totalCounts = regionKeys.reduce((acc, key) => {
    acc[key] = filteredData.reduce((sum, row) => sum + (row[key] || 0), 0);
    return acc;
  }, {});

  const getColor = (index) => `hsl(${(index * 35) % 360}, 60%, 55%)`;

  // Histogram (BarChart) data
  const histogramData = regionKeys.map((key) => ({
    name: placeholders[key],
    value: totalCounts[key] || 0,
  }));

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ textAlign: "center", marginBottom: "10px" }}>
        Emigrant Distribution by Region of Origin
      </h2>

      {/* Filters */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "20px",
          justifyContent: "center",
        }}
      >
        <div>
          <label style={{ fontWeight: "bold" }}>Filter by Year:</label>
          <select
            value={filteredYear}
            onChange={(e) => setFilteredYear(e.target.value)}
            style={{ marginLeft: "10px", padding: "5px" }}
          >
            <option value="All">All Years</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontWeight: "bold" }}>Year Range:</label>
          <input
            type="number"
            placeholder="From"
            value={yearFrom}
            onChange={(e) => setYearFrom(e.target.value)}
            style={{ width: "90px", margin: "0 5px", padding: "5px" }}
          />
          <input
            type="number"
            placeholder="To"
            value={yearTo}
            onChange={(e) => setYearTo(e.target.value)}
            style={{ width: "90px", padding: "5px" }}
          />
        </div>
      </div>

      {/* Chart Type Switch */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "10px",
          marginBottom: "20px",
        }}
      >
        <button
          onClick={() => setChartType("histogram")}
          style={{
            backgroundColor: chartType === "histogram" ? "#007bff" : "#ccc",
            color: "white",
            border: "none",
            padding: "8px 16px",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Histogram Graph
        </button>
        <button
          onClick={() => setChartType("line")}
          style={{
            backgroundColor: chartType === "line" ? "#007bff" : "#ccc",
            color: "white",
            border: "none",
            padding: "8px 16px",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Line Graph
        </button>
      </div>

      {/* Total Counts Badges */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          marginBottom: "20px",
          gap: "10px",
        }}
      >
        {regionKeys.map((key, index) => (
          <div
            key={key}
            style={{
              background: getColor(index),
              color: "white",
              padding: "8px 12px",
              borderRadius: "20px",
              fontSize: "14px",
            }}
          >
            {placeholders[key]}: {totalCounts[key] || 0}
          </div>
        ))}
      </div>

      {/* Chart Visualization */}
      <ResponsiveContainer width="100%" height={450}>
        {chartType === "histogram" ? (
          <BarChart data={histogramData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              angle={-45}
              textAnchor="end"
              interval={0}
              height={100}
            />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" name="Number of Emigrants">
              {histogramData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(index)} />
              ))}
            </Bar>
          </BarChart>
        ) : (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip />
            <Legend />
            {regionKeys.map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                name={placeholders[key]}
                stroke={getColor(index)}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

export default OriginDashboard;
