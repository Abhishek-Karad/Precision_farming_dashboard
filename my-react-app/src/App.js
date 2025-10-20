import React, { useState, useEffect } from "react";

function App() {
  const [activeTab, setActiveTab] = useState("form");
  const [formData, setFormData] = useState({
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
  });
  const [farms, setFarms] = useState([]);

  const farmingStyles = ["Organic", "Traditional", "Precision", "Hydroponic", "Aquaponic"];
  const farmTypes = ["Crop Field", "Greenhouse", "Plantation", "Livestock Farm", "Mixed Farm"];
  const soilTypes = ["Sandy", "Clayey", "Loamy", "Silty", "Peaty"];
  const sprayTypes = ["Fertilizer", "Pesticide", "Herbicide", "Micronutrient Mix"];

  const fetchFarms = async () => {
    try {
      const res = await fetch("http://localhost:8888/api/farms");
      const data = await res.json();
      setFarms(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchFarms();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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

      const res = await fetch("http://localhost:8888/api/farms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        alert("Farm details submitted successfully!");
        setFormData({
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
        });
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
      const res = await fetch(`http://localhost:8888/api/farms/${formData._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        alert("Farm updated successfully!");
        setFormData({
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
        });
        fetchFarms();
        setActiveTab("dashboard");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this farm?")) return;
    try {
      await fetch(`http://localhost:8888/api/farms/${id}`, { method: "DELETE" });
      setFarms(farms.filter(f => f._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (farm) => {
    setFormData({
      length: farm.length,
      width: farm.width,
      farmingStyle: farm.farmingStyle,
      farmType: farm.farmType,
      soilType: farm.soilType,
      temperature: farm.temperature,
      humidity: farm.humidity,
      rainfall: farm.rainfall,
      wind: farm.wind,
      sprayType: farm.sprayType,
      _id: farm._id,
    });
    setActiveTab("form");
  };

  const handleSendData = async (farm) => {
    try {
      const res = await fetch("http://localhost:8888/api/sendout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ farmId: farm._id }),
      });

      const data = await res.json();

      if (res.ok) {
        alert(`MATLAB Simulation Complete!\nSent Data: ${JSON.stringify(data.sentData)}`);
        console.log("MATLAB Response:", data);
      } else {
        alert("Failed to send farm data!");
      }
    } catch (err) {
      console.error(err);
      alert("Server error while sending farm data.");
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Farm Management System</h2>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          onClick={() => setActiveTab("form")}
          style={activeTab === "form" ? styles.activeTab : styles.tab}
        >
          Add Farm
        </button>
        <button
          onClick={() => setActiveTab("dashboard")}
          style={activeTab === "dashboard" ? styles.activeTab : styles.tab}
        >
          Dashboard
        </button>
      </div>

      {/* Form */}
      {activeTab === "form" && (
        <form onSubmit={formData._id ? handleUpdate : handleSubmit} style={styles.form}>
          <label style={styles.label}>Farm Dimensions (m):</label>
          <div style={styles.row}>
            <input
              type="number"
              name="length"
              value={formData.length}
              onChange={handleChange}
              placeholder="Length"
              style={styles.input}
              required
            />
            <span style={styles.multiplySign}>×</span>
            <input
              type="number"
              name="width"
              value={formData.width}
              onChange={handleChange}
              placeholder="Width"
              style={styles.input}
              required
            />
          </div>

          <label style={styles.label}>Farming Style:</label>
          <select name="farmingStyle" value={formData.farmingStyle} onChange={handleChange} style={styles.select} required>
            <option value="">Select Farming Style</option>
            {farmingStyles.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <label style={styles.label}>Type of Farm:</label>
          <select name="farmType" value={formData.farmType} onChange={handleChange} style={styles.select} required>
            <option value="">Select Farm Type</option>
            {farmTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <label style={styles.label}>Soil Type:</label>
          <select name="soilType" value={formData.soilType} onChange={handleChange} style={styles.select} required>
            <option value="">Select Soil Type</option>
            {soilTypes.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <h3 style={styles.subHeading}>Weather Conditions</h3>

          <label style={styles.label}>Temperature (°C):</label>
          <input type="number" name="temperature" value={formData.temperature} onChange={handleChange} style={styles.input} required />

          <label style={styles.label}>Humidity (%):</label>
          <input type="number" name="humidity" value={formData.humidity} onChange={handleChange} style={styles.input} required />

          <label style={styles.label}>Rainfall (mm):</label>
          <input type="number" name="rainfall" value={formData.rainfall} onChange={handleChange} style={styles.input} required />

          <label style={styles.label}>Wind (km/h):</label>
          <input type="number" name="wind" value={formData.wind} onChange={handleChange} style={styles.input} required />

          <label style={styles.label}>Spray Type:</label>
          <select name="sprayType" value={formData.sprayType} onChange={handleChange} style={styles.select} required>
            <option value="">Select Spray Type</option>
            {sprayTypes.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <button type="submit" style={styles.button}>{formData._id ? "Update Farm" : "Submit"}</button>
        </form>
      )}

      {/* Dashboard */}
      {activeTab === "dashboard" && (
        <div style={styles.grid}>
          {farms.length === 0 ? <p style={styles.noData}>No farm records found.</p> : (
            farms.map((farm, idx) => (
              <div key={farm._id} style={styles.card}>
                <h4 style={styles.cardHeading}>Farm #{idx + 1}</h4>
                <p><strong>Dimensions:</strong> {farm.length} × {farm.width} m</p>
                <p><strong>Farming Style:</strong> {farm.farmingStyle}</p>
                <p><strong>Farm Type:</strong> {farm.farmType}</p>
                <p><strong>Soil Type:</strong> {farm.soilType}</p>
                <p><strong>Temp:</strong> {farm.temperature}°C, <strong>Humidity:</strong> {farm.humidity}%</p>
                <p><strong>Rainfall:</strong> {farm.rainfall} mm, <strong>Wind:</strong> {farm.wind} km/h</p>
                <p><strong>Spray Type:</strong> {farm.sprayType}</p>

                {farm.matlabResults ? (
                  <div style={{ marginTop: "10px" }}>
                    <p><strong>Algorithm:</strong> {farm.matlabResults.bestAlgorithm}</p>
                    <p><strong>Efficiency:</strong> {farm.matlabResults.sprayEfficiency}%</p>
                    <p><strong>Coverage:</strong> {farm.matlabResults.coverage}%</p>
                    <p><strong>Formula:</strong> {farm.matlabResults.recommendedFormula}</p>
                    {farm.matlabResults.imagePath && <img src={farm.matlabResults.imagePath} alt="Heatmap" style={{ width: "100%", borderRadius: "5px", marginTop: "5px" }} />}
                  </div>
                ) : <p>No MATLAB results yet.</p>}

                <div style={styles.cardButtons}>
                  <button onClick={() => handleEdit(farm)} style={styles.cardButton}>Edit</button>
                  <button onClick={() => handleDelete(farm._id)} style={styles.cardButton}>Delete</button>
                  <button onClick={() => handleSendData(farm)} style={styles.cardButton}>Send Data</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "1000px",
    margin: "20px auto",
    padding: "20px",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    color: "#333",
  },
  heading: {
    textAlign: "center",
    marginBottom: "25px",
    fontSize: "28px",
    fontWeight: "600",
  },
  tabs: { display: "flex", gap: "10px", marginBottom: "25px", justifyContent: "center" },
  tab: { padding: "10px 25px", cursor: "pointer", background: "#f0f0f0", border: "none", borderRadius: "6px", transition: "0.3s", fontWeight: "500" },
  activeTab: { padding: "10px 25px", cursor: "pointer", background: "#2c7a7b", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "500" },
  form: { display: "flex", flexDirection: "column", gap: "15px", padding: "20px", background: "#fefefe", borderRadius: "8px", boxShadow: "0 4px 10px rgba(0,0,0,0.05)" },
  row: { display: "flex", alignItems: "center", gap: "10px" },
  input: { padding: "8px 12px", borderRadius: "5px", border: "1px solid #ccc", flex: 1, fontSize: "14px" },
  select: { padding: "8px 12px", borderRadius: "5px", border: "1px solid #ccc", fontSize: "14px" },
  multiplySign: { fontWeight: "600", fontSize: "16px" },
  label: { fontWeight: "500", marginBottom: "5px" },
  subHeading: { fontWeight: "600", marginTop: "15px", marginBottom: "10px" },
  button: { backgroundColor: "#2c7a7b", color: "white", padding: "10px", border: "none", borderRadius: "6px", cursor: "pointer", marginTop: "10px", fontWeight: "500", transition: "0.3s" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" },
  card: { padding: "20px", borderRadius: "10px", background: "#fff", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", transition: "0.3s", display: "flex", flexDirection: "column", justifyContent: "space-between" },
  cardHeading: { marginBottom: "10px", fontSize: "18px", fontWeight: "600" },
  cardButtons: { display: "flex", gap: "8px", marginTop: "15px", flexWrap: "wrap" },
  cardButton: { flex: 1, padding: "8px", border: "none", borderRadius: "5px", background: "#2c7a7b", color: "#fff", cursor: "pointer", fontWeight: "500", transition: "0.3s" },
  noData: { textAlign: "center", fontStyle: "italic", color: "#777" },
};

export default App;
