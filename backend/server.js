const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const Farm = require("./models/Farm");

const app = express();

const allowedOrigins = [
  'http://localhost:3000', // local React
  'https://precision-farming-dashboard.vercel.app',
  'https://precision-farming-dashboard-2.onrender.com',
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

// READ all farms - clean output for frontend
app.get("/api/farms", async (req, res) => {
  try {
    const farms = await Farm.find({}, { __v: 0 }).sort({ createdAt: -1 });
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

// GET single farm by ID
app.get("/api/farms/:id", async (req, res) => { 
  try {
    const farm = await Farm.findById(req.params.id);
    if (!farm) return res.status(404).json({ error: "Farm not found" });
    res.json(farm);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching farm" });
  }
});

/* =========================================================
   2️⃣  MATLAB INTEGRATION ROUTES - IMPROVED 
========================================================= */

// 🔄 IMPROVEMENT 1: Combined endpoint to mark pending AND queue for MATLAB
app.post("/api/pending", async (req, res) => {
  try {
    const { farmId } = req.body;
    if (!farmId) return res.status(400).json({ error: "farmId required" });

    const farm = await Farm.findById(farmId);
    if (!farm) return res.status(404).json({ error: "Farm not found" });

    // ✨ IMPROVED: Update status to pending
    farm.status = "pending";
    await farm.save();

    console.log(`✅ Farm ${farmId} marked as pending`); //  IMPROVED: Better logging

    res.json({ message: "Farm marked as pending", farm });
  } catch (err) {
    console.error("❌ Error in /api/pending:", err); //  IMPROVED: Better error logging
    res.status(500).json({ error: err.message });
  }
});

// 🔄 IMPROVEMENT 2: Enhanced push-json with status update and better payload handling
app.post("/api/push-json", async (req, res) => {
  try {
    const { farmId, payload } = req.body;
    if (!farmId) return res.status(400).json({ error: "farmId is required" });

    const farm = await Farm.findById(farmId);
    if (!farm) return res.status(404).json({ error: "Farm not found" });

    // ✅ If payload is not explicitly sent, use the farm data
    const finalPayload = payload || farm.toObject();

    // ✨ IMPROVED: Also set status to "pending" when pushing payload
    const updatedFarm = await Farm.findByIdAndUpdate(
      farmId,
      {
        $set: {
          pushedPayload: {
            data: finalPayload,
            createdAt: new Date(),
            readByMatlab: false,
          },
          status: "pending" // ✨ NEW: Ensure status is synchronized
        },
      },
      { new: true }
    );

    console.log("📤 Payload pushed for MATLAB:", farmId); // ✨ IMPROVED: Cleaner logging
    res.json({ 
      message: "Payload pushed successfully", 
      farm: updatedFarm 
    });
  } catch (err) {
    console.error("❌ Error in /api/push-json:", err);
    res.status(500).json({ error: "Failed to push payload" });
  }
});

// 🔄 IMPROVEMENT 3: Enhanced polling with FIFO ordering and status update
app.get("/api/poll-json", async (req, res) => {
  try {
    // ✨ IMPROVED: Find the OLDEST unprocessed farm (FIFO - First In First Out)
    const farm = await Farm.findOne({ 
      "pushedPayload.readByMatlab": false 
    }).sort({ "pushedPayload.createdAt": 1 }); // ✨ NEW: Sort by creation time

    if (!farm || !farm.pushedPayload) {
      return res.json({ message: "No new payloads" });
    }

    // ✨ IMPROVED: Mark as read AND update status to "processing"
    farm.pushedPayload.readByMatlab = true;
    farm.status = "processing"; // ✨ NEW: Track processing state
    await farm.save();

    console.log("📥 MATLAB fetched payload for farm:", farm._id);
    res.json({
      farmId: farm._id.toString(), // ✨ IMPROVED: Ensure string format
      payload: farm.pushedPayload.data,
    });
  } catch (err) {
    console.error("❌ Error in /api/poll-json:", err);
    res.status(500).json({ error: "Failed to fetch payload" });
  }
});

// 🔄 IMPROVEMENT 4: Enhanced MATLAB results callback with status completion
app.post("/api/matlab-results", async (req, res) => {
  try {
    const { 
      farmId, 
      sprayEfficiency, 
      coverage, 
      bestAlgorithm, 
      recommendedFormula, 
      imagePath 
    } = req.body;

    if (!farmId) {
      return res.status(400).json({ error: "farmId is required" });
    }

    // ✨ IMPROVED: Update farm with results AND mark as "completed"
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
          status: "completed" // ✨ NEW: Mark processing as completed
        },
      },
      { new: true }
    );

    if (!updatedFarm) {
      return res.status(404).json({ error: "Farm not found" });
    }

    console.log("✅ MATLAB results received for farm:", farmId); // ✨ IMPROVED: Better logging

    res.json({
      message: "MATLAB results saved successfully",
      farm: updatedFarm,
    });
  } catch (err) {
    console.error("❌ Error in /api/matlab-results:", err);
    res.status(500).json({ error: "Failed to process MATLAB results" });
  }
});

// 🔄 IMPROVEMENT 5: Enhanced results endpoint that also returns status
app.get("/api/farms/:id/matlab-results", async (req, res) => {
  try {
    const farm = await Farm.findById(req.params.id);
    if (!farm) return res.status(404).json({ error: "Farm not found" });

    // ✨ IMPROVED: Return both results AND current status
    res.json({ 
      matlabResults: farm.matlabResults || null,
      status: farm.status // ✨ NEW: Include processing status
    });
  } catch (err) {
    console.error("❌ Error fetching MATLAB results:", err); // ✨ IMPROVED: Better error logging
    res.status(500).json({ error: "Failed to fetch MATLAB results" });
  }
});

// 🔄 IMPROVEMENT 6: Legacy sendout endpoint - now calls push-json internally
// Keep this for backward compatibility if needed
app.post("/api/sendout", async (req, res) => {
  try {
    const { farmId } = req.body;
    if (!farmId) return res.status(400).json({ error: "farmId is required" });

    const farm = await Farm.findById(farmId);
    if (!farm) return res.status(404).json({ error: "Farm not found" });

    // ✨ IMPROVED: Use the same logic as push-json for consistency
    const updatedFarm = await Farm.findByIdAndUpdate(
      farmId,
      {
        $set: {
          pushedPayload: {
            data: farm.toObject(),
            createdAt: new Date(),
            readByMatlab: false,
          },
          status: "pending" // ✨ NEW: Set status
        },
      },
      { new: true }
    );

    console.log("📤 Farm payload queued for MATLAB:", farmId);
    res.json({ 
      message: "Farm data queued successfully!", 
      sentData: updatedFarm 
    });
  } catch (err) {
    console.error("❌ Error sending farm data:", err.message);
    res.status(500).json({ error: "Failed to send farm data" });
  }
});

//Chatbot assistant
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fetch = require("node-fetch");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 🕸️ Simple free web search using DuckDuckGo API
async function webSearch(query) {
  try {
    const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(
      query
    )}&format=json&no_html=1&skip_disambig=1`;
    const res = await fetch(searchUrl);
    const data = await res.json();

    // Extract a short text snippet
    const text =
      data.AbstractText ||
      (data.RelatedTopics && data.RelatedTopics[0]?.Text) ||
      "No reliable web summary available.";
    return text;
  } catch {
    return "Unable to retrieve web context.";
  }
}

// 🎯 Route: POST /api/gemini-query
app.post("/api/gemini-query", async (req, res) => {
  try {
    const { query, context } = req.body;

    // 1️⃣ Get web context
    const webContext = await webSearch(query);

    // 2️⃣ Ask Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
You are an AI assistant strictly focused on the following domain:
"${context || "agriculture"}".

You must always stay within this domain. 
If the user's query is outside this context, reply with: 
"Out of context."

Use only reliable knowledge and the recent web snippet below to answer concisely.

=== WEB CONTEXT ===
${webContext}

=== USER QUESTION ===
${query}
`;

    const result = await model.generateContent(prompt);
    const answer = await result.response.text();

    res.json({ answer });
  } catch (err) {
    console.error("❌ Error in /api/gemini-query:", err);
    res.status(500).json({ error: err.message });
  }
});










/* =========================================================
   3️⃣  SERVER START
========================================================= */

const PORT = process.env.PORT || 8888;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));