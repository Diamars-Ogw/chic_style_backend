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

async function uniqueSlug(base, ignoreId) {
  let slug = slugify(base) || 'produit';
  let i = 1;
  while (
    await prisma.product.findFirst({
      where: { slug, ...(ignoreId ? { id: { not: ignoreId } } : {}) },
    })
  ) {
    i += 1;
    slug = `${slugify(base)}-${i}`;
  }
  return slug;
}

// Public : liste des produits actifs (avec catégorie)
router.get('/', async (req, res) => {
  const { category, featured } = req.query;
  const isAdminView = req.query.all === '1' && req.cookies?.admin_token;

  const where = {};
  if (!isAdminView) where.isActive = true;
  if (category) where.category = { slug: category };
  if (featured === '1') where.isFeatured = true;

  const products = await prisma.product.findMany({
    where,
    include: { category: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(products);
});

router.get('/:slug', async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { slug: req.params.slug },
    include: { category: true },
  });
  if (!product) return res.status(404).json({ error: 'Produit introuvable' });
  res.json(product);
});

// Admin : création
router.post('/', requireAdmin, async (req, res) => {
  const { name, description, price, compareAtPrice, images, categoryId, sourceUrl, badge, isAvailable, isFeatured, isActive } = req.body;
  if (!name || price === undefined) {
    return res.status(400).json({ error: 'Nom et prix requis' });
  }
  const slug = await uniqueSlug(name);
  const product = await prisma.product.create({
    data: {
      name,
      slug,
      description,
      price,
      compareAtPrice: compareAtPrice || null,
      images: images || [],
      categoryId: categoryId || null,
      sourceUrl,
      badge,
      isAvailable: isAvailable ?? true,
      isFeatured: isFeatured ?? false,
      isActive: isActive ?? true,
    },
  });
  res.status(201).json(product);
});

// Admin : modification
router.put('/:id', requireAdmin, async (req, res) => {
  const { name, description, price, compareAtPrice, images, categoryId, sourceUrl, badge, isAvailable, isFeatured, isActive } = req.body;
  const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: 'Produit introuvable' });

  const slug = name && name !== existing.name ? await uniqueSlug(name, existing.id) : existing.slug;

  const product = await prisma.product.update({
    where: { id: req.params.id },
    data: {
      name: name ?? existing.name,
      slug,
      description: description ?? existing.description,
      price: price ?? existing.price,
      compareAtPrice: compareAtPrice ?? existing.compareAtPrice,
      images: images ?? existing.images,
      categoryId: categoryId !== undefined ? categoryId : existing.categoryId,
      sourceUrl: sourceUrl ?? existing.sourceUrl,
      badge: badge ?? existing.badge,
      isAvailable: isAvailable ?? existing.isAvailable,
      isFeatured: isFeatured ?? existing.isFeatured,
      isActive: isActive ?? existing.isActive,
    },
  });
  res.json(product);
});

// Admin : afficher/masquer rapide
router.patch('/:id/toggle-active', requireAdmin, async (req, res) => {
  const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: 'Produit introuvable' });
  const product = await prisma.product.update({
    where: { id: req.params.id },
    data: { isActive: !existing.isActive },
  });
  res.json(product);
});

// Admin : suppression
router.delete('/:id', requireAdmin, async (req, res) => {
  await prisma.product.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

export default router;
