// prisma.ts
import { PrismaClient } from '@prisma/client';

if (!global.prisma) {
  global.prisma = new PrismaClient({
    log: ['query', 'error', 'warn'], // Optional: for debugging purposes
  });
  
}

export default global.prisma;
