const mongoose = require("mongoose");

const FarmSchema = new mongoose.Schema({
  farmid: { type: String, required: true },           
  farm_name: { type: String },                        
  farm_area: { type: Number },                       
  shape: { type: String },                            
  size_fragmentation: { type: String },               
  level: { type: String },                           
  boundary: { type: String },                         
  style: { type: String },                            
  cropping_pattern: { type: String },                 
  obstacle_density: { type: Number },                 
  soil_type: { type: String },                        
  chemical_mix: { type: String },                     
  temp: { type: Number },                            
  organic_matter: { type: String },                   
  spray_type: { type: String },                       
  coverage: { type: String },                        
  effectiveness: { type: String },                    
  suggested_volume: { type: String },                

  // Optional tracking / integration fields
  pushedPayload: {
    data: Object,
    createdAt: { type: Date, default: Date.now },
    readByMatlab: { type: Boolean, default: false },
  },

  status: { type: String, default: "new" }, // new / pending / processing / completed

  matlabResults: {
    sprayEfficiency: Number,
    coverage: Number,
    bestAlgorithm: String,
    recommendedFormula: String,
    imagePath: String,
    receivedAt: Date,
  },
});

module.exports = mongoose.model("Farm", FarmSchema);
