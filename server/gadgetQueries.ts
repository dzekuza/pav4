export const GET_EVENTS = /* GraphQL */ `
  query GetEvents($first: Int, $after: String, $filter: [EventFilter!]) {
    events(first: $first, after: $after, filter: $filter) {
      edges {
        node {
          id
          sessionId
          eventType
          path
          productId
          variantId
          quantity
          value
          currency
          occurredAt
          userAgent
          ipAddress
          click { id clickId destinationUrl }
          shop { id domain }
        }
        cursor
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

export const GET_ORDERS = /* GraphQL */ `
  query GetOrders($first: Int, $after: String, $filter: [OrderFilter!]) {
    orders(first: $first, after: $after, filter: $filter) {
      edges {
        node {
          id
          orderId
          totalPrice
          currency
          createdAt
          sessionId
          click { id clickId destinationUrl }
          shop { id domain }
        }
        cursor
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

export const GET_AGGREGATES = /* GraphQL */ `
  query GetAggregates($first: Int, $after: String, $filter: [AggregateFilter!]) {
    aggregates(first: $first, after: $after, filter: $filter, sort: { date: Descending }) {
      edges {
        node {
          id
          date
          sessions
          productViews
          createdAt
          updatedAt
          shop { id domain }
        }
        cursor
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

export const GET_CLICKS = /* GraphQL */ `
  query GetClicks($first: Int, $after: String, $filter: [ClickFilter!]) {
    clicks(first: $first, after: $after, filter: $filter) {
      edges {
        node {
          id
          clickId
          destinationUrl
          ipAddress
          userAgent
          createdAt
          shop { id domain }
        }
        cursor
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;
