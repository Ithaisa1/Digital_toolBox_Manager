// Configuración global para tests
import { beforeAll, afterAll } from '@jest/globals';
import prisma from '../src/config/database.js';

beforeAll(async () => {
  // Conectar a la base de datos de test si es necesario
  console.log('Setting up test environment...');
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
