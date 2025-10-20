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
