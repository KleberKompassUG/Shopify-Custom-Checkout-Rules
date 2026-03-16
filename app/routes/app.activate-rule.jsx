import { useLoaderData, useNavigation } from "react-router";
import { useFetcher } from "react-router";
import { authenticate } from "../shopify.server";

const DEFAULT_CONFIG = {
  enabled: true,
  paymentMethodNameIncludes: "Rechnung",
};

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(
    `#graphql
    query AppRuleConfig {
      shop {
        id
        metafield(namespace: "$app", key: "payment_rule") {
          value
        }
      }
    }
  `,
  );

  const json = await response.json();
  const metafield = json.data?.shop?.metafield;

  let config = DEFAULT_CONFIG;

  if (metafield?.value) {
    try {
      const parsed = JSON.parse(metafield.value);
      config = {
        ...DEFAULT_CONFIG,
        ...parsed,
      };
    } catch (_error) {
      config = DEFAULT_CONFIG;
    }
  }

  return {
    shopId: json.data?.shop?.id ?? null,
    config,
  };
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();

  const enabled = formData.get("enabled") === "on";
  const paymentMethodNameIncludes =
    (formData.get("paymentMethodNameIncludes") || "").toString().trim() ||
    DEFAULT_CONFIG.paymentMethodNameIncludes;

  const config = {
    enabled,
    paymentMethodNameIncludes,
  };

  const shopResponse = await admin.graphql(
    `#graphql
    query GetShopId {
      shop {
        id
      }
    }
  `,
  );

  const shopJson = await shopResponse.json();
  const shopId = shopJson.data?.shop?.id;

  if (!shopId) {
    return Response.json(
      { ok: false, error: "Unable to resolve shop id" },
      { status: 500 },
    );
  }

  const metafieldsResponse = await admin.graphql(
    `#graphql
    mutation SetRuleMetafield($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields {
          id
        }
        userErrors {
          field
          message
        }
      }
    }
  `,
    {
      variables: {
        metafields: [
          {
            ownerId: shopId,
            namespace: "$app",
            key: "payment_rule",
            type: "json",
            value: JSON.stringify(config),
          },
        ],
      },
    },
  );

  const metafieldsJson = await metafieldsResponse.json();
  const userErrors = metafieldsJson.data?.metafieldsSet?.userErrors || [];

  if (userErrors.length > 0) {
    return Response.json(
      {
        ok: false,
        error: userErrors.map((e) => e.message).join(", "),
      },
      { status: 400 },
    );
  }

  return Response.json({ ok: true, config });
};

export default function ActivateRule() {
  const { config } = useLoaderData();
  const fetcher = useFetcher();
  const navigation = useNavigation();

  const isSubmitting =
    navigation.state === "submitting" || fetcher.state === "submitting";

  const pendingConfig =
    fetcher.state === "idle" && fetcher.data?.config
      ? fetcher.data.config
      : config;

  return (
    <s-page heading="Checkout rule settings">
      <s-section heading="B2B invoice rule">
        <s-card>
          <fetcher.Form method="post">
            <s-layout>
              <s-layout-section>
                <s-checkbox
                  name="enabled"
                  label="Enable rule"
                  defaultChecked={Boolean(pendingConfig.enabled)}
                />

                <s-text-field
                  label="Payment method name contains"
                  name="paymentMethodNameIncludes"
                  defaultValue={pendingConfig.paymentMethodNameIncludes}
                  helpText="The payment method whose name contains this text will be hidden unless the customer is B2B or has a company set on the shipping address."
                />

                <s-text-field
                  label="Customer tag used"
                  name="customerTag"
                  defaultValue="b2b"
                  disabled
                  helpText="The B2B customer tag is currently fixed to “b2b” in this version of the app."
                />
              </s-layout-section>

              <s-layout-section>
                <s-button submit loading={isSubmitting}>
                  Save settings
                </s-button>
              </s-layout-section>
            </s-layout>
          </fetcher.Form>
        </s-card>
      </s-section>
    </s-page>
  );
}