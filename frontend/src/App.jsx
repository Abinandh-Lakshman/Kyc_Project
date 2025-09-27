import { useState } from "react";
import "./App.css";
import Reports from "./reports/reports";
import Login from "./Login/Login";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Maker from "./maker/Maker";
import Checker from "./checker/Checker";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/maker" element={<Maker/>} />
        <Route path="/checker" element={<Checker/>} />
        <Route path="/reports" element={<Reports/>} />
      </Routes>
    </Router>
  );
}

export default App;
