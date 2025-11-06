import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid,
} from "recharts";
const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8888";
const COLORS = ["#0F766E", "#14B8A6", "#2DD4BF", "#5EEAD4", "#99F6E4", "#CCFBF1"];

const StatusBadge = ({ status }) => {
  const statusConfig = {
    draft: { bg: "rgb(241 245 249)", color: "rgb(51 65 85)", text: "Draft" },
    pending: { bg: "rgb(254 243 199)", color: "rgb(161 98 7)", text: "Pending" },
    processing: { bg: "rgb(219 234 254)", color: "rgb(29 78 216)", text: "Processing" },
    completed: { bg: "rgb(220 252 231)", color: "rgb(21 128 61)", text: "Completed" },
    failed: { bg: "rgb(254 226 226)", color: "rgb(185 28 28)", text: "Failed" }
  };

  const config = statusConfig[status] || statusConfig.draft;

  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      padding: "0.25rem 0.75rem",
      borderRadius: "0.375rem",
      background: config.bg,
      color: config.color,
      fontSize: "0.75rem",
      fontWeight: "600",
      letterSpacing: "0.025em"
    }}>
      {config.text}
    </span>
  );
};

function App() {
  const [query, setQuery] = useState("");
  const [geminiAnswer, setGeminiAnswer] = useState("");
  const [loadingAnswer, setLoadingAnswer] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const farmsPerPage = 5;

  const initialForm = {
    farmid: "", farm_name: "", farm_area: "", shape: "", size_fragmentation: "",
    level: "", boundary: "", style: "", cropping_pattern: "", obstacle_density: "",
    soil_type: "", chemical_mix: "", temp: "", organic_matter: "", spray_type: "",
    coverage: "", effectiveness: "", suggested_volume: "", _id: ""
  };
  
  const [formData, setFormData] = useState(initialForm);
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchFarms = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/farms`);
      const data = await res.json();
      setFarms(Array.isArray(data) ? data : []);
      setCurrentPage(1);
    } catch (err) {
      console.error("Fetch farms error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFarms();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => setFormData(initialForm);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { _id, ...dataWithoutId } = formData;
      const body = {
        ...dataWithoutId,
        farm_area: Number(formData.farm_area),
        obstacle_density: Number(formData.obstacle_density),
        temp: Number(formData.temp),
      };

      const res = await fetch(`${API_BASE}/api/farms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        alert("Farm created successfully!");
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
        farm_area: Number(formData.farm_area),
        obstacle_density: Number(formData.obstacle_density),
        temp: Number(formData.temp),
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
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this farm?")) return;
    try {
      await fetch(`${API_BASE}/api/farms/${id}`, { method: "DELETE" });
      setFarms(prev => prev.filter(f => f._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (farm) => {
    setFormData({
      farmid: farm.farmid ?? "",
      farm_name: farm.farm_name ?? "",
      farm_area: farm.farm_area ?? "",
      shape: farm.shape ?? "",
      size_fragmentation: farm.size_fragmentation ?? "",
      level: farm.level ?? "",
      boundary: farm.boundary ?? "",
      style: farm.Style ?? "",
      cropping_pattern: farm.Cropping_pattern ?? "",
      obstacle_density: farm.obstacle_density ?? "",
      soil_type: farm.soil_type ?? "",
      chemical_mix: farm.chemical_mix ?? "",
      temp: farm.temp ?? "",
      organic_matter: farm.organic_matter ?? "",
      spray_type: farm.spray_type ?? "",
      coverage: farm.coverage ?? "",
      effectiveness: farm.effectiveness ?? "",
      suggested_volume: farm.suggested_volume ?? "",
      _id: farm._id ?? "",
    });
    setActiveTab("form");
  };

  const handleSendToMATLAB = async (farmId) => {
    try {
      const pendingRes = await fetch(`${API_BASE}/api/pending`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ farmId }),
      });
      
      if (!pendingRes.ok) {
        alert("Error marking farm as pending");
        return;
      }
  
      const pushRes = await fetch(`${API_BASE}/api/push-json`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ farmId }),
      });
  
      if (pushRes.ok) {
        alert("Farm queued for MATLAB processing!");
        fetchFarms();
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  };

  const analytics = useMemo(() => {
    const totalFarms = farms.length;
    const avg = arr => arr.length ? Math.round((arr.reduce((a,b)=>a+b,0)/arr.length)*10)/10 : 0;
    const sum = arr => arr.reduce((a,b)=>a+b,0);
    const countBy = (key) => {
      const counts = farms.reduce((acc, f) => {
        const val = f[key];
        if (!val) return acc;
        acc[val] = (acc[val] || 0) + 1;
        return acc;
      }, {});
      return Object.entries(counts).map(([name, value]) => ({ name, value }));
    };

    if (totalFarms === 0) {
      return {
        totalFarms: 0, avgTemperature: 0, avgFieldSize: 0,
        mostCommonCroppingPattern: "—", avgSprayEfficiency: 0,
        soilCounts: [], farmTypeCounts: [], tempSeries: [],
        totalArea: 0, minTemp: 0, maxTemp: 0
      };
    }

    const temps = farms.map(f => Number(f.temp || 0)).filter(n => !Number.isNaN(n) && n > 0);
    const sizes = farms.map(f => Number(f.farm_area || 0)).filter(n => !Number.isNaN(n) && n > 0);
    const efficiencies = farms.map(f => parseFloat(f.effectiveness) || 0).filter(n => n > 0);

    const avgTemperature = avg(temps);
    const avgFieldSize = avg(sizes);
    const avgSprayEfficiency = avg(efficiencies);
    const totalArea = sum(sizes);
    const minTemp = temps.length ? Math.min(...temps) : 0;
    const maxTemp = temps.length ? Math.max(...temps) : 0;

    const soilCounts = countBy("soil_type").filter(d => d.value > 0);
    const farmTypeCounts = countBy("Style").filter(d => d.value > 0);
    const patternCounts = countBy("Cropping_pattern").filter(d => d.value > 0);

    const sortedPatterns = [...patternCounts].sort((a, b) => b.value - a.value);
    const mostCommonCroppingPattern = sortedPatterns[0]?.name || "—";

    const tempSeries = farms
      .filter(f => f.temp && Number(f.temp) > 0)
      .map((f, i) => ({
        name: f.farm_name || `Farm ${i + 1}`,
        temperature: Number(f.temp || 0),
      }));

    return {
      totalFarms, avgTemperature, avgFieldSize, mostCommonCroppingPattern,
      avgSprayEfficiency, soilCounts, farmTypeCounts, patternCounts,
      tempSeries, totalArea, minTemp, maxTemp
    };
  }, [farms]);

  const formatNumber = (n) => (n === null || n === undefined || Number.isNaN(n) ? "—" : n);

  const totalPages = Math.ceil(farms.length / farmsPerPage);
  const paginatedFarms = farms.slice((currentPage - 1) * farmsPerPage, currentPage * farmsPerPage);

  return (
    <div style={{
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      background: "linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)",
      minHeight: "100vh",
      color: "#1e293b"
    }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: "280px 1fr",
        minHeight: "100vh"
      }}>
        {/* Sidebar */}
        <aside style={{
          background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)",
          padding: "2rem 1.5rem",
          display: "flex",
          flexDirection: "column",
          boxShadow: "4px 0 24px rgba(0,0,0,0.12)",
          position: "sticky",
          top: 0,
          height: "100vh",
          overflowY: "auto"
        }}>
          <div style={{ marginBottom: "2.5rem" }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              marginBottom: "0.5rem"
            }}>
              <div style={{
                width: "44px",
                height: "44px",
                background: "linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                fontWeight: "700",
                color: "#fff",
                boxShadow: "0 4px 12px rgba(20, 184, 166, 0.4)"
              }}>A</div>
              <div>
                <div style={{ color: "#fff", fontSize: "1.25rem", fontWeight: "700", letterSpacing: "-0.02em" }}>AgroDBMS</div>
                <div style={{ color: "rgb(148 163 184)", fontSize: "0.75rem", fontWeight: "500" }}>Professional Suite</div>
              </div>
            </div>
          </div>

          <nav style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "auto" }}>
            {[
              { id: "dashboard", label: "Dashboard", icon: "" },
              { id: "form", label: "Farm Entry", icon: "" },
              { id: "analytics", label: "Analytics", icon: "" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); if (tab.id === "form") resetForm(); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.875rem 1rem",
                  background: activeTab === tab.id ? "rgba(20, 184, 166, 0.15)" : "transparent",
                  border: activeTab === tab.id ? "1px solid rgba(20, 184, 166, 0.3)" : "1px solid transparent",
                  borderRadius: "10px",
                  color: activeTab === tab.id ? "#14B8A6" : "rgb(203 213 225)",
                  fontSize: "0.9375rem",
                  fontWeight: activeTab === tab.id ? "600" : "500",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  textAlign: "left"
                }}
              >
                <span style={{ fontSize: "1.25rem" }}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>

          <div style={{
            background: "rgba(255,255,255,0.05)",
            borderRadius: "12px",
            padding: "1rem",
            marginTop: "1.5rem"
          }}>
            <div style={{ color: "rgb(148 163 184)", fontSize: "0.75rem", marginBottom: "0.5rem" }}>Quick Actions</div>
            <button
              onClick={() => { fetchFarms(); alert("Data refreshed"); }}
              style={{
                width: "100%",
                padding: "0.625rem",
                background: "linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)",
                border: "none",
                borderRadius: "8px",
                color: "#fff",
                fontSize: "0.875rem",
                fontWeight: "600",
                cursor: "pointer",
                transition: "transform 0.2s ease"
              }}
            >
              Refresh Data
            </button>
          </div>

          <div style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ color: "rgb(148 163 184)", fontSize: "0.75rem", marginBottom: "0.25rem" }}>Developed by</div>
            <div style={{ color: "#fff", fontSize: "0.875rem", fontWeight: "600" }}>Abhishek Karad</div>
            <div style={{ color: "#fff", fontSize: "0.875rem", fontWeight: "600" }}>Minal Shinde</div>
            <div style={{ color: "rgb(148 163 184)", fontSize: "0.75rem", marginTop: "0.5rem" }}>TY-ECE AIML</div>
          </div>
        </aside>

        {/* Main Content */}
        <main style={{ padding: "2rem 2.5rem", overflowY: "auto" }}>
          {/* Header */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "2rem",
            flexWrap: "wrap",
            gap: "1rem"
          }}>
            <div>
              <h1 style={{
                margin: 0,
                fontSize: "1.875rem",
                fontWeight: "700",
                color: "#0f172a",
                letterSpacing: "-0.02em"
              }}>
                {activeTab === "dashboard" ? "Dashboard Overview" : activeTab === "form" ? (formData._id ? "Edit Farm" : "New Farm Entry") : "Analytics Center"}
              </h1>
              <p style={{
                margin: "0.25rem 0 0 0",
                color: "#64748b",
                fontSize: "0.9375rem"
              }}>
                {activeTab === "dashboard" ? "Monitor and manage your agricultural operations" : activeTab === "form" ? "Enter comprehensive farm details" : "Deep insights and data visualization"}
              </p>
            </div>

            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "#fff",
                padding: "0.625rem 1rem",
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="11" cy="11" r="7" stroke="#64748b" strokeWidth="2"/>
                  <path d="M21 21l-4.35-4.35" stroke="#64748b" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <input
                  placeholder="Search farms..."
                  style={{
                    border: "none",
                    outline: "none",
                    fontSize: "0.875rem",
                    width: "180px",
                    background: "transparent"
                  }}
                  onChange={(e) => {
                    const q = e.target.value.toLowerCase();
                    if (!q) { fetchFarms(); return; }
                    setFarms(prev => prev.filter(f =>
                      (f.farm_name || "").toLowerCase().includes(q) ||
                      (f.soil_type || "").toLowerCase().includes(q)
                    ));
                  }}
                />
              </div>
            </div>
          </div>

          {/* Dashboard Tab */}
          {activeTab === "dashboard" && (
            <div>
              {/* Stats Cards */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "1.25rem",
                marginBottom: "2rem"
              }}>
                {[
                  { label: "Total Farms", value: analytics.totalFarms, icon: "", color: "#14B8A6" },
                  { label: "Avg Field Size", value: `${formatNumber(analytics.avgFieldSize)} Ha²`, icon: "", color: "#6366F1" },
                  { label: "Avg Temperature", value: `${formatNumber(analytics.avgTemperature)}°C`, icon: "", color: "#F59E0B" },
                  { label: "Common Pattern", value: analytics.mostCommonCroppingPattern, icon: "", color: "#10B981" }
                ].map((stat, i) => (
                  <div key={i} style={{
                    background: "#fff",
                    padding: "1.5rem",
                    borderRadius: "16px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "1rem" }}>
                      <span style={{ fontSize: "2rem" }}>{stat.icon}</span>
                      <div style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: stat.color
                      }}></div>
                    </div>
                    <div style={{ color: "#64748b", fontSize: "0.875rem", marginBottom: "0.25rem" }}>{stat.label}</div>
                    <div style={{ fontSize: "1.75rem", fontWeight: "700", color: "#0f172a" }}>{stat.value}</div>
                  </div>
                ))}
              </div>

              {/* Farms List */}
              <div style={{
                background: "#fff",
                borderRadius: "16px",
                padding: "1.75rem",
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 16px rgba(0,0,0,0.04)"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                  <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: "700", color: "#0f172a" }}>Farm Records</h3>
                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    <button
                      onClick={() => { setActiveTab("form"); resetForm(); }}
                      style={{
                        padding: "0.625rem 1.25rem",
                        background: "linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)",
                        border: "none",
                        borderRadius: "8px",
                        color: "#fff",
                        fontSize: "0.875rem",
                        fontWeight: "600",
                        cursor: "pointer"
                      }}
                    >
                      + Add Farm
                    </button>
                    <button
                      onClick={fetchFarms}
                      style={{
                        padding: "0.625rem 1.25rem",
                        background: "#fff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        color: "#64748b",
                        fontSize: "0.875rem",
                        fontWeight: "600",
                        cursor: "pointer"
                      }}
                    >
                      Refresh
                    </button>
                  </div>
                </div>

                {loading ? (
                  <div style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>Loading farms...</div>
                ) : farms.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>No farms found. Add your first farm to get started.</div>
                ) : (
                  <>
                    <div style={{ display: "grid", gap: "1rem" }}>
                      {paginatedFarms.map((farm, idx) => {
                        const globalIdx = (currentPage - 1) * farmsPerPage + idx;
                        return (
                          <div key={farm._id} style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "1.25rem",
                            background: "#f8fafc",
                            borderRadius: "12px",
                            border: "1px solid #e2e8f0",
                            transition: "all 0.2s ease"
                          }}>
                            <div style={{ display: "flex", gap: "1rem", alignItems: "center", flex: 1 }}>
                              <div style={{
                                width: "56px",
                                height: "56px",
                                background: "linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)",
                                borderRadius: "12px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#fff",
                                fontSize: "1.25rem",
                                fontWeight: "700",
                                flexShrink: 0
                              }}>
                                {globalIdx + 1}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: "1.0625rem", fontWeight: "700", color: "#0f172a", marginBottom: "0.25rem" }}>
                                  {farm.farm_name || "Unnamed Farm"}
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.5rem", fontSize: "0.8125rem", color: "#64748b" }}>
                                  <div>📍 ID: {farm.farmid} • Area: {farm.farm_area} Ha²</div>
                                  <div>🌱 Style: {farm.Style} • Pattern: {farm.Cropping_pattern}</div>
                                  <div>🌡️ Temp: {farm.temp}°C • Soil: {farm.soil_type}</div>
                                </div>
                                {farm.effectiveness && (
                                  <div style={{
                                    marginTop: "0.5rem",
                                    display: "inline-block",
                                    padding: "0.25rem 0.75rem",
                                    background: "rgba(16, 185, 129, 0.1)",
                                    borderRadius: "6px",
                                    fontSize: "0.75rem",
                                    color: "#059669",
                                    fontWeight: "600"
                                  }}>
                                    ✓ Effectiveness: {farm.effectiveness}% • Coverage: {farm.coverage}%
                                  </div>
                                )}
                              </div>
                            </div>

                            <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                              <button
                                onClick={() => handleEdit(farm)}
                                style={{
                                  padding: "0.5rem 1rem",
                                  background: "#fff",
                                  border: "1px solid #e2e8f0",
                                  borderRadius: "8px",
                                  color: "#64748b",
                                  fontSize: "0.8125rem",
                                  fontWeight: "600",
                                  cursor: "pointer"
                                }}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(farm._id)}
                                style={{
                                  padding: "0.5rem 1rem",
                                  background: "#fff",
                                  border: "1px solid #fecaca",
                                  borderRadius: "8px",
                                  color: "#dc2626",
                                  fontSize: "0.8125rem",
                                  fontWeight: "600",
                                  cursor: "pointer"
                                }}
                              >
                                Delete
                              </button>
                              <button
                                onClick={() => handleSendToMATLAB(farm._id)}
                                style={{
                                  padding: "0.5rem 1rem",
                                  background: "linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)",
                                  border: "none",
                                  borderRadius: "8px",
                                  color: "#fff",
                                  fontSize: "0.8125rem",
                                  fontWeight: "600",
                                  cursor: "pointer"
                                }}
                              >
                                Process
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: "1.5rem",
                        paddingTop: "1.5rem",
                        borderTop: "1px solid #e2e8f0"
                      }}>
                        <div style={{ color: "#64748b", fontSize: "0.875rem" }}>
                          Showing {(currentPage - 1) * farmsPerPage + 1} to {Math.min(currentPage * farmsPerPage, farms.length)} of {farms.length} farms
                        </div>
                        
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            style={{
                              padding: "0.5rem 1rem",
                              background: currentPage === 1 ? "#f1f5f9" : "#fff",
                              border: "1px solid #e2e8f0",
                              borderRadius: "8px",
                              color: currentPage === 1 ? "#94a3b8" : "#64748b",
                              fontSize: "0.875rem",
                              fontWeight: "600",
                              cursor: currentPage === 1 ? "not-allowed" : "pointer"
                            }}
                          >
                            Previous
                          </button>
                          
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              style={{
                                padding: "0.5rem 0.875rem",
                                background: currentPage === pageNum ? "linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)" : "#fff",
                                border: currentPage === pageNum ? "none" : "1px solid #e2e8f0",
                                borderRadius: "8px",
                                color: currentPage === pageNum ? "#fff" : "#64748b",
                                fontSize: "0.875rem",
                                fontWeight: "600",
                                cursor: "pointer",
                                minWidth: "36px"
                              }}
                            >
                              {pageNum}
                            </button>
                          ))}
                          
                          <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            style={{
                              padding: "0.5rem 1rem",
                              background: currentPage === totalPages ? "#f1f5f9" : "#fff",
                              border: "1px solid #e2e8f0",
                              borderRadius: "8px",
                              color: currentPage === totalPages ? "#94a3b8" : "#64748b",
                              fontSize: "0.875rem",
                              fontWeight: "600",
                              cursor: currentPage === totalPages ? "not-allowed" : "pointer"
                            }}
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Form Tab */}
          {activeTab === "form" && (
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 360px",
              gap: "1.5rem"
            }}>
              <div style={{
                background: "#fff",
                borderRadius: "16px",
                padding: "2rem",
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 16px rgba(0,0,0,0.04)"
              }}>
                <form onSubmit={formData._id ? handleUpdate : handleSubmit}>
                  {Object.entries({
                    "Farm ID": { name: "farmid", type: "text" },
                    "Farm Name": { name: "farm_name", type: "text" },
                    "Farm Area (Ha²)": { name: "farm_area", type: "number" },
                    "Temperature (°C)": { name: "temp", type: "number" },
                    "Obstacle Density": { name: "obstacle_density", type: "number" }
                  }).map(([label, field]) => (
                    <div key={field.name} style={{ marginBottom: "1.25rem" }}>
                      <label style={{
                        display: "block",
                        marginBottom: "0.5rem",
                        fontSize: "0.875rem",
                        fontWeight: "600",
                        color: "#334155"
                      }}>{label}</label>
                      <input
                        type={field.type}
                        name={field.name}
                        value={formData[field.name]}
                        onChange={handleChange}
                        required
                        style={{
                          width: "100%",
                          padding: "0.75rem",
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                          fontSize: "0.9375rem",
                          outline: "none",
                          transition: "border-color 0.2s ease"
                        }}
                      />
                    </div>
                  ))}

                  {[
                    { label: "Shape", name: "shape", options: ["", "rectangular", "circular", "irregular"] },
                    { label: "Size Fragmentation", name: "size_fragmentation", options: ["", "low", "medium", "high"] },
                    { label: "Level", name: "level", options: ["", "flat", "slope", "uneven"] },
                    { label: "Boundary", name: "boundary", options: ["", "open", "fenced", "natural"] },
                    { label: "Soil Type", name: "soil_type", options: ["", "clay", "sandy", "loamy", "silty", "peaty"] },
                    { label: "Cropping Pattern", name: "cropping_pattern", options: ["", "monocropping", "intercropping", "mixed", "relay"] },
                    { label: "Spray Type", name: "spray_type", options: ["", "manual", "drone", "tractor", "automated"] }
                  ].map(field => (
                    <div key={field.name} style={{ marginBottom: "1.25rem" }}>
                      <label style={{
                        display: "block",
                        marginBottom: "0.5rem",
                        fontSize: "0.875rem",
                        fontWeight: "600",
                        color: "#334155"
                      }}>{field.label}</label>
                      <select
                        name={field.name}
                        value={formData[field.name]}
                        onChange={handleChange}
                        style={{
                          width: "100%",
                          padding: "0.75rem",
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                          fontSize: "0.9375rem",
                          outline: "none",
                          background: "#fff"
                        }}
                      >
                        {field.options.map(opt => (
                          <option key={opt} value={opt}>{opt || "Select " + field.label}</option>
                        ))}
                      </select>
                    </div>
                  ))}

                  <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
                    <button
                      type="submit"
                      style={{
                        flex: 1,
                        padding: "0.875rem",
                        background: "linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)",
                        border: "none",
                        borderRadius: "10px",
                        color: "#fff",
                        fontSize: "0.9375rem",
                        fontWeight: "600",
                        cursor: "pointer",
                        boxShadow: "0 4px 12px rgba(20, 184, 166, 0.3)"
                      }}
                    >
                      {formData._id ? "Update Farm" : "Create Farm"}
                    </button>
                    <button
                      type="button"
                      onClick={() => { resetForm(); setActiveTab("dashboard"); }}
                      style={{
                        flex: 1,
                        padding: "0.875rem",
                        background: "#fff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "10px",
                        color: "#64748b",
                        fontSize: "0.9375rem",
                        fontWeight: "600",
                        cursor: "pointer"
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>

              <div style={{
                background: "#fff",
                borderRadius: "16px",
                padding: "1.75rem",
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
                height: "fit-content"
              }}>
                <h4 style={{ margin: "0 0 1rem 0", fontSize: "1.125rem", fontWeight: "700", color: "#0f172a" }}>
                  Form Guidelines
                </h4>
                <p style={{ color: "#64748b", fontSize: "0.875rem", lineHeight: "1.6", marginBottom: "1.5rem" }}>
                  Complete all farm details including geographical, environmental, and agricultural parameters. After creation, use the Process button to run MATLAB simulations.
                </p>

                <div style={{ marginTop: "1.5rem" }}>
                  <div style={{ fontSize: "0.875rem", fontWeight: "600", color: "#334155", marginBottom: "0.75rem" }}>
                    Recent Entries
                  </div>
                  <div style={{ display: "grid", gap: "0.75rem" }}>
                    {farms.slice(0, 5).map((f, i) => (
                      <div key={i} style={{
                        padding: "0.875rem",
                        background: "#f8fafc",
                        borderRadius: "8px",
                        fontSize: "0.8125rem"
                      }}>
                        <div style={{ fontWeight: "600", color: "#0f172a", marginBottom: "0.25rem" }}>
                          {f.farm_name || f.farmid}
                        </div>
                        <div style={{ color: "#64748b" }}>
                          {f.soil_type} • {f.Style}
                        </div>
                      </div>
                    ))}
                    {farms.length === 0 && (
                      <div style={{ color: "#94a3b8", fontSize: "0.8125rem", padding: "1rem", textAlign: "center" }}>
                        No farms yet
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === "analytics" && (
            <div>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "1.5rem",
                marginBottom: "2rem"
              }}>
                {[
                  { title: "Total Farms", value: analytics.totalFarms, subtitle: "Active records", color: "#14B8A6" },
                  { title: "Avg Temperature", value: `${formatNumber(analytics.avgTemperature)}°C`, subtitle: "Climate average", color: "#F59E0B" },
                  { title: "Avg Field Size", value: `${formatNumber(analytics.avgFieldSize)} Ha²`, subtitle: "Per farm", color: "#6366F1" },
                  { title: "Avg Efficiency", value: `${formatNumber(analytics.avgSprayEfficiency)}%`, subtitle: "Spray effectiveness", color: "#10B981" }
                ].map((stat, i) => (
                  <div key={i} style={{
                    background: "#fff",
                    padding: "1.75rem",
                    borderRadius: "16px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.04)"
                  }}>
                    <div style={{
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      background: stat.color,
                      marginBottom: "1rem"
                    }}></div>
                    <div style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: "0.5rem" }}>
                      {stat.title}
                    </div>
                    <div style={{ fontSize: "2rem", fontWeight: "700", color: "#0f172a", marginBottom: "0.25rem" }}>
                      {stat.value}
                    </div>
                    <div style={{ fontSize: "0.8125rem", color: "#94a3b8" }}>
                      {stat.subtitle}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
                <div style={{
                  background: "#fff",
                  padding: "1.75rem",
                  borderRadius: "16px",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.04)"
                }}>
                  <h4 style={{ margin: "0 0 1.25rem 0", fontSize: "1.125rem", fontWeight: "700", color: "#0f172a" }}>
                    Soil Type Distribution
                  </h4>
                  <div style={{ height: "300px" }}>
                    {analytics.soilCounts.length === 0 ? (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#94a3b8" }}>
                        No data available
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            dataKey="value"
                            data={analytics.soilCounts}
                            labelLine={false}
                            outerRadius={100}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {analytics.soilCounts.map((entry, idx) => (
                              <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                            ))}
                          </Pie>
                          <Legend />
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                <div style={{
                  background: "#fff",
                  padding: "1.75rem",
                  borderRadius: "16px",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.04)"
                }}>
                  <h4 style={{ margin: "0 0 1.25rem 0", fontSize: "1.125rem", fontWeight: "700", color: "#0f172a" }}>
                    Farm Type Analysis
                  </h4>
                  <div style={{ height: "300px" }}>
                    {analytics.farmTypeCounts.length === 0 ? (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#94a3b8" }}>
                        No data available
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics.farmTypeCounts} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis type="number" />
                          <YAxis type="category" dataKey="name" />
                          <Tooltip />
                          <Bar dataKey="value" fill="#14B8A6" radius={[0, 8, 8, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>

              <div style={{
                background: "#fff",
                padding: "1.75rem",
                borderRadius: "16px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 16px rgba(0,0,0,0.04)"
              }}>
                <h4 style={{ margin: "0 0 1.25rem 0", fontSize: "1.125rem", fontWeight: "700", color: "#0f172a" }}>
                  Temperature Trends
                </h4>
                <div style={{ height: "320px" }}>
                  {analytics.tempSeries.length === 0 ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#94a3b8" }}>
                      No temperature data available
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analytics.tempSeries}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="temperature"
                          stroke="#14B8A6"
                          strokeWidth={3}
                          name="Temperature (°C)"
                          dot={{ fill: "#14B8A6", r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div style={{
                background: "#fff",
                padding: "1.75rem",
                borderRadius: "16px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
                marginTop: "1.5rem"
              }}>
                <h4 style={{ margin: "0 0 1rem 0", fontSize: "1.125rem", fontWeight: "700", color: "#0f172a" }}>
                  AI Assistant
                </h4>
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", marginBottom: "1rem" }}>
                  <input
                    type="text"
                    placeholder="Ask about farming practices, soil types, crop patterns..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    style={{
                      flex: 1,
                      padding: "0.875rem 1rem",
                      border: "1px solid #e2e8f0",
                      borderRadius: "10px",
                      fontSize: "0.9375rem",
                      outline: "none"
                    }}
                  />
                  <button
                    onClick={async () => {
                      if (!query.trim()) return;
                      setLoadingAnswer(true);
                      try {
                        const res = await fetch(`${API_BASE}/api/gemini-query`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ query, context: "agriculture and farm analytics" }),
                        });
                        const data = await res.json();
                        setGeminiAnswer(data.answer || "No response received.");
                      } catch (error) {
                        setGeminiAnswer("Error connecting to the server.");
                      } finally {
                        setLoadingAnswer(false);
                      }
                    }}
                    disabled={loadingAnswer || !query}
                    style={{
                      padding: "0.875rem 1.5rem",
                      background: loadingAnswer ? "#94a3b8" : "linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)",
                      border: "none",
                      borderRadius: "10px",
                      color: "#fff",
                      fontSize: "0.9375rem",
                      fontWeight: "600",
                      cursor: loadingAnswer ? "not-allowed" : "pointer",
                      whiteSpace: "nowrap"
                    }}
                  >
                    {loadingAnswer ? "Thinking..." : "Ask AI"}
                  </button>
                </div>

                {geminiAnswer && (
                  <div style={{
                    background: "linear-gradient(135deg, #f0fdfa 0%, #ecfdf5 100%)",
                    borderRadius: "12px",
                    padding: "1.25rem",
                    fontSize: "0.9375rem",
                    lineHeight: "1.7",
                    color: "#0f172a",
                    border: "1px solid #a7f3d0",
                    whiteSpace: "pre-wrap"
                  }}>
                    {geminiAnswer}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
