import { authenticate } from "../shopify.server";

export const action = async ({ request }) => {
  const { shop, session, topic } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  // No-op cleanup: sessions are stored in app session storage.
  // Avoid throwing during webhook processing (review blocker).
  void session;

  return new Response();
};
