import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';

const router = Router();

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
};

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis' });
  }

  const admin = await prisma.admin.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!admin) {
    return res.status(401).json({ error: 'Identifiants incorrects' });
  }

  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: 'Identifiants incorrects' });
  }

  const token = jwt.sign({ id: admin.id, email: admin.email }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });

  res.cookie('admin_token', token, COOKIE_OPTIONS);
  res.json({ id: admin.id, email: admin.email });
});

router.post('/logout', (req, res) => {
  res.clearCookie('admin_token', COOKIE_OPTIONS);
  res.json({ ok: true });
});

router.get('/me', async (req, res) => {
  const token = req.cookies?.admin_token;
  if (!token) return res.status(401).json({ error: 'Non authentifié' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ id: payload.id, email: payload.email });
  } catch {
    res.status(401).json({ error: 'Session invalide' });
  }
});

export default router;
