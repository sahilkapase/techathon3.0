require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const adminDetails = await p.adminDetails.findMany();
  
  console.log('=== AdminDetails table ===');
  console.log(JSON.stringify(adminDetails, null, 2));
  
  if (adminDetails.length === 0) {
    console.log('\nNo admin found! Creating one...');
    const newAdmin = await p.adminDetails.create({
      data: {
        AdminName: 'System Admin',
        Email: 'admin',
        Password: 'admin123',
        AdminType: 'SuperAdmin'
      }
    });
    console.log('Created admin:', JSON.stringify(newAdmin, null, 2));
  }
}

main().finally(() => p.$disconnect());

