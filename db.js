const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Attempt connection with a short timeout to prevent blocking startup if MongoDB is down
    mongoose.set('strictQuery', false);
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/early_disease_prediction', {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    global.dbFallback = false;
  } catch (err) {
    console.warn('\n========================================================================');
    console.warn('WARNING: MongoDB is not available or failed to connect.');
    console.warn('Activating Local JSON File DB Fallback mode automatically...');
    console.warn('All users, predictions, and reports will be saved locally in backend/data/');
    console.warn('========================================================================\n');
    global.dbFallback = true;
  }
};

module.exports = connectDB;
