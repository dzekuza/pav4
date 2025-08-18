import type { GadgetModel } from "gadget-server";

// This file describes the schema for the "order" model, go to https://itrcks.gadget.app/edit to view/edit your model in Gadget
// For more information on how to update this file http://docs.gadget.dev

export const schema: GadgetModel = {
  type: "gadget/model-schema/v1",
  storageKey: "STpcM3Jr7nCH",
  fields: {
    click: {
      type: "belongsTo",
      parent: { model: "click" },
      storageKey: "nkFJca6tXVGX::Ed6rQe8LED8L",
    },
    currency: {
      type: "string",
      validations: { required: true },
      storageKey: "aSEcoqDA_5P5::h0eMwduh1YFh",
    },
    orderId: {
      type: "string",
      validations: { required: true, unique: true },
      storageKey: "bEDGWxsykx7U::PuYgXuTSz5qW",
    },
    session: {
      type: "belongsTo",
      parent: { model: "session" },
      storageKey: "EMQ3wrM_RVo6::Yuch5yAHD2dg",
    },
    shop: {
      type: "belongsTo",
      parent: { model: "shopifyShop" },
      storageKey: "FOpfKH4AWM9Y::rHYdvKGnJKvy",
    },
    totalPrice: {
      type: "number",
      validations: { required: true },
      storageKey: "JWA2W4aZibfR::U1SBRSLdh8Mb",
    },
  },
};
