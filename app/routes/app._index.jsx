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
  const shop = json.data?.shop;
  const shopName = shop?.name ?? "your store";
  const metafieldValue = shop?.metafield?.value ?? null;

  let config = { enabled: false, paymentMethodNameIncludes: "Cash on Delivery" };
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
    <s-page heading="Hide Invoice for non B2B">
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

      <s-section heading="Current rule status">
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
              <strong>Activate Rule</strong>: Click on Configure payment rule, add the payment method name (e.g. "Cash on delivery") you want to hide and activate the rule.
            </s-list-item>
            <s-list-item>
              <strong>Test Case 1</strong>: place two test checkouts (one with company field filled, one without) and check if the desired payment method is hidden or not.
            </s-list-item>
            <s-list-item>
              <strong>Test Case 2</strong>: place two test checkouts (one with customer tag "b2b", one without) and check if the desired payment method is hidden or not.
            </s-list-item>
          </s-unordered-list>
        </s-card>
      </s-section>
      <s-section slot="aside" heading="Need Support?">
        <s-card>
          <s-paragraph>
            <strong>Contact</strong>: <s-link href="mailto:max.wieber@kleberkompass.de">max.wieber@kleberkompass.de</s-link>
          </s-paragraph>
          <s-paragraph>
            <strong>Response time</strong>: within 1 business day
          </s-paragraph>
        </s-card>
      </s-section>
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
