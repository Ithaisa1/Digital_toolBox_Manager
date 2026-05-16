// Configuración global para tests
import { beforeAll, afterAll } from '@jest/globals';
import prisma from '../src/config/database.js';
import { connectDatabase } from '../src/config/database.js';

beforeAll(async () => {
  console.log('Setting up test environment...');
  await connectDatabase();
});

afterAll(async () => {
  // Limpiar después de todos los tests
  await prisma.$disconnect();
  console.log('Test environment cleaned up');
});

// Silenciar console.error durante los tests para cleaner output
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' && 
      args[0].includes('PrismaClientInitializationError')
    ) {
      return; // Ignorar errores de Prisma en tests
    }
    originalError(...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
