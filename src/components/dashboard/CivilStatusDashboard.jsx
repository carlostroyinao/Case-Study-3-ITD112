import React, { useEffect, useState } from "react";
import { getEmigrants } from "../../services/emigrants_CivilStatus";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

// Auto-fill missing years in civil status dataset
const normalizeCivilStatusData = (data, allYears, keys) => {
  const yearMap = new Map(data.map((row) => [row.year, row]));

  return allYears.map((year) => {
    if (yearMap.has(year)) return yearMap.get(year);

    // If year missing → fill with zero values
    const emptyRow = { year };
    keys.forEach((key) => {
      emptyRow[key] = 0;
    });
    return emptyRow;
  });
};

const CivilStatusDashboard = () => {
  const [emigrants, setEmigrants] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [filteredYear, setFilteredYear] = useState("All");
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [chartType, setChartType] = useState("bar"); // 'bar' | 'line'

  const placeholders = {
    single: "Single",
    married: "Married",
    widower: "Widower",
    separated: "Separated",
    divorced: "Divorced",
    notReported: "Not Reported",
  };

  const allStatusKeys = Object.keys(placeholders);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      const data = await getEmigrants();
      console.log("Civil status response:", data);

      if (!Array.isArray(data) || data.length === 0) {
        setEmigrants([]);
        return;
      }

      // Extract all unique years
      const allYears = Array.from(new Set(data.map((d) => d.year))).sort(
        (a, b) => a - b
      );

      // Normalize dataset — fill missing years
      const normalized = normalizeCivilStatusData(data, allYears, allStatusKeys);

      setEmigrants(normalized);
    };

    fetchData();
  }, []);

  // Unique years for dropdown
  const years = [...new Set(emigrants.map((row) => row.year))].sort(
    (a, b) => a - b
  );

  // Filter logic
  const filteredData = emigrants.filter((row) => {
    const matchYear = filteredYear === "All" || row.year === Number(filteredYear);
    const matchRange =
      (!yearFrom || row.year >= Number(yearFrom)) &&
      (!yearTo || row.year <= Number(yearTo));
    return matchYear && matchRange;
  });

  // Chart data
  let chartData;
  if (selectedStatus === "All") {
    // Summarize totals per status
    const totals = allStatusKeys.reduce((acc, key) => {
      acc[key] = filteredData.reduce((sum, row) => sum + (row[key] || 0), 0);
      return acc;
    }, {});

    chartData = allStatusKeys.map((key) => ({
      category: placeholders[key],
      count: totals[key],
    }));
  } else {
    // Trend for one status over years
    chartData = filteredData
      .slice()
      .sort((a, b) => a.year - b.year)
      .map((row) => ({
        year: row.year,
        count: row[selectedStatus] || 0,
      }));
  }

  // Total counts badges
  const totalCounts = allStatusKeys.reduce((acc, key) => {
    acc[key] = filteredData.reduce((sum, row) => sum + (row[key] || 0), 0);
    return acc;
  }, {});

  const mainColor = "#8884d8";

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
        Emigrant Distribution by Civil Status
      </h2>

      {/* Filters */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "15px",
          marginBottom: "20px",
        }}
      >
        <div>
          <label style={{ fontWeight: "bold" }}>Filter by Year:</label>
          <select
            value={filteredYear}
            onChange={(e) => setFilteredYear(e.target.value)}
            style={{ marginLeft: "10px", padding: "6px", borderRadius: "5px" }}
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

      {/* Badges */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "10px",
          marginBottom: "20px",
        }}
      >
        {allStatusKeys.map((key) => (
          <div
            key={key}
            style={{
              background: mainColor,
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

      {/* Chart Type Toggle */}
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <button
          onClick={() => setChartType("bar")}
          style={{
            backgroundColor: chartType === "bar" ? "#007bff" : "#ccc",
            color: "white",
            border: "none",
            padding: "8px 16px",
            marginRight: "10px",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Bar Graph
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

      {/* Chart */}
      <ResponsiveContainer width="100%" height={400}>
        {chartType === "bar" ? (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={selectedStatus === "All" ? "category" : "year"} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill={mainColor} />
          </BarChart>
        ) : (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={selectedStatus === "All" ? "category" : "year"} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="count"
              stroke={mainColor}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

export default CivilStatusDashboard;
