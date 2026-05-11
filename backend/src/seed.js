import prisma from './config/database.js';
import bcrypt from 'bcryptjs';

const seed = async () => {
  try {
    console.log('Starting seed...');

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        email: 'admin@example.com',
        password: hashedPassword,
        name: 'Admin User',
        role: 'ADMIN',
      },
    });
    console.log('Created admin user:', admin.email);

    // Create regular user
    const userPassword = await bcrypt.hash('user123', 10);
    const user = await prisma.user.upsert({
      where: { email: 'user@example.com' },
      update: {},
      create: {
        email: 'user@example.com',
        password: userPassword,
        name: 'Regular User',
        role: 'USER',
      },
    });
    console.log('Created regular user:', user.email);

    // Create categories
    const categories = await Promise.all([
      prisma.category.upsert({
        where: { name: 'Development' },
        update: {},
        create: { name: 'Development', description: 'Development tools and IDEs' },
      }),
      prisma.category.upsert({
        where: { name: 'Design' },
        update: {},
        create: { name: 'Design', description: 'Design and creative tools' },
      }),
      prisma.category.upsert({
        where: { name: 'Productivity' },
        update: {},
        create: { name: 'Productivity', description: 'Productivity and collaboration tools' },
      }),
      prisma.category.upsert({
        where: { name: 'Communication' },
        update: {},
        create: { name: 'Communication', description: 'Communication and messaging tools' },
      }),
      prisma.category.upsert({
        where: { name: 'AI & Machine Learning' },
        update: {},
        create: { name: 'AI & Machine Learning', description: 'AI tools and machine learning platforms' },
      }),
    ]);
    console.log('Created categories');

    // Create tools for user
    const devCategory = categories.find(c => c.name === 'Development');
    const designCategory = categories.find(c => c.name === 'Design');
    const prodCategory = categories.find(c => c.name === 'Productivity');
    const commCategory = categories.find(c => c.name === 'Communication');
    const aiCategory = categories.find(c => c.name === 'AI & Machine Learning');

    const tools = await Promise.all([
      // Development Tools
      prisma.tool.create({
        data: {
          name: 'Visual Studio Code',
          type: 'IDE',
          url: 'https://code.visualstudio.com',
          price: 0,
          status: 'ACTIVE',
          categoryId: devCategory.id,
          userId: user.id,
        },
      }),
      prisma.tool.create({
        data: {
          name: 'GitHub Copilot',
          type: 'AI Assistant',
          url: 'https://github.com/features/copilot',
          price: 10,
          status: 'ACTIVE',
          categoryId: devCategory.id,
          userId: user.id,
        },
      }),
      prisma.tool.create({
        data: {
          name: 'JetBrains IDEs',
          type: 'IDE',
          url: 'https://jetbrains.com',
          price: 12.50,
          status: 'ACTIVE',
          categoryId: devCategory.id,
          userId: user.id,
        },
      }),
      
      // Design Tools
      prisma.tool.create({
        data: {
          name: 'Figma',
          type: 'Design Tool',
          url: 'https://figma.com',
          price: 15,
          status: 'ACTIVE',
          categoryId: designCategory.id,
          userId: user.id,
        },
      }),
      prisma.tool.create({
        data: {
          name: 'Adobe Creative Cloud',
          type: 'Design Suite',
          url: 'https://adobe.com/creativecloud',
          price: 54.99,
          status: 'ACTIVE',
          categoryId: designCategory.id,
          userId: user.id,
        },
      }),
      prisma.tool.create({
        data: {
          name: 'Canva Pro',
          type: 'Design Tool',
          url: 'https://canva.com',
          price: 15,
          status: 'ACTIVE',
          categoryId: designCategory.id,
          userId: user.id,
        },
      }),
      
      // Productivity Tools
      prisma.tool.create({
        data: {
          name: 'Notion',
          type: 'Productivity',
          url: 'https://notion.so',
          price: 10,
          status: 'ACTIVE',
          categoryId: prodCategory.id,
          userId: user.id,
        },
      }),
      prisma.tool.create({
        data: {
          name: 'Slack',
          type: 'Collaboration',
          url: 'https://slack.com',
          price: 8,
          status: 'ACTIVE',
          categoryId: prodCategory.id,
          userId: user.id,
        },
      }),
      prisma.tool.create({
        data: {
          name: 'Trello',
          type: 'Project Management',
          url: 'https://trello.com',
          price: 5,
          status: 'ACTIVE',
          categoryId: prodCategory.id,
          userId: user.id,
        },
      }),
      
      // Communication Tools
      prisma.tool.create({
        data: {
          name: 'Zoom',
          type: 'Video Conferencing',
          url: 'https://zoom.us',
          price: 14.99,
          status: 'ACTIVE',
          categoryId: commCategory.id,
          userId: user.id,
        },
      }),
      prisma.tool.create({
        data: {
          name: 'Microsoft Teams',
          type: 'Collaboration',
          url: 'https://teams.microsoft.com',
          price: 6,
          status: 'ACTIVE',
          categoryId: commCategory.id,
          userId: user.id,
        },
      }),
      
      // AI & Machine Learning Tools
      prisma.tool.create({
        data: {
          name: 'Claude Pro',
          type: 'AI Assistant',
          url: 'https://claude.ai',
          price: 20,
          status: 'ACTIVE',
          categoryId: aiCategory.id,
          userId: user.id,
        },
      }),
      prisma.tool.create({
        data: {
          name: 'ChatGPT Plus',
          type: 'AI Assistant',
          url: 'https://chat.openai.com',
          price: 20,
          status: 'ACTIVE',
          categoryId: aiCategory.id,
          userId: user.id,
        },
      }),
      prisma.tool.create({
        data: {
          name: 'LM Studio',
          type: 'AI Platform',
          url: 'https://lmstudio.ai',
          price: 0,
          status: 'ACTIVE',
          categoryId: aiCategory.id,
          userId: user.id,
        },
      }),
      prisma.tool.create({
        data: {
          name: 'Hugging Face',
          type: 'AI Platform',
          url: 'https://huggingface.co',
          price: 0,
          status: 'ACTIVE',
          categoryId: aiCategory.id,
          userId: user.id,
        },
      }),
      prisma.tool.create({
        data: {
          name: 'Midjourney',
          type: 'AI Image Generator',
          url: 'https://midjourney.com',
          price: 10,
          status: 'ACTIVE',
          categoryId: aiCategory.id,
          userId: user.id,
        },
      }),
      prisma.tool.create({
        data: {
          name: 'Runway',
          type: 'AI Video Editor',
          url: 'https://runwayml.com',
          price: 12,
          status: 'ACTIVE',
          categoryId: aiCategory.id,
          userId: user.id,
        },
      }),
    ]);
    console.log('Created tools');

    // Create subscriptions (simplified - only for tools that exist)
    const figma = tools.find(t => t.name === 'Figma');
    const notion = tools.find(t => t.name === 'Notion');
    const copilot = tools.find(t => t.name === 'GitHub Copilot');
    const slack = tools.find(t => t.name === 'Slack');
    const zoom = tools.find(t => t.name === 'Zoom');
    const claude = tools.find(t => t.name === 'Claude Pro');
    const chatgpt = tools.find(t => t.name === 'ChatGPT Plus');
    const midjourney = tools.find(t => t.name === 'Midjourney');
    const runway = tools.find(t => t.name === 'Runway');
    const adobe = tools.find(t => t.name === 'Adobe Creative Cloud');
    const jetbrains = tools.find(t => t.name === 'JetBrains IDEs');

    const renewalDate = new Date();
    renewalDate.setDate(renewalDate.getDate() + 15);

    const renewalDateNextMonth = new Date();
    renewalDateNextMonth.setDate(renewalDateNextMonth.getDate() + 45);

    const subscriptions = [];
    
    if (figma) {
      subscriptions.push(
        prisma.subscription.create({
          data: {
            toolId: figma.id,
            renewalDate,
            price: 15,
            billingCycle: 'monthly',
            status: 'ACTIVE',
            userId: user.id,
          },
        })
      );
    }
    
    if (notion) {
      subscriptions.push(
        prisma.subscription.create({
          data: {
            toolId: notion.id,
            renewalDate,
            price: 10,
            billingCycle: 'monthly',
            status: 'ACTIVE',
            userId: user.id,
          },
        })
      );
    }
    
    if (copilot) {
      subscriptions.push(
        prisma.subscription.create({
          data: {
            toolId: copilot.id,
            renewalDate,
            price: 10,
            billingCycle: 'monthly',
            status: 'ACTIVE',
            userId: user.id,
          },
        })
      );
    }
    
    if (claude) {
      subscriptions.push(
        prisma.subscription.create({
          data: {
            toolId: claude.id,
            renewalDate,
            price: 20,
            billingCycle: 'monthly',
            status: 'ACTIVE',
            userId: user.id,
          },
        })
      );
    }

    await Promise.all(subscriptions);
    console.log('Created subscriptions');

    console.log('Seed completed successfully!');
  } catch (error) {
    console.error('Error during seed:', error);
  } finally {
    await prisma.$disconnect();
  }
};

seed();
