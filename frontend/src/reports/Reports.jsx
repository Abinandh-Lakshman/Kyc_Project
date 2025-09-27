import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import "./Reports.css";

const Reports = () => {
  const location = useLocation();
  const [reportData, setReportData] = useState(location.state?.reportData || null);
  const [kycId, setKycId] = useState(location.state?.id || null);
  const [username, setUsername] = useState("");
  const [fileFormat, setFileFormat] = useState("excel");
  const [error, setError] = useState("");

  // 🔎 Load Report Data from backend if not passed in state
  useEffect(() => {
    if (!reportData && kycId) {
      fetch(`http://localhost:5000/api/kyc/${kycId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.message === "KYC not found") {
            setError("No KYC record found for this ID.");
          } else {
            // ✅ Combine values + statuses
            const combined = {
              name: { value: data.name, status: data.status?.name },
              mobile: { value: data.mobile, status: data.status?.mobile },
              dob: { value: data.dob, status: data.status?.dob },
              aadhar: { value: data.aadhar, status: data.status?.aadhar },
              pan: { value: data.pan, status: data.status?.pan },
            };

            setReportData(combined);
            setUsername(data.username);
          }
        })
        .catch(() => setError("Error fetching KYC record"));
    }
  }, [reportData, kycId]);

  if (error) {
    return (
      <div className="reports-container">
        <h2>KYC Report</h2>
        <p style={{ color: "red" }}>{error}</p>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="reports-container">
        <h2>KYC Report</h2>
        <p>Loading...</p>
      </div>
    );
  }

  // ✅ Download handler
  const handleDownload = async () => {
    const rows = [
      { Field: "KYC ID", Value: kycId, Status: "" },
      ...Object.keys(reportData).map((key) => ({
        Field: key,
        Value: reportData[key].value,
        Status: reportData[key].status,
      })),
    ];

    if (fileFormat === "excel" || fileFormat === "csv") {
      const XLSX = await import("xlsx");
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "KYC Report");
      fileFormat === "excel"
        ? XLSX.writeFile(wb, `KYC_Report_${kycId}.xlsx`)
        : XLSX.writeFile(wb, `KYC_Report_${kycId}.csv`);
    }

    if (fileFormat === "pdf") {
      const jsPDF = (await import("jspdf")).default;
      const autoTable = (await import("jspdf-autotable")).default;

      const doc = new jsPDF();
      doc.text(`KYC Report - ID: ${kycId}`, 14, 15);

      const tableData = Object.keys(reportData).map((key) => [
        key,
        reportData[key].value,
        reportData[key].status,
      ]);

      tableData.unshift(["KYC ID", kycId, ""]);

      autoTable(doc, {
        head: [["Field", "Value", "Status"]],
        body: tableData,
        startY: 20,
      });

      doc.save(`KYC_Report_${kycId}.pdf`);
    }
  };

  return (
    <div className="reports-container">
      <h2>KYC Report</h2>
      <p><strong>User:</strong> {username}</p>
      <p><strong>KYC ID:</strong> {kycId}</p>

      <table>
        <thead>
          <tr>
            <th>Field</th>
            <th>Value</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {Object.keys(reportData).map((key) => (
            <tr key={key}>
              <td>{key}</td>
              <td>{reportData[key].value || "N/A"}</td>
              <td>
                <span
                  className={`status-badge ${
                    reportData[key].status === "Verified"
                      ? "status-verified"
                      : "status-pending"
                  }`}
                >
                  {reportData[key].status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="download-wrapper">
        <span>Choose file format:</span>
        <select
          className="format-select"
          value={fileFormat}
          onChange={(e) => setFileFormat(e.target.value)}
        >
          <option value="excel">Excel (.xlsx)</option>
          <option value="csv">CSV (.csv)</option>
          <option value="pdf">PDF (.pdf)</option>
        </select>
        <button className="download-btn" onClick={handleDownload}>
          Download
        </button>
      </div>
    </div>
  );
};

export default Reports;