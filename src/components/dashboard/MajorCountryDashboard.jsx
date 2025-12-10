import React, { useEffect, useState } from "react";
import { getMajorCountryGroups } from "../../services/emigrants_MajorCountry";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";
import { scaleLinear } from "d3-scale";
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
import { Tooltip as ReactTooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const MajorCountryDashboard = () => {
  const [majorCountryGroups, setMajorCountryGroups] = useState([]);
  const [filteredYear, setFilteredYear] = useState("All");
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [chartType, setChartType] = useState("map"); // 'map' | 'bar'

  const placeholders = {
    usa: "United States of America",
    canada: "Canada",
    japan: "Japan",
    australia: "Australia",
    italy: "Italy",
    newZealand: "New Zealand",
    unitedKingdom: "United Kingdom",
    germany: "Germany",
    southKorea: "South Korea",
    spain: "Spain",
    others: "Others",
  };

  const countryKeys = Object.keys(placeholders);

  // 🔹 Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getMajorCountryGroups();
        console.log("MajorCountryDashboard data:", data);
        setMajorCountryGroups(data);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };
    fetchData();
  }, []);

  const years = Array.from(new Set(majorCountryGroups.map((i) => i.year))).sort();

  // 🔹 Filter by year or range
  const filteredData = majorCountryGroups.filter((row) => {
    const matchSpecificYear =
      filteredYear === "All" || row.year === Number(filteredYear);
    const matchRange =
      (!yearFrom || row.year >= Number(yearFrom)) &&
      (!yearTo || row.year <= Number(yearTo));
    return matchSpecificYear && matchRange;
  });

  // 🔹 Compute totals
  const totalCounts = countryKeys.reduce((acc, key) => {
    acc[key] = filteredData.reduce((sum, row) => sum + (row[key] || 0), 0);
    return acc;
  }, {});

  // 🔹 Data for charts
  const countryData = Object.entries(placeholders).map(([key, name]) => ({
    name,
    value: totalCounts[key] || 0,
  }));

  // 🔹 Color scale
  const colorScale = scaleLinear()
    .domain([0, Math.max(...countryData.map((d) => d.value)) || 1])
    .range(["#E0F7FA", "#006064"]);

  const totalEmigrants = Object.values(totalCounts).reduce((a, b) => a + b, 0);

  const getColor = (index) => `hsl(${(index * 36) % 360}, 70%, 50%)`;

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ textAlign: "center", marginBottom: "10px" }}>
        Emigrant Distribution by Major Country
      </h2>

      {/* 🔹 Filters */}
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

      {/* 🔹 Chart Type Switch */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "10px",
          marginBottom: "20px",
        }}
      >
        <button
          onClick={() => setChartType("map")}
          style={{
            backgroundColor: chartType === "map" ? "#007bff" : "#ccc",
            color: "white",
            border: "none",
            padding: "8px 16px",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Choropleth Map
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

      {/* 🔹 Total Count Badges */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          marginBottom: "20px",
          gap: "10px",
        }}
      >
        {countryData.map((country, index) => (
          <div
            key={country.name}
            style={{
              background: getColor(index),
              color: "white",
              padding: "8px 12px",
              borderRadius: "20px",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            {country.name}: {country.value.toLocaleString()}
          </div>
        ))}
      </div>

      {/* 🔹 Total Summary */}
      <div
        style={{
          textAlign: "center",
          fontSize: "18px",
          fontWeight: "bold",
          marginBottom: "15px",
          background: "#f9f9f9",
          width: "fit-content",
          margin: "0 auto 20px auto",
          padding: "10px 25px",
          borderRadius: "8px",
          boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
        }}
      >
        Total Emigrants: {totalEmigrants.toLocaleString()}
      </div>

      {/* 🔹 Conditional Chart Rendering */}
      {chartType === "map" ? (
        <div style={{ width: "100%", height: "600px", position: "relative" }}>
          <ComposableMap projectionConfig={{ scale: 150 }} width={980} height={500}>
            <ZoomableGroup>
              <Geographies geography={geoUrl}>
                {({ geographies }) =>
                  geographies.map((geo) => {
                    const countryName = geo.properties.name;
                    const countryInfo = countryData.find(
                      (c) =>
                        c.name.toLowerCase() === countryName.toLowerCase() ||
                        (c.name === "United States of America" &&
                          countryName === "United States")
                    );
                    const value = countryInfo ? countryInfo.value : 0;
                    const tooltipText = `${countryName}: ${value.toLocaleString()} emigrants`;

                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={value ? colorScale(value) : "#EEE"}
                        stroke="#FFF"
                        data-tooltip-id="map-tooltip"
                        data-tooltip-content={tooltipText}
                        style={{
                          default: { outline: "none" },
                          hover: { fill: "#FFB300", outline: "none" },
                          pressed: { outline: "none" },
                        }}
                      />
                    );
                  })
                }
              </Geographies>
            </ZoomableGroup>
          </ComposableMap>

          <ReactTooltip id="map-tooltip" place="top" />
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={500}>
          <BarChart data={countryData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-30} textAnchor="end" interval={0} height={70} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value">
              {countryData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(index)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default MajorCountryDashboard;
