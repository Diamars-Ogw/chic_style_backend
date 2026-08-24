import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

async function main() {
  // 1. Compte admin (unique) — email/mot de passe pris dans les variables d'environnement
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@chicstyle.bj').toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || 'ChangeMoi123!';
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.admin.upsert({
    where: { email: adminEmail },
    update: {},
    create: { email: adminEmail, passwordHash },
  });
  console.log(`Compte admin prêt : ${adminEmail}`);

  // 2. Paramètres de la boutique
  await prisma.settings.upsert({
    where: { id: 'main' },
    update: {},
    create: {
      id: 'main',
      shopName: 'Chic Style',
      whatsappNumber: process.env.WHATSAPP_NUMBER || '22960194915',
      whatsappGroupLink: process.env.WHATSAPP_GROUP_LINK || '',
      instagram: '',
      tiktok: '',
      facebook: '',
      tagline: 'Tu trouves l\u2019article. Je m\u2019occupe du reste.',
      ownerName: 'Dahounto Ophélia',
      ownerBio:
        "Je m'appelle Ophélia, passionnée de mode depuis toujours. Après une licence en journalisme, j'ai lancé Chic Style pour aider les filles d'ici à s'habiller stylé sans le stress des commandes en ligne. Je gère tout, de la sélection à la livraison, avec la même rigueur que dans mon métier : à l'écoute, sérieuse, et toujours à l'heure.",
      ownerPhotoUrl: '',
    },
  });
  console.log('Paramètres boutique initialisés');

  // 3. Catégories
  const categoriesData = [
    { name: 'Vêtements', description: 'Robes, hauts, ensembles et plus', displayOrder: 1 },
    { name: 'Accessoires', description: 'Sacs, bijoux, ceintures...', displayOrder: 2 },
    { name: 'Chaussures', description: 'Sneakers, sandales, talons', displayOrder: 3 },
    { name: 'Beauté & plus', description: 'Beauté et petits plaisirs', displayOrder: 4 },
  ];

  const categories = {};
  for (const c of categoriesData) {
    const cat = await prisma.category.upsert({
      where: { slug: slugify(c.name) },
      update: {},
      create: { ...c, slug: slugify(c.name) },
    });
    categories[c.name] = cat;
  }
  console.log(`${categoriesData.length} catégories prêtes`);

  // 4. Produits de démarrage à partir des photos envoyées par Ophélia.
  // Les images sont servies depuis /products dans le frontend pour ce démarrage rapide ;
  // une fois Cloudinary connecté, elle pourra les remplacer/compléter directement depuis /admin.
  const demoProducts = [
    { name: 'Collier trèfle & cœurs sertis', price: 8000, category: 'Accessoires', image: '/products/produit-01.jpeg' },
    { name: 'Robe longue épaules dénudées', price: 19500, category: 'Vêtements', image: '/products/produit-09.jpeg', badge: 'Coup de cœur' },
    { name: 'Top mousseline fleur imprimée', price: 9500, category: 'Vêtements', image: '/products/produit-07.jpeg' },
    { name: 'Collier multi-rangs pierres colorées', price: 7500, category: 'Accessoires', image: '/products/produit-10.jpeg' },
    { name: 'Pendentif croix & infini', price: 6000, category: 'Accessoires', image: '/products/produit-15.jpeg' },
    { name: 'Bracelet fleurs strass ajustable', price: 5500, category: 'Accessoires', image: '/products/produit-20.jpeg' },
    { name: 'Collier pendentif oiseau doré', price: 6500, category: 'Accessoires', image: '/products/produit-25.jpeg' },
    { name: 'Queue de cheval bouclée extension', price: 12000, category: 'Beauté & plus', image: '/products/produit-30.jpeg', badge: 'Populaire' },
    { name: 'Set faux-ongles nail art fleurs', price: 4000, category: 'Beauté & plus', image: '/products/produit-05.jpeg' },
    { name: 'Bague dorée fine élégante', price: 4500, category: 'Accessoires', image: '/products/produit-13.jpeg' },
    { name: 'Boucles d\u2019oreilles pendantes chic', price: 5000, category: 'Accessoires', image: '/products/produit-17.jpeg' },
    { name: 'Sac bandoulière mini tendance', price: 11000, category: 'Accessoires', image: '/products/produit-22.jpeg' },
    { name: 'Ensemble deux pièces moderne', price: 16000, category: 'Vêtements', image: '/products/produit-11.jpeg' },
    { name: 'Bracelet chaîne fine layering', price: 4500, category: 'Accessoires', image: '/products/produit-27.jpeg' },

    // Batch complémentaire — le reste des photos envoyées, pour ne rien laisser de côté
    { name: 'Collier chaîne double pendentif barre', price: 6000, category: 'Accessoires', image: '/products/produit-02.jpeg' },
    { name: 'Grillz dents dorées strass', price: 7000, category: 'Accessoires', image: '/products/produit-03.jpeg' },
    { name: 'Ensemble jersey crop & short en jean', price: 14000, category: 'Vêtements', image: '/products/produit-04.jpeg' },
    { name: 'Ensemble total look chic noir & blanc', price: 22000, category: 'Vêtements', image: '/products/produit-06.jpeg', badge: 'Look complet' },
    { name: 'Jean large motifs étoiles', price: 17000, category: 'Vêtements', image: '/products/produit-08.jpeg' },
    { name: 'Lot de chouchous satinés', price: 3000, category: 'Beauté & plus', image: '/products/produit-12.jpeg' },
    { name: 'Lunettes tendance (lot de 3 montures)', price: 6000, category: 'Accessoires', image: '/products/produit-14.jpeg' },
    { name: 'Set boucles d\u2019oreilles dorées', price: 5500, category: 'Accessoires', image: '/products/produit-16.jpeg' },
    { name: 'Collier croix filigrane doré', price: 5000, category: 'Accessoires', image: '/products/produit-18.jpeg' },
    { name: 'Set faux-ongles nail art rose', price: 4000, category: 'Beauté & plus', image: '/products/produit-19.jpeg' },
    { name: 'Faux-cils volumineux (lot de 5 paires)', price: 3500, category: 'Beauté & plus', image: '/products/produit-21.jpeg' },
    { name: 'Collier cœur cristal "Friendship"', price: 4500, category: 'Accessoires', image: '/products/produit-23.jpeg' },
    { name: 'Collier pendentif papillon', price: 5500, category: 'Accessoires', image: '/products/produit-24.jpeg' },
    { name: 'Parure tortue émeraude (collier + boucles)', price: 8000, category: 'Accessoires', image: '/products/produit-26.jpeg' },
    { name: 'Set ear cuffs dorés', price: 5000, category: 'Accessoires', image: '/products/produit-28.jpeg' },
    { name: 'Faux piercing nez étoile', price: 2500, category: 'Accessoires', image: '/products/produit-29.jpeg' },
    { name: 'Faux piercing nez cœur doré', price: 2500, category: 'Accessoires', image: '/products/produit-31.jpeg' },
  ];

  for (const p of demoProducts) {
    const slug = slugify(p.name);
    await prisma.product.upsert({
      where: { slug },
      update: {},
      create: {
        name: p.name,
        slug,
        description: `${p.name} — sélectionné avec soin, disponible via commande WhatsApp.`,
        price: p.price,
        images: [p.image],
        categoryId: categories[p.category]?.id,
        badge: p.badge || null,
        isActive: true,
        isFeatured: !!p.badge,
      },
    });
  }
  console.log(`${demoProducts.length} produits de démarrage créés (à compléter/illustrer depuis l'admin)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
