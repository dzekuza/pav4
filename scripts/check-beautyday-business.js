import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkBeautydayBusiness() {
  try {
    console.log('🔍 Checking for beautyday business...')
    
    // Check by domain
    const businessByDomain = await prisma.business.findFirst({
      where: {
        OR: [
          { domain: 'beautyday.lt' },
          { domain: 'beautydayl' },
          { name: { contains: 'beautyday', mode: 'insensitive' } }
        ]
      }
    })
    
    if (businessByDomain) {
      console.log('✅ Found business by domain/name:')
      console.log('  ID:', businessByDomain.id)
      console.log('  Name:', businessByDomain.name)
      console.log('  Domain:', businessByDomain.domain)
      console.log('  Affiliate ID:', businessByDomain.affiliateId)
      return businessByDomain.id
    }
    
    // Check all businesses
    const allBusinesses = await prisma.business.findMany({
      select: {
        id: true,
        name: true,
        domain: true,
        affiliateId: true
      }
    })
    
    console.log('📋 All businesses in database:')
    allBusinesses.forEach(b => {
      console.log(`  ID: ${b.id}, Name: ${b.name}, Domain: ${b.domain}, Affiliate ID: ${b.affiliateId}`)
    })
    
    return null
  } catch (error) {
    console.error('❌ Error checking business:', error)
    return null
  } finally {
    await prisma.$disconnect()
  }
}

checkBeautydayBusiness()
