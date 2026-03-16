import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { useLoaderData, useLocation } from "react-router";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(
    `#graphql
    query OverviewConfig {
      shop {
        name
        metafield(namespace: "$app", key: "payment_rule") {
          value
        }
      }
    }
  `,
  );

  const json = await response.json();
  const shopName = json.data?.shop?.name ?? "your store";
  const metafieldValue = json.data?.shop?.metafield?.value ?? null;

  let config = { enabled: true, paymentMethodNameIncludes: "Rechnung" };
  if (typeof metafieldValue === "string" && metafieldValue.trim() !== "") {
    try {
      const parsed = JSON.parse(metafieldValue);
      config = { ...config, ...parsed };
    } catch (_error) {
      // keep defaults
    }
  }

  return { shopName, config };
};

export default function Index() {
  const { shopName, config } = useLoaderData();
  const location = useLocation();
  const search = location.search || "";

  return (
    <s-page heading="Custom Checkout Rules">
      <s-section heading="Overview">
        <s-card>
          <s-layout>
            <s-layout-section>
              <s-paragraph>
                Manage checkout payment method visibility rules for <strong>{shopName}</strong>.
              </s-paragraph>
              <s-paragraph>
                This app uses a Shopify Payment Customization Function to hide a payment method unless the customer
                is eligible (B2B tag) or the checkout address includes a company.
              </s-paragraph>
            </s-layout-section>

            <s-layout-section>
              <s-button href={`/app/rules/payment${search}`}>Configure payment rule</s-button>
            </s-layout-section>
          </s-layout>
        </s-card>
      </s-section>

      <s-section heading="Current status">
        <s-card>
          <s-unordered-list>
            <s-list-item>
              <strong>Rule enabled</strong>: {config.enabled ? "Yes" : "No"}
            </s-list-item>
            <s-list-item>
              <strong>Payment method match</strong>: “{config.paymentMethodNameIncludes || "Rechnung"}”
            </s-list-item>
            <s-list-item>
              <strong>Eligibility</strong>: customer has tag “b2b” OR shipping address company is not empty
            </s-list-item>
          </s-unordered-list>
        </s-card>
      </s-section>

      <s-section slot="aside" heading="Next steps">
        <s-card>
          <s-unordered-list>
            <s-list-item>
              <strong>Test</strong>: place two test checkouts (one with company filled, one without).
            </s-list-item>
            <s-list-item>
              <strong>Security</strong>: settings are stored per shop in a Shop metafield.
            </s-list-item>
            <s-list-item>
              <strong>Publish readiness</strong>: add clear help text, consistent navigation, and predictable behavior.
            </s-list-item>
          </s-unordered-list>
        </s-card>
      </s-section>
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
