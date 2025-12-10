import React, { useEffect, useState } from "react";
import { getAllCountriesGroups } from "../../services/emigrants_AllCountries";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";
import { scaleLinear } from "d3-scale";
import { Tooltip as ReactTooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const continentMap = {
  Philippines: "Asia", Afghanistan: "Asia", Albania: "Europe", Algeria: "Africa", Angola: "Africa",
  Antarctica: "Antarctica", Argentina: "South America", Armenia: "Asia", Australia: "Oceania",
  Austria: "Europe", Azerbaijan: "Asia", Bahamas: "North America", Bangladesh: "Asia",
  Belarus: "Europe", Belgium: "Europe", Belize: "North America", Benin: "Africa",
  Bhutan: "Asia", Bolivia: "South America", "Bosnia and Herzegovina": "Europe",
  Botswana: "Africa", Brazil: "South America", "Brunei Darussalam": "Asia", Bulgaria: "Europe",
  Burkina: "Africa", Burundi: "Africa", Cambodia: "Asia", Cameroon: "Africa", Canada: "North America",
  "Central African Republic": "Africa", Chad: "Africa", Chile: "South America", China: "Asia",
  Colombia: "South America", "Costa Rica": "North America", "Ivory Coast": "Africa",
  Croatia: "Europe", Cuba: "North America", Cyprus: "Europe", "Czech Republic": "Europe",
  "Democratic Republic of the Congo": "Africa", Denmark: "Europe", Djibouti: "Africa",
  "Dominican Republic": "North America", Ecuador: "South America", Egypt: "Africa",
  "El Salvador": "North America", "Equatorial Guinea": "Africa", Eritrea: "Africa", Estonia: "Europe",
  Ethiopia: "Africa", "Falkland Islands": "South America", Fiji: "Oceania",
  Finland: "Europe", France: "Europe", "French Southern and Antarctic Lands": "Antarctica",
  Gabon: "Africa", Gambia: "Africa", Georgia: "Europe", Germany: "Europe", Ghana: "Africa",
  Greece: "Europe", Greenland: "North America", Guatemala: "North America", "Guinea Bissau": "Africa",
  Guyana: "South America", Haiti: "North America", Honduras: "North America", Hungary: "Europe",
  Iceland: "Europe", India: "Asia", Indonesia: "Asia", Iran: "Asia", Iraq: "Asia", Ireland: "Europe",
  Israel: "Asia", Italy: "Europe", Jamaica: "North America", Japan: "Asia", Jordan: "Asia",
  Kazakhstan: "Asia", Kenya: "Africa", Kosovo: "Europe", Kuwait: "Asia", Kyrgyzstan: "Asia",
  Laos: "Asia", Latvia: "Europe", Lebanon: "Asia", Lesotho: "Africa", Liberia: "Africa", Libya: "Africa",
  Lithuania: "Europe", Luxembourg: "Europe", Macedonia: "Europe", Madagascar: "Africa", Malawi: "Africa",
  Malaysia: "Asia", Mali: "Africa", Mauritania: "Africa", Mexico: "North America", Moldova: "Europe",
  Mongolia: "Asia", Montenegro: "Europe", Morocco: "Africa", Mozambique: "Africa", "Myanmar": "Asia",
  Namibia: "Africa", Nepal: "Asia", Netherlands: "Europe", "New Caledonia": "Oceania", "New Zealand": "Oceania",
  Nicaragua: "North America", Niger: "Africa", Nigeria: "Africa", "Northern Cyprus": "Europe", "North Korea": "Asia",
  Norway: "Europe", Oman: "Asia", Pakistan: "Asia", Panama: "North America", "Papua New Guinea": "Oceania",
  Paraguay: "South America", Peru: "South America", Poland: "Europe", Portugal: "Europe", "Puerto Rico": "North America",
  Qatar: "Asia", "Republic Of the Congo": "Africa", "Republic of Serbia": "Europe", Romania: "Europe",
  "Russian Federation": "Europe", Rwanda: "Africa", "Saudi Arabia": "Asia", Senegal: "Africa",
  "Sierra Leone": "Africa", "Slovak Republic": "Europe", Slovenia: "Europe", "Solomon Islands": "Oceania",
  Somalia: "Africa", Somaliland: "Africa", "South Africa": "Africa", "South Korea": "Asia", "South Sudan": "Africa",
  Spain: "Europe", "Sri Lanka": "Asia", Sudan: "Africa", Suriname: "South America", Sweden: "Europe",
  Switzerland: "Europe", Syria: "Asia", Tajikistan: "Asia", Taiwan: "Asia", Thailand: "Asia", Togo: "Africa",
  "Trinidad and Tobago": "North America", Tunisia: "Africa", Turkey: "Europe", Turkmenistan: "Asia",
  Uganda: "Africa", Ukraine: "Europe", "United Arab Emirates": "Asia", "United Kingdom": "Europe",
  "United Republic of Tanzania": "Africa", "United States of America": "North America", Uruguay: "South America",
  Uzbekistan: "Asia", Vanuatu: "Oceania", Venezuela: "South America", Vietnam: "Asia", "West Bank": "Asia",
  "Western Sahara": "Africa", Yemen: "Asia", Zambia: "Africa", Zimbabwe: "Africa"
};

const AllCountriesDashboard = () => {
  const [allCountriesGroups, setAllCountriesGroups] = useState([]);
  const [filteredYear, setFilteredYear] = useState("All");
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [selectedContinent, setSelectedContinent] = useState("All");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getAllCountriesGroups();
        console.log("AllCountriesDashboard data:", data);
        setAllCountriesGroups(data);
      } catch (err) {
        console.error("Error fetching All Countries data:", err);
      }
    };
    fetchData();
  }, []);

  const countries = Object.keys(continentMap);
  const years = Array.from(new Set(allCountriesGroups.map((i) => i.year))).sort();

  // Filter data
  const filteredData = allCountriesGroups.filter((row) => {
    const matchSpecificYear =
      filteredYear === "All" || row.year === Number(filteredYear);
    const matchRange =
      (!yearFrom || row.year >= Number(yearFrom)) &&
      (!yearTo || row.year <= Number(yearTo));
    return matchSpecificYear && matchRange;
  });

  // Get selected countries by continent
  const filteredCountries =
    selectedContinent === "All"
      ? countries
      : countries.filter((c) => continentMap[c] === selectedContinent);

  // Compute totals per country
  const totalCounts = filteredCountries.reduce((acc, country) => {
    acc[country] = filteredData.reduce(
      (sum, row) => sum + (row[country] || 0),
      0
    );
    return acc;
  }, {});

  const countryData = filteredCountries.map((country) => ({
    name: country,
    value: totalCounts[country] || 0,
  }));

  const totalEmigrants = Object.values(totalCounts).reduce((a, b) => a + b, 0);

  const colorScale = scaleLinear()
    .domain([0, Math.max(...countryData.map((d) => d.value)) || 1])
    .range(["#E0F7FA", "#006064"]);

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ textAlign: "center", marginBottom: "10px" }}>
        Emigrant Distribution by Country
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

        <div>
          <label style={{ fontWeight: "bold" }}>Filter by Continent:</label>
          <select
            value={selectedContinent}
            onChange={(e) => setSelectedContinent(e.target.value)}
            style={{ marginLeft: "10px", padding: "5px" }}
          >
            <option value="All">All</option>
            <option value="Asia">Asia</option>
            <option value="Europe">Europe</option>
            <option value="Africa">Africa</option>
            <option value="North America">North America</option>
            <option value="South America">South America</option>
            <option value="Oceania">Oceania</option>
            <option value="Antarctica">Antarctica</option>
          </select>
        </div>
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

      {/* 🔹 Choropleth Map Only */}
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
    </div>
  );
};

export default AllCountriesDashboard;
