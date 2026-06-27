const mongoose = require('mongoose');
const { createDualModel } = require('../config/dbFallback');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
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
  },
  age: {
    type: Number,
  },
  gender: {
    type: String,
  },
  height: {
    type: Number,
  },
  weight: {
    type: Number,
  },
  bloodGroup: {
    type: String,
  }
}, {
  timestamps: true,
});

module.exports = createDualModel('User', userSchema, mongoose);
