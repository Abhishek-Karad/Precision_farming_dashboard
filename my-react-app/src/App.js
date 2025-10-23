// src/App.js
import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid,
} from "recharts";
import { motion } from "framer-motion";

// Backend URL from environment variable (works on Vercel)
const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8888";

const COLORS = ["#2c7a7b", "#68d391", "#f6ad55", "#63b3ed", "#9f7aea", "#f56565"];

function App() {
  // UI state
  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard | form | analytics
  const [mobileOpen, setMobileOpen] = useState(false);

  // form state (keeps shape of your original structure)
  const initialForm = {
    length: "",
    width: "",
    farmingStyle: "",
    farmType: "",
    soilType: "",
    temperature: "",
    humidity: "",
    rainfall: "",
    wind: "",
    sprayType: "",
    _id: "",
  };
  const [formData, setFormData] = useState(initialForm);

  // main data
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(false);

  const farmingStyles = ["Organic", "Traditional", "Precision", "Hydroponic", "Aquaponic"];
  const farmTypes = ["Crop Field", "Greenhouse", "Plantation", "Livestock Farm", "Mixed Farm"];
  const soilTypes = ["Sandy", "Clayey", "Loamy", "Silty", "Peaty"];
  const sprayTypes = ["Fertilizer", "Pesticide", "Herbicide", "Micronutrient Mix"];

  // Fetch farms
  const fetchFarms = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/farms`);
      const data = await res.json();
      setFarms(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch farms error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFarms();
    // eslint-disable-next-line
  }, []);

  // form handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData(initialForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { _id, ...dataWithoutId } = formData;
      const body = {
        ...dataWithoutId,
        length: Number(formData.length),
        width: Number(formData.width),
        temperature: Number(formData.temperature),
        humidity: Number(formData.humidity),
        rainfall: Number(formData.rainfall),
        wind: Number(formData.wind),
      };

      const res = await fetch(`${API_BASE}/api/farms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        alert("Farm details submitted successfully!");
        resetForm();
        fetchFarms();
        setActiveTab("dashboard");
      } else {
        alert("Error submitting form!");
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!formData._id) return;
    try {
      const body = {
        ...formData,
        length: Number(formData.length),
        width: Number(formData.width),
        temperature: Number(formData.temperature),
        humidity: Number(formData.humidity),
        rainfall: Number(formData.rainfall),
        wind: Number(formData.wind),
      };
      const res = await fetch(`${API_BASE}/api/farms/${formData._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        alert("Farm updated successfully!");
        resetForm();
        fetchFarms();
        setActiveTab("dashboard");
      } else {
        alert("Update failed");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this farm?")) return;
    try {
      await fetch(`${API_BASE}/api/farms/${id}`, { method: "DELETE" });
      setFarms(prev => prev.filter(f => f._id !== id));
    } catch (err) {
      console.error(err);
      alert("Delete failed");
    }
  };

  const handleEdit = (farm) => {
    setFormData({
      length: farm.length ?? "",
      width: farm.width ?? "",
      farmingStyle: farm.farmingStyle ?? "",
      farmType: farm.farmType ?? "",
      soilType: farm.soilType ?? "",
      temperature: farm.temperature ?? "",
      humidity: farm.humidity ?? "",
      rainfall: farm.rainfall ?? "",
      wind: farm.wind ?? "",
      sprayType: farm.sprayType ?? "",
      _id: farm._id ?? "",
    });
    setActiveTab("form");
  };

  const handleSendToMATLAB = async (farmId) => {
    try {
      const res = await fetch(`${API_BASE}/api/pending`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ farmId }),
      });
      const data = await res.json();
      if (res.ok) alert(`Farm ${farmId} marked for MATLAB processing.`);
      else alert(`Error: ${data.error}`);
    } catch (err) {
      console.error(err);
      alert("Server error while marking farm.");
    }
  };
  
  

  // --- Analytics computations (memoized) ---
  const analytics = useMemo(() => {
    const totalFarms = farms.length;
    let avgTemperature = null;
    let avgHumidity = null;
    let avgRainfall = null;
    let avgFieldSize = null;
    let mostCommonFarmingStyle = null;
    let avgSprayEfficiency = null;

    if (totalFarms > 0) {
      const temps = farms.map(f => Number(f.temperature || 0)).filter(n => !Number.isNaN(n));
      const hums = farms.map(f => Number(f.humidity || 0)).filter(n => !Number.isNaN(n));
      const rains = farms.map(f => Number(f.rainfall || 0)).filter(n => !Number.isNaN(n));
      const sizes = farms.map(f => (Number(f.length || 0) * Number(f.width || 0))).filter(n => !Number.isNaN(n));
      avgTemperature = Math.round((temps.reduce((a, b) => a + b, 0) / (temps.length || 1)) * 10) / 10;
      avgHumidity = Math.round((hums.reduce((a, b) => a + b, 0) / (hums.length || 1)) * 10) / 10;
      avgRainfall = Math.round((rains.reduce((a, b) => a + b, 0) / (rains.length || 1)) * 10) / 10;
      avgFieldSize = Math.round((sizes.reduce((a, b) => a + b, 0) / (sizes.length || 1)) * 10) / 10;

      // most common farming style
      const styleCount = farms.reduce((acc, f) => {
        if (!f.farmingStyle) return acc;
        acc[f.farmingStyle] = (acc[f.farmingStyle] || 0) + 1;
        return acc;
      }, {});
      mostCommonFarmingStyle = Object.entries(styleCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

      // avg spray efficiency from matlabResults (if any)
      const efficiencies = farms.map(f => f.matlabResults?.sprayEfficiency).filter(n => typeof n === "number");
      if (efficiencies.length > 0) {
        avgSprayEfficiency = Math.round((efficiencies.reduce((a, b) => a + b, 0) / efficiencies.length) * 10) / 10;
      }
    }

    // distributions
    const soilCounts = soilTypes.map(st => ({
      name: st,
      value: farms.filter(f => f.soilType === st).length,
    })).filter(d => d.value > 0);

    const farmTypeCounts = farmTypes.map(ft => ({
      name: ft,
      value: farms.filter(f => f.farmType === ft).length,
    })).filter(d => d.value > 0);

    // series for line chart: create points across farms index
    const tempSeries = farms.map((f, i) => ({ name: `F${i + 1}`, temperature: Number(f.temperature || 0), humidity: Number(f.humidity || 0), rainfall: Number(f.rainfall || 0) }));

    return {
      totalFarms,
      avgTemperature,
      avgHumidity,
      avgRainfall,
      avgFieldSize,
      mostCommonFarmingStyle,
      avgSprayEfficiency,
      soilCounts,
      farmTypeCounts,
      tempSeries,
    };
  }, [farms]);

  // simple responsive helpers
  const SidebarButton = ({ children, active, onClick, icon }) => (
    <button
      onClick={onClick}
      className={`sb-btn ${active ? "sb-btn-active" : ""}`}
    >
      <span className="sb-ico">{icon}</span>
      <span>{children}</span>
    </button>
  );

  // small helper to format numbers
  const formatNumber = (n) => (n === null || n === undefined || Number.isNaN(n) ? "—" : n);

  return (
    <div className="app-root">
      <style>{`
        /* Basic resets & fonts */
        .app-root { font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial; background: #f4f7f6; min-height: 100vh; color: #1a202c; }
        .layout { display: grid; grid-template-columns: 260px 1fr; gap: 0; min-height: 100vh; }
        .sidebar { background: linear-gradient(180deg,#173f3f,#2c7a7b); color: #fff; padding: 20px; display: flex; flex-direction: column; position: sticky; top: 0; height: 100vh; }
        .brand { font-weight: 700; letter-spacing: 0.3px; margin-bottom: 18px; display:flex; align-items:center; gap:10px; }
        .brand .logo { width:34px;height:34px;border-radius:8px;background:#fff3; display:inline-block; }
        .nav { display:flex; flex-direction:column; gap:8px; margin-top:14px; }
        .sb-btn { display:flex; align-items:center; gap:12px; padding:10px 12px; border-radius:8px; background: transparent; color:#e6fffa; border:none; cursor:pointer; text-align:left; font-weight:600; opacity:0.95; }
        .sb-btn:hover { background: rgba(255,255,255,0.06); transform: translateX(4px); }
        .sb-btn-active { background: #e6fffa; color: #2c7a7b; box-shadow: 0 6px 18px rgba(44,122,123,0.12); }
        .sb-ico { width:28px;height:28px;display:inline-flex;align-items:center;justify-content:center;border-radius:6px;background:rgba(255,255,255,0.08); }
        .content { padding: 22px; }
        .topbar { display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; gap:12px; }
        .search { display:flex; gap:8px; align-items:center; background:#fff; padding:8px 10px; border-radius:10px; box-shadow: 0 2px 8px rgba(16,24,40,0.04); }
        .search input { border:none; outline:none; font-size:14px; }
        .cards { display:grid; grid-template-columns: repeat(auto-fit, minmax(200px,1fr)); gap:14px; margin-bottom:18px; }
        .card { background: #ffffff; padding:14px; border-radius:12px; box-shadow: 0 6px 18px rgba(99,102,241,0.04); }
        .card h3 { margin:0; font-size:14px; color:#2d3748; }
        .card p { margin:6px 0 0 0; color:#4a5568; font-weight:700; font-size:20px; }
        .grid-two { display:grid; grid-template-columns: 1fr 440px; gap: 14px; align-items:start; }
        .panel { background: #fff; padding: 14px; border-radius:12px; box-shadow: 0 6px 18px rgba(2,6,23,0.04); }
        .farm-list { display:grid; gap:12px; }
        .farm-card { display:flex; justify-content:space-between; gap:12px; padding:12px; border-radius:10px; border:1px solid #edf2f7; align-items:center; }
        .farm-card .left { display:flex; gap:12px; align-items:center; }
        .farm-card .tag { padding:6px 10px; border-radius:8px; background: #edfdf7; color:#234e4e; font-weight:700; }
        .farm-actions { display:flex; gap:8px; }
        .btn { padding:8px 10px; border-radius:8px; border:none; cursor:pointer; font-weight:700; }
        .btn-primary { background:#2c7a7b;color:#fff; }
        .btn-ghost { background:transparent; border:1px solid #e2e8f0; color:#2d3748; }
        .form-row { display:flex; gap:10px; }
        .input, select { padding:8px 10px; border-radius:8px; border:1px solid #e2e8f0; width:100%; }
        .field { margin-bottom:10px; }
        .grid-cards { display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:12px; }
        .analytics-charts { display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-top:10px; }
        @media (max-width: 980px) {
          .layout { grid-template-columns: 1fr; }
          .sidebar { position:relative; height:auto; display:flex; flex-direction:row; gap:8px; overflow-x:auto; padding:12px; }
          .nav { flex-direction:row; }
          .grid-two { grid-template-columns: 1fr; }
          .analytics-charts { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="layout">
        {/* SIDEBAR */}
        <aside className="sidebar" aria-hidden={false}>
          <div className="brand">
            <div className="logo" />
            <div>
              <div style={{ fontSize: 16 }}>AgroDBMS</div>
              <div style={{ fontSize: 12, opacity: 0.85 }}>Farm Management</div>
            </div>
          </div>

          <nav className="nav" role="navigation" aria-label="Main navigation">
            <SidebarButton
              active={activeTab === "dashboard"}
              onClick={() => setActiveTab("dashboard")}
              icon={"📊"}
            >
              Dashboard
            </SidebarButton>

            <SidebarButton
              active={activeTab === "form"}
              onClick={() => { setActiveTab("form"); resetForm(); }}
              icon={"➕"}
            >
              Add / Edit Farm
            </SidebarButton>

            <SidebarButton
              active={activeTab === "analytics"}
              onClick={() => setActiveTab("analytics")}
              icon={"📈"}
            >
              Analytics
            </SidebarButton>

            <div style={{ marginTop: 14 }} className="card">
              <div style={{ fontSize: 13, color: "#e6fffa", marginBottom: 6 }}>Quick actions</div>
              <button className="btn btn-primary" onClick={() => { fetchFarms(); alert("Refreshed farms"); }}>Refresh Farms</button>
            </div>
          </nav>

          <div style={{ marginTop: "auto", fontSize: 13, opacity: 0.9 }}>
            <div style={{ marginBottom: 6 }}>API: <strong style={{ fontWeight: 800 }}>{API_BASE.replace(/^https?:\/\//, "")}</strong></div>
            <div style={{ marginTop: 6 }}>Version: <strong>1.2.0</strong></div>
          </div>
        </aside>

        {/* CONTENT */}
        <main className="content">
          <div className="topbar">
            <div>
              <h1 style={{ margin: 0, fontSize: 20 }}>{activeTab === "dashboard" ? "Dashboard" : activeTab === "form" ? (formData._id ? "Edit Farm" : "Add Farm") : "Analytics"}</h1>
              <div style={{ fontSize: 13, color: "#718096" }}>Manage farms, run simulations, and inspect analytics</div>
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div className="search">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21 21l-4.35-4.35" stroke="#4A5568" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="11" cy="11" r="6" stroke="#4A5568" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <input placeholder="Search farms by style / soil / type" onChange={(e) => {
                  const q = e.target.value.toLowerCase();
                  if (!q) { fetchFarms(); return; }
                  setFarms(prev => prev.filter(f => (f.farmingStyle || "").toLowerCase().includes(q) || (f.soilType || "").toLowerCase().includes(q) || (f.farmType || "").toLowerCase().includes(q)));
                }} />
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13 }}>Admin</div>
                <div style={{ fontSize: 12, color: "#718096" }}>abhi@example.com</div>
              </div>
            </div>
          </div>

          {/* --- DASHBOARD --- */}
          {activeTab === "dashboard" && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <div className="cards">
                <div className="card">
                  <h3>Total Farms</h3>
                  <p>{analytics.totalFarms}</p>
                </div>
                <div className="card">
                  <h3>Avg Field Size (m²)</h3>
                  <p>{formatNumber(analytics.avgFieldSize)}</p>
                </div>
                <div className="card">
                  <h3>Avg Temperature (°C)</h3>
                  <p>{formatNumber(analytics.avgTemperature)}</p>
                </div>
                <div className="card">
                  <h3>Most Common Farming Style</h3>
                  <p>{analytics.mostCommonFarmingStyle}</p>
                </div>
              </div>

              <div className="grid-two">
                <div className="panel">
                  <h3 style={{ marginBottom: 10 }}>Farms</h3>

                  <div style={{ marginBottom: 12 }}>
                    <button className="btn btn-primary" onClick={() => { setActiveTab("form"); resetForm(); }}>Add Farm</button>
                    <button className="btn btn-ghost" style={{ marginLeft: 8 }} onClick={() => fetchFarms()}>Refresh</button>
                  </div>

                  {loading ? <div>Loading farms...</div> : (
                    <div className="farm-list">
                      {farms.length === 0 ? <div className="card">No farm records found.</div> : farms.map((farm, idx) => (
                        <div key={farm._id} className="farm-card">
                          <div className="left">
                            <div style={{ width: 54, height: 54, borderRadius: 8, background: "#f0fff4", display: "flex", justifyContent: "center", alignItems: "center", color: "#22543d", fontWeight: 800 }}>
                              F{idx + 1}
                            </div>
                            <div>
                              <div style={{ fontWeight: 800 }}>{farm.farmType || "Farm"}</div>
                              <div style={{ fontSize: 13, color: "#718096" }}>{farm.farmingStyle} • {farm.soilType}</div>
                              <div style={{ marginTop: 6, fontSize: 13, color: "#4A5568" }}>Temp: {farm.temperature}°C • Humidity: {farm.humidity}%</div>
                            </div>
                          </div>

                          <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
                            <div className="farm-actions">
                              <button className="btn btn-ghost" onClick={() => handleEdit(farm)}>Edit</button>
                              <button className="btn" onClick={() => handleDelete(farm._id)} style={{ background: "#fff2f2", border: "1px solid #fed7d7", color: "#c53030" }}>Delete</button>
                              <button className="btn btn-primary" onClick={() => handleSendData(farm)}>Send</button>
                            </div>

                            {farm.matlabResults ? (
                              <div style={{ fontSize: 12, color: "#2f855a", background: "#f0fff4", padding: "6px 8px", borderRadius: 8 }}>
                                Alg: {farm.matlabResults.bestAlgorithm || "—"} • Eff: {farm.matlabResults.sprayEfficiency ?? "—"}%
                              </div>
                            ) : (
                              <div style={{ fontSize: 12, color: "#718096" }}>No MATLAB results</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right column - summary + charts */}
                <div>
                  <div className="panel" style={{ marginBottom: 12 }}>
                    <h4 style={{ margin: 0 }}>Quick Summary</h4>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
                      <div style={{ background: "#f7fafc", borderRadius: 8, padding: 10 }}>
                        <div style={{ fontSize: 12, color: "#718096" }}>Avg Spray Efficiency</div>
                        <div style={{ fontWeight: 800, fontSize: 18 }}>{formatNumber(analytics.avgSprayEfficiency)}%</div>
                      </div>
                      <div style={{ background: "#fff7ed", borderRadius: 8, padding: 10 }}>
                        <div style={{ fontSize: 12, color: "#718096" }}>Avg Rainfall</div>
                        <div style={{ fontWeight: 800, fontSize: 18 }}>{formatNumber(analytics.avgRainfall)} mm</div>
                      </div>
                      <div style={{ background: "#f0fdf4", borderRadius: 8, padding: 10 }}>
                        <div style={{ fontSize: 12, color: "#718096" }}>Avg Humidity</div>
                        <div style={{ fontWeight: 800, fontSize: 18 }}>{formatNumber(analytics.avgHumidity)}%</div>
                      </div>
                      <div style={{ background: "#ebf8ff", borderRadius: 8, padding: 10 }}>
                        <div style={{ fontSize: 12, color: "#718096" }}>Most Soil</div>
                        <div style={{ fontWeight: 800, fontSize: 18 }}>{analytics.soilCounts[0]?.name ?? "—"}</div>
                      </div>
                    </div>
                  </div>

                  <div className="panel">
                    <h4 style={{ marginTop: 0 }}>Trends</h4>
                    <div style={{ height: 220 }}>
                      {analytics.tempSeries.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={analytics.tempSeries} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="temperature" stroke="#2c7a7b" strokeWidth={2} name="Temp (°C)" />
                            <Line type="monotone" dataKey="humidity" stroke="#63b3ed" strokeWidth={2} name="Humidity (%)" />
                            <Line type="monotone" dataKey="rainfall" stroke="#f6ad55" strokeWidth={2} name="Rainfall (mm)" />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : <div style={{ color: "#718096" }}>No trend data available yet.</div>}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* --- FORM --- */}
          {activeTab === "form" && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 14 }}>
                <div className="panel">
                  <form onSubmit={formData._id ? handleUpdate : handleSubmit}>
                    <div style={{ display: "flex", gap: 14 }}>
                      <div style={{ flex: 1 }}>
                        <div className="field">
                          <label className="label">Length (m)</label>
                          <input className="input" type="number" name="length" value={formData.length} onChange={handleChange} required />
                        </div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className="field">
                          <label className="label">Width (m)</label>
                          <input className="input" type="number" name="width" value={formData.width} onChange={handleChange} required />
                        </div>
                      </div>
                    </div>

                    <div className="field">
                      <label className="label">Farming Style</label>
                      <select name="farmingStyle" className="input" value={formData.farmingStyle} onChange={handleChange} required>
                        <option value="">Select Farming Style</option>
                        {farmingStyles.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>

                    <div style={{ display: "flex", gap: 10 }}>
                      <div style={{ flex: 1 }} className="field">
                        <label className="label">Farm Type</label>
                        <select name="farmType" className="input" value={formData.farmType} onChange={handleChange} required>
                          <option value="">Select Farm Type</option>
                          {farmTypes.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>

                      <div style={{ flex: 1 }} className="field">
                        <label className="label">Soil Type</label>
                        <select name="soilType" className="input" value={formData.soilType} onChange={handleChange} required>
                          <option value="">Select Soil Type</option>
                          {soilTypes.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>

                    <h4 style={{ marginTop: 6 }}>Weather Conditions</h4>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                      <div className="field">
                        <label className="label">Temperature (°C)</label>
                        <input className="input" type="number" name="temperature" value={formData.temperature} onChange={handleChange} required />
                      </div>
                      <div className="field">
                        <label className="label">Humidity (%)</label>
                        <input className="input" type="number" name="humidity" value={formData.humidity} onChange={handleChange} required />
                      </div>
                      <div className="field">
                        <label className="label">Rainfall (mm)</label>
                        <input className="input" type="number" name="rainfall" value={formData.rainfall} onChange={handleChange} required />
                      </div>
                    </div>

                    <div className="field">
                      <label className="label">Wind (km/h)</label>
                      <input className="input" type="number" name="wind" value={formData.wind} onChange={handleChange} required />
                    </div>

                    <div className="field">
                      <label className="label">Spray Type</label>
                      <select name="sprayType" className="input" value={formData.sprayType} onChange={handleChange} required>
                        <option value="">Select Spray Type</option>
                        {sprayTypes.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>

                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <button type="submit" className="btn btn-primary">{formData._id ? "Update Farm" : "Create Farm"}</button>
                      <button type="button" className="btn btn-ghost" onClick={() => { resetForm(); setActiveTab("dashboard"); }}>Cancel</button>
                    </div>
                  </form>
                </div>

                <div className="panel">
                  <h4>Form help</h4>
                  <p style={{ color: "#718096" }}>Fill farm dimensions & weather info. Use the <strong>Send</strong> action from the dashboard to run MATLAB simulation and store results.</p>

                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 13, color: "#718096", marginBottom: 6 }}>Recent Farms</div>
                    <div style={{ display: "grid", gap: 8 }}>
                      {farms.slice(0, 5).map((f, i) => (
                        <div key={i} style={{ padding: 8, borderRadius: 8, background: "#f7fafc", fontSize: 13 }}>
                          <strong>{f.farmType}</strong> • {f.farmingStyle} • {f.soilType}
                        </div>
                      ))}

                      {farms.length === 0 && <div style={{ color: "#718096" }}>No farms yet</div>}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* --- ANALYTICS --- */}
          {activeTab === "analytics" && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <div className="grid-cards">
                <div className="card">
                  <h3>Analytics Overview</h3>
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: 13, color: "#718096" }}>Avg Temperature</div>
                    <div style={{ fontWeight: 800, fontSize: 20 }}>{formatNumber(analytics.avgTemperature)} °C</div>
                  </div>

                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: 13, color: "#718096" }}>Avg Humidity</div>
                    <div style={{ fontWeight: 800, fontSize: 20 }}>{formatNumber(analytics.avgHumidity)} %</div>
                  </div>
                </div>

                <div className="card">
                  <h3>Field Size</h3>
                  <div style={{ fontWeight: 800, fontSize: 20 }}>{formatNumber(analytics.avgFieldSize)} m²</div>
                  <div style={{ fontSize: 13, color: "#718096", marginTop: 6 }}>{analytics.totalFarms} farms included</div>
                </div>

                <div className="panel">
                  <h4>Soil Type Distribution</h4>
                  <div style={{ height: 260 }}>
                    {analytics.soilCounts.length === 0 ? <div style={{ color: "#718096" }}>No data</div> : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie dataKey="value" data={analytics.soilCounts} labelLine={false} outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                            {analytics.soilCounts.map((entry, idx) => <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />)}
                          </Pie>
                          <Legend />
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                <div className="panel">
                  <h4>Farm Type Counts</h4>
                  <div style={{ height: 260 }}>
                    {analytics.farmTypeCounts.length === 0 ? <div style={{ color: "#718096" }}>No data</div> : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics.farmTypeCounts} layout="vertical" margin={{ top: 8, right: 16, left: 24, bottom: 8 }}>
                          <XAxis type="number" />
                          <YAxis type="category" dataKey="name" />
                          <Tooltip />
                          <Bar dataKey="value" fill="#2c7a7b" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                <div className="panel">
                  <h4>Trends across farms</h4>
                  <div style={{ height: 260 }}>
                    {analytics.tempSeries.length === 0 ? <div style={{ color: "#718096" }}>No data</div> : (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={analytics.tempSeries}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="temperature" stroke="#2c7a7b" />
                          <Line type="monotone" dataKey="humidity" stroke="#63b3ed" />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
