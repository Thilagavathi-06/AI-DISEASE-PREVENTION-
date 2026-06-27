const express = require('express');
const router = express.Router();

const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  loginAdmin,
} = require('../controllers/authController');

const {
  createPrediction,
  getPredictions,
  deletePrediction,
  emailPredictionReport,
} = require('../controllers/predictionController');

const {
  getAdminStats,
  getAllUsers,
  deleteUser,
  getAllReports
} = require('../controllers/adminController');

const { protect, adminProtect } = require('../middleware/authMiddleware');

// Health Check Route
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date(),
    fallbackDB: !!global.dbFallback
  });
});

// Authentication Routes
router.post('/auth/register', registerUser);
router.post('/auth/login', loginUser);
router.post('/auth/admin-login', loginAdmin);
router.get('/auth/me', protect, getUserProfile);
router.put('/auth/profile', protect, updateUserProfile);

// Prediction Routes
router.post('/predictions', protect, createPrediction);
router.get('/predictions', protect, getPredictions);
router.delete('/predictions/:id', protect, deletePrediction);
router.post('/predictions/:id/email', protect, emailPredictionReport);

// Admin Routes
router.get('/admin/stats', adminProtect, getAdminStats);
router.get('/admin/users', adminProtect, getAllUsers);
router.delete('/admin/users/:id', adminProtect, deleteUser);
router.get('/admin/reports', adminProtect, getAllReports);

module.exports = router;
