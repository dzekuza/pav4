import type { GadgetPermissions } from "gadget-server";

/**
 * This metadata describes the access control configuration available in your application.
 * Grants that are not defined here are set to false by default.
 *
 * View and edit your roles and permissions in the Gadget editor at https://itrcks.gadget.app/edit/settings/permissions
 */
export const permissions: GadgetPermissions = {
  type: "gadget/permissions/v1",
  roles: {
    "shopify-app-users": {
      storageKey: "Role-Shopify-App",
      default: {
        read: true,
        action: true,
      },
      models: {
        aggregate: {
          read: {
            filter: "accessControl/filters/shopify/aggregate.gelly",
          },
          actions: {
            create: true,
            delete: true,
            update: true,
          },
        },
        click: {
          read: {
            filter: "accessControl/filters/shopify/click.gelly",
          },
          actions: {
            create: true,
            delete: true,
            update: true,
          },
        },
        event: {
          read: {
            filter: "accessControl/filters/shopify/event.gelly",
          },
          actions: {
            create: true,
            delete: true,
            update: true,
          },
        },
        order: {
          read: {
            filter: "accessControl/filters/shopify/order.gelly",
          },
          actions: {
            create: true,
            delete: true,
            update: true,
          },
        },
        shopifyCheckout: {
          read: {
            filter:
              "accessControl/filters/shopify/shopifyCheckout.gelly",
          },
          actions: {
            create: true,
            delete: true,
            update: true,
          },
        },
        shopifyCustomer: {
          read: {
            filter:
              "accessControl/filters/shopify/shopifyCustomer.gelly",
          },
        },
        shopifyGdprRequest: {
          read: {
            filter:
              "accessControl/filters/shopify/shopifyGdprRequest.gelly",
          },
          actions: {
            create: true,
            update: true,
          },
        },
        shopifyOrder: {
          read: {
            filter:
              "accessControl/filters/shopify/shopifyOrder.gelly",
          },
          actions: {
            create: true,
            delete: true,
            update: true,
          },
        },
        shopifyProduct: {
          read: {
            filter:
              "accessControl/filters/shopify/shopifyProduct.gelly",
          },
        },
        shopifyShop: {
          read: {
            filter: "accessControl/filters/shopify/shopifyShop.gelly",
          },
          actions: {
            install: true,
            reinstall: true,
            uninstall: true,
            update: true,
          },
        },
        shopifySync: {
          read: {
            filter: "accessControl/filters/shopify/shopifySync.gelly",
          },
          actions: {
            abort: true,
            complete: true,
            error: true,
            run: true,
          },
        },
      },
    },
    unauthenticated: {
      storageKey: "unauthenticated",
      models: {
        event: {
          actions: {
            create: true,
          },
        },
      },
    },
    API: {
      storageKey: "ekrzERck1lEz",
      models: {
        aggregate: {
          read: true,
        },
      },
    },
    "external-api": {
      storageKey: "external-api",
      models: {
        aggregate: {
          read: {
            filter:
              "accessControl/filters/aggregate/external-api-read.gelly",
          },
        },
        click: {
          read: {
            filter:
              "accessControl/filters/click/external-api-read.gelly",
          },
        },
        event: {
          read: {
            filter:
              "accessControl/filters/event/external-api-read.gelly",
          },
        },
        order: {
          read: {
            filter:
              "accessControl/filters/order/external-api-read.gelly",
          },
        },
        shopifyOrder: {
          read: {
            filter:
              "accessControl/filters/shopifyOrder/external-api-read.gelly",
          },
        },
        shopifyProduct: {
          read: {
            filter:
              "accessControl/filters/shopifyProduct/external-api-read.gelly",
          },
        },
        shopifyShop: {
          read: {
            filter:
              "accessControl/filters/shopifyShop/external-api-read.gelly",
          },
        },
      },
    },
  },
};
