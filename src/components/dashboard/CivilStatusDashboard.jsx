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

const CivilStatusDashboard = () => {
  const [emigrants, setEmigrants] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [filteredYear, setFilteredYear] = useState("All");
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [chartType, setChartType] = useState("bar");

  const placeholders = {
    single: "Single",
    married: "Married",
    widower: "Widower",
    separated: "Separated",
    divorced: "Divorced",
    notReported: "Not Reported",
  };

  const allStatusKeys = Object.keys(placeholders);

  // Automatically fix Recharts width issue when component becomes visible
  useEffect(() => {
    const delayResize = setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 150);

    return () => clearTimeout(delayResize);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const data = await getEmigrants();
      setEmigrants(data);
    };
    fetchData();
  }, []);

  const years = [...new Set(emigrants.map((row) => row.year))].sort((a, b) => a - b);

  const filteredData = emigrants.filter((row) => {
    const matchYear = filteredYear === "All" || row.year === Number(filteredYear);
    const matchRange =
      (!yearFrom || row.year >= Number(yearFrom)) &&
      (!yearTo || row.year <= Number(yearTo));
    return matchYear && matchRange;
  });

  let chartData;

  // ALL STATUS (category view)
  if (selectedStatus === "All") {
    const totals = allStatusKeys.reduce((acc, key) => {
      acc[key] = filteredData.reduce((sum, row) => sum + (row[key] || 0), 0);
      return acc;
    }, {});

    chartData = allStatusKeys.map((key) => ({
      category: placeholders[key],
      count: totals[key],
    }));
  }

  // SINGLE STATUS (year trend view)
  else {
    chartData = filteredData
      .slice()
      .sort((a, b) => a.year - b.year)
      .map((row) => ({
        year: row.year,
        count: row[selectedStatus] || 0,
      }));
  }

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
        {/* Year Filter */}
        <div>
          <label style={{ fontWeight: "bold" }}>Filter by Year:</label>
          <select
            value={filteredYear}
            onChange={(e) => setFilteredYear(e.target.value)}
            style={{ marginLeft: "10px", padding: "6px", borderRadius: "5px" }}
          >
            <option value="All">All Years</option>
            {years.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        {/* Year Range */}
        <div>
          <label style={{ fontWeight: "bold" }}>Year Range:</label>
          <input
            type="number"
            placeholder="From"
            value={yearFrom}
            onChange={(e) => setYearFrom(e.target.value)}
            style={{ width: "90px", margin: "0 5px", padding: "6px" }}
          />
          <input
            type="number"
            placeholder="To"
            value={yearTo}
            onChange={(e) => setYearTo(e.target.value)}
            style={{ width: "90px", padding: "6px" }}
          />
        </div>

        {/* Status selector */}
        <div>
          <label style={{ fontWeight: "bold" }}>Civil Status:</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{ marginLeft: "10px", padding: "6px", borderRadius: "5px" }}
          >
            <option value="All">All</option>
            {allStatusKeys.map((key) => (
              <option key={key} value={key}>{placeholders[key]}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Totals Badges */}
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

      {/* Chart Tabs */}
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
      <div style={{ width: "100%", height: 400 }}>
        <ResponsiveContainer width="100%" height="100%">
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
    </div>
  );
};

export default CivilStatusDashboard;
