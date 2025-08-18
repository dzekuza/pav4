import type { GadgetModel } from "gadget-server";

// This file describes the schema for the "event" model, go to https://itrcks.gadget.app/edit to view/edit your model in Gadget
// For more information on how to update this file http://docs.gadget.dev

export const schema: GadgetModel = {
  type: "gadget/model-schema/v1",
  storageKey: "FyEfSvWQhZe7",
  fields: {
    cartToken: { type: "string", storageKey: "ppLQahWwnd-6" },
    checkoutId: { type: "string", storageKey: "kknLhr8rYudb" },
    click: {
      type: "belongsTo",
      parent: { model: "click" },
      storageKey: "dba9gq3ggW2e::PUVoRVIVRddp",
    },
    currency: { type: "string", storageKey: "OYuVN09TrC4v" },
    eventType: {
      type: "enum",
      acceptMultipleSelections: false,
      acceptUnlistedOptions: false,
      options: [
        "page_view",
        "product_view",
        "add_to_cart",
        "begin_checkout",
        "checkout_abandoned",
        "checkout_completed",
      ],
      validations: { required: true },
      storageKey: "JK6UAkUKoNWF::6qSDnF3pN0EG",
    },
    ipAddress: { type: "string", storageKey: "MGbaNiqmZo3F" },
    occurredAt: {
      type: "dateTime",
      includeTime: true,
      validations: { required: true },
      storageKey: "HuCwJLwfycYg",
    },
    orderId: { type: "string", storageKey: "Qvpqq6fJGiQo" },
    path: {
      type: "string",
      validations: { required: true },
      storageKey: "52h9LoNCZUGo::d6rBcIDl2HNT",
    },
    productId: {
      type: "string",
      storageKey: "m1zM3ZqY1TNw::ZmYrkmSKNzPq",
    },
    quantity: {
      type: "number",
      decimals: 0,
      storageKey: "u-NQjC8CiTBi",
    },
    rawData: { type: "json", storageKey: "pQVTDM2T8_eo" },
    sessionId: {
      type: "string",
      validations: { required: true },
      storageKey: "87ApcgZzPi2J",
    },
    shop: {
      type: "belongsTo",
      parent: { model: "shopifyShop" },
      storageKey: "45X5SRmOUaf8::LhY_Ht4AcL-D",
    },
    userAgent: { type: "string", storageKey: "2IKtGxta6BVi" },
    value: {
      type: "number",
      decimals: 2,
      storageKey: "ul8lzadeUWoA",
    },
    variantId: {
      type: "string",
      storageKey: "rpQCo29GFMSX::jeSHawFW4iR8",
    },
  },
};
