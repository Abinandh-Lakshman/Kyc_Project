import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import "./Maker.css"; // We will replace the content of this file

const Maker = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const editId = location.state?.id || null;

  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    dob: "",
    aadhar: "",
    pan: "",
  });
  const [searchId, setSearchId] = useState("");
  const [searchError, setSearchError] = useState("");

  const token = localStorage.getItem("token");
  let username = "User";
  if (token) {
    try {
      username = jwtDecode(token).username;
    } catch (e) {
      console.error("Invalid token");
    }
  }

  useEffect(() => {
    if (location.state?.formData) {
      const prefillData = {
        ...location.state.formData,
        dob: location.state.formData.dob
          ? new Date(location.state.formData.dob).toISOString().slice(0, 10)
          : "",
      };
      setFormData(prefillData);
    }
  }, [location.state]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "pan") {
      setFormData((prev) => ({ ...prev, [name]: value.toUpperCase() }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.aadhar.length !== 12 || formData.pan.length !== 10) {
      return alert("Aadhar must be 12 digits and PAN must be 10 characters.");
    }
    try {
      const url = editId
        ? `http://localhost:5000/api/kyc/${editId}`
        : "http://localhost:5000/api/kyc";
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ formData }),
      });
      const data = await res.json();
      if (res.ok) {
        const nextId = editId || data.id;
        alert(data.message);
        navigate("/checker", { state: { id: nextId } });
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (err) {
      alert("A critical error occurred.");
    }
  };

  const handleSearch = async () => {
    if (!searchId.trim()) return;
    try {
      const res = await fetch(`http://localhost:5000/api/kyc/${searchId}`);
      if (res.ok) {
        navigate("/checker", { state: { id: searchId } });
      } else {
        const data = await res.json();
        setSearchError(data.message);
      }
    } catch (err) {
      setSearchError("Failed to fetch the record.");
    }
  };

  return (
    <div className="maker-page-container">
      {/* --- App Header --- */}
      <header className="app-header">
        <div className="header-brand">
          <h1>KYC Portal</h1>
        </div>
        <div className="header-user">
          <span>
            Welcome, <strong>{username}</strong>
          </span>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </header>

      {/* --- Main Content --- */}
      <main className="main-content">
        <div className="content-header">
          <h2>Maker Dashboard</h2>
          <p>Create, edit, or search for KYC records from this central hub.</p>
        </div>

        <div className="content-card">
          <h3>Find Existing Record</h3>
          <div className="search-box">
            <input
              type="text"
              placeholder="Enter a KYC ID to find and review..."
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
            />
            <button onClick={handleSearch}>Search</button>
          </div>
          {searchError && <p className="error-message">{searchError}</p>}
        </div>

        <div className="content-card">
          <h3>{editId ? "Edit KYC Details" : "Create New KYC Record"}</h3>
          <form onSubmit={handleSubmit} className="maker-form">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., John Doe"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="mobile">Mobile Number</label>
              <input
                id="mobile"
                name="mobile"
                type="tel"
                value={formData.mobile}
                onChange={handleChange}
                placeholder="e.g., 9876543210"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="dob">Date of Birth</label>
              <input
                id="dob"
                name="dob"
                type="date"
                value={formData.dob}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="aadhar">Aadhar Number</label>
              <input
                id="aadhar"
                name="aadhar"
                type="text"
                value={formData.aadhar}
                onChange={handleChange}
                placeholder="12-digit number"
                maxLength="12"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="pan">PAN Number</label>
              <input
                id="pan"
                name="pan"
                type="text"
                value={formData.pan}
                onChange={handleChange}
                placeholder="10-character PAN"
                maxLength="10"
                required
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="submit-btn">
                {editId ? "Update KYC Record" : "Submit for Verification"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Maker;
