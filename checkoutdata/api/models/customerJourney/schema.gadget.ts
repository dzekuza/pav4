import type { GadgetModel } from "gadget-server";

// This file describes the schema for the "customerJourney" model, go to https://checkoutdata.gadget.app/edit to view/edit your model in Gadget
// For more information on how to update this file http://docs.gadget.dev

export const schema: GadgetModel = {
  type: "gadget/model-schema/v1",
  storageKey: "Ux3nXfEBwawD",
  comment:
    "This model tracks the customer's journey from initial visit to final purchase, providing insights into user behavior and interactions with the shop.",
  fields: {
    browserName: { type: "string", storageKey: "-cfk9KNIRTm-" },
    businessReferral: {
      type: "belongsTo",
      parent: { model: "businessReferral" },
      storageKey: "2cPBb70ncL68",
    },
    cartValue: {
      type: "number",
      decimals: 2,
      storageKey: "QEwrao4QNHHd",
    },
    checkoutId: { type: "string", storageKey: "XwVwE134eL0F" },
    country: { type: "string", storageKey: "Ykkwmh61rHXw" },
    deviceType: { type: "string", storageKey: "1JKblgKmpMZI" },
    discountCode: { type: "string", storageKey: "snMS89nlVKh4" },
    discountValue: {
      type: "number",
      decimals: 2,
      storageKey: "fWdmxlPpJ51o",
    },
    email: { type: "email", storageKey: "mls4Si2hyIka" },
    eventData: { type: "json", storageKey: "PlAipChq3I1T" },
    eventType: {
      type: "enum",
      acceptMultipleSelections: false,
      acceptUnlistedOptions: false,
      options: [
        "visit",
        "page_view",
        "product_view",
        "add_to_cart",
        "remove_from_cart",
        "checkout_start",
        "checkout_step",
        "checkout_complete",
        "purchase",
        "discount_applied",
        "exit_intent",
        "bounce",
      ],
      validations: { required: true },
      storageKey: "2gqg4wtaqP8q",
    },
    ipAddress: { type: "string", storageKey: "ENww9GExW4cC" },
    orderId: { type: "string", storageKey: "yqVIARMomypu" },
    pageTitle: { type: "string", storageKey: "h7LHBX5wNdUb" },
    pageUrl: { type: "url", storageKey: "Iz1rO3EJ6wGP" },
    productId: { type: "string", storageKey: "Z1XriUUGhcFZ" },
    productName: { type: "string", storageKey: "giwHzdyVHRUa" },
    productPrice: {
      type: "number",
      decimals: 2,
      storageKey: "qkn4h2jhT2yK",
    },
    referrerUrl: { type: "url", storageKey: "k8u2DhneKlQL" },
    sessionId: {
      type: "string",
      validations: { required: true },
      storageKey: "9muQZV6FvyIT",
    },
    shop: {
      type: "belongsTo",
      validations: { required: true },
      parent: { model: "shopifyShop" },
      storageKey: "BIqqE5vIYTsr",
    },
    timestamp: {
      type: "dateTime",
      includeTime: true,
      validations: { required: true },
      storageKey: "vJewVkbE3gmc",
    },
    userId: { type: "string", storageKey: "iwhzpd1ISmnG" },
    utmCampaign: { type: "string", storageKey: "8C46aNYwTh2Y" },
    utmMedium: { type: "string", storageKey: "bIWUxlm-N_sT" },
    utmSource: { type: "string", storageKey: "TWrZ_85FwAO9" },
  },
};
