const mongoose = require('mongoose');
const { createDualModel } = require('../config/dbFallback');

const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    default: 'System Administrator'
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  }
}, {
  timestamps: true,
});

module.exports = createDualModel('Admin', adminSchema, mongoose);
