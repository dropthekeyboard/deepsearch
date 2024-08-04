// prismaClient.ts
import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient|undefined = undefined;

if (process.env.NODE_ENV === 'production') {
  if(!prisma) {
    prisma = new PrismaClient();
  }
} else {
  if (!prisma) {
    prisma = new PrismaClient();
  }
}

export default prisma;
