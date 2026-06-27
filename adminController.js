const User = require('../models/User');
const Prediction = require('../models/Prediction');

// @desc    Get Admin Dashboard Stats
// @route   GET /api/admin/stats
// @access  Protected (Admin only)
const getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalPredictions = await Prediction.countDocuments();

    // Get all predictions to generate aggregate risk counts
    const predictions = await Prediction.find({});
    
    // Initialize risk trackers
    const risksCount = {
      diabetes: { High: 0, Medium: 0, Low: 0 },
      heartDisease: { High: 0, Medium: 0, Low: 0 },
      liverDisease: { High: 0, Medium: 0, Low: 0 },
      kidneyDisease: { High: 0, Medium: 0, Low: 0 },
      hypertension: { High: 0, Medium: 0, Low: 0 },
    };

    predictions.forEach(p => {
      const pred = p.predictions;
      if (pred) {
        if (pred.diabetes) risksCount.diabetes[pred.diabetes.riskLevel]++;
        if (pred.heartDisease) risksCount.heartDisease[pred.heartDisease.riskLevel]++;
        if (pred.liverDisease) risksCount.liverDisease[pred.liverDisease.riskLevel]++;
        if (pred.kidneyDisease) risksCount.kidneyDisease[pred.kidneyDisease.riskLevel]++;
        if (pred.hypertension) risksCount.hypertension[pred.hypertension.riskLevel]++;
      }
    });

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalPredictions,
        risksCount,
        fallbackDB: !!global.dbFallback
      }
    });
  } catch (error) {
    console.error('Get admin stats error:', error.message);
    res.status(500).json({ success: false, message: 'Server error retrieving dashboard statistics' });
  }
};

// @desc    Get all registered users
// @route   GET /api/admin/users
// @access  Protected (Admin only)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({});
    // Exclude password in response
    const sanitizedUsers = users.map(u => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      age: u.age,
      gender: u.gender,
      height: u.height,
      weight: u.weight,
      bloodGroup: u.bloodGroup,
      createdAt: u.createdAt,
    }));

    res.json({
      success: true,
      users: sanitizedUsers
    });
  } catch (error) {
    console.error('Get all users error:', error.message);
    res.status(500).json({ success: false, message: 'Server error retrieving users list' });
  }
};

// @desc    Delete a user and all their prediction records
// @route   DELETE /api/admin/users/:id
// @access  Protected (Admin only)
const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Delete all prediction records of this user
    const userPredictions = await Prediction.find({ userId });
    for (let p of userPredictions) {
      await Prediction.findByIdAndDelete(p._id);
    }

    // Delete user profile
    await User.findByIdAndDelete(userId);

    res.json({
      success: true,
      message: 'User and all associated medical history records deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error.message);
    res.status(500).json({ success: false, message: 'Server error deleting user profile' });
  }
};

// @desc    Get all prediction reports
// @route   GET /api/admin/reports
// @access  Protected (Admin only)
const getAllReports = async (req, res) => {
  try {
    const reports = await Prediction.find({});
    reports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Add user metadata details to reports if possible
    const reportsWithUser = [];
    for (let r of reports) {
      const user = await User.findById(r.userId);
      reportsWithUser.push({
        ...r,
        userName: user ? user.name : 'Unknown User',
        userEmail: user ? user.email : 'Unknown Email'
      });
    }

    res.json({
      success: true,
      reports: reportsWithUser
    });
  } catch (error) {
    console.error('Get all reports error:', error.message);
    res.status(500).json({ success: false, message: 'Server error retrieving reports logs' });
  }
};

module.exports = {
  getAdminStats,
  getAllUsers,
  deleteUser,
  getAllReports
};
