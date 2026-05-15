import bcrypt from 'bcryptjs';
import prisma from './src/config/database.js';

const seedData = async () => {
  try {
    console.log('Creando usuario de prueba...');

    // Crear usuario admin
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const user = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        password: hashedPassword,
        name: 'Admin User',
        role: 'ADMIN'
      }
    });

    console.log('Usuario creado:', user);

    // Crear categorías básicas
    const categories = await Promise.all([
      prisma.category.create({
        data: { name: 'Herramientas de Desarrollo', description: 'IDEs, editores, etc.' }
      }),
      prisma.category.create({
        data: { name: 'Herramientas de Diseño', description: 'Figma, Photoshop, etc.' }
      }),
      prisma.category.create({
        data: { name: 'Herramientas de Productividad', description: 'Notion, Trello, etc.' }
      })
    ]);

    console.log('Categorías creadas:', categories);

    console.log('Base de datos inicializada correctamente!');
  } catch (error) {
    console.error('Error al inicializar base de datos:', error);
  } finally {
    await prisma.$disconnect();
  }
};

seedData();
