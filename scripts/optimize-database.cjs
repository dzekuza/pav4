const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function optimizeDatabase() {
  try {
    console.log('🔧 Starting database optimization...');

    // Add database indexes for better performance
    console.log('📊 Adding database indexes...');

    // Note: SQLite doesn't support CREATE INDEX IF NOT EXISTS, so we'll use try-catch
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_search_history_timestamp ON search_history(timestamp)',
      'CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_businesses_domain ON businesses(domain)',
      'CREATE INDEX IF NOT EXISTS idx_businesses_email ON businesses(email)',
      'CREATE INDEX IF NOT EXISTS idx_businesses_is_active ON businesses(isActive)',
      'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
      'CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email)',
      'CREATE INDEX IF NOT EXISTS idx_affiliate_urls_is_active ON affiliate_urls(isActive)',
    ];

    for (const index of indexes) {
      try {
        await prisma.$executeRawUnsafe(index);
        console.log(`✅ Added index: ${index.split(' ')[2]}`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`ℹ️  Index already exists: ${index.split(' ')[2]}`);
        } else {
          console.error(`❌ Failed to add index: ${index.split(' ')[2]}`, error.message);
        }
      }
    }

    // Analyze table statistics
    console.log('📈 Analyzing table statistics...');
    await prisma.$executeRawUnsafe('ANALYZE');

    // Get database statistics
    const stats = await prisma.$queryRaw`
      SELECT 
        name,
        sql
      FROM sqlite_master 
      WHERE type='table' 
      ORDER BY name
    `;

    console.log('📋 Database tables:');
    stats.forEach(table => {
      console.log(`  - ${table.name}`);
    });

    // Get index information
    const indexList = await prisma.$queryRaw`
      SELECT 
        name,
        tbl_name,
        sql
      FROM sqlite_master 
      WHERE type='index' 
      ORDER BY tbl_name, name
    `;

    console.log('🔍 Database indexes:');
    indexList.forEach(index => {
      console.log(`  - ${index.name} on ${index.tbl_name}`);
    });

    console.log('✅ Database optimization completed successfully!');

  } catch (error) {
    console.error('❌ Database optimization failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run optimization
optimizeDatabase(); 