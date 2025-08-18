import type { GadgetModel } from "gadget-server";

// This file describes the schema for the "shopifyProduct" model, go to https://itrcks.gadget.app/edit to view/edit your model in Gadget
// For more information on how to update this file http://docs.gadget.dev

export const schema: GadgetModel = {
  type: "gadget/model-schema/v1",
  storageKey: "DataModel-Shopify-Product",
  fields: {
    spiciness: {
      type: "number",
      shopifyMetafield: {
        privateMetafield: false,
        namespace: "product_attributes",
        key: "spiciness",
        metafieldType: "number_integer",
        allowMultipleEntries: false,
      },
      storageKey: "37005iYm9cHc::YjXXsSmdYzKJ",
    },
  },
  shopify: {
    fields: [
      "body",
      "category",
      "compareAtPriceRange",
      "handle",
      "hasVariantsThatRequiresComponents",
      "productCategory",
      "productType",
      "publishedAt",
      "shop",
      "shopifyCreatedAt",
      "shopifyUpdatedAt",
      "status",
      "tags",
      "templateSuffix",
      "title",
      "vendor",
    ],
  },
};
