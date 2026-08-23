const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI environment variable is required');
  }
  await mongoose.connect(uri);
  console.log('tasks-service connected to MongoDB');
}

module.exports = connectDB;
