export async function gadgetFetch<T>(query: string, variables?: Record<string, any>): Promise<T> {
  const endpoint = process.env.GADGET_GRAPHQL_ENDPOINT!;
  const body = JSON.stringify({ query, variables });

  let lastErr: any;
  for (const delay of [0, 250, 500, 1000]) {
    if (delay) await new Promise(r => setTimeout(r, delay));
    
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.GADGET_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body,
      });
      
      const json = await res.json();
      if (res.ok && !json.errors) return json as T;
      lastErr = json.errors ?? json;
    } catch (error) {
      lastErr = error;
    }
  }
  
  throw new Error(`Gadget GraphQL error: ${JSON.stringify(lastErr)}`);
}
