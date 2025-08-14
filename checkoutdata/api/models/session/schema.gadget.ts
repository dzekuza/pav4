import type { GadgetModel } from "gadget-server";

// This file describes the schema for the "session" model, go to https://checkoutdata.gadget.app/edit to view/edit your model in Gadget
// For more information on how to update this file http://docs.gadget.dev

export const schema: GadgetModel = {
  type: "gadget/model-schema/v1",
  storageKey: "1Pe2Y0mH2vhc",
  fields: {
    roles: {
      type: "roleList",
      default: ["unauthenticated"],
      storageKey: "Ioreug7INIif",
    },
  },
  shopify: { fields: ["shop", "shopifySID"] },
};
