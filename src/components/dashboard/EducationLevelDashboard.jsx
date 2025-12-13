import React, { useEffect, useState } from "react";
import { getEducationLevels } from "../../services/emigrants_EducationLevel";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
} from "recharts";

const EducationLevelDashboard = () => {
  const [educationLevels, setEducationLevels] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState("All");
  const [filteredYear, setFilteredYear] = useState("All");
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [chartType, setChartType] = useState("horizontalStackedBar");

  const levelKeys = [
    "notOfSchoolingAge",
    "noFormalEducation",
    "elementaryLevel",
    "elementaryGraduate",
    "highSchoolLevel",
    "highSchoolGraduate",
    "vocationalLevel",
    "vocationalGraduate",
    "collegeLevel",
    "collegeGraduate",
    "postGraduateLevel",
    "postGraduate",
    "nonFormalEducation",
    "notReported",
  ];

  const placeholders = {
    notOfSchoolingAge: "Not of Schooling Age",
    noFormalEducation: "No Formal Education",
    elementaryLevel: "Elementary Level",
    elementaryGraduate: "Elementary Graduate",
    highSchoolLevel: "High School Level",
    highSchoolGraduate: "High School Graduate",
    vocationalLevel: "Vocational Level",
    vocationalGraduate: "Vocational Graduate",
    collegeLevel: "College Level",
    collegeGraduate: "College Graduate",
    postGraduateLevel: "Post Graduate Level",
    postGraduate: "Post Graduate",
    nonFormalEducation: "Non-Formal Education",
    notReported: "Not Reported",
  };

  const colors = [
    "#8884d8",
    "#82ca9d",
    "#ffc658",
    "#ff7f50",
    "#8dd1e1",
    "#a4de6c",
    "#d0ed57",
    "#ffbb28",
    "#ff8042",
    "#00C49F",
    "#0088FE",
    "#FF69B4",
    "#CD5C5C",
    "#A0522D",
  ];

  const [educationData, setEducationData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const data = await getEducationLevels();
      setEducationData(data);
    };
    fetchData();
  }, []);

  // Unique years
  const years = [...new Set(educationData.map((row) => row.year))].sort(
    (a, b) => a - b
  );

  // Filter data
  const filteredData = educationData.filter((row) => {
    const matchYear =
      filteredYear === "All" || row.year === Number(filteredYear);
    const matchRange =
      (!yearFrom || row.year >= Number(yearFrom)) &&
      (!yearTo || row.year <= Number(yearTo));
    return matchYear && matchRange;
  });

  // Chart data
  const displayKeys = selectedLevel === "All" ? levelKeys : [selectedLevel];
  let chartData;
  if (selectedLevel === "All") {
    const totals = displayKeys.reduce((acc, key) => {
      acc[key] = filteredData.reduce(
        (sum, row) => sum + Number(row[key] ?? 0),
        0
      );
      return acc;
    }, {});
    chartData = displayKeys.map((key, index) => ({
      name: placeholders[key],
      value: totals[key],
      color: colors[index % colors.length],
    }));
  } else {
    chartData = filteredData
      .slice()
      .sort((a, b) => a.year - b.year)
      .map((row) => ({
        year: row.year,
        count: Number(row[selectedLevel] ?? 0),
        color:
          colors[levelKeys.indexOf(selectedLevel) % colors.length] ||
          "#47fd7eff",
      }));
  }

  // Total counts for badges
  const totalCounts = displayKeys.reduce((acc, key) => {
    acc[key] = filteredData.reduce(
      (sum, row) => sum + Number(row[key] ?? 0),
      0
    );
    return acc;
  }, {});

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
        Emigrant Distribution by Education Level
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

      {/* Total counts badges */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "10px",
          marginBottom: "20px",
        }}
      >
        {displayKeys.map((key, index) => (
          <div
            key={key}
            style={{
              background: colors[index % colors.length],
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

      {/* Chart Type Tabs */}
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <button
          onClick={() => setChartType("horizontalStackedBar")}
          style={{
            backgroundColor:
              chartType === "horizontalStackedBar" ? "#007bff" : "#ccc",
            color: "white",
            border: "none",
            padding: "8px 16px",
            marginRight: "10px",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Horizontal Stacked Bar Graph
        </button>
        <button
          onClick={() => setChartType("bar")}
          style={{
            backgroundColor: chartType === "bar" ? "#007bff" : "#ccc",
            color: "white",
            border: "none",
            padding: "8px 16px",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Bar Graph
        </button>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={400}>
        {chartType === "bar" || selectedLevel !== "All" ? (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={selectedLevel === "All" ? "name" : "year"} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar
              dataKey={selectedLevel === "All" ? "value" : "count"}
              name={selectedLevel === "All" ? "Total" : placeholders[selectedLevel]}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        ) : (
          <BarChart
            layout="vertical"
            data={chartData}
            margin={{ top: 20, right: 50, left: 50, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis type="category" dataKey="name" />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" stackId="a">
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

export default EducationLevelDashboard;
