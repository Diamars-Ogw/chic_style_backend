import { PrismaClient } from '@prisma/client';

// Un seul client Prisma réutilisé partout (évite d'épuiser les connexions Postgres)
export const prisma = new PrismaClient();
