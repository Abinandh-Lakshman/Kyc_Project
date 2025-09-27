import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Checker.css";

const Checker = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // 👇 capture ID passed from Maker or Search
  const kycId = location.state?.id || null;

  const [formData, setFormData] = useState(null);
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");

  const expectedFields = ["name", "mobile", "dob", "aadhar", "pan"];

  const [statusFields, setStatusFields] = useState({
    name: "Pending",
    mobile: "Pending",
    dob: "Pending",
    aadhar: "Pending",
    pan: "Pending",
  });

  // ✅ Fetch KYC record from backend
  useEffect(() => {
    if (kycId) {
      fetch(`http://localhost:5000/api/kyc/${kycId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.message === "KYC not found") {
            setError("No KYC record found for this ID.");
          } else {
            setFormData({
              name: data.name,
              mobile: data.mobile,
              dob: data.dob,
              aadhar: data.aadhar,
              pan: data.pan,
            });
            setUsername(data.username);
            if (data.status) setStatusFields(data.status);
            setError("");
          }
        })
        .catch(() => setError("Error fetching KYC record"));
    } else {
      setError("No KYC ID provided. Please submit the form first.");
    }
  }, [kycId]);

  // ✅ Status checkbox toggle
  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setStatusFields((prev) => ({
      ...prev,
      [name]: checked ? "Verified" : "Pending",
    }));
  };

  // ✅ Submit statuses to backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData) return;

    try {
      const res = await fetch(`http://localhost:5000/api/kyc/${kycId}/review`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: statusFields }),
      });

      const data = await res.json();
      if (res.ok) {
        navigate("/reports", { state: { id: kycId } });
      } else {
        alert(data.message || "Error updating KYC status");
      }
    } catch (err) {
      console.error("Error reviewing KYC:", err);
      alert("Something went wrong while saving review.");
    }
  };

  // ✅ Navigate to Maker for editing
  const handleEdit = () => {
    if (formData) {
      navigate("/maker", { state: { id: kycId, formData } });
    }
  };

  return (
    <div className="checker-container">
      <h2>KYC Review</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {!error && formData && (
        <form onSubmit={handleSubmit} className="checker-form">
          <h3>User: {username || "Unknown User"}</h3>
          <p>
            <strong>KYC ID:</strong> {kycId}
          </p>

          {expectedFields.map((key) => (
            <div className="checker-field" key={key}>
              <label>
                <strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong>{" "}
                {formData[key] || "N/A"}
              </label>
              <div className="checker-status">
                <input
                  type="checkbox"
                  name={key}
                  checked={statusFields[key] === "Verified"}
                  onChange={handleCheckboxChange}
                />
                <span
                  className={`status-badge ${
                    statusFields[key] === "Verified"
                      ? "status-verified"
                      : "status-pending"
                  }`}
                >
                  {statusFields[key]}
                </span>
              </div>
            </div>
          ))}

          <div className="checker-actions">
            <button type="submit" className="btn-primary">Submit Review</button>
            <button
              type="button"
              className="edit-btn"
              onClick={handleEdit}
            >
              Edit Record
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default Checker;