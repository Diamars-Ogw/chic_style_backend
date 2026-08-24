import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

function slugify(text) {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

router.get('/', async (req, res) => {
  const categories = await prisma.category.findMany({
    orderBy: { displayOrder: 'asc' },
  });
  res.json(categories);
});

router.post('/', requireAdmin, async (req, res) => {
  const { name, description, imageUrl, displayOrder } = req.body;
  if (!name) return res.status(400).json({ error: 'Nom requis' });
  const category = await prisma.category.create({
    data: { name, slug: slugify(name), description, imageUrl, displayOrder: displayOrder ?? 0 },
  });
  res.status(201).json(category);
});

router.put('/:id', requireAdmin, async (req, res) => {
  const { name, description, imageUrl, displayOrder } = req.body;
  const existing = await prisma.category.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: 'Catégorie introuvable' });
  const category = await prisma.category.update({
    where: { id: req.params.id },
    data: {
      name: name ?? existing.name,
      slug: name ? slugify(name) : existing.slug,
      description: description ?? existing.description,
      imageUrl: imageUrl ?? existing.imageUrl,
      displayOrder: displayOrder ?? existing.displayOrder,
    },
  });
  res.json(category);
});

router.delete('/:id', requireAdmin, async (req, res) => {
  await prisma.category.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

export default router;
