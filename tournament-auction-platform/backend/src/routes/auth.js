import express from 'express';
import bcrypt from 'bcryptjs';
import { supabase, must } from '../config/db.js';
import { authenticate, generateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/me', authenticate, async (req, res) => {
  res.json({ user: req.user });
});

// Register
router.post('/register', async (req, res) => {
  const { email, password, full_name, phone } = req.body;
  if (!email || !password || !full_name) {
    return res.status(400).json({ error: 'Email, password, and full name are required' });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const user = await must(await supabase
      .from('profiles')
      .insert({ email, password_hash: hashedPassword, full_name, role: 'player', phone })
      .select('id, email, full_name, role, phone, created_at')
      .single());
    const token = generateToken(user);
    res.json({ token, user });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await must(await supabase
    .from('profiles')
    .select('*')
    .eq('email', email)
    .maybeSingle());
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
  const token = generateToken(user);
  const { password_hash, ...userWithoutPassword } = user;
  res.json({ token, user: userWithoutPassword });
});

export default router;
