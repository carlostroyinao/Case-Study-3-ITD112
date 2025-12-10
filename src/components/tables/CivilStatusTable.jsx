import React, { useEffect, useState } from "react";
import { addEmigrant, getEmigrants, updateEmigrant, deleteEmigrant, } from "../../services/emigrants_CivilStatus";
import { FaEdit, FaTrash } from "react-icons/fa";

const CivilStatusTable = () => {
  const [emigrants, setEmigrants] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    year: "",
    single: "",
    married: "",
    widower: "",
    separated: "",
    divorced: "",
    notReported: "",
  });

  const [selectedStatus, setSelectedStatus] = useState("All");
  const [filteredYear, setFilteredYear] = useState("All");
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");

  const placeholders = {
    year: "Enter Year",
    single: "Single",
    married: "Married",
    widower: "Widower",
    separated: "Separated",
    divorced: "Divorced",
    notReported: "Not Reported",
  };

  const statusKeys = [
    "single",
    "married",
    "widower",
    "separated",
    "divorced",
    "notReported",
  ];

  // Fetch data
  const fetchData = async () => {
    const data = await getEmigrants();
    setEmigrants(data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // --- Add Record ---
  const handleAdd = async () => {
    await addEmigrant(
      Object.fromEntries(
        statusKeys.map((key) => [key, Number(form[key]) || 0]).concat([
          ["year", Number(form.year) || 0],
        ])
      )
    );
    setForm({
      year: "",
      single: "",
      married: "",
      widower: "",
      separated: "",
      divorced: "",
      notReported: "",
    });
    setShowModal(false);
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
    await updateEmigrant(
      editId,
      Object.fromEntries(
        statusKeys.map((key) => [key, Number(form[key]) || 0]).concat([
          ["year", Number(form.year) || 0],
        ])
      )
    );
    setShowEditModal(false);
    fetchData();
  };

  // --- Delete Record ---
  const handleDelete = async (id) => {
    await deleteEmigrant(id);
    fetchData();
  };

  // --- Delete All Records ---
  const handleDeleteAll = () => {
    if (!emigrants.length) return;
    setShowDeleteAllModal(true);
  };

  const handleConfirmDeleteAll = async () => {
    if (!emigrants.length) {
      setShowDeleteAllModal(false);
      return;
    }
    await Promise.all(emigrants.map((row) => deleteEmigrant(row.id)));
    setShowDeleteAllModal(false);
    fetchData();
  };

  // --- Filter & Table logic ---
  const years = [...new Set(emigrants.map((row) => row.year))].sort(
    (a, b) => b - a
  );

  const filteredData = emigrants.filter((row) => {
    const matchSpecificYear =
      filteredYear === "All" || row.year === Number(filteredYear);
    const matchRange =
      (!yearFrom || row.year >= Number(yearFrom)) &&
      (!yearTo || row.year <= Number(yearTo));
    return matchSpecificYear && matchRange;
  });

  const tableColumns =
    selectedStatus === "All" ? statusKeys : [selectedStatus];

  const displayedData = filteredData.slice().sort((a, b) => b.year - a.year);

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
        {/* Filter by Year */}
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

        {/* Filter by Year Range */}
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

        {/* Filter by Status */}
        <div>
          <label style={{ fontWeight: "bold" }}>Filter by Civil Status:</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{ marginLeft: "10px", padding: "5px" }}
          >
            <option value="All">All</option>
            {statusKeys.map((key) => (
              <option key={key} value={key}>
                {placeholders[key]}
              </option>
            ))}
          </select>
        </div>

        {/* Add Record Button */}
        <div style={{ display: "flex", gap: "0.5rem", marginLeft: "auto" }}>
          <button
            onClick={() => {
              setForm({
                year: "",
                single: "",
                married: "",
                widower: "",
                separated: "",
                divorced: "",
                notReported: "",
              }); // reset form when opening
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
      <h2 className="table-title">Emigrant Records based on Civil Status</h2>
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

      {displayedData.length === 0 && <div style={{ height: '400px' }} />}

      {/* --- Add Modal --- */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Add New Civil Status Record</h3>

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
              {statusKeys.map((key) => (
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
            <h3>Edit Civil Status Record</h3>

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
              {statusKeys.map((key) => (
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

      {showDeleteAllModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Delete All Civil Status Records</h3>
            <p style={{ margin: "10px 0 20px" }}>
              Are you sure you want to delete all civil status records? This cannot be undone.
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

export default CivilStatusTable;
