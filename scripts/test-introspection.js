// Introspect Gadget schema
const GADGET_GRAPHQL_ENDPOINT = "https://itrcks--development.gadget.app/api/graphql";
const GADGET_API_KEY = "gsk-wXJiwmtZkpHt9tHrfFHEYerLkK3B44Wn";

const introspectionQuery = `
  query IntrospectionQuery {
    __schema {
      queryType {
        name
        fields {
          name
          type {
            name
            kind
            ofType {
              name
              kind
            }
          }
        }
      }
      types {
        name
        kind
        fields {
          name
          type {
            name
            kind
            ofType {
              name
              kind
            }
          }
        }
      }
    }
  }
`;

async function introspectSchema() {
  try {
    console.log("Introspecting Gadget schema...");
    
    const response = await fetch(GADGET_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GADGET_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: introspectionQuery
      })
    });

    const data = await response.json();
    
    if (data.errors) {
      console.error("Introspection errors:", data.errors);
    } else if (data.data) {
      console.log("Available query fields:");
      data.data.__schema.queryType.fields.forEach(field => {
        console.log(`  - ${field.name}: ${field.type.name || field.type.ofType?.name}`);
      });
      
      console.log("\nAvailable types:");
      data.data.__schema.types
        .filter(type => type.name && type.name.includes('Event') || type.name.includes('Order') || type.name.includes('Aggregate') || type.name.includes('Click'))
        .forEach(type => {
          console.log(`\n${type.name} (${type.kind}):`);
          if (type.fields) {
            type.fields.forEach(field => {
              console.log(`  - ${field.name}: ${field.type.name || field.type.ofType?.name}`);
            });
          }
        });
    }

  } catch (error) {
    console.error("Introspection error:", error.message);
  }
}

introspectSchema();
