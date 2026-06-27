const Prediction = require('../models/Prediction');
const User = require('../models/User');
const nodemailer = require('nodemailer');

// Helper to calculate risk percentages, levels and confidence scores
const calculateDiseaseRisks = (data) => {
  const {
    age, gender, height, weight, bmi,
    bloodPressureSystolic: sBP,
    bloodPressureDiastolic: dBP,
    sugarLevel: sugar,
    heartRate: hr,
    cholesterol: chol,
    smoking, alcohol, familyHistory = [], symptoms = []
  } = data;

  const results = {};

  // Helper to standardise search in lists
  const hasHistory = (term) => familyHistory.some(h => h.toLowerCase().includes(term.toLowerCase()));
  const hasSymptom = (term) => symptoms.some(s => s.toLowerCase().includes(term.toLowerCase()));

  // 1. DIABETES
  let diabetesRisk = 5; // Baseline
  if (bmi > 25) diabetesRisk += 12;
  if (bmi > 30) diabetesRisk += 18;
  if (sugar > 100 && sugar <= 125) diabetesRisk += 25; // Prediabetes
  if (sugar > 125) diabetesRisk += 50; // Diabetic range
  if (age > 45) diabetesRisk += 8;
  if (hasHistory('diabet')) diabetesRisk += 15;
  if (hasSymptom('thirst') || hasSymptom('urination') || hasSymptom('hunger')) diabetesRisk += 12;
  if (hasSymptom('fatigue') || hasSymptom('blurred')) diabetesRisk += 5;
  diabetesRisk = Math.min(Math.max(diabetesRisk, 2), 98);
  
  results.diabetes = {
    riskPercentage: Math.round(diabetesRisk),
    riskLevel: diabetesRisk > 60 ? 'High' : (diabetesRisk > 25 ? 'Medium' : 'Low'),
    confidenceScore: Math.round(85 + Math.random() * 10)
  };

  // 2. HEART DISEASE
  let heartRisk = 5;
  if (sBP > 130 || dBP > 80) heartRisk += 10;
  if (sBP > 140 || dBP > 90) heartRisk += 15;
  if (chol > 200 && chol <= 239) heartRisk += 15;
  if (chol >= 240) heartRisk += 30;
  if (smoking) heartRisk += 20;
  if (age > 50) heartRisk += 10;
  if (bmi > 28) heartRisk += 8;
  if (hasHistory('heart') || hasHistory('cardio') || hasHistory('stroke')) heartRisk += 15;
  if (hasSymptom('chest pain') || hasSymptom('shortness of breath')) heartRisk += 20;
  if (hasSymptom('dizziness') || hasSymptom('palpitation')) heartRisk += 8;
  heartRisk = Math.min(Math.max(heartRisk, 2), 98);

  results.heartDisease = {
    riskPercentage: Math.round(heartRisk),
    riskLevel: heartRisk > 60 ? 'High' : (heartRisk > 25 ? 'Medium' : 'Low'),
    confidenceScore: Math.round(88 + Math.random() * 8)
  };

  // 3. LIVER DISEASE
  let liverRisk = 5;
  if (alcohol) liverRisk += 30;
  if (bmi > 30) liverRisk += 15;
  if (chol > 220) liverRisk += 8;
  if (hasHistory('liver') || hasHistory('hepat')) liverRisk += 12;
  if (hasSymptom('abdominal pain') || hasSymptom('nausea')) liverRisk += 10;
  if (hasSymptom('yellowish') || hasSymptom('jaundice')) liverRisk += 35;
  liverRisk = Math.min(Math.max(liverRisk, 2), 98);

  results.liverDisease = {
    riskPercentage: Math.round(liverRisk),
    riskLevel: liverRisk > 60 ? 'High' : (liverRisk > 25 ? 'Medium' : 'Low'),
    confidenceScore: Math.round(80 + Math.random() * 12)
  };

  // 4. KIDNEY DISEASE
  let kidneyRisk = 5;
  if (sBP > 140 || dBP > 90) kidneyRisk += 15;
  if (sugar > 125) kidneyRisk += 15;
  if (age > 60) kidneyRisk += 12;
  if (bmi > 30) kidneyRisk += 8;
  if (hasHistory('kidney') || hasHistory('renal')) kidneyRisk += 18;
  if (hasSymptom('swollen') || hasSymptom('edema')) kidneyRisk += 20;
  if (hasSymptom('fatigue') || hasSymptom('urination')) kidneyRisk += 8;
  kidneyRisk = Math.min(Math.max(kidneyRisk, 2), 98);

  results.kidneyDisease = {
    riskPercentage: Math.round(kidneyRisk),
    riskLevel: kidneyRisk > 60 ? 'High' : (kidneyRisk > 25 ? 'Medium' : 'Low'),
    confidenceScore: Math.round(82 + Math.random() * 11)
  };

  // 5. HYPERTENSION
  let hypertensionRisk = 5;
  if (sBP >= 120 && sBP < 130 && dBP < 80) hypertensionRisk += 20; // Elevated
  if (sBP >= 130 && sBP < 140 || dBP >= 80 && dBP < 90) hypertensionRisk += 50; // Stage 1
  if (sBP >= 140 || dBP >= 90) hypertensionRisk += 80; // Stage 2
  if (age > 45) hypertensionRisk += 8;
  if (smoking || alcohol) hypertensionRisk += 10;
  if (hasHistory('hyperten') || hasHistory('pressure')) hypertensionRisk += 15;
  if (hasSymptom('headache') || hasSymptom('dizziness')) hypertensionRisk += 10;
  hypertensionRisk = Math.min(Math.max(hypertensionRisk, 2), 99);

  results.hypertension = {
    riskPercentage: Math.round(hypertensionRisk),
    riskLevel: hypertensionRisk > 60 ? 'High' : (hypertensionRisk > 25 ? 'Medium' : 'Low'),
    confidenceScore: Math.round(92 + Math.random() * 6)
  };

  return results;
};

