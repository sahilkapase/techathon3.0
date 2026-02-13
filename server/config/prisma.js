const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['query', 'error', 'warn'],
});

// Connect to PostgreSQL (Neon)
async function connectDB() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("/////Database is connected successfully/////");
    return prisma;
  } catch (error) {
    console.error('Error connecting to database:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

module.exports = { prisma, connectDB };
