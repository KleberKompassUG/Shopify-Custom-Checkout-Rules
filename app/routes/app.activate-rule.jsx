import { useEffect, useState } from "react";
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
  const [toggleChecked, setToggleChecked] = useState(Boolean(config.enabled));

  const isSubmitting =
    navigation.state === "submitting" || fetcher.state === "submitting";

  const pendingConfig =
    fetcher.state === "idle" && fetcher.data?.config
      ? fetcher.data.config
      : config;

  useEffect(() => {
    setToggleChecked(Boolean(pendingConfig.enabled));
  }, [pendingConfig.enabled]);

  const errorMessage =
    fetcher.state === "idle" && fetcher.data?.ok === false
      ? fetcher.data?.error || "Failed to save settings"
      : null;

  return (
    <s-page heading="Checkout rule settings">
      <s-section heading="B2B invoice rule">
        <s-card>
          <fetcher.Form
            method="post"
            key={JSON.stringify(pendingConfig)}
          >
            <s-layout>
              <s-layout-section>
                {errorMessage ? (
                  <div
                    style={{
                      padding: 12,
                      borderRadius: 8,
                      border: "1px solid #FED3D1",
                      background: "#FFF4F4",
                      color: "#8E1F0B",
                      marginBottom: 12,
                    }}
                    role="alert"
                  >
                    {errorMessage}
                  </div>
                ) : null}

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>Rule aktiv</div>
                    <div style={{ fontSize: 12, color: "#6d7175", marginTop: 2 }}>
                      Versteckt die definierte Zahlungsart für Nicht‑B2B Kunden ohne Firma im Checkout.
                    </div>
                  </div>

                  <label style={{ display: "inline-flex", alignItems: "center", cursor: isSubmitting ? "default" : "pointer" }}>
                    <input
                      type="checkbox"
                      name="enabled"
                      checked={toggleChecked}
                      onChange={(e) => setToggleChecked(e.currentTarget.checked)}
                      disabled={isSubmitting}
                      style={{
                        position: "absolute",
                        opacity: 0,
                        width: 1,
                        height: 1,
                      }}
                    />
                    <span
                      aria-hidden="true"
                      style={{
                        width: 44,
                        height: 24,
                        borderRadius: 999,
                        background: toggleChecked ? "#008060" : "#C9CCCF",
                        position: "relative",
                        transition: "background 120ms ease",
                        display: "inline-block",
                      }}
                    >
                      <span
                        style={{
                          position: "absolute",
                          top: 3,
                          left: toggleChecked ? 23 : 3,
                          width: 18,
                          height: 18,
                          borderRadius: 999,
                          background: "#ffffff",
                          transition: "left 120ms ease",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
                        }}
                      />
                    </span>
                  </label>
                </div>

                <div style={{ marginTop: 16 }}>
                  <label style={{ display: "block", fontWeight: 500, marginBottom: 4 }}>
                    Payment method name contains
                  </label>
                  <input
                    type="text"
                    name="paymentMethodNameIncludes"
                    defaultValue={pendingConfig.paymentMethodNameIncludes}
                    style={{ width: "100%", padding: "8px 10px" }}
                  />
                  <p style={{ marginTop: 4, fontSize: 12, color: "#6d7175" }}>
                    The payment method whose name contains this text will be hidden unless the
                    customer is B2B or has a company set on the shipping address.
                  </p>
                </div>

                <div style={{ marginTop: 16 }}>
                  <label style={{ display: "block", fontWeight: 500, marginBottom: 4 }}>
                    Customer tag used
                  </label>
                  <input
                    type="text"
                    name="customerTag"
                    defaultValue="b2b"
                    disabled
                    style={{ width: "100%", padding: "8px 10px", background: "#f6f6f7" }}
                  />
                  <p style={{ marginTop: 4, fontSize: 12, color: "#6d7175" }}>
                    The B2B customer tag is currently fixed to “b2b” in this version of the app.
                  </p>
                </div>
              </s-layout-section>

              <s-layout-section>
                <button
                  type="submit"
                  style={{
                    padding: "8px 16px",
                    borderRadius: 4,
                    border: "none",
                    backgroundColor: "#008060",
                    color: "#ffffff",
                    fontWeight: 500,
                    cursor: isSubmitting ? "default" : "pointer",
                    opacity: isSubmitting ? 0.6 : 1,
                  }}
                  disabled={isSubmitting}
                >
                  Save settings
                </button>
              </s-layout-section>
            </s-layout>
          </fetcher.Form>
        </s-card>
      </s-section>
    </s-page>
  );
}