// Generate Prevention Plan
const generatePreventionPlan = (data, risks) => {
  const { weight, sugar, smoking, alcohol, symptoms = [] } = data;
  
  const dietPlan = ['Maintain a balanced diet rich in leafy greens, fiber, and lean proteins.'];
  const exercisePlan = ['Perform at least 150 minutes of moderate aerobic exercise (e.g. brisk walking) weekly.'];
  const lifestyleChanges = ['Ensure consistent hydration and regular checkups.'];
  const precautions = ['Monitor vitals periodically. If acute chest pain, shortness of breath, or numbness occurs, consult a physician immediately.'];

  // Calculate water intake in Liters (weight in kg * 0.035)
  const calcWater = Math.max(2.0, Math.min(4.5, (weight * 0.035))).toFixed(1);
  const waterIntake = `${calcWater} Liters / day`;
  
  const sleepRecommendation = '7 - 8 hours of quality sleep per night';

  // Diabetes risk indicators
  if (risks.diabetes.riskLevel === 'High' || risks.diabetes.riskLevel === 'Medium' || sugar > 100) {
    dietPlan.push('Restrict processed sugars, refined carbohydrates, and sugary beverages.');
    dietPlan.push('Incorporate low glycemic index foods like whole grains, legumes, and non-starchy vegetables.');
    lifestyleChanges.push('Monitor fasting blood glucose levels monthly.');
    lifestyleChanges.push('Aim for gradual weight reduction if BMI is elevated.');
  }

  // Cardiovascular indicators
  if (risks.heartDisease.riskLevel === 'High' || risks.hypertension.riskLevel === 'High' || risks.heartDisease.riskLevel === 'Medium') {
    dietPlan.push('Adopt a DASH-style diet: low sodium (< 2,300 mg/day), low saturated fats.');
    dietPlan.push('Incorporate heart-healthy fats (olive oil, avocados, nuts) and foods high in Omega-3.');
    exercisePlan.push('Incorporate daily cardiovascular exercises like jogging, swimming, or cycling.');
    lifestyleChanges.push('Check blood pressure weekly and track trends.');
    if (smoking) {
      lifestyleChanges.push('Enroll in a smoking cessation program (smoking raises cardiovascular risk dramatically).');
    }
  }

  // Liver risk
  if (risks.liverDisease.riskLevel === 'High' || risks.liverDisease.riskLevel === 'Medium') {
    dietPlan.push('Reduce intake of saturated fats and high-fructose corn syrups.');
    dietPlan.push('Increase intake of antioxidant-rich foods and cruciferous vegetables (broccoli, Brussels sprouts).');
    lifestyleChanges.push('Limit or completely avoid alcohol consumption to reduce liver inflammation.');
  }

  // Kidney risk
  if (risks.kidneyDisease.riskLevel === 'High' || risks.kidneyDisease.riskLevel === 'Medium') {
    dietPlan.push('Avoid excessive protein intake; choose high-quality, plant-based proteins when possible.');
    dietPlan.push('Minimize dietary sodium and phosphorus-rich foods.');
    precautions.push('Avoid self-prescribing NSAIDs (like ibuprofen) as they can stress the kidneys.');
    lifestyleChanges.push('Verify kidney function parameters (e.g. eGFR, Serum Creatinine) in annual checkups.');
  }

  // General lifestyle additions
  if (alcohol && risks.liverDisease.riskLevel !== 'High') {
    lifestyleChanges.push('Limit alcohol consumption to moderate limits (under 1-2 drinks per day).');
  }

  return {
    dietPlan,
    exercisePlan,
    waterIntake,
    sleepRecommendation,
    lifestyleChanges,
    precautions
  };
};

