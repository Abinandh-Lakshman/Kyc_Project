require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");
const { v4: uuidv4 } = require("uuid");

const app = express();

const PORT = process.env.PORT || 5000;
const SECRET = process.env.JWT_SECRET || "devsecret123";

const pool = new Pool({
  user: process.env.PG_USER || "postgres",
  host: process.env.PG_HOST || "localhost",
  database: process.env.PG_DATABASE || "auth",
  password: process.env.PG_PASSWORD || "12345",
  port: process.env.PG_PORT || 5432,
});

app.use(cors());
app.use(express.json());

/* ========== Helpers ========== */
function normalizeISODate(value) {
  if (!value) return null;
  const d = new Date(value);
  // Check if the date is valid before converting
  if (isNaN(d.getTime())) {
    return value; // Let the database handle the invalid format error
  }
  return d.toISOString().slice(0, 10); // Returns YYYY-MM-DD
}

function decodeToken(req) {
  const authHeader = req.headers["authorization"] || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
  if (!token) return null;
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}

/* ========== AUTH ROUTES ========== */

// --- SIGNUP ---
app.post("/api/auth/signup", async (req, res) => {

  const { username, password } = req.body;
  try {
    const existing = await pool.query("SELECT 1 FROM users WHERE username=$1", [
      username,
    ]);
    if (existing.rows.length) {
      return res.status(400).json({ message: "User already exists" });
    }
    const hashed = await bcrypt.hash(password, 10);
    await pool.query("INSERT INTO users (username, password) VALUES ($1, $2)", [
      username,
      hashed,
    ]);
    res.json({ message: "Signup successful, please sign in." });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: err.message });
  }
});

// --- LOGIN ---
app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE username=$1", [
      username,
    ]);
    if (!result.rows.length) {
      return res.status(400).json({ message: "You should sign up first" });
    }
    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res
        .status(401)
        .json({ message: "Username or password doesn’t match" });
    }
    const token = jwt.sign({ id: user.id, username: user.username }, SECRET, {
      expiresIn: "1h",
    });
    res.json({ message: "Login successful", token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: err.message });
  }
});

/* ========== KYC ROUTES ========== */

// --- CREATE KYC ---
app.post("/api/kyc", async (req, res) => {
    console.log("Received request body:", req.body); 

  try {
    const decoded = decodeToken(req);
    const userId = decoded?.id || null;
    const usernameFromToken = decoded?.username || null;

    const payload = req.body.formData || req.body;
    if (!payload || !payload.name || !payload.dob || !payload.aadhar || !payload.pan) {
        return res.status(400).json({ message: "Required fields are missing" });
    }

    const dobISO = normalizeISODate(payload.dob);
    const kycId = uuidv4();
    const statuses = { name: "Pending", mobile: "Pending", dob: "Pending", aadhar: "Pending", pan: "Pending" };

    await pool.query(
      `INSERT INTO kyc_records (id, user_id, username, name, mobile, dob, aadhar, pan, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        kycId,
        userId,
        usernameFromToken,
        payload.name,
        payload.mobile,
        dobISO,
        payload.aadhar,
        payload.pan,
        JSON.stringify(statuses),
      ]
    );
    res.json({ message: "KYC created successfully", id: kycId });
  } catch (err) {
    console.error("Error creating KYC:", err);
    res.status(500).json({ message: err.message });
  }
});

// --- GET KYC BY ID ---
app.get("/api/kyc/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT k.*, u.username
         FROM kyc_records k
         LEFT JOIN users u ON k.user_id = u.id
        WHERE k.id=$1`,
      [req.params.id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ message: "KYC not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Fetch KYC error:", err);
    res.status(500).json({ message: err.message });
  }
});

// --- UPDATE KYC FIELDS (Maker edit) ---
app.put("/api/kyc/:id", async (req, res) => {
  try {
    const payload = req.body.formData || req.body;
    if (!payload) return res.status(400).json({ message: "formData missing" });
    
    const dobISO = normalizeISODate(payload.dob);
    
    const result = await pool.query(
      `UPDATE kyc_records
          SET name=$1, mobile=$2, dob=$3, aadhar=$4, pan=$5, updated_at=NOW()
        WHERE id=$6
      RETURNING *`,
      [payload.name, payload.mobile, dobISO, payload.aadhar, payload.pan, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: "KYC record not found" });
    res.json({ message: "KYC updated successfully", record: result.rows[0] });
  } catch (err) {
    console.error("Error updating KYC:", err);
    res.status(500).json({ message: err.message });
  }
});

// --- UPDATE STATUS ONLY (Checker review) ---
app.put("/api/kyc/:id/review", async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: "status object missing" });
    
    const result = await pool.query(
      `UPDATE kyc_records
          SET status=$1, updated_at=NOW()
        WHERE id=$2
      RETURNING *`,
      [JSON.stringify(status), req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: "KYC record not found" });
    res.json({ message: "KYC status updated", record: result.rows[0] });
  } catch (err) {
    console.error("Error updating KYC status:", err);
    res.status(500).json({ message: err.message });
  }
});

/* ========== START SERVER ========== */
app.listen(process.env.PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});