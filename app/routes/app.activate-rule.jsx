import { useEffect, useState } from "react";
import { useLoaderData, useNavigation } from "react-router";
import { useFetcher } from "react-router";
import { authenticate } from "../shopify.server";

const DEFAULT_CONFIG = {
  enabled: true,
  paymentMethodNameIncludes: "Rechnung",
};

const PAYMENT_CUSTOMIZATION_TITLE = "Custom Checkout Rules";
const PAYMENT_FUNCTION_HANDLE = "payment-customization";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  if (url.pathname === "/app/activate-rule") {
    return Response.redirect(`/app/rules/payment${url.search}`, 302);
  }

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
      paymentCustomizations(first: 50) {
        nodes {
          id
          title
          enabled
        }
      }
    }
  `,
  );

  const json = await response.json();
  const metafield = json.data?.shop?.metafield;
  const paymentCustomizations = json.data?.paymentCustomizations?.nodes ?? [];
  const currentCustomization =
    paymentCustomizations.find((c) => c?.title === PAYMENT_CUSTOMIZATION_TITLE) ??
    null;

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
    customization: currentCustomization
      ? {
          id: currentCustomization.id,
          enabled: Boolean(currentCustomization.enabled),
          title: currentCustomization.title,
        }
      : null,
  };
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();

  const intent = (formData.get("intent") || "save").toString();

  if (intent === "ensure_customization") {
    const listResponse = await admin.graphql(
      `#graphql
      query ListPaymentCustomizations {
        paymentCustomizations(first: 50) {
          nodes {
            id
            title
            enabled
          }
        }
      }
    `,
    );
    const listJson = await listResponse.json();
    const nodes = listJson.data?.paymentCustomizations?.nodes ?? [];
    const existing =
      nodes.find((c) => c?.title === PAYMENT_CUSTOMIZATION_TITLE) ?? null;

    if (!existing) {
      const createResponse = await admin.graphql(
        `#graphql
        mutation CreatePaymentCustomization($title: String!, $functionHandle: String!) {
          paymentCustomizationCreate(
            paymentCustomization: {
              title: $title
              enabled: true
              functionHandle: $functionHandle
            }
          ) {
            paymentCustomization {
              id
              enabled
              title
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
            title: PAYMENT_CUSTOMIZATION_TITLE,
            functionHandle: PAYMENT_FUNCTION_HANDLE,
          },
        },
      );

      const createJson = await createResponse.json();
      const userErrors =
        createJson.data?.paymentCustomizationCreate?.userErrors ?? [];

      if (userErrors.length > 0) {
        return Response.json(
          {
            ok: false,
            error: userErrors.map((e) => e.message).join(", "),
          },
          { status: 400 },
        );
      }

      return Response.json({
        ok: true,
        customization:
          createJson.data.paymentCustomizationCreate.paymentCustomization,
      });
    }

    if (existing.enabled) {
      return Response.json({ ok: true, customization: existing });
    }

    const updateResponse = await admin.graphql(
      `#graphql
      mutation EnablePaymentCustomization($id: ID!) {
        paymentCustomizationUpdate(
          id: $id
          paymentCustomization: { enabled: true }
        ) {
          paymentCustomization {
            id
            enabled
            title
          }
          userErrors {
            field
            message
          }
        }
      }
    `,
      { variables: { id: existing.id } },
    );

    const updateJson = await updateResponse.json();
    const updateErrors =
      updateJson.data?.paymentCustomizationUpdate?.userErrors ?? [];

    if (updateErrors.length > 0) {
      return Response.json(
        {
          ok: false,
          error: updateErrors.map((e) => e.message).join(", "),
        },
        { status: 400 },
      );
    }

    return Response.json({
      ok: true,
      customization:
        updateJson.data.paymentCustomizationUpdate.paymentCustomization,
    });
  }

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
  const loaderData = useLoaderData();
  const config = loaderData?.config ?? DEFAULT_CONFIG;
  const customization = loaderData?.customization ?? null;
  const fetcher = useFetcher();
  const customizationFetcher = useFetcher();
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

  const customizationError =
    customizationFetcher.state === "idle" &&
    customizationFetcher.data?.ok === false
      ? customizationFetcher.data?.error || "Failed to activate customization"
      : null;

  return (
    <s-page heading="Payment rule">
      <s-section heading="B2B invoice rule">
        <s-card>
          {!customization || customization.enabled === false ? (
            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  padding: 12,
                  borderRadius: 8,
                  border: "1px solid #E1E3E5",
                  background: "#F6F6F7",
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 4 }}>
                  Payment customization status
                </div>
                <div style={{ fontSize: 12, color: "#6d7175", marginBottom: 10 }}>
                  {customization
                    ? "A customization exists but is currently disabled."
                    : "No payment customization exists yet for this app."}
                </div>

                {customizationError ? (
                  <div style={{ fontSize: 12, color: "#8E1F0B", marginBottom: 10 }}>
                    {customizationError}
                  </div>
                ) : null}

                <customizationFetcher.Form method="post">
                  <input type="hidden" name="intent" value="ensure_customization" />
                  <s-button submit loading={customizationFetcher.state !== "idle"}>
                    {customization ? "Enable" : "Create & enable"}
                  </s-button>
                </customizationFetcher.Form>
              </div>
            </div>
          ) : null}

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
                    <div style={{ fontWeight: 600 }}>Rule active</div>
                    <div style={{ fontSize: 12, color: "#6d7175", marginTop: 2 }}>
                    Hides the defined payment method for non-B2B customers without a company name in the checkout.
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

                <div style={{ marginTop: 16, maxWidth: 520 }}>
                  <label style={{ display: "block", fontWeight: 500, marginBottom: 4 }}>
                    Payment method name contains
                  </label>
                  <input
                    type="text"
                    name="paymentMethodNameIncludes"
                    defaultValue={pendingConfig.paymentMethodNameIncludes}
                    style={{
                      width: "100%",
                      maxWidth: "100%",
                      boxSizing: "border-box",
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: "1px solid #c9cccf",
                      background: "#ffffff",
                      fontSize: 14,
                      lineHeight: "20px",
                    }}
                  />
                  <p style={{ marginTop: 4, fontSize: 12, color: "#6d7175" }}>
                    The payment method whose name contains this text will be hidden unless the
                    customer is B2B or has a company set on the shipping address.
                  </p>
                </div>

                <div style={{ marginTop: 16, maxWidth: 520 }}>
                  <label style={{ display: "block", fontWeight: 500, marginBottom: 4 }}>
                    Customer tag used
                  </label>
                  <input
                    type="text"
                    name="customerTag"
                    defaultValue="b2b"
                    disabled
                    style={{
                      width: "100%",
                      maxWidth: "100%",
                      boxSizing: "border-box",
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: "1px solid #e1e3e5",
                      background: "#f6f6f7",
                      color: "#6d7175",
                      fontSize: 14,
                      lineHeight: "20px",
                    }}
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