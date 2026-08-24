import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', async (req, res) => {
  let settings = await prisma.settings.findUnique({ where: { id: 'main' } });
  if (!settings) {
    settings = await prisma.settings.create({ data: { id: 'main' } });
  }
  res.json(settings);
});

router.put('/', requireAdmin, async (req, res) => {
  const { shopName, whatsappNumber, instagram, tiktok, facebook, tagline, ownerName, ownerBio, ownerPhotoUrl } = req.body;
  const settings = await prisma.settings.upsert({
    where: { id: 'main' },
    update: { shopName, whatsappNumber, instagram, tiktok, facebook, tagline, ownerName, ownerBio, ownerPhotoUrl },
    create: { id: 'main', shopName, whatsappNumber, instagram, tiktok, facebook, tagline, ownerName, ownerBio, ownerPhotoUrl },
  });
  res.json(settings);
});

export default router;
