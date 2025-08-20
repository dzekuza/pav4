import React from 'react';
import { EventsDashboard } from '../components/EventsDashboard';

export default function EventsTest() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Events Dashboard Test</h1>
        <p className="text-muted-foreground">
          Testing events data for shop: checkoutipick.myshopify.com (ID: 91283456333)
        </p>
      </div>
      
      <EventsDashboard 
        shopId="91283456333"
        shopDomain="checkoutipick.myshopify.com"
      />
    </div>
  );
}
