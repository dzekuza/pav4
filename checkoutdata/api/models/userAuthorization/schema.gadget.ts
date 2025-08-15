import type { GadgetModel } from "gadget-server";

// This file describes the schema for the "userAuthorization" model, go to https://checkoutdata.gadget.app/edit to view/edit your model in Gadget
// For more information on how to update this file http://docs.gadget.dev

export const schema: GadgetModel = {
  type: "gadget/model-schema/v1",
  storageKey: "bSIMF1Uc6lAE",
  comment:
    "This model tracks user authorization and consent for business tracking, storing essential information about merchant identity, tracking status, and consent details.",
  fields: {
    businessDomain: { type: "string", storageKey: "YvzOnDmYPWQR" },
    consentGivenAt: {
      type: "dateTime",
      includeTime: true,
      validations: { required: true },
      storageKey: "38lI-QsFyrlz",
    },
    consentUpdatedAt: {
      type: "dateTime",
      includeTime: true,
      storageKey: "LBLp4Xdq3HSq",
    },
    consentVersion: { type: "string", storageKey: "wYtzPIXqbpM0" },
    ipAddress: { type: "string", storageKey: "IeKYiGaHDHgQ" },
    isTrackingEnabled: {
      type: "boolean",
      default: true,
      storageKey: "pEOWzQcwDhYw",
    },
    merchantEmail: {
      type: "email",
      validations: { required: true },
      storageKey: "7TXwLDEXrZFF",
    },
    merchantName: { type: "string", storageKey: "-FPV5AxHlsAr" },
    notificationPreferences: {
      type: "json",
      storageKey: "01YucORL05sV",
    },
    revokedAt: {
      type: "dateTime",
      includeTime: true,
      storageKey: "r9BT52ralx3d",
    },
    revokedReason: { type: "string", storageKey: "lFqNlMLsdTjU" },
    shop: {
      type: "belongsTo",
      validations: { required: true },
      parent: { model: "shopifyShop" },
      storageKey: "fz97GbzxB27r",
    },
    trackingId: {
      type: "string",
      validations: { required: true, unique: true },
      storageKey: "ktpzwjx22TBW",
    },
    trackingScope: {
      type: "enum",
      default: "full",
      acceptMultipleSelections: false,
      acceptUnlistedOptions: false,
      options: ["basic", "full", "analytics_only"],
      storageKey: "rrzs7UyKnMtY",
    },
    userAgent: { type: "string", storageKey: "-3i-uex16QVA" },
  },
};
