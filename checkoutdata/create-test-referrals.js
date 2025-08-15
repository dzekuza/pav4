const axios = require('axios');

const GADGET_API_URL = 'https://checkoutdata--development.gadget.app/api/graphql';
const API_KEY = 'gsk-BDE2GN4ftPEmRdMHVaRqX7FrWE7DVDEL';

async function createTestReferrals() {
  console.log('Creating test referral data for godislove.lt...\n');

  const testReferrals = [
    {
      referralId: 'ref-godislove-001',
      businessDomain: 'godislove.lt',
      targetUrl: 'https://godislove.lt/products/religious-book-1',
      sourceUrl: 'https://ipick.io/suggestions/religious-books',
      productName: 'Religious Book Collection',
      utmSource: 'ipick',
      utmMedium: 'suggestion',
      utmCampaign: 'business_tracking',
      clickedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      conversionStatus: 'pending'
    },
    {
      referralId: 'ref-godislove-002',
      businessDomain: 'godislove.lt',
      targetUrl: 'https://godislove.lt/products/prayer-book',
      sourceUrl: 'https://ipick.io/suggestions/prayer-materials',
      productName: 'Prayer Book',
      utmSource: 'ipick',
      utmMedium: 'suggestion',
      utmCampaign: 'business_tracking',
      clickedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
      conversionStatus: 'converted',
      conversionValue: 25.99
    },
    {
      referralId: 'ref-godislove-003',
      businessDomain: 'godislove.lt',
      targetUrl: 'https://godislove.lt/products/bible-study',
      sourceUrl: 'https://ipick.io/suggestions/bible-study',
      productName: 'Bible Study Guide',
      utmSource: 'ipick',
      utmMedium: 'suggestion',
      utmCampaign: 'business_tracking',
      clickedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
      conversionStatus: 'pending'
    },
    {
      referralId: 'ref-godislove-004',
      businessDomain: 'godislove.lt',
      targetUrl: 'https://godislove.lt/products/religious-art',
      sourceUrl: 'https://ipick.io/suggestions/religious-art',
      productName: 'Religious Art Print',
      utmSource: 'ipick',
      utmMedium: 'suggestion',
      utmCampaign: 'business_tracking',
      clickedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
      conversionStatus: 'converted',
      conversionValue: 45.50
    },
    {
      referralId: 'ref-godislove-005',
      businessDomain: 'godislove.lt',
      targetUrl: 'https://godislove.lt/products/cross-necklace',
      sourceUrl: 'https://ipick.io/suggestions/jewelry',
      productName: 'Cross Necklace',
      utmSource: 'ipick',
      utmMedium: 'suggestion',
      utmCampaign: 'business_tracking',
      clickedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
      conversionStatus: 'abandoned'
    }
  ];

  for (const referral of testReferrals) {
    try {
      console.log(`Creating referral: ${referral.referralId}`);
      
      const response = await axios.post(GADGET_API_URL, {
        query: `
          mutation {
            createBusinessReferral(
              businessReferral: {
                businessDomain: "${referral.businessDomain}",
                referralId: "${referral.referralId}",
                targetUrl: "${referral.targetUrl}",
                sourceUrl: "${referral.sourceUrl}",
                productName: "${referral.productName}",
                utmSource: "${referral.utmSource}",
                utmMedium: "${referral.utmMedium}",
                utmCampaign: "${referral.utmCampaign}",
                clickedAt: "${referral.clickedAt}",
                shop: { _link: "75941839177" }
              }
            ) {
              businessReferral {
                id
                referralId
                businessDomain
                utmSource
                utmMedium
                utmCampaign
                conversionStatus
                conversionValue
                clickedAt
              }
            }
          }
        `
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        }
      });

      if (response.data.data?.createBusinessReferral?.businessReferral) {
        const createdReferral = response.data.data.createBusinessReferral.businessReferral;
        console.log(`✅ Successfully created referral: ${referral.referralId} (ID: ${createdReferral.id})`);
        
        // If this is a converted referral, update the conversion value
        if (referral.conversionStatus === 'converted' && referral.conversionValue) {
          await updateReferralConversion(createdReferral.id, referral.conversionValue);
        }
        
        // If this is an abandoned referral, update the status
        if (referral.conversionStatus === 'abandoned') {
          await updateReferralStatus(createdReferral.id, 'abandoned');
        }
      } else {
        console.log(`❌ Failed to create referral: ${referral.referralId}`);
        console.log('Response:', response.data);
      }
    } catch (error) {
      console.log(`❌ Error creating referral ${referral.referralId}:`, error.message);
    }
  }

  console.log('\nTest referral creation completed!');
}

async function updateReferralConversion(referralId, conversionValue) {
  try {
    const response = await axios.post(GADGET_API_URL, {
      query: `
        mutation {
          updateBusinessReferral(
            id: "${referralId}",
            businessReferral: {
              conversionStatus: "converted",
              conversionValue: ${conversionValue}
            }
          ) {
            businessReferral {
              id
              conversionStatus
              conversionValue
            }
          }
        }
      `
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      }
    });

    if (response.data.data?.updateBusinessReferral?.businessReferral) {
      console.log(`✅ Updated conversion for referral ${referralId}: €${conversionValue}`);
    }
  } catch (error) {
    console.log(`❌ Error updating conversion for ${referralId}:`, error.message);
  }
}

async function updateReferralStatus(referralId, status) {
  try {
    const response = await axios.post(GADGET_API_URL, {
      query: `
        mutation {
          updateBusinessReferral(
            id: "${referralId}",
            businessReferral: {
              conversionStatus: "${status}"
            }
          ) {
            businessReferral {
              id
              conversionStatus
            }
          }
        }
      `
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      }
    });

    if (response.data.data?.updateBusinessReferral?.businessReferral) {
      console.log(`✅ Updated status for referral ${referralId}: ${status}`);
    }
  } catch (error) {
    console.log(`❌ Error updating status for ${referralId}:`, error.message);
  }
}

async function checkExistingReferrals() {
  try {
    const response = await axios.post(GADGET_API_URL, {
      query: `
        query {
          businessReferrals(
            first: 10,
            filter: { businessDomain: { equals: "godislove.lt" } }
          ) {
            edges {
              node {
                id
                referralId
                businessDomain
                utmSource
                utmMedium
                utmCampaign
                conversionStatus
                conversionValue
                clickedAt
              }
            }
          }
        }
      `
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      }
    });

    const referrals = response.data.data?.businessReferrals?.edges || [];
    console.log(`\n📊 Current referrals for godislove.lt: ${referrals.length}`);
    
    if (referrals.length > 0) {
      referrals.forEach(({ node }) => {
        console.log(`- ${node.referralId}: ${node.conversionStatus} (€${node.conversionValue || 0})`);
      });
    } else {
      console.log('No existing referrals found.');
    }
  } catch (error) {
    console.log('Error checking existing referrals:', error.message);
  }
}

// Run the script
async function main() {
  console.log('🔍 Checking existing referrals...');
  await checkExistingReferrals();
  
  console.log('\n🚀 Creating test referrals...');
  await createTestReferrals();
  
  console.log('\n🔍 Checking updated referrals...');
  await checkExistingReferrals();
}

main().catch(console.error);
