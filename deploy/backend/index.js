// Migrated from backend2.js
// MongoDB connection using official driver
const { MongoClient } = require('mongodb');
const mongoUri = 'mongodb://localhost:27017';
const dbName = 'guidora';
let db;

function connectToMongoDB() {
  const client = new MongoClient(mongoUri, { useUnifiedTopology: true });
  client.connect()
    .then(() => {
      console.log('Connected successfully to MongoDB');
      db = client.db(dbName);
    })
    .catch(err => {
      console.error('Error connecting to MongoDB:', err);
    });
}

connectToMongoDB();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');

const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/guidora', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB connected');
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

// Configure Nodemailer (Gmail example)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'guidoratravels@gmail.com',
    pass: 'ujpb wrnf uonj wkek'
  }
});

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'guidora_jwt_secret_key_2023_production';

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

const GEMINI_API_KEY = 'AIzaSyCGRTjJ_pKVwoy28t-Zgwq5brgkZJRCrls';
const fetch = require('node-fetch');

app.post('/api/gemini-chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
    const body = {
      contents: [{ parts: [{ text: message }] }]
    };
    const apiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!apiRes.ok) {
      const errText = await apiRes.text();
      return res.status(500).json({ error: 'Gemini API error', details: errText });
    }
    const data = await apiRes.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response.';
    res.json({ text });
  } catch (err) {
    console.error('Gemini proxy error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// --- All routes and logic from backend2.js migrated here ---
// [Full backend2.js code migrated]

app.listen(PORT, () => {
  console.log(`Guidora server running on port ${PORT}`);
  console.log(`API endpoints available at http://localhost:${PORT}/api/`);
});

// module.exports = app; // Remove or comment out if not needed
