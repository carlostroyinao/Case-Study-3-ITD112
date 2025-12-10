import React, { useEffect, useState } from "react";
import {
  addAllCountriesGroup,
  getAllCountriesGroups,
  updateAllCountriesGroup,
  deleteAllCountriesGroup,
} from "../../services/emigrants_AllCountries";
import { FaEdit, FaTrash } from "react-icons/fa";

// Continent mapping
const continentMap = {
  Philippines: "Asia", Afghanistan: "Asia", Albania: "Europe", Algeria: "Africa",
  Angola: "Africa", Antarctica: "Antarctica", Argentina: "South America",
  Armenia: "Asia", Australia: "Oceania", Austria: "Europe", Azerbaijan: "Asia",
  Bahamas: "North America", Bangladesh: "Asia", Belarus: "Europe", Belgium: "Europe",
  Belize: "North America", Benin: "Africa", Bhutan: "Asia", Bolivia: "South America",
  "Bosnia and Herzegovina": "Europe", Botswana: "Africa", Brazil: "South America",
  "Brunei Darussalam": "Asia", Bulgaria: "Europe", Burkina: "Africa", Burundi: "Africa",
  Cambodia: "Asia", Cameroon: "Africa", Canada: "North America", "Central African Republic": "Africa",
  Chad: "Africa", Chile: "South America", China: "Asia", Colombia: "South America",
  "Costa Rica": "North America", "Ivory Coast": "Africa", Croatia: "Europe", Cuba: "North America",
  Cyprus: "Europe", "Czech Republic": "Europe", "Democratic Republic of the Congo": "Africa",
  Denmark: "Europe", Djibouti: "Africa", "Dominican Republic": "North America", Ecuador: "South America",
  Egypt: "Africa", "El Salvador": "North America", "Equatorial Guinea": "Africa", Eritrea: "Africa",
  Estonia: "Europe", Ethiopia: "Africa", "Falkland Islands": "South America", Fiji: "Oceania",
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
  Mongolia: "Asia", Montenegro: "Europe", Morocco: "Africa", Mozambique: "Africa", Myanmar: "Asia",
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

const AllCountriesTable = () => {
  const countries = Object.keys(continentMap);

  const [data, setData] = useState([]);
  const [form, setForm] = useState(
    Object.fromEntries(["year", ...countries].map((c) => [c, ""]))
  );

  const [filteredYear, setFilteredYear] = useState("All");
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [selectedContinent, setSelectedContinent] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [editId, setEditId] = useState(null);

  // --- Fetch Data ---
  const fetchData = async () => {
    const res = await getAllCountriesGroups();
    setData(res);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // --- Add or Update ---
  const handleAddOrUpdate = async () => {
    const payload = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [key, Number(value) || 0])
    );

    if (editId) {
      await updateAllCountriesGroup(editId, payload);
    } else {
      await addAllCountriesGroup(payload);
    }

    setForm(Object.fromEntries(Object.keys(form).map((k) => [k, ""])));
    setEditId(null);
    setShowModal(false);
    fetchData();
  };

  const handleEdit = (row) => {
    setForm(row);
    setEditId(row.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    await deleteAllCountriesGroup(id);
    fetchData();
  };

  // --- Delete All Records ---
  const handleDeleteAll = () => {
    if (!data.length) return;
    setShowDeleteAllModal(true);
  };

  const handleConfirmDeleteAll = async () => {
    if (!data.length) {
      setShowDeleteAllModal(false);
      return;
    }
    await Promise.all(data.map((row) => deleteAllCountriesGroup(row.id)));
    setShowDeleteAllModal(false);
    fetchData();
  };

  // --- Filters ---
  const filteredData = data.filter((row) => {
    if (filteredYear !== "All" && row.year !== Number(filteredYear)) return false;
    if (yearFrom && row.year < Number(yearFrom)) return false;
    if (yearTo && row.year > Number(yearTo)) return false;
    return true;
  });

  const filteredCountries =
    selectedContinent === "All"
      ? countries
      : countries.filter((c) => continentMap[c] === selectedContinent);

  const years = [...new Set(data.map((d) => d.year))].sort((a, b) => b - a);

  return (
    <div style={{ padding: 10 }}>
      {/* Filters */}
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "20px" }}>
        <div>
          <label style={{ fontWeight: "bold" }}>Filter by Year:</label>
          <select value={filteredYear} onChange={(e) => setFilteredYear(e.target.value)} style={{ marginLeft: "10px", padding: "5px" }}>
            <option value="All">All Years</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <div>
          <label style={{ fontWeight: "bold" }}>Year Range:</label>
          <input type="number" placeholder="From" value={yearFrom} onChange={(e) => setYearFrom(e.target.value)} style={{ width: "90px", margin: "0 5px", padding: "5px" }} />
          <input type="number" placeholder="To" value={yearTo} onChange={(e) => setYearTo(e.target.value)} style={{ width: "90px", padding: "5px" }} />
        </div>

        <div>
          <label style={{ fontWeight: "bold" }}>Filter by Continent:</label>
          <select value={selectedContinent} onChange={(e) => setSelectedContinent(e.target.value)} style={{ marginLeft: "10px", padding: "5px" }}>
            <option value="All">All</option>
            {["Asia","Europe","Africa","North America","South America","Oceania","Antarctica"].map((cont) => (
              <option key={cont} value={cont}>{cont}</option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", marginLeft: "auto" }}>
          <button
            onClick={() => { setForm(Object.fromEntries(Object.keys(form).map((k) => [k,""]))); setEditId(null); setShowModal(true); }}
            style={{ backgroundColor: "#007bff", color: "#fff", padding: "8px 16px", border: "none", borderRadius: "5px", cursor: "pointer" }}
          >
            + Add Record
          </button>
          <button
            onClick={handleDeleteAll}
            style={{ backgroundColor: "#dc3545", color: "white", padding: "8px 16px", border: "none", borderRadius: "5px", cursor: "pointer" }}
          >
            Delete All
          </button>
        </div>
      </div>

      {/* Table */}
      <h2 className="table-title">Emigrant Records by Country</h2>
      <div className="table-container" style={{ overflowX: "auto" }}>
        <table className="custom-table">
          <thead>
            <tr>
              <th>Year</th>
              {filteredCountries.map((c) => <th key={c}>{c}</th>)}
              <th>Total</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.slice().sort((a,b) => b.year-a.year).map((row) => {
              const total = filteredCountries.reduce((sum,c) => sum + Number(row[c] || 0),0);
              return (
                <tr key={row.id}>
                  <td>{row.year}</td>
                  {filteredCountries.map((c) => <td key={c}>{row[c] || 0}</td>)}
                  <td><strong>{total}</strong></td>
                  <td>
                    <button className="icon-btn update" onClick={() => handleEdit(row)} title="Edit"><FaEdit color="green" /></button>
                    <button className="icon-btn delete" onClick={() => handleDelete(row.id)} title="Delete"><FaTrash color="red" /></button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {filteredData.length === 0 && <div style={{ height: '400px' }} />}


      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{editId ? "Edit" : "Add"} Country Record</h3>
            <input
              name="year"
              type="number"
              placeholder="Year"
              value={form.year}
              onChange={handleChange}
              className="form-input"
            />
            <div className="modal-form" style={{ maxHeight: "400px", overflowY: "auto" }}>
              {countries.map((c) => (
                <input
                  key={c}
                  name={c}
                  placeholder={c}
                  value={form[c]}
                  onChange={handleChange}
                  className="form-input"
                />
              ))}
            </div>
            <div className="modal-actions">
              <button onClick={handleAddOrUpdate} className="save-btn">{editId ? "Update" : "Save"}</button>
              <button onClick={() => setShowModal(false)} className="cancel-btn">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteAllModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Delete All Country Records</h3>
            <p style={{ margin: "10px 0 20px" }}>
              Are you sure you want to delete all country records? This cannot be undone.
            </p>
            <div className="modal-actions">
              <button onClick={handleConfirmDeleteAll} className="save-btn">
                Yes, Delete All
              </button>
              <button
                onClick={() => setShowDeleteAllModal(false)}
                className="cancel-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
};

export default AllCountriesTable;
