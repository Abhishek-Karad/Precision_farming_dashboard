const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const Farm = require("./models/Farm");

const app = express();

const allowedOrigins = [
  'http://localhost:3000', // local React
  'https://precision-farming-dashboard.vercel.app',
  "*" // production
];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// 🔗 MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

/* =========================================================
   1️⃣  FARM CRUD ROUTES
========================================================= */

// CREATE a new farm
app.post("/api/farms", async (req, res) => {
  try {
    const newFarm = new Farm(req.body);
    await newFarm.save();
    res.status(201).json(newFarm);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error saving farm details" });
  }
});

// READ all farms
app.get("/api/farms", async (req, res) => {
  try {
    const farms = await Farm.find();
    res.json(farms);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching farms" });
  }
});

// UPDATE a farm
app.put("/api/farms/:id", async (req, res) => {
  try {
    const updatedFarm = await Farm.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedFarm);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error updating farm" });
  }
});

// DELETE a farm
app.delete("/api/farms/:id", async (req, res) => {
  try {
    await Farm.findByIdAndDelete(req.params.id);
    res.json({ message: "Farm deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error deleting farm" });
  }
});

app.get("/api/farms/:id", async (req, res) => { 
  try {
    const farm = await Farm.findById(req.params.id);
    if (!farm) return res.status(404).json({ error: "Farm not found" });
    res.json(farm);  // ✅ This is what MATLAB fetchFarmData uses
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching farm" });
  }
});






const axios = require("axios"); // npm install axios

// ✅ Replace /api/sendout with this
app.post("/api/sendout", async (req, res) => {
  try {
    const { farmId } = req.body;
    if (!farmId) return res.status(400).json({ error: "farmId is required" });

    const farm = await Farm.findById(farmId);
    if (!farm) return res.status(404).json({ error: "Farm not found" });

    // Instead of sending to external backend, push locally
    const updatedFarm = await Farm.findByIdAndUpdate(
      farmId,
      {
        $set: {
          pushedPayload: {
            data: farm.toObject(),
            createdAt: new Date(),
            readByMatlab: false,
          },
        },
      },
      { new: true }
    );

    console.log("📤 Farm payload queued for MATLAB:", updatedFarm.pushedPayload);
    res.json({ message: "Farm data queued successfully!", sentData: updatedFarm });
  } catch (err) {
    console.error("❌ Error sending farm data:", err.message);
    res.status(500).json({ error: "Failed to send farm data" });
  }
});



/* =========================================================
   2️⃣  MATLAB RESULT CALLBACK (MATLAB → Node.js)
========================================================= */

app.post("/api/matlab-results", async (req, res) => {
  try {
    const { farmId, sprayEfficiency, coverage, bestAlgorithm, recommendedFormula, imagePath } = req.body;

    if (!farmId) {
      return res.status(400).json({ error: "farmId is required" });
    }

    // Update the farm document with MATLAB results
    const updatedFarm = await Farm.findByIdAndUpdate(
      farmId,
      {
        $set: {
          matlabResults: {
            sprayEfficiency,
            coverage,
            bestAlgorithm,
            recommendedFormula,
            imagePath,
            receivedAt: new Date(),
          },
        },
      },
      { new: true }
    );

    if (!updatedFarm) {
      return res.status(404).json({ error: "Farm not found" });
    }

    console.log("📥 MATLAB results received:", req.body);

    res.json({
      message: "MATLAB results saved successfully",
      farm: updatedFarm,
    });
  } catch (err) {
    console.error("❌ Error in /api/matlab-results:", err);
    res.status(500).json({ error: "Failed to process MATLAB results" });
  }
});

/* =========================================================
   3️⃣  GET MATLAB RESULTS (Frontend)
========================================================= */

app.get("/api/farms/:id/matlab-results", async (req, res) => {
  try {
    const farm = await Farm.findById(req.params.id);
    if (!farm) return res.status(404).json({ error: "Farm not found" });

    res.json({ matlabResults: farm.matlabResults || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch MATLAB results" });
  }
});


// ✅ MATLAB polling endpoint
app.get("/api/poll-json", async (req, res) => {
  try {
    // Find any farm where MATLAB hasn’t yet read the payload
    const farm = await Farm.findOne({ "pushedPayload.readByMatlab": false });

    if (!farm || !farm.pushedPayload) {
      return res.json({ message: "No new payloads" });
    }

    // Mark as read
    farm.pushedPayload.readByMatlab = true;
    await farm.save();

    console.log("📥 MATLAB fetched payload for farm:", farm._id);
    res.json({
      farmId: farm._id,
      payload: farm.pushedPayload.data,
    });
  } catch (err) {
    console.error("❌ Error in /api/poll-json:", err);
    res.status(500).json({ error: "Failed to fetch payload" });
  }
});


app.post("/api/push-json", async (req, res) => {
  try {
    const { farmId, payload } = req.body;
    if (!farmId) return res.status(400).json({ error: "farmId is required" });

    // ✅ If payload is not explicitly sent, use the farm data
    const farm = await Farm.findById(farmId);
    if (!farm) return res.status(404).json({ error: "Farm not found" });

    const finalPayload = payload || farm.toObject();

    const updatedFarm = await Farm.findByIdAndUpdate(
      farmId,
      {
        $set: {
          pushedPayload: {
            data: finalPayload,
            createdAt: new Date(),
            readByMatlab: false,
          },
        },
      },
      { new: true }
    );

    console.log("📤 Payload pushed for MATLAB:", updatedFarm.pushedPayload);
    res.json({ message: "Payload pushed successfully", farm: updatedFarm });
  } catch (err) {
    console.error("❌ Error in /api/push-json:", err);
    res.status(500).json({ error: "Failed to push payload" });
  }
});

app.post("/api/pending", async (req, res) => {
  try {
    const { farmId } = req.body;
    if (!farmId) return res.status(400).json({ error: "farmId required" });

    const farm = await Farm.findById(farmId);
    if (!farm) return res.status(404).json({ error: "Farm not found" });

    farm.status = "pending"; // add a status field in schema if not there
    await farm.save();

    res.json({ message: "Farm marked as pending" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});




/* =========================================================
   4️⃣  SERVER START
========================================================= */

const PORT = process.env.PORT || 8888;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
