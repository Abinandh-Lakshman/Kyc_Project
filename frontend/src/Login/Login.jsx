import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Login.css"; // We will replace the content of this file
import loginIllustration from "../assets/Team-bro.png"; // <-- UPDATE THIS PATH to your image

const Login = () => {
  const [signState, setSignState] = useState("Sign In");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoint =
        signState === "Sign Up" ? "/api/auth/signup" : "/api/auth/login";
      const res = await axios.post(`http://localhost:5000${endpoint}`, {
        username,
        password,
      });

      alert(res.data.message);

      if (signState === "Sign Up") {
        setSignState("Sign In");
      } else {
        localStorage.setItem("token", res.data.token);
        navigate("/maker");
      }
      setUsername("");
      setPassword("");
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.message || "An error occurred. Please try again."
      );
    }
  };

  return (
    <div className="login-page-wrapper corporate-split">
      {/* --- Left Panel: The Brand Statement with Image --- */}
      <div className="login-visual-panel">
        <div className="visual-content">
          <img
            src={loginIllustration}
            alt="KYC Process Illustration"
            className="login-illustration"
          />
          <div className="text-content">
            <h1>Secure KYC Portal</h1>
            <p>
              The industry standard for secure and compliant identity
              verification.
            </p>
          </div>
        </div>
      </div>

      {/* --- Right Panel: The Action Zone --- */}
      <div className="login-form-panel">
        <div className="login-box">
          <div className="login-header">
            <h2>
              {signState === "Sign In"
                ? "Sign In to Your Account"
                : "Create a New Account"}
            </h2>
          </div>
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="error-message">{error}</p>}
            <button type="submit" className="submit-btn">
              {signState}
            </button>
          </form>
          <div className="form-switch">
            {signState === "Sign In" ? (
              <p>
                Don't have an account?{" "}
                <span onClick={() => setSignState("Sign Up")}>Create one</span>
              </p>
            ) : (
              <p>
                Already have an account?{" "}
                <span onClick={() => setSignState("Sign In")}>Sign In</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
