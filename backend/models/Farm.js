const mongoose = require("mongoose");

const FarmSchema = new mongoose.Schema({
  length: Number,
  width: Number,
  farmingStyle: String,
  farmType: String,
  soilType: String,
  temperature: Number,
  humidity: Number,
  rainfall: Number,
  wind: Number,
  sprayType: String,

  // MATLAB integration
  pushedPayload: {
    data: Object,        // stores the farm data to process
    createdAt: Date,
    readByMatlab: { type: Boolean, default: false }
  },
  status: { type: String, default: "new" }, // new / pending / processing / completed

  matlabResults: {
    sprayEfficiency: Number,
    coverage: Number,
    bestAlgorithm: String,
    recommendedFormula: String,
    imagePath: String,
    receivedAt: Date
  }
});

module.exports = mongoose.model("Farm", FarmSchema);
