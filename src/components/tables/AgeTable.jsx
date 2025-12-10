import React, { useEffect, useState } from "react";
import { addAgeGroup, getAgeGroups, updateAgeGroup, deleteAgeGroup, } from "../../services/emigrants_Age";
import { FaEdit, FaTrash } from "react-icons/fa";

const AgeTable = () => {
  const [ageGroups, setAgeGroups] = useState([]);
  const [filteredYear, setFilteredYear] = useState("All");
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [selectedColumn, setSelectedColumn] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    year: "",
    below14: "",
    "15-19": "",
    "20-24": "",
    "25-29": "",
    "30-34": "",
    "35-39": "",
    "40-44": "",
    "45-49": "",
    "50-54": "",
    "55-59": "",
    "60-64": "",
    "65-69": "",
    above70: "",
    notReported: "",
  });

  const placeholders = {
    year: "Enter Year",
    below14: "14 & Below",
    "15-19": "15 – 19",
    "20-24": "20 – 24",
    "25-29": "25 – 29",
    "30-34": "30 – 34",
    "35-39": "35 – 39",
    "40-44": "40 – 44",
    "45-49": "45 – 49",
    "50-54": "50 – 54",
    "55-59": "55 – 59",
    "60-64": "60 – 64",
    "65-69": "65 – 69",
    above70: "70 & Above",
    notReported: "Not Reported",
  };

  // Fetch data
  const fetchData = async () => {
    const data = await getAgeGroups();
    setAgeGroups(data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // --- Add Record ---
  const handleAdd = async () => {
    await addAgeGroup(
      Object.fromEntries(
        Object.keys(form).map((key) => [key, Number(form[key]) || 0])
      )
    );
    setForm({
      year: "",
      below14: "",
      "15-19": "",
      "20-24": "",
      "25-29": "",
      "30-34": "",
      "35-39": "",
      "40-44": "",
      "45-49": "",
      "50-54": "",
      "55-59": "",
      "60-64": "",
      "65-69": "",
      above70: "",
      notReported: "",
    });
    setShowModal(false);
    fetchData();
  };

  // --- Delete Record ---
  const handleDelete = async (id) => {
    await deleteAgeGroup(id);
    fetchData();
  };

  // --- Delete All Records ---
  const handleDeleteAll = () => {
    if (!ageGroups.length) return;
    setShowDeleteAllModal(true);
  };

  const handleConfirmDeleteAll = async () => {
    if (!ageGroups.length) {
      setShowDeleteAllModal(false);
      return;
    }
    await Promise.all(ageGroups.map((row) => deleteAgeGroup(row.id)));
    setShowDeleteAllModal(false);
    fetchData();
  };

  // --- Edit Record ---
  const handleEdit = (row) => {
    const { id, ...formData } = row;
    setForm(formData);
    setEditId(id);
    setShowEditModal(true);
  };

  // --- Update Record ---
  const handleUpdate = async () => {
    await updateAgeGroup(
      editId,
      Object.fromEntries(
        Object.keys(form).map((key) => [key, Number(form[key]) || 0])
      )
    );
    setAgeGroups((prev) =>
      prev.map((item) => (item.id === editId ? { ...item, ...form } : item))
    );
    setShowEditModal(false);
    fetchData();
  };

  // Unique years for filter dropdown
  const years = [...new Set(ageGroups.map((row) => row.year))].sort(
    (a, b) => b - a
  );

  // Filtered data
  const filteredData = ageGroups.filter((row) => {
    const matchSpecificYear =
      filteredYear === "All" || row.year === Number(filteredYear);
    const matchRange =
      (!yearFrom || row.year >= Number(yearFrom)) &&
      (!yearTo || row.year <= Number(yearTo));
    return matchSpecificYear && matchRange;
  });

  // Table columns to display
  const tableColumns =
    selectedColumn === "All"
      ? Object.keys(placeholders).filter((key) => key !== "year")
      : [selectedColumn];

  // Displayed table data
  const displayedData = filteredData.slice().sort((a, b) => b.year - a.year);

  const ageGroupKeys = [
    "below14",
    "15-19",
    "20-24",
    "25-29",
    "30-34",
    "35-39",
    "40-44",
    "45-49",
    "50-54",
    "55-59",
    "60-64",
    "65-69",
    "above70",
    "notReported",
  ];

  return (
    <div style={{ padding: 20 }}>
      {/* Filters */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
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
          <label style={{ fontWeight: "bold" }}>Filter by Age Group:</label>
          <select
            value={selectedColumn}
            onChange={(e) => setSelectedColumn(e.target.value)}
            style={{ marginLeft: "10px", padding: "5px" }}
          >
            <option value="All">All Age Groups</option>
            {Object.keys(placeholders)
              .filter((k) => k !== "year")
              .map((col) => (
                <option key={col} value={col}>
                  {placeholders[col]}
                </option>
              ))}
          </select>
        </div>
        
        <div style={{ display: "flex", gap: "0.5rem", marginLeft: "auto" }}>
          <button
            onClick={() => {
              setForm({ year: "", below14: "", "15-19": "", "20-24": "", "25-29": "", "30-34": "", "35-39": "", "40-44": "", "45-49": "", "50-54": "", "55-59": "", "60-64": "", "65-69": "", above70: "", notReported: "" }); // Reset form when opening Add modal
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
      <h2 className="table-title">Emigrant Records based on Age Group</h2>
      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Year</th>
              {tableColumns.map((key) => (
                <th key={key}>{placeholders[key]}</th>
              ))}
              <th>Total</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayedData.map((row) => {
              const total = tableColumns.reduce(
                (sum, key) => sum + (Number(row[key]) || 0),
                0
              );
              return (
                <tr key={row.id}>
                  <td>{row.year}</td>
                  {tableColumns.map((key) => (
                    <td key={key}>{row[key] || 0}</td>
                  ))}
                  <td style={{ fontWeight: "bold" }}>{total}</td>
                  <td>
                    <button
                      className="icon-btn update"
                      onClick={() => handleEdit(row)} // ✅ FIXED
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

      {displayedData.length === 0 && <div style={{ height: '400px' }} />}

      {/* --- Add Modal --- */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Add New Age Group Record</h3>

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
              {ageGroupKeys.map((key) => (
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
              <button onClick={handleAdd} className="save-btn">
                Save
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

      {/* --- Edit Modal --- */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Edit Age Group Record</h3>

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
              {ageGroupKeys.map((key) => (
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
              <button onClick={handleUpdate} className="save-btn">
                Update
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="cancel-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Delete All Modal --- */}
      {showDeleteAllModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Delete All Age Records</h3>
            <p style={{ margin: "10px 0 20px" }}>
              Are you sure you want to delete all age records? This cannot be undone.
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

export default AgeTable;
