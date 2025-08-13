// Shopify Web Pixel using official Web Pixels API
// This pixel can be installed via Shopify's Web Pixels feature
import {register} from '@shopify/web-pixels-extension';

register(({analytics}) => {
  // Configuration
  const config = {
    apiUrl: "https://pavlo4.netlify.app/.netlify/functions/track-event",
    businessId: "2", // Default business ID
    affiliateId: "aff_godislovel_1755091745057_n7ccoo", // Default affiliate ID
    apiKey: "16272754ed68cbdcb55e8f579703d92e"
  };

  // Extract business ID and affiliate ID from URL parameters
  function extractBusinessId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('business_id') || 
           urlParams.get('utm_source') || 
           config.businessId;
  }

  function extractAffiliateId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('affiliate_id') || 
           urlParams.get('utm_medium') || 
           config.affiliateId;
  }

  // Send tracking data to our API
  function sendTrackingData(eventType, data) {
    const businessId = extractBusinessId();
    const affiliateId = extractAffiliateId();
    
    const trackingData = {
      event_type: eventType,
      business_id: businessId,
      affiliate_id: affiliateId,
      platform: "shopify",
      session_id: `webpixel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_agent: navigator.userAgent,
      referrer: document.referrer,
      timestamp: Date.now(),
      url: window.location.href,
      page_title: document.title,
      data: {
        ...data,
        shop_domain: window.location.hostname,
        source: "shopify-web-pixel"
      }
    };

    console.log(`[Shopify Web Pixel] Sending ${eventType} event:`, trackingData);

    // Send to our API
    fetch(config.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${config.apiKey}`
      },
      body: JSON.stringify(trackingData),
      keepalive: true // Important for checkout events
    })
    .then(response => {
      if (response.ok) {
        console.log(`[Shopify Web Pixel] ${eventType} event sent successfully`);
        return response.json();
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    })
    .catch(error => {
      console.error(`[Shopify Web Pixel] Failed to send ${eventType} event:`, error);
      
      // Fallback: try image beacon
      try {
        const params = new URLSearchParams({
          event_type: eventType,
          business_id: businessId,
          affiliate_id: affiliateId,
          timestamp: Date.now().toString(),
          url: window.location.href,
          data: JSON.stringify(data)
        });
        
        const img = new Image();
        img.src = `${config.apiUrl}?${params.toString()}`;
        console.log(`[Shopify Web Pixel] Event sent via image beacon`);
      } catch (e) {
        console.error(`[Shopify Web Pixel] Image beacon failed:`, e);
      }
    });
  }

  // Track page viewed events
  analytics.subscribe('page_viewed', (event) => {
    console.log('[Shopify Web Pixel] Page viewed event:', event);
    
    sendTrackingData('page_view', {
      page_title: event.data.page.title,
      page_url: event.data.page.url,
      page_type: event.data.page.type,
      referrer: event.data.page.referrer
    });
  });

  // Track product viewed events
  analytics.subscribe('product_viewed', (event) => {
    console.log('[Shopify Web Pixel] Product viewed event:', event);
    
    const product = event.data.product;
    sendTrackingData('product_view', {
      product_id: product.id,
      product_name: product.title,
      price: product.price?.amount,
      currency: product.price?.currencyCode,
      vendor: product.vendor,
      product_type: product.productType,
      tags: product.tags,
      variants: product.variants?.length || 0
    });
  });

  // Track cart viewed events
  analytics.subscribe('cart_viewed', (event) => {
    console.log('[Shopify Web Pixel] Cart viewed event:', event);
    
    const cart = event.data.cart;
    sendTrackingData('cart_view', {
      cart_id: cart.id,
      total_price: cart.totalPrice?.amount,
      currency: cart.totalPrice?.currencyCode,
      item_count: cart.lineItems?.length || 0,
      items: cart.lineItems?.map(item => ({
        product_id: item.product?.id,
        variant_id: item.variant?.id,
        title: item.title,
        quantity: item.quantity,
        price: item.cost?.totalAmount?.amount
      }))
    });
  });

  // Track product added to cart events
  analytics.subscribe('product_added_to_cart', (event) => {
    console.log('[Shopify Web Pixel] Product added to cart event:', event);
    
    const product = event.data.product;
    const variant = event.data.variant;
    
    sendTrackingData('add_to_cart', {
      product_id: product.id,
      product_name: product.title,
      variant_id: variant.id,
      variant_title: variant.title,
      price: variant.price?.amount,
      currency: variant.price?.currencyCode,
      quantity: event.data.quantity,
      cart_id: event.data.cart?.id
    });
  });

  // Track checkout started events
  analytics.subscribe('checkout_started', (event) => {
    console.log('[Shopify Web Pixel] Checkout started event:', event);
    
    const checkout = event.data.checkout;
    sendTrackingData('checkout_start', {
      checkout_id: checkout.id,
      total_price: checkout.totalPrice?.amount,
      currency: checkout.totalPrice?.currencyCode,
      item_count: checkout.lineItems?.length || 0,
      email: checkout.email,
      phone: checkout.phone
    });
  });

  // Track checkout completed events (most important!)
  analytics.subscribe('checkout_completed', (event) => {
    console.log('[Shopify Web Pixel] Checkout completed event:', event);
    
    const checkout = event.data.checkout;
    
    // Extract order information
    const orderData = {
      checkout_id: checkout.id,
      order_id: checkout.order?.id,
      total_price: checkout.totalPrice?.amount,
      currency: checkout.totalPrice?.currencyCode,
      subtotal_price: checkout.subtotalPrice?.amount,
      total_tax: checkout.totalTax?.amount,
      total_discounts: checkout.totalDiscounts?.amount,
      item_count: checkout.lineItems?.length || 0,
      email: checkout.email,
      phone: checkout.phone,
      customer_id: checkout.customer?.id
    };

    // Extract line items
    if (checkout.lineItems) {
      orderData.items = checkout.lineItems.map(item => ({
        product_id: item.product?.id,
        variant_id: item.variant?.id,
        title: item.title,
        quantity: item.quantity,
        price: item.cost?.totalAmount?.amount,
        discount: item.discountAllocations?.[0]?.amount
      }));
    }

    // Extract discount codes
    if (checkout.discountApplications) {
      orderData.discount_codes = checkout.discountApplications
        .filter(discount => discount.type === 'DISCOUNT_CODE')
        .map(discount => discount.title);
    }

    // Extract payment information
    if (checkout.transactions) {
      orderData.payment_transactions = checkout.transactions.map(transaction => ({
        payment_gateway: transaction.gateway,
        amount: transaction.amount?.amount,
        currency: transaction.amount?.currencyCode,
        status: transaction.status
      }));
    }

    // Extract shipping information
    if (checkout.shippingAddress) {
      orderData.shipping_address = {
        country: checkout.shippingAddress.country,
        province: checkout.shippingAddress.province,
        city: checkout.shippingAddress.city,
        zip: checkout.shippingAddress.zip
      };
    }

    sendTrackingData('purchase_complete', orderData);
  });

  // Track checkout address info submitted
  analytics.subscribe('checkout_address_info_submitted', (event) => {
    console.log('[Shopify Web Pixel] Checkout address info submitted:', event);
    
    const checkout = event.data.checkout;
    sendTrackingData('checkout_address_submitted', {
      checkout_id: checkout.id,
      email: checkout.email,
      phone: checkout.phone,
      has_shipping_address: !!checkout.shippingAddress,
      has_billing_address: !!checkout.billingAddress
    });
  });

  // Track checkout shipping info submitted
  analytics.subscribe('checkout_shipping_info_submitted', (event) => {
    console.log('[Shopify Web Pixel] Checkout shipping info submitted:', event);
    
    const checkout = event.data.checkout;
    sendTrackingData('checkout_shipping_submitted', {
      checkout_id: checkout.id,
      shipping_method: checkout.shippingLine?.title,
      shipping_price: checkout.shippingLine?.price?.amount
    });
  });

  // Track payment info submitted
  analytics.subscribe('payment_info_submitted', (event) => {
    console.log('[Shopify Web Pixel] Payment info submitted:', event);
    
    const checkout = event.data.checkout;
    sendTrackingData('checkout_payment_submitted', {
      checkout_id: checkout.id,
      payment_gateway: checkout.transactions?.[0]?.gateway
    });
  });

  // Track collection viewed events
  analytics.subscribe('collection_viewed', (event) => {
    console.log('[Shopify Web Pixel] Collection viewed event:', event);
    
    const collection = event.data.collection;
    sendTrackingData('collection_view', {
      collection_id: collection.id,
      collection_title: collection.title,
      collection_handle: collection.handle,
      product_count: collection.productsCount
    });
  });

  // Track search submitted events
  analytics.subscribe('search_submitted', (event) => {
    console.log('[Shopify Web Pixel] Search submitted event:', event);
    
    sendTrackingData('search_submitted', {
      search_term: event.data.searchTerm,
      search_results_count: event.data.searchResultsCount
    });
  });

  console.log('[Shopify Web Pixel] Web pixel registered successfully');
});
