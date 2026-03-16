import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  console.log("Webhook hit:", request.method, request.url);
  console.log("HMAC header:", request.headers.get("x-shopify-hmac-sha256"));
  const { shop, topic, payload } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook from ${shop}`);

  switch (topic) {
    case "customers/data_request":
      console.log(`No customer data stored. Responding to data request for shop: ${shop}`);
      break;
    case "customers/redact":
      console.log(`No customer data stored. Ignoring redaction request for shop: ${shop}`);
      break;
    case "shop/redact":
      console.log(`No shop data stored. Acknowledging shop deletion request for shop: ${shop}`);
      break;
    default:
      console.warn(`Unhandled webhook topic: ${topic}`);
      return new Response("Unhandled webhook topic", { status: 400 });
  }

  return new Response();
};
