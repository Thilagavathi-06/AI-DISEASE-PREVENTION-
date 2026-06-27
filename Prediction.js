const mongoose = require('mongoose');
const { createDualModel } = require('../config/dbFallback');

const predictionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  inputData: {
    age: { type: Number, required: true },
    gender: { type: String, required: true },
    height: { type: Number, required: true }, // in cm
    weight: { type: Number, required: true }, // in kg
    bmi: { type: Number, required: true },
    bloodPressureSystolic: { type: Number, required: true },
    bloodPressureDiastolic: { type: Number, required: true },
    sugarLevel: { type: Number, required: true }, // Fasting in mg/dL
    heartRate: { type: Number, required: true }, // bpm
    cholesterol: { type: Number, required: true }, // mg/dL
    smoking: { type: Boolean, default: false },
    alcohol: { type: Boolean, default: false },
    familyHistory: { type: [String], default: [] },
    symptoms: { type: [String], default: [] },
  },
  predictions: {
    diabetes: {
      riskPercentage: { type: Number, required: true },
      riskLevel: { type: String, required: true }, // Low, Medium, High
      confidenceScore: { type: Number, required: true }
    },
    heartDisease: {
      riskPercentage: { type: Number, required: true },
      riskLevel: { type: String, required: true },
      confidenceScore: { type: Number, required: true }
    },
    liverDisease: {
      riskPercentage: { type: Number, required: true },
      riskLevel: { type: String, required: true },
      confidenceScore: { type: Number, required: true }
    },
    kidneyDisease: {
      riskPercentage: { type: Number, required: true },
      riskLevel: { type: String, required: true },
      confidenceScore: { type: Number, required: true }
    },
    hypertension: {
      riskPercentage: { type: Number, required: true },
      riskLevel: { type: String, required: true },
      confidenceScore: { type: Number, required: true }
    }
  },
  preventionPlan: {
    dietPlan: { type: [String], default: [] },
    exercisePlan: { type: [String], default: [] },
    waterIntake: { type: String }, // e.g., "3.2 Liters / day"
    sleepRecommendation: { type: String }, // e.g., "7-8 hours / night"
    lifestyleChanges: { type: [String], default: [] },
    precautions: { type: [String], default: [] }
  }
}, {
  timestamps: true,
});

module.exports = createDualModel('Prediction', predictionSchema, mongoose);
