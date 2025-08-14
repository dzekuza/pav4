import type { GadgetModel } from "gadget-server";

// This file describes the schema for the "businessReferral" model, go to https://checkoutdata.gadget.app/edit to view/edit your model in Gadget
// For more information on how to update this file http://docs.gadget.dev

export const schema: GadgetModel = {
  type: "gadget/model-schema/v1",
  storageKey: "D0GGme9R8Zr8",
  comment:
    "This model tracks user referrals from the ipick.io price comparison app to business websites, allowing us to monitor the success of our referrals and conversions.",
  fields: {
    businessDomain: {
      type: "string",
      validations: { required: true },
      storageKey: "7mVJqirfnCnn",
    },
    clickedAt: {
      type: "dateTime",
      includeTime: true,
      validations: { required: true },
      storageKey: "xKMQiROl7DNT",
    },
    conversionStatus: {
      type: "enum",
      default: "pending",
      acceptMultipleSelections: false,
      acceptUnlistedOptions: false,
      options: ["pending", "converted", "abandoned"],
      storageKey: "8IcuWR6Lnc7y",
    },
    conversionValue: {
      type: "number",
      decimals: 2,
      storageKey: "Ry5bt8eC4nL7",
    },
    productName: { type: "string", storageKey: "GNj9jEzKZ86R" },
    referralId: {
      type: "string",
      validations: { required: true, unique: true },
      storageKey: "LNQsBy5ICFAi",
    },
    shop: {
      type: "belongsTo",
      validations: { required: true },
      parent: { model: "shopifyShop" },
      storageKey: "84SyO4TDHxqE",
    },
    sourceUrl: { type: "url", storageKey: "SJPI7EMazJ8N" },
    targetUrl: {
      type: "url",
      validations: { required: true },
      storageKey: "J_hVwbUdszLD",
    },
    userId: { type: "string", storageKey: "zU4yq-kvVnxr" },
    utmCampaign: {
      type: "string",
      validations: { required: true },
      storageKey: "358fzRhb6sly",
    },
    utmMedium: {
      type: "string",
      validations: { required: true },
      storageKey: "jd6BDKP9Kki8",
    },
    utmSource: {
      type: "string",
      validations: { required: true },
      storageKey: "XK5XrBGGbuIY",
    },
  },
};
