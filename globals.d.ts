// globals.d.ts
import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined; // Use `let` if you plan to reassign
}
