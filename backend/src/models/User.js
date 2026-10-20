const mongoose = require('mongoose');
const { isFallback, readFallbackData, writeFallbackData } = require('../config/db');

// Define Mongoose User Schema
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Hashed password
  createdAt: { type: Date, default: Date.now }
});

const MongoUser = mongoose.model('User', UserSchema);

// CRUD repository methods wrapping Mongoose or Fallback DB
async function saveUser(data) {
  if (isFallback()) {
    const list = readFallbackData();
    
    // Check if user email already exists in fallback list
    const existing = list.find(item => item.email === data.email && item.password);
    if (existing) {
      throw new Error('User already exists with this email address.');
    }

    const newRecord = {
      _id: Date.now().toString(),
      name: data.name,
      email: data.email.toLowerCase().trim(),
      password: data.password,
      createdAt: new Date().toISOString()
    };
    
    list.push(newRecord);
    writeFallbackData(list);
    return newRecord;
  } else {
    // Normal mongoose saving (Unique validation handled by route controller)
    const record = new MongoUser(data);
    return await record.save();
  }
}

async function findUserByEmail(email) {
  const queryEmail = email.toLowerCase().trim();
  if (isFallback()) {
    const list = readFallbackData();
    // Filter objects that look like a User profile (have password fields)
    return list.find(item => item.email === queryEmail && item.password) || null;
  } else {
    return await MongoUser.findOne({ email: queryEmail });
  }
}

async function findUserById(id) {
  if (isFallback()) {
    const list = readFallbackData();
    return list.find(item => item._id === id && item.password) || null;
  } else {
    return await MongoUser.findById(id);
  }
}

module.exports = {
  MongoUser,
  saveUser,
  findUserByEmail,
  findUserById
};
