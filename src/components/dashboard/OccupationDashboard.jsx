import React, { useEffect, useState } from "react";
import { getOccupationGroups } from "../../services/emigrants_Occupation";
import {
  ResponsiveContainer,
  Treemap,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

const OccupationDashboard = () => {
  const [occupationGroups, setOccupationGroups] = useState([]);
  const [filteredYear, setFilteredYear] = useState("All");
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [chartType, setChartType] = useState("treemap");

  const occupationKeys = [
    "professional",
    "administrative",
    "clerical",
    "sales",
    "service",
    "agriculture",
    "production",
    "armedForces",
    "housewives",
    "retirees",
    "students",
    "minors",
    "outOfSchool",
    "refugees",
    "noOccupationReported",
  ];

  const placeholders = {
    professional: "Professional",
    administrative: "Administrative",
    clerical: "Clerical",
    sales: "Sales",
    service: "Service",
    agriculture: "Agriculture",
    production: "Production",
    armedForces: "Armed Forces",
    housewives: "Housewives",
    retirees: "Retirees",
    students: "Students",
    minors: "Minors",
    outOfSchool: "Out of School",
    refugees: "Refugees",
    noOccupationReported: "No Occupation Reported",
  };

  const employedKeys = [
    "professional",
    "administrative",
    "clerical",
    "sales",
    "service",
    "agriculture",
    "production",
    "armedForces",
  ];
  const unemployedKeys = [
    "housewives",
    "retirees",
    "students",
    "minors",
    "outOfSchool",
    "refugees",
  ];
  const noOccupationKeys = ["noOccupationReported"];

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

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getOccupationGroups();
        console.log("OccupationDashboard data:", data);
        setOccupationGroups(data);
      } catch (error) {
        console.error("Error fetching occupation data:", error);
      }
    };
    fetchData();
  }, []);

  // Unique years
  const years = [...new Set(occupationGroups.map((row) => row.year))].sort(
    (a, b) => a - b
  );

  // Filter data
  const filteredData = occupationGroups.filter((row) => {
    const matchSpecificYear =
      filteredYear === "All" || row.year === Number(filteredYear);
    const matchRange =
      (!yearFrom || row.year >= Number(yearFrom)) &&
      (!yearTo || row.year <= Number(yearTo));
    return matchSpecificYear && matchRange;
  });

  // Total counts per occupation
  const totalCounts = occupationKeys.reduce((acc, key) => {
    acc[key] = filteredData.reduce((sum, row) => sum + (row[key] || 0), 0);
    return acc;
  }, {});

  // Treemap data
  const treemapData = [
    {
      name: "Employed",
      children: employedKeys.map((key) => ({
        name: placeholders[key],
        size: totalCounts[key],
      })),
    },
    {
      name: "Unemployed",
      children: unemployedKeys.map((key) => ({
        name: placeholders[key],
        size: totalCounts[key],
      })),
    },
    {
      name: "No Occupation Reported",
      children: noOccupationKeys.map((key) => ({
        name: placeholders[key],
        size: totalCounts[key],
      })),
    },
  ];

  // Bar chart data
  const barChartData = occupationKeys.map((key, index) => ({
    name: placeholders[key],
    count: totalCounts[key],
    fill: colors[index % colors.length],
  }));

  const getColor = (index) => colors[index % colors.length];

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ textAlign: "center", marginBottom: "10px" }}>
        Emigrant Distribution by Occupation
      </h2>

      {/* --- Filters --- */}
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

      {/* --- Summary Counts (badge style) --- */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          marginBottom: "20px",
          gap: "10px",
        }}
      >
        {occupationKeys.map((key, index) => (
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

      {/* --- Chart Type Toggle --- */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "10px",
          marginBottom: "20px",
        }}
      >
        <button
          onClick={() => setChartType("treemap")}
          style={{
            backgroundColor: chartType === "treemap" ? "#007bff" : "#ccc",
            color: "white",
            border: "none",
            padding: "8px 16px",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Treemap
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

      {/* --- Chart Display --- */}
      {chartType === "treemap" ? (
        <ResponsiveContainer width="100%" height={450}>
          <Treemap
            data={treemapData}
            dataKey="size"
            nameKey="name"
            ratio={4 / 3}
            stroke="#000000ff"
            fill="#8884d8"
            content={(props) => {
              const { x, y, width, height, name, fill } = props;
              return (
                <g>
                  <rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    style={{ fill, stroke: "#000000ff" }}
                  />
                  {width > 40 && height > 20 && (
                    <text
                      x={x + width / 2}
                      y={y + height / 2}
                      textAnchor="middle"
                      fill="#000000ff"
                      fontSize={12}
                      fontWeight="bold"
                    >
                      {name}
                    </text>
                  )}
                </g>
              );
            }}
          />
        </ResponsiveContainer>
      ) : (
        <ResponsiveContainer width="100%" height={450}>
          <BarChart data={barChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-30} textAnchor="end" height={80} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count">
              {barChartData.map((entry, index) => (
                <cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default OccupationDashboard;
