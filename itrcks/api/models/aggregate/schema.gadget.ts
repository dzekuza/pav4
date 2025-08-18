import type { GadgetModel } from "gadget-server";

// This file describes the schema for the "aggregate" model, go to https://itrcks.gadget.app/edit to view/edit your model in Gadget
// For more information on how to update this file http://docs.gadget.dev

export const schema: GadgetModel = {
  type: "gadget/model-schema/v1",
  storageKey: "EueosGSWRLNr",
  fields: {
    date: {
      type: "dateTime",
      includeTime: true,
      validations: { required: true },
      storageKey: "UuMB9rk2x4K0::72O1tcaNikMI",
    },
    productViews: {
      type: "number",
      validations: { required: true },
      storageKey: "6GN0I3H2oWx7::tzlJQGTupAI7",
    },
    sessions: {
      type: "number",
      validations: { required: true },
      storageKey: "7BN7a4tVFaRP::8N4P4OCPkCqo",
    },
    shop: {
      type: "belongsTo",
      parent: { model: "shopifyShop" },
      storageKey: "N7HRBUWUhn9K::nSJVAmbxlA3v",
    },
  },
};
