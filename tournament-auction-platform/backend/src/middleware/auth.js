import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { supabase, must } from '../config/db.js';
dotenv.config();

export const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

export const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const profile = await must(await supabase
      .from('profiles')
      .select('id, email, role, full_name')
      .eq('id', decoded.id)
      .maybeSingle());
    if (!profile) return res.status(401).json({ error: 'Invalid token' });
    req.user = profile;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const requireRole = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};
