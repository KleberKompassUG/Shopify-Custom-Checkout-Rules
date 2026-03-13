import "@shopify/shopify-app-react-router/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
} from "@shopify/shopify-app-react-router/server";
import { MemorySessionStorage } from "@shopify/shopify-app-session-storage-memory";

const FUNCTION_ID = "4f8a281d-8599-ed4f-dd32-1297c2872b96939fbf00";

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.July25,
  scopes: process.env.SCOPES?.split(","),
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: new MemorySessionStorage(),
  distribution: AppDistribution.AppStore,

  webhooks: {
    APP_UNINSTALLED: {
      deliveryMethod: "http",
      callbackUrl: "/webhooks/app/uninstalled",
    },
  },

  hooks: {
    afterAuth: async ({ admin }) => {

      // Prüfen ob Regel schon existiert
      const existing = await admin.graphql(`
        {
          paymentCustomizations(first: 10) {
            nodes {
              id
              title
            }
          }
        }
      `);

      const existingJson = await existing.json();

      const alreadyExists =
        existingJson.data.paymentCustomizations.nodes.find(
          (c) => c.title === "Custom Checkout Rules"
        );

      if (alreadyExists) {
        console.log("Payment rule already exists");
        return;
      }

      // Regel erstellen
      const response = await admin.graphql(
        `
        mutation activateRule($functionId: String!) {
          paymentCustomizationCreate(
            paymentCustomization: {
              title: "Custom Checkout Rules"
              enabled: true
              functionId: $functionId
            }
          ) {
            paymentCustomization {
              id
            }
            userErrors {
              message
            }
          }
        }
        `,
        {
          variables: {
            functionId: FUNCTION_ID,
          },
        }
      );

      const json = await response.json();

      console.log("Payment rule created", json);
    },
  },

  future: {
    expiringOfflineAccessTokens: true,
  },

  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

export default shopify;
export const apiVersion = ApiVersion.July25;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;