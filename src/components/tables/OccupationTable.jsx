import React, { useEffect, useState } from "react";
import { addOccupationGroup, getOccupationGroups, updateOccupationGroup, deleteOccupationGroup, } from "../../services/emigrants_Occupation";
import { FaEdit, FaTrash } from "react-icons/fa";

const OccupationTable = () => {
  const [occupationGroups, setOccupationGroups] = useState([]);
  const [form, setForm] = useState({
    year: "",
    professional: "",
    administrative: "",
    clerical: "",
    sales: "",
    service: "",
    agriculture: "",
    production: "",
    armedForces: "",
    housewives: "",
    retirees: "",
    students: "",
    minors: "",
    outOfSchool: "",
    refugees: "",
    noOccupationReported: "",
  });

  const [selectedOccupation, setSelectedOccupation] = useState("All");
  const [filteredYear, setFilteredYear] = useState("All");
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [editId, setEditId] = useState(null);

  const placeholders = {
    year: "Enter Year",
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

  const occupationKeys = Object.keys(placeholders).filter((k) => k !== "year");

  // --- Fetch Data ---
  const fetchData = async () => {
    const data = await getOccupationGroups();
    setOccupationGroups(data);
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
      await updateOccupationGroup(editId, payload);
    } else {
      await addOccupationGroup(payload);
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
    await deleteOccupationGroup(id);
    fetchData();
  };

  // --- Delete All Records ---
  const handleDeleteAll = () => {
    if (!occupationGroups.length) return;
    setShowDeleteAllModal(true);
  };

  const handleConfirmDeleteAll = async () => {
    if (!occupationGroups.length) {
      setShowDeleteAllModal(false);
      return;
    }
    await Promise.all(occupationGroups.map((row) => deleteOccupationGroup(row.id)));
    setShowDeleteAllModal(false);
    fetchData();
  };

  // --- Filters ---
  const years = [...new Set(occupationGroups.map((row) => row.year))].sort(
    (a, b) => b - a
  );

  const filteredData = occupationGroups.filter((row) => {
    const matchYear =
      filteredYear === "All" || row.year === Number(filteredYear);
    const matchRange =
      (!yearFrom || row.year >= Number(yearFrom)) &&
      (!yearTo || row.year <= Number(yearTo));
    return matchYear && matchRange;
  });

  const displayKeys =
    selectedOccupation === "All" ? occupationKeys : [selectedOccupation];

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
          <label style={{ fontWeight: "bold" }}>Filter by Occupation:</label>
          <select
            value={selectedOccupation}
            onChange={(e) => setSelectedOccupation(e.target.value)}
            style={{ marginLeft: "10px", padding: "5px" }}
          >
            <option value="All">All</option>
            {occupationKeys.map((key) => (
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
      <h2 className="table-title">Emigrant Records by Occupation</h2>
      <div className="table-container">
        <div className="scroll-container">
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
      </div>

      {filteredData.length === 0 && <div style={{ height: '400px' }} />}


      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{editId ? "Edit" : "Add New"} Occupation Record</h3>

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
              {occupationKeys.map((key) => (
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
            <h3>Delete All Occupation Records</h3>
            <p style={{ margin: "10px 0 20px" }}>
              Are you sure you want to delete all occupation records? This cannot be undone.
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

export default OccupationTable;