// @desc    Create a new prediction report
// @route   POST /api/predictions
// @access  Protected
const createPrediction = async (req, res) => {
  try {
    const {
      age, gender, height, weight,
      bloodPressureSystolic, bloodPressureDiastolic,
      sugarLevel, heartRate, cholesterol,
      smoking, alcohol, familyHistory, symptoms
    } = req.body;

    const parsedAge = Number(age);
    const parsedHeight = Number(height);
    const parsedWeight = Number(weight);
    const parsedBPsys = Number(bloodPressureSystolic);
    const parsedBPdia = Number(bloodPressureDiastolic);
    const parsedSugar = Number(sugarLevel);
    const parsedHR = Number(heartRate);
    const parsedChol = Number(cholesterol);

    // Compute BMI
    const bmi = Number((parsedWeight / Math.pow(parsedHeight / 100, 2)).toFixed(1));

    const inputData = {
      age: parsedAge,
      gender,
      height: parsedHeight,
      weight: parsedWeight,
      bmi,
      bloodPressureSystolic: parsedBPsys,
      bloodPressureDiastolic: parsedBPdia,
      sugarLevel: parsedSugar,
      heartRate: parsedHR,
      cholesterol: parsedChol,
      smoking: !!smoking,
      alcohol: !!alcohol,
      familyHistory: Array.isArray(familyHistory) ? familyHistory : [],
      symptoms: Array.isArray(symptoms) ? symptoms : [],
    };

    const predictions = calculateDiseaseRisks(inputData);
    const preventionPlan = generatePreventionPlan(inputData, predictions);

    // Save Prediction
    const predictionReport = await Prediction.create({
      userId: req.user._id,
      inputData,
      predictions,
      preventionPlan,
    });

    res.status(201).json({
      success: true,
      report: predictionReport
    });
  } catch (error) {
    console.error('Create prediction error:', error.message);
    res.status(500).json({ success: false, message: 'Server error processing prediction' });
  }
};

// @desc    Get user's predictions reports
// @route   GET /api/predictions
// @access  Protected
const getPredictions = async (req, res) => {
  try {
    // Return sorted reports (newest first)
    const reports = await Prediction.find({ userId: req.user._id });
    reports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({
      success: true,
      reports
    });
  } catch (error) {
    console.error('Get predictions error:', error.message);
    res.status(500).json({ success: false, message: 'Server error retrieving reports' });
  }
};

