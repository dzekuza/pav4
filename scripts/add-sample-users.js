import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function addRealUsers() {
  try {
    console.log('Adding real users with search history from registered businesses...');

    // Get all active businesses from the database
    const businesses = await prisma.business.findMany({
      where: { isActive: true },
      select: { name: true, domain: true, website: true }
    });

    if (businesses.length === 0) {
      console.log('No active businesses found. Please register businesses first.');
      return;
    }

    const realUsers = [
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

    // Generate realistic product URLs based on real businesses
    const generateProductUrl = (business) => {
      const products = [
        'iphone-15-pro-max',
        'samsung-galaxy-s24',
        'sony-wh-1000xm5',
        'macbook-pro-14',
        'dell-xps-13',
        'canon-eos-r5',
        'nike-air-max',
        'adidas-ultraboost',
        'sonos-arc',
        'lg-oled-c3'
      ];
      
      const randomProduct = products[Math.floor(Math.random() * products.length)];
      return `${business.website}/product/${randomProduct}`;
    };

    for (const userData of realUsers) {
      // Check if user already exists
      let user = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      if (!user) {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        
        user = await prisma.user.create({
          data: {
            email: userData.email,
            password: hashedPassword,
            isAdmin: userData.isAdmin,
          },
        });
        console.log(`Created new user: ${userData.email}`);
      } else {
        console.log(`User already exists: ${userData.email}`);
      }

      // Clear existing search history for this user
      await prisma.searchHistory.deleteMany({
        where: { userId: user.id }
      });

      // Add search history using real business URLs
      for (let i = 0; i < userData.searchCount; i++) {
        const randomBusiness = businesses[Math.floor(Math.random() * businesses.length)];
        const productUrl = generateProductUrl(randomBusiness);
        
        await prisma.searchHistory.create({
          data: {
            userId: user.id,
            url: productUrl,
            title: `Product Search ${i + 1} - ${randomBusiness.name}`,
            requestId: `req_${user.id}_${i + 1}`,
          },
        });
      }

      console.log(`Updated user: ${userData.email} with ${userData.searchCount} searches from real businesses`);
    }

    console.log('✅ Real users updated successfully!');
  } catch (error) {
    console.error('❌ Error updating real users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addRealUsers(); 