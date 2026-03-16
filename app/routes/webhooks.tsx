import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
const { shop, topic, payload, admin } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook from ${shop}`);

  switch (topic) {
    case "CUSTOMERS_DATA_REQUEST":
      console.log(`No customer data stored. Responding to data request for shop: ${shop}`);
      break;
    case "CUSTOMERS_REDACT":
      console.log(`No customer data stored. Ignoring redaction request for shop: ${shop}`);
      break;
    case "SHOP_REDACT":
      console.log(`No shop data stored. Acknowledging shop deletion request for shop: ${shop}`);
      break;
    case "APP_UNINSTALLED": {
      console.log(`App uninstalled from shop: ${shop}`);
      if (admin) {
        const shopResponse = await admin.graphql(`#graphql
          query { shop { id } }
        `);
        const { data } = await shopResponse.json();
        if (data?.shop?.id) {
          await admin.graphql(
            `#graphql
            mutation DeletePaymentRuleMetafield($ownerId: ID!) {
              metafieldDelete(input: { ownerId: $ownerId, namespace: "$app", key: "payment_rule" }) {
                deletedId
              }
            }`,
            { variables: { ownerId: data.shop.id } }
          );
        }
      }
      break;
    }
    default:
      console.warn(`Unhandled webhook topic: ${topic}`);
      return new Response("Unhandled webhook topic", { status: 400 });
  }

  return new Response();
};
