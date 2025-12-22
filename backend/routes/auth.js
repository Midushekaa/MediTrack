const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');

// user signup
router.post('/signup', async (req, res) => {
  const { fullName, email, password, language } = req.body;
  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ message: 'Email already registered' });
  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ fullName, email, password: hashed, language });
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, user: { id: user._id, fullName: user.fullName, email: user.email } });
});

// user signin
router.post('/signin', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ message: 'Invalid credentials' });
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, user: { id: user._id, fullName: user.fullName, email: user.email }});
});

// admin bootstrap login route (only for initial admin creation)
router.post('/admin-setup', async (req, res) => {
  const { email, password, fullName } = req.body;
  const existing = await Admin.findOne({ email });
  if (existing) return res.status(400).json({ message: 'admin exists' });
  const hashed = await bcrypt.hash(password, 10);
  const admin = await Admin.create({ fullName, email, password: hashed, role: 'super_admin' });
  res.json({ admin });
});

module.exports = router;
