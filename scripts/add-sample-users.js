import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function addSampleUsers() {
  try {
    console.log('Adding sample users...');

    const sampleUsers = [
      {
        email: 'john.doe@example.com',
        password: 'password123',
        isAdmin: false,
        searchCount: 15,
      },
      {
        email: 'jane.smith@example.com',
        password: 'password123',
        isAdmin: false,
        searchCount: 8,
      },
      {
        email: 'mike.wilson@example.com',
        password: 'password123',
        isAdmin: false,
        searchCount: 23,
      },
      {
        email: 'sarah.jones@example.com',
        password: 'password123',
        isAdmin: false,
        searchCount: 12,
      },
      {
        email: 'david.brown@example.com',
        password: 'password123',
        isAdmin: false,
        searchCount: 31,
      },
    ];

    for (const userData of sampleUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          password: hashedPassword,
          isAdmin: userData.isAdmin,
        },
      });

      // Add some sample search history
      const sampleSearches = [
        'https://amazon.com/dp/B08N5WRWNW',
        'https://bestbuy.com/site/apple-iphone-15-pro-max-256gb-natural-titanium-verizon/6534523.p',
        'https://newegg.com/p/N82E16824012025',
        'https://walmart.com/ip/Apple-iPhone-15-Pro-Max-256GB-Natural-Titanium-Verizon/1234567890',
        'https://target.com/p/apple-iphone-15-pro-max-256gb-natural-titanium-verizon/-/A-1234567890',
      ];

      for (let i = 0; i < userData.searchCount; i++) {
        const randomSearch = sampleSearches[Math.floor(Math.random() * sampleSearches.length)];
        await prisma.searchHistory.create({
          data: {
            userId: user.id,
            url: randomSearch,
            title: `Product Search ${i + 1}`,
            requestId: `req_${user.id}_${i + 1}`,
          },
        });
      }

      console.log(`Added user: ${userData.email} with ${userData.searchCount} searches`);
    }

    console.log('✅ Sample users added successfully!');
  } catch (error) {
    console.error('❌ Error adding sample users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addSampleUsers(); 