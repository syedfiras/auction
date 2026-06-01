import express from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/db.js';
import { generateToken } from '../middleware/auth.js';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  const { email, password, full_name, role, phone } = req.body;
  if (!['captain', 'player'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role. Only player and captain accounts can register here.' });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const [result] = await pool.query(
      'INSERT INTO users (email, password_hash, full_name, role, phone) VALUES (?, ?, ?, ?, ?)',
      [email, hashedPassword, full_name, role, phone]
    );
    const user = { id: result.insertId, email, role, full_name };
    const token = generateToken(user);
    res.json({ token, user });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
  const user = rows[0];
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
  const token = generateToken(user);
  const { password_hash, ...userWithoutPassword } = user;
  res.json({ token, user: userWithoutPassword });
});

export default router;