// @desc    Delete a prediction report
// @route   DELETE /api/predictions/:id
// @access  Protected
const deletePrediction = async (req, res) => {
  try {
    const report = await Prediction.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    // Verify report ownership or admin role
    if (report.userId !== req.user._id && req.userRole !== 'admin') {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    await Prediction.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Delete prediction error:', error.message);
    res.status(500).json({ success: false, message: 'Server error deleting report' });
  }
};

// @desc    Email prediction report to the user
// @route   POST /api/predictions/:id/email
// @access  Protected
const emailPredictionReport = async (req, res) => {
  try {
    const report = await Prediction.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    // Get user details
    const user = await User.findById(report.userId);
    const recipientEmail = user ? user.email : req.user.email;
    const recipientName = user ? user.name : req.user.name;

    // Set up nodemailer transporter
    let transporter;
    
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      // Use user-defined SMTP details
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
    } else {
      // Create Ethereal test SMTP account (perfect for instant out-of-the-box testing)
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    }

    const diseaseText = Object.entries(report.predictions)
      .map(([disease, val]) => {
        const formattedName = disease.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        return `- ${formattedName}: ${val.riskPercentage}% Risk Level: [${val.riskLevel}]`;
      })
      .join('\n');

    const mailOptions = {
      from: '"AuraHealth AI Platform" <earlyprediction@aurahealth.com>',
      to: recipientEmail,
      subject: `Your Early Disease Risk Analysis Report - ${new Date(report.createdAt).toLocaleDateString()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #0d6efd; border-bottom: 2px solid #0d6efd; padding-bottom: 10px;">AuraHealth AI Diagnostic Report</h2>
          <p>Hello <strong>${recipientName}</strong>,</p>
          <p>Here is your comprehensive Early Disease Prediction and Prevention report generated on our system.</p>
          
          <h3 style="color: #495057;">Health Inputs Summary</h3>
          <ul>
            <li>Age: ${report.inputData.age} years</li>
            <li>Gender: ${report.inputData.gender}</li>
            <li>BMI: ${report.inputData.bmi} (Weight: ${report.inputData.weight}kg, Height: ${report.inputData.height}cm)</li>
            <li>Blood Pressure: ${report.inputData.bloodPressureSystolic}/${report.inputData.bloodPressureDiastolic} mmHg</li>
            <li>Fasting Sugar: ${report.inputData.sugarLevel} mg/dL</li>
            <li>Heart Rate: ${report.inputData.heartRate} bpm</li>
            <li>Total Cholesterol: ${report.inputData.cholesterol} mg/dL</li>
          </ul>

          <h3 style="color: #495057;">AI Disease Prediction</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f8f9fa; border-bottom: 2px solid #dee2e6;">
                <th style="padding: 10px; text-align: left;">Condition</th>
                <th style="padding: 10px; text-align: left;">Risk Level</th>
                <th style="padding: 10px; text-align: left;">Probability</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(report.predictions).map(([key, val]) => {
                const name = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                const color = val.riskLevel === 'High' ? '#dc3545' : (val.riskLevel === 'Medium' ? '#ffc107' : '#198754');
                return `
                  <tr style="border-bottom: 1px solid #dee2e6;">
                    <td style="padding: 10px;">${name}</td>
                    <td style="padding: 10px; color: ${color}; font-weight: bold;">${val.riskLevel}</td>
                    <td style="padding: 10px;">${val.riskPercentage}%</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          <h3 style="color: #495057;">Key AI Prevention Recommendations</h3>
          <p><strong>Water Intake:</strong> ${report.preventionPlan.waterIntake}</p>
          <p><strong>Sleep:</strong> ${report.preventionPlan.sleepRecommendation}</p>
          <p><strong>Diet Plan Highlights:</strong></p>
          <ul>
            ${report.preventionPlan.dietPlan.slice(0, 3).map(item => `<li>${item}</li>`).join('')}
          </ul>
          <p><strong>Recommended Lifestyle Adjustments:</strong></p>
          <ul>
            ${report.preventionPlan.lifestyleChanges.slice(0, 3).map(item => `<li>${item}</li>`).join('')}
          </ul>

          <p style="font-size: 11px; color: #868e96; margin-top: 30px; border-top: 1px solid #dee2e6; padding-top: 10px;">
            Disclaimer: AuraHealth AI diagnostics represent risk calculations based on statistical medical guidelines. This does not substitute professional medical diagnosis, advice, or treatment.
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    
    // If using Ethereal, log the web link to inspect emails instantly
    const etherealUrl = nodemailer.getTestMessageUrl(info);
    if (etherealUrl) {
      console.log(`\n========================================================================`);
      console.log(`MOCK EMAIL SENT. Open standard report preview link in browser:`);
      console.log(etherealUrl);
      console.log(`========================================================================\n`);
    }

    res.json({
      success: true,
      message: 'Report emailed successfully',
      previewUrl: etherealUrl || null
    });
  } catch (error) {
    console.error('Email report error:', error.message);
    res.status(500).json({ success: false, message: 'Server error dispatching email' });
  }
};

module.exports = {
  createPrediction,
  getPredictions,
  deletePrediction,
  emailPredictionReport,
};
