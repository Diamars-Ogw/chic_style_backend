import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

// Public : envoi d'un message depuis le formulaire de contact du site
router.post('/', async (req, res) => {
  const { name, contact, message } = req.body;
  if (!name || !message) {
    return res.status(400).json({ error: 'Nom et message sont requis' });
  }
  const entry = await prisma.contactMessage.create({
    data: { name: name.trim(), contact: (contact || '').trim(), message: message.trim() },
  });
  res.status(201).json({ ok: true, id: entry.id });
});

// Admin : liste des messages reçus
router.get('/', requireAdmin, async (req, res) => {
  const messages = await prisma.contactMessage.findMany({
    orderBy: { createdAt: 'desc' },
  });
  res.json(messages);
});

// Admin : marquer comme lu/non lu
router.patch('/:id/toggle-read', requireAdmin, async (req, res) => {
  const existing = await prisma.contactMessage.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: 'Message introuvable' });
  const updated = await prisma.contactMessage.update({
    where: { id: req.params.id },
    data: { isRead: !existing.isRead },
  });
  res.json(updated);
});

// Admin : suppression
router.delete('/:id', requireAdmin, async (req, res) => {
  await prisma.contactMessage.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

export default router;
