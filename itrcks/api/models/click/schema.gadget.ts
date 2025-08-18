import type { GadgetModel } from "gadget-server";

// This file describes the schema for the "click" model, go to https://itrcks.gadget.app/edit to view/edit your model in Gadget
// For more information on how to update this file http://docs.gadget.dev

export const schema: GadgetModel = {
  type: "gadget/model-schema/v1",
  storageKey: "13eiYVnEqvES",
  fields: {
    clickId: {
      type: "string",
      validations: { required: true, unique: true },
      storageKey: "dS-QaUcCVFOV::PKt6P6_RaU4g",
    },
    destinationUrl: {
      type: "url",
      validations: { required: true },
      storageKey: "NqmRDiddTnq5::zIs09NDSmfGE",
    },
    ipAddress: {
      type: "string",
      validations: { required: true },
      storageKey: "WBoZYZD5r36u::0Q1WibY4Qduh",
    },
    shop: {
      type: "belongsTo",
      parent: { model: "shopifyShop" },
      storageKey: "WM1qeSUji6kU::sdTjk79XmA_o",
    },
    userAgent: {
      type: "string",
      validations: { required: true },
      storageKey: "Rlf3do63RJLd::7bCVU8NkFLg2",
    },
  },
};
