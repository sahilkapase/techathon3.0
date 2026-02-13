/**
 * Prisma Database Connection Test
 * Run: node test_prisma_connection.js
 */

const { prisma, connectDB } = require('./config/prisma');

async function testConnection() {
  console.log('🔄 Testing PostgreSQL (Neon) connection via Prisma...\n');

  try {
    // Test connection
    await connectDB();
    console.log('✅ Database connection successful!\n');

    // Test creating a record
    console.log('📝 Testing CREATE operation...');
    const testUser = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        password: 'test123',
        userType: 'farmer',
        name: 'Test User'
      }
    });
    console.log('✅ CREATE successful:', testUser);

    // Test reading a record
    console.log('\n📖 Testing READ operation...');
    const foundUser = await prisma.user.findUnique({
      where: { id: testUser.id }
    });
    console.log('✅ READ successful:', foundUser);

    // Test updating a record
    console.log('\n✏️ Testing UPDATE operation...');
    const updated = await prisma.user.update({
      where: { id: testUser.id },
      data: { name: 'Updated Test User' }
    });
    console.log('✅ UPDATE successful:', updated);

    // Test counting
    console.log('\n📊 Testing COUNT operation...');
    const count = await prisma.user.count();
    console.log('✅ COUNT successful: Total users =', count);

    // Test deleting
    console.log('\n🗑️ Testing DELETE operation...');
    const deleted = await prisma.user.delete({
      where: { id: testUser.id }
    });
    console.log('✅ DELETE successful:', deleted);

    // List all tables
    console.log('\n📋 All tables in PostgreSQL:');
    const tables = [
      'FarmerInfo',
      'Farm',
      'CropHistoryForm',
      'Irigation',
      'AdminDetails',
      'ExpertsRegistration',
      'ExpertMessage',
      'SchemeDetails',
      'InsuranceCompany',
      'TraderDetails',
      'Bill',
      'District',
      'DistrictwiseSoil',
      'AdhaarDetails',
      'Message',
      'Notification',
      'TrainingProgram',
      'GSTDetails',
      'CultivatedArea',
      'APY',
      'User'
    ];
    
    tables.forEach(table => console.log(`   ✓ ${table}`));

    console.log('\n✨ All tests passed! PostgreSQL migration successful!\n');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
