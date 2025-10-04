// ...existing code...
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
      // Optionally list collections
      // return db.collections();
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
// ...existing code...
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'guidora_jwt_secret_key_2023_production';

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Gemini Chatbot Proxy Endpoint (must be after all middleware)
// const GEMINI_API_KEY = 'AIzaSyDqPxsFRKxU1B1x-UdwlWAK8fu1jPsoteg';

const GEMINI_API_KEY = 'AIzaSyCGRTjJ_pKVwoy28t-Zgwq5brgkZJRCrls';
const fetch = require('node-fetch');

app.post('/api/gemini-chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });
    // const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;
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

// In-memory data stores (in production, use a real database)
let users = [];
// let experiences = []; // Now using MongoDB
let categories = [];
let otps = {}; // { email: { otp, expires, verified } }

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

// Initialize sample data
function initializeSampleData() {
  // Sample users
  users.push({
    id: 'user-1',
    name: 'John Traveler',
    email: 'john@example.com',
    password: '$2a$10$dummyhashedpasswordfordemo', // "password123"
    points: 245,
    joinedDate: new Date('2023-01-15'),
    avatar: null,
    role: 'user'
  });

  users.push({
    id: 'user-2',
    name: 'Sarah Explorer',
    email: 'sarah@example.com',
    password: '$2a$10$dummyhashedpasswordfordemo2', // "password123"
    points: 180,
    joinedDate: new Date('2023-03-22'),
    avatar: null,
    role: 'user'
  });

  // Admin user
  users.push({
    id: 'admin-1',
    name: 'Admin User',
    email: 'admin@guidora.com',
    password: '$2a$10$dummyhashedpasswordforadmin', // "admin123"
    points: 500,
    joinedDate: new Date('2023-01-01'),
    avatar: null,
    role: 'admin'
  });

  // Sample categories
  categories = [
    { id: 'cat-1', name: 'All', count: 156, icon: 'layer-group' },
    { id: 'cat-2', name: 'Food & Drink', count: 42, icon: 'utensils' },
    { id: 'cat-3', name: 'Adventure', count: 38, icon: 'hiking' },
    { id: 'cat-4', name: 'Culture & Arts', count: 45, icon: 'palette' },
    { id: 'cat-5', name: 'Nature', count: 31, icon: 'mountain' }
  ];

  // Sample experiences
  experiences.push(
    // Food & Drink
    {
      id: 'exp-1',
      title: 'Secret Garden Café',
      location: 'Old Town District',
      description: 'Hidden gem serving organic coffee and homemade pastries in a beautiful garden setting.',
      category: 'Food & Drink',
      rating: 4.8,
      reviewCount: 124,
      rewardPoints: 50,
      coordinates: { lat: 40.7128, lng: -74.0060 },
      images: [
        'https://images.unsplash.com/photo-1554118811-1e0d58224f24?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
      ],
      addedBy: 'user-2',
      verified: true,
      createdAt: new Date('2023-05-10'),
      tags: ['coffee', 'pastries', 'garden', 'organic']
    },
    {
      id: 'exp-3',
      title: 'Riverside Market',
      location: 'Harbor District',
      description: 'Vibrant market showcasing local produce, crafts, and street food delicacies.',
      category: 'Food & Drink',
      rating: 4.6,
      reviewCount: 203,
      rewardPoints: 40,
      coordinates: { lat: 40.7148, lng: -74.0260 },
      images: [
        'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1502741338009-cac2772e18bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
      ],
      addedBy: 'user-2',
      verified: true,
      createdAt: new Date('2023-06-20'),
      tags: ['market', 'local', 'street food', 'crafts']
    },
    {
      id: 'exp-5',
      title: 'Vintage Wine Bar',
      location: 'Downtown',
      description: 'Cozy bar with a wide selection of local and international wines.',
      category: 'Food & Drink',
      rating: 4.5,
      reviewCount: 88,
      rewardPoints: 35,
      coordinates: { lat: 40.7168, lng: -74.0460 },
      images: [
        'https://images.unsplash.com/photo-1514361892635-cebb7c1c81e7?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1519864600265-abb23847ef2c?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
      ],
      addedBy: 'user-1',
      verified: true,
      createdAt: new Date('2023-07-10'),
      tags: ['wine', 'bar', 'cozy', 'drinks']
    },
    // Adventure
    {
      id: 'exp-2',
      title: 'Sunset Hiking Trail',
      location: 'Mountain Ridge',
      description: 'Breathtaking trail offering panoramic views and unforgettable sunset experiences.',
      category: 'Adventure',
      rating: 4.9,
      reviewCount: 69,
      rewardPoints: 75,
      coordinates: { lat: 40.7138, lng: -74.0160 },
      images: [
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
      ],
      addedBy: 'user-1',
      verified: true,
      createdAt: new Date('2023-04-15'),
      tags: ['hiking', 'sunset', 'views', 'nature']
    },
    {
      id: 'exp-6',
      title: 'Kayak Adventure',
      location: 'Crystal Lake',
      description: 'Guided kayak tours through crystal clear waters and scenic landscapes.',
      category: 'Adventure',
      rating: 4.7,
      reviewCount: 54,
      rewardPoints: 60,
      coordinates: { lat: 40.7188, lng: -74.0560 },
      images: [
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1464983953574-0892a716854b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
      ],
      addedBy: 'user-2',
      verified: true,
      createdAt: new Date('2023-08-01'),
      tags: ['kayak', 'lake', 'adventure', 'water']
    },
    // Culture & Arts
    {
      id: 'exp-4',
      title: 'Artisan Workshop',
      location: 'Cultural Quarter',
      description: 'Learn traditional crafts from local masters in this authentic workshop experience.',
      category: 'Culture & Arts',
      rating: 4.7,
      reviewCount: 156,
      rewardPoints: 80,
      coordinates: { lat: 40.7158, lng: -74.0360 },
      images: [
        'https://images.unsplash.com/photo-1544787219-7f47ccb76574?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1464983953574-0892a716854b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
      ],
      addedBy: 'user-1',
      verified: true,
      createdAt: new Date('2023-03-05'),
      tags: ['workshop', 'crafts', 'traditional', 'learning']
    },
    {
      id: 'exp-7',
      title: 'Street Art Tour',
      location: 'City Center',
      description: 'Explore vibrant murals and graffiti art with a local guide.',
      category: 'Culture & Arts',
      rating: 4.8,
      reviewCount: 112,
      rewardPoints: 55,
      coordinates: { lat: 40.7198, lng: -74.0660 },
      images: [
        'https://images.unsplash.com/photo-1465101178521-c1a9136a3b41?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
      ],
      addedBy: 'user-2',
      verified: true,
      createdAt: new Date('2023-08-15'),
      tags: ['art', 'street', 'murals', 'tour']
    },
    // Nature
    {
      id: 'exp-8',
      title: 'Botanical Gardens',
      location: 'Greenbelt',
      description: 'A peaceful escape with rare plants, walking trails, and picnic spots.',
      category: 'Nature',
      rating: 4.9,
      reviewCount: 98,
      rewardPoints: 70,
      coordinates: { lat: 40.7208, lng: -74.0760 },
      images: [
        'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
      ],
      addedBy: 'user-1',
      verified: true,
      createdAt: new Date('2023-09-01'),
      tags: ['garden', 'nature', 'plants', 'relax']
    },
    {
      id: 'exp-9',
      title: 'Mountain Lake Viewpoint',
      location: 'Highlands',
      description: 'Scenic viewpoint overlooking a pristine mountain lake.',
      category: 'Nature',
      rating: 4.8,
      reviewCount: 77,
      rewardPoints: 65,
      coordinates: { lat: 40.7218, lng: -74.0860 },
      images: [
        'https://images.unsplash.com/photo-1501785888041-af3ef285b470?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
      ],
      addedBy: 'user-2',
      verified: true,
      createdAt: new Date('2023-09-10'),
      tags: ['mountain', 'lake', 'view', 'nature']
    }
  );

  // Sample reviews
  reviews.push(
    {
      id: 'rev-1',
      experienceId: 'exp-1',
      userId: 'user-1',
      rating: 5,
      comment: 'Absolutely loved this place! The coffee was amazing and the garden atmosphere is so peaceful.',
      createdAt: new Date('2023-05-15')
    },
    {
      id: 'rev-2',
      experienceId: 'exp-1',
      userId: 'user-2',
      rating: 4,
      comment: 'Great spot for a quiet afternoon. Pastries were delicious!',
      createdAt: new Date('2023-05-20')
    }
  );

  // Sample contributions
  userContributions.push(
    {
      id: 'cont-1',
      userId: 'user-1',
      experienceId: 'exp-2',
      pointsEarned: 75,
      status: 'approved',
      date: new Date('2023-04-15')
    },
    {
      id: 'cont-2',
      userId: 'user-1',
      experienceId: 'exp-4',
      pointsEarned: 80,
      status: 'approved',
      date: new Date('2023-03-05')
    },
    {
      id: 'cont-3',
      userId: 'user-2',
      experienceId: 'exp-1',
      pointsEarned: 50,
      status: 'approved',
      date: new Date('2023-05-10')
    },
    {
      id: 'cont-4',
      userId: 'user-2',
      experienceId: 'exp-3',
      pointsEarned: 40,
      status: 'approved',
      date: new Date('2023-06-20')
    }
  );

  // Sample rewards
  rewards.push(
    {
      id: 'reward-1',
      userId: 'user-1',
      points: 75,
      type: 'contribution',
      description: 'Added Sunset Hiking Trail',
      date: new Date('2023-04-15')
    },
    {
      id: 'reward-2',
      userId: 'user-1',
      points: 80,
      type: 'contribution',
      description: 'Added Artisan Workshop',
      date: new Date('2023-03-05')
    },
    {
      id: 'reward-3',
      userId: 'user-2',
      points: 50,
      type: 'contribution',
      description: 'Added Secret Garden Café',
      date: new Date('2023-05-10')
    },
    {
      id: 'reward-4',
      userId: 'user-2',
      points: 40,
      type: 'contribution',
      description: 'Added Riverside Market',
      date: new Date('2023-06-20')
    }
  );
}

// Routes

// Get all experiences from MongoDB
app.get('/api/experiences', async (req, res) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not connected' });
    const experiences = await db.collection('experiences').find({}).toArray();
    res.json(experiences);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// User registration
app.post('/api/register', async (req, res) => {
  try {
  let { name, email, password } = req.body;
  // Trim spaces from input
  if (typeof email === 'string') email = email.trim().toLowerCase();
  if (typeof name === 'string') name = name.trim();


    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // No email format validation
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    // Check if user already exists in MongoDB
    if (!db) return res.status(500).json({ error: 'Database not connected' });
    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Create user (unverified)
    const user = {
      id: uuidv4(),
      name,
      email,
      password: hashedPassword,
      points: 100, // Starting points
      joinedDate: new Date(),
      avatar: null,
      role: 'user',
      verified: false,
      otp,
      otpExpires
    };

    await db.collection('users').insertOne(user);

    // Send OTP email
    try {
      await transporter.sendMail({
  from: 'guidoratravels@gmail.com',
        to: email,
        subject: 'Your Guidora OTP Verification Code',
        text: `Your OTP code is: ${otp}`
      });
      console.log(`OTP email sent to ${email}`);
    } catch (err) {
      console.error('Failed to send OTP email:', err);
      return res.status(500).json({ error: 'Failed to send OTP email. Please try again.' });
    }

    res.status(201).json({
      message: 'OTP sent to your email. Please verify to complete registration.',
      user: { ...user, password: undefined, otp: undefined, otpExpires: undefined },
      otpRequired: true
    });
// OTP verification endpoint
app.post('/api/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }
    if (!db) return res.status(500).json({ error: 'Database not connected' });
    const user = await db.collection('users').findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }
    if (user.verified) {
      return res.status(400).json({ error: 'User already verified' });
    }
    if (user.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }
    if (Date.now() > user.otpExpires) {
      return res.status(400).json({ error: 'OTP expired' });
    }
    await db.collection('users').updateOne({ email }, { $set: { verified: true }, $unset: { otp: '', otpExpires: '' } });
    res.json({ message: 'Email verified! You can now log in.' });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User login
app.post('/api/login', async (req, res) => {
  try {
  let { email, password } = req.body;
  if (typeof email === 'string') email = email.trim().toLowerCase();

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }


    // No email format validation
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }


  // Find user in MongoDB (case-insensitive)
  const user = await db.collection('users').findOne({ email: email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Check if verified
    if (!user.verified) {
      return res.status(400).json({ error: 'Email not verified. Please check your email for the OTP.' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email }, 
      JWT_SECRET, 
      { expiresIn: '24h' }
    );

    // Return user data (without password) and token
    const { password: _, ...userWithoutPassword } = user;
    res.json({
      message: 'Login successful',
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user profile
app.get('/api/profile', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Get user contributions
  const contributions = userContributions.filter(c => c.userId === user.id);
  
  // Get user reviews
  const userReviews = reviews.filter(r => r.userId === user.id);
  
  // Get user rewards
  const userRewards = rewards.filter(r => r.userId === user.id);
  
  const { password: _, ...userWithoutPassword } = user;
  res.json({
    user: userWithoutPassword,
    contributions,
    reviews: userReviews,
    rewards: userRewards
  });
});

// Update user profile
app.put('/api/profile', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    const { name, currentPassword, newPassword } = req.body;
    const user = users.find(u => u.id === req.user.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update name if provided
    if (name) {
      user.name = name ;
    }

    // Update avatar if provided
    if (req.file) {
  user.avatar = `/uploads/${req.file.filename}`;
    }

    // Update password if provided
    if (currentPassword && newPassword) {
      const validPassword = await bcrypt.compare(currentPassword, user.password);
      if (!validPassword) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }
      
      user.password = await bcrypt.hash(newPassword, 10);
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json({
      message: 'Profile updated successfully',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all experiences with filtering
// Removed in-memory filtering endpoint. All /api/experiences requests now use MongoDB.

// Get a specific experience
app.get('/api/experiences/:id', (req, res) => {
  const experience = experiences.find(e => e.id === req.params.id);
  if (!experience) {
    return res.status(404).json({ error: 'Experience not found' });
  }
  
  // Get reviews for this experience
  const experienceReviews = reviews.filter(r => r.experienceId === experience.id);
  
  // Add user info to reviews
  const reviewsWithUserInfo = experienceReviews.map(review => {
    const user = users.find(u => u.id === review.userId);
    return {
      ...review,
      user: user ? { id: user.id, name: user.name, avatar: user.avatar } : null
    };
  });
  
  res.json({
    ...experience,
    reviews: reviewsWithUserInfo
  });
});

// Add a new experience (requires authentication)
app.post('/api/experiences', authenticateToken, upload.array('images', 5), (req, res) => {
  (async () => {
    try {
      const { title, location, description, category, lat, lng, tags } = req.body;
      console.log('Received experience upload:', { title, location, description, category, lat, lng, tags });
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          console.log(`Saved file: ${file.filename} at path: ${file.path}`);
        });
      } else {
        console.log('No files uploaded.');
      }
      // Validate required fields
      if (!title || !location || !description || !category) {
        return res.status(400).json({ error: 'Title, location, description, and category are required' });
      }
      if (!db) return res.status(500).json({ error: 'Database not connected' });
      // Combine uploaded files and image URLs
      let images = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];
      if (req.body.imageUrls) {
        if (Array.isArray(req.body.imageUrls)) {
          images = images.concat(req.body.imageUrls.filter(url => typeof url === 'string' && url.trim() !== ''));
        } else if (typeof req.body.imageUrls === 'string' && req.body.imageUrls.trim() !== '') {
          images.push(req.body.imageUrls.trim());
        }
      }
      // Create new experience
      const experience = {
        id: uuidv4(),
        title,
        location,
        description,
        category,
        rating: 0,
        reviewCount: 0,
        rewardPoints: Math.floor(Math.random() * 50) + 25, // Random points between 25-75
        coordinates: {
          lat: lat ? parseFloat(lat) : null,
          lng: lng ? parseFloat(lng) : null
        },
        images,
        addedBy: req.user.userId,
        verified: false, // Needs to be verified by admin
        createdAt: new Date(),
        tags: tags ? tags.split(',') : []
      };
      console.log('Experience object to insert:', experience);
      await db.collection('experiences').insertOne(experience);
      // Create contribution record
      const contribution = {
        id: uuidv4(),
        userId: req.user.userId,
        experienceId: experience.id,
        pointsEarned: 0, // Will be awarded after verification
        status: 'pending',
        date: new Date()
      };
      await db.collection('contributions').insertOne(contribution);
      console.log('Contribution object to insert:', contribution);
      res.status(201).json({
        message: 'Experience submitted for verification',
        experience,
        contributionId: contribution.id
      });
    } catch (error) {
      console.error('Add experience error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  })();
});

// Add a review to an experience (requires authentication)
app.post('/api/experiences/:id/reviews', authenticateToken, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const experienceId = req.params.id;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
    if (!db) return res.status(500).json({ error: 'Database not connected' });
    const experience = await db.collection('experiences').findOne({ id: experienceId });
    if (!experience) {
      return res.status(404).json({ error: 'Experience not found' });
    }
    // Check if user has already reviewed this experience
    const existingReview = await db.collection('reviews').findOne({ experienceId, userId: req.user.id });
    if (existingReview) {
      return res.status(400).json({ error: 'You have already reviewed this experience' });
    }
    // Create review
    const review = {
      id: uuidv4(),
      experienceId,
      userId: req.user.id,
      rating: parseInt(rating),
      comment: comment || '',
      createdAt: new Date()
    };
    await db.collection('reviews').insertOne(review);
    // Update experience rating and reviewCount
    const allReviews = await db.collection('reviews').find({ experienceId }).toArray();
    const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = allReviews.length ? totalRating / allReviews.length : 0;
    await db.collection('experiences').updateOne(
      { id: experienceId },
      { $set: { rating: avgRating, reviewCount: allReviews.length } }
    );
    res.status(201).json({
      message: 'Review added successfully',
      review
    });
  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all categories
app.get('/api/categories', (req, res) => {
  res.json(categories);
});

app.get('/api/contributions', authenticateToken, async (req, res) => {
  if (!db) return res.status(500).json({ error: 'Database not connected' });
  try {
    const contributions = await db.collection('contributions').find({ userId: req.user.id }).toArray();
    // Add experience details to contributions
    const experienceIds = contributions.map(c => c.experienceId);
    const experiencesArr = await db.collection('experiences').find({ id: { $in: experienceIds } }).toArray();
    const contributionsWithDetails = contributions.map(contribution => {
      const experience = experiencesArr.find(e => e.id === contribution.experienceId);
      return {
        ...contribution,
        experience: experience ? {
          id: experience.id,
          title: experience.title,
          category: experience.category,
          image: experience.images && experience.images[0] ? experience.images[0] : null
        } : null
      };
    });
    res.json(contributionsWithDetails);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Add a new contribution with photo upload, save all details to MongoDB
app.post('/api/contributions', authenticateToken, upload.single('photo'), async (req, res) => {
  if (!db) return res.status(500).json({ error: 'Database not connected' });
  try {
    const { title, description, experienceId, ...otherFields } = req.body;
    const photoPath = req.file ? `/uploads/${req.file.filename}` : null;
    const contribution = {
      id: uuidv4(),
      userId: req.user.id,
      experienceId: experienceId || null,
      title,
      description,
      photo: photoPath,
      ...otherFields,
      createdAt: new Date()
    };
    await db.collection('contributions').insertOne(contribution);
    res.status(201).json({ message: 'Contribution added', contribution });
  } catch (err) {
    console.error('Add contribution error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get user rewards from MongoDB
app.get('/api/rewards', authenticateToken, async (req, res) => {
  if (!db) return res.status(500).json({ error: 'Database not connected' });
  try {
    const userRewards = await db.collection('rewards').find({ userId: req.user.id }).toArray();
    res.json(userRewards);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Get map data (coordinates of experiences)
app.get('/api/map-data', (req, res) => {
  const mapData = experiences
    .filter(exp => exp.coordinates.lat && exp.coordinates.lng)
    .map(exp => ({
      id: exp.id,
      title: exp.title,
      category: exp.category,
      coordinates: exp.coordinates,
      rating: exp.rating
    }));
  
  res.json(mapData);
});

// Search experiences
app.get('/api/search', async (req, res) => {
  const { q, category } = req.query;
  if (!q) {
    return res.status(400).json({ error: 'Search query is required' });
  }
  if (!db) return res.status(500).json({ error: 'Database not connected' });
  let filter = {
    $or: [
      { title: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
      { location: { $regex: q, $options: 'i' } },
      { tags: { $elemMatch: { $regex: q, $options: 'i' } } }
    ]
  };
  if (category && category !== 'all') {
    filter.category = category;
  }
  try {
    const results = await db.collection('experiences').find(filter).toArray();
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Removed initializeSampleData();

// Start server
app.listen(PORT, () => {
  console.log(`Guidora server running on port ${PORT}`);
  console.log(`API endpoints available at http://localhost:${PORT}/api/`);
});

// module.exports = app; // Remove or comment out if not needed