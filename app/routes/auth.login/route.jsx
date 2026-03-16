import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { useLoaderData } from "react-router";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  return { shop };
};

export default function Auth() {
  const { shop } = useLoaderData();

  return (
    <AppProvider embedded={false}>
      <s-page>
        <s-section heading="Open this app from Shopify">
          <s-card>
            <s-paragraph>
              This app is designed to be launched from the Shopify admin as an embedded app.
            </s-paragraph>
            {shop ? (
              <s-paragraph>
                Shop: <strong>{shop}</strong>
              </s-paragraph>
            ) : (
              <s-paragraph>
                No shop context was provided. Please open the app from your Shopify admin Apps list.
              </s-paragraph>
            )}
          </s-card>
        </s-section>
      </s-page>
    </AppProvider>
  );
}
