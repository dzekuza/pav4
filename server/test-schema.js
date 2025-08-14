import fetch from 'node-fetch';

// Development environment configuration
const GADGET_API_URL = 'https://checkoutdata--development.gadget.app/api/graphql';
const API_KEY = 'gsk-BDE2GN4ftPEmRdMHVaRqX7FrWE7DVDEL';

async function checkSchema() {
  console.log('🔍 Checking GraphQL Schema...');
  console.log('API URL:', GADGET_API_URL);
  console.log('');

  try {
    const response = await fetch(GADGET_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        query: `
          query IntrospectionQuery {
            __schema {
              queryType {
                name
                fields {
                  name
                  type {
                    name
                  }
                }
              }
            }
          }
        `
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      throw new Error(result.errors[0].message);
    }

    console.log('Available queries:');
    result.data.__schema.queryType.fields.forEach(field => {
      console.log(`- ${field.name}: ${field.type.name}`);
    });

  } catch (error) {
    console.error('❌ Schema check failed:', error.message);
    console.error('Full error:', error);
  }
}

checkSchema();
