import { Router } from 'express';
import multer from 'multer';
import { requireAdmin } from '../middleware/auth.js';
import { uploadBufferToCloudinary } from '../lib/cloudinary.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 Mo max
});

// Upload d'une image vers Cloudinary — utilisé par l'admin pour ajouter/modifier des produits
router.post('/', requireAdmin, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Aucune image envoyée' });
  try {
    const result = await uploadBufferToCloudinary(req.file.buffer, 'chic-style/products');
    res.json({ url: result.secure_url, publicId: result.public_id });
  } catch (err) {
    console.error('Erreur upload Cloudinary:', err);
    res.status(500).json({ error: "Échec de l'upload de l'image" });
  }
});

export default router;
