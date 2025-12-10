import React, { useEffect, useState } from "react";
import { addMajorCountryGroup, getMajorCountryGroups, updateMajorCountryGroup, deleteMajorCountryGroup, } from "../../services/emigrants_MajorCountry";
import { FaEdit, FaTrash } from "react-icons/fa";

const MajorCountryTable = () => {
  const [majorCountryGroups, setMajorCountryGroups] = useState([]);
  const [form, setForm] = useState({
    year: "",
    usa: "",
    canada: "",
    japan: "",
    australia: "",
    italy: "",
    newZealand: "",
    unitedKingdom: "",
    germany: "",
    southKorea: "",
    spain: "",
    others: "",
  });

  const [selectedCountry, setSelectedCountry] = useState("All");
  const [filteredYear, setFilteredYear] = useState("All");
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [editId, setEditId] = useState(null);

  const placeholders = {
    year: "Enter Year",
    usa: "USA",
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

  const countryKeys = Object.keys(placeholders).filter((k) => k !== "year");

  // --- Fetch Data ---
  const fetchData = async () => {
    const data = await getMajorCountryGroups();
    setMajorCountryGroups(data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // --- Add or Update ---
  const handleAddOrUpdate = async () => {
    const payload = Object.fromEntries(
      Object.keys(form).map((key) => [key, Number(form[key]) || 0])
    );

    if (editId) {
      await updateMajorCountryGroup(editId, payload);
    } else {
      await addMajorCountryGroup(payload);
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
    await deleteMajorCountryGroup(id);
    fetchData();
  };

  // --- Delete All Records ---
  const handleDeleteAll = () => {
    if (!majorCountryGroups.length) return;
    setShowDeleteAllModal(true);
  };

  const handleConfirmDeleteAll = async () => {
    if (!majorCountryGroups.length) {
      setShowDeleteAllModal(false);
      return;
    }
    await Promise.all(majorCountryGroups.map((row) => deleteMajorCountryGroup(row.id)));
    setShowDeleteAllModal(false);
    fetchData();
  };

  // --- Filters ---
  const years = [...new Set(majorCountryGroups.map((row) => row.year))].sort(
    (a, b) => b - a
  );

  const filteredData = majorCountryGroups.filter((row) => {
    const matchYear =
      filteredYear === "All" || row.year === Number(filteredYear);
    const matchRange =
      (!yearFrom || row.year >= Number(yearFrom)) &&
      (!yearTo || row.year <= Number(yearTo));
    return matchYear && matchRange;
  });

  const displayKeys =
    selectedCountry === "All" ? countryKeys : [selectedCountry];

  return (
    <div style={{ padding: 20 }}>
      {/* Filters */}
      <div
        style={{
          display: "flex",
          gap: "1rem",
          flexWrap: "wrap",
          marginBottom: "20px",
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
          <label style={{ fontWeight: "bold" }}>Filter by Country:</label>
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            style={{ marginLeft: "10px", padding: "5px" }}
          >
            <option value="All">All</option>
            {countryKeys.map((key) => (
              <option key={key} value={key}>
                {placeholders[key]}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", marginLeft: "auto" }}>
          <button
            onClick={() => {
              setForm(Object.fromEntries(Object.keys(form).map((k) => [k, ""])));
              setEditId(null);
              setShowModal(true);
            }}
            style={{
              backgroundColor: "#007bff",
              color: "white",
              padding: "8px 16px",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            + Add Record
          </button>
          <button
            onClick={handleDeleteAll}
            style={{
              backgroundColor: "#dc3545",
              color: "white",
              padding: "8px 16px",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            Delete All
          </button>
        </div>
      </div>

      {/* Table */}
      <h2 className="table-title">Emigrant Records by Major Country</h2>
      <div className="table-container" style={{ overflowX: "auto" }}>
        <table className="custom-table">
          <thead>
            <tr>
              <th>Year</th>
              {displayKeys.map((key) => (
                <th key={key}>{placeholders[key]}</th>
              ))}
              <th>Total</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData
              .slice()
              .sort((a, b) => b.year - a.year)
              .map((row) => {
                const total = displayKeys.reduce(
                  (sum, key) => sum + Number(row[key] || 0),
                  0
                );
                return (
                  <tr key={row.id}>
                    <td>{row.year}</td>
                    {displayKeys.map((key) => (
                      <td key={key}>{row[key] || 0}</td>
                    ))}
                    <td>
                      <strong>{total}</strong>
                    </td>
                    <td>
                      <button
                        className="icon-btn update"
                        onClick={() => handleEdit(row)}
                        title="Edit Record"
                      >
                        <FaEdit color="green" />
                      </button>
                      <button
                        className="icon-btn delete"
                        onClick={() => handleDelete(row.id)}
                        title="Delete Record"
                      >
                        <FaTrash color="red" />
                      </button>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {filteredData.length === 0 && <div style={{ height: '400px' }} />}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{editId ? "Edit" : "Add New"} Major Country Record</h3>

            <div className="year-input-container">
              <label style={{ fontWeight: "bold" }}>Year: </label>
              <input
                name="year"
                type="number"
                placeholder={placeholders.year}
                value={form.year}
                onChange={handleChange}
                className="year-input"
              />
            </div>

            <div className="modal-form">
              {countryKeys.map((key) => (
                <input
                  key={key}
                  name={key}
                  placeholder={placeholders[key]}
                  value={form[key]}
                  onChange={handleChange}
                  className="form-input"
                />
              ))}
            </div>

            <div className="modal-actions">
              <button onClick={handleAddOrUpdate} className="save-btn">
                {editId ? "Update" : "Save"}
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="cancel-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteAllModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Delete All Major Country Records</h3>
            <p style={{ margin: "10px 0 20px" }}>
              Are you sure you want to delete all major country records? This cannot be undone.
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
  );
};

export default MajorCountryTable;
