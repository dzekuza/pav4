import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function updateTestBusinessPassword() {
  try {
    // Hash password
    const hashedPassword = await bcrypt.hash('testpassword123', 12);

    // Update test business password
    const business = await prisma.business.update({
      where: { id: 1 },
      data: {
        password: hashedPassword
      }
    });

    console.log('Test business password updated successfully:', business.id);
    console.log('Login credentials:');
    console.log('Email: test@test-business.com');
    console.log('Password: testpassword123');
  } catch (error) {
    console.error('Error updating test business password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateTestBusinessPassword();
