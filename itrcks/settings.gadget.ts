import type { GadgetSettings } from "gadget-server";

export const settings: GadgetSettings = {
  type: "gadget/settings/v1",
  frameworkVersion: "v1.4.0",
  plugins: {
    connections: {
      shopify: {
        apiVersion: "2025-07",
        enabledModels: [
          "shopifyCheckout",
          "shopifyCustomer",
          "shopifyOrder",
          "shopifyProduct",
        ],
        type: "partner",
        scopes: [
          "read_customer_events",
          "read_customers",
          "read_products",
          "write_app_proxy",
          "write_checkouts",
          "write_orders",
          "write_pixels",
        ],
        customerAuthenticationEnabled: false,
      },
      openai: true,
    },
  },
};
