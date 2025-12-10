import React, { useEffect, useState } from "react";
import { getSexGroups } from "../../services/emigrants_Sex";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

const SexDashboard = () => {
  const [sexGroups, setSexGroups] = useState([]);
  const [filteredYear, setFilteredYear] = useState("All");
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [chartType, setChartType] = useState("pie");

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getSexGroups();
        console.log("SexDashboard data:", data);
        setSexGroups(data);
      } catch (error) {
        console.error("Error fetching sex data:", error);
      }
    };
    fetchData();
  }, []);

  // Filter data based on year and range
  const filteredData = sexGroups.filter((row) => {
    const matchSpecificYear =
      filteredYear === "All" || row.year === Number(filteredYear);
    const matchRange =
      (!yearFrom || row.year >= Number(yearFrom)) &&
      (!yearTo || row.year <= Number(yearTo));
    return matchSpecificYear && matchRange;
  });

  // Total counts
  const totalMale = filteredData.reduce((sum, r) => sum + (r.male || 0), 0);
  const totalFemale = filteredData.reduce((sum, r) => sum + (r.female || 0), 0);
  const grandTotal = totalMale + totalFemale;

  // Bar chart data
  const chartData = filteredData
    .slice()
    .sort((a, b) => a.year - b.year)
    .map((row) => ({
      year: row.year,
      male: row.male || 0,
      female: row.female || 0,
      total: (row.male || 0) + (row.female || 0),
    }));

  // Donut chart data
  const pieData = [
    { name: "Male", value: totalMale },
    { name: "Female", value: totalFemale },
  ];

  const years = [...new Set(sexGroups.map((row) => row.year))].sort(
    (a, b) => b - a
  );

  const COLORS = ["#5850f8ff", "#fab2b2ff"];
  const getColor = (index) => COLORS[index % COLORS.length];

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ textAlign: "center", marginBottom: "10px" }}>
        Emigrant Distribution by Sex
      </h2>

      {/* --- Filters Section --- */}
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

      {/* --- Chart Type Tabs --- */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "10px",
          marginBottom: "20px",
        }}
      >
        <button
          onClick={() => setChartType("pie")}
          style={{
            backgroundColor: chartType === "pie" ? "#007bff" : "#ccc",
            color: "white",
            border: "none",
            padding: "8px 16px",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Donut Chart
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

      {/* --- Summary Counts --- */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          marginBottom: "20px",
          gap: "10px",
        }}
      >
        <div
          style={{
            background: getColor(0),
            color: "white",
            padding: "8px 12px",
            borderRadius: "20px",
            fontSize: "14px",
          }}
        >
          Male: {totalMale.toLocaleString()}
        </div>
        <div
          style={{
            background: getColor(1),
            color: "white",
            padding: "8px 12px",
            borderRadius: "20px",
            fontSize: "14px",
          }}
        >
          Female: {totalFemale.toLocaleString()}
        </div>
        <div
          style={{
            background: "#00C49F",
            color: "white",
            padding: "8px 12px",
            borderRadius: "20px",
            fontSize: "14px",
          }}
        >
          Total: {grandTotal.toLocaleString()}
        </div>
      </div>

      {/* --- Chart Section --- */}
      <ResponsiveContainer width="100%" height={450}>
        {chartType === "bar" ? (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="male" fill={getColor(0)} name="Male" />
            <Bar dataKey="female" fill={getColor(1)} name="Female" />
          </BarChart>
        ) : (
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={100}
              outerRadius={160}
              fill="#5850f8ff"
              paddingAngle={5}
              dataKey="value"
              nameKey="name"
              label={({ name, value }) =>
                `${name}: ${((value / grandTotal) * 100).toFixed(1)}%`
              }
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(index)} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => value.toLocaleString()}
              contentStyle={{ borderRadius: "10px" }}
            />
            <Legend />
          </PieChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

export default SexDashboard;
