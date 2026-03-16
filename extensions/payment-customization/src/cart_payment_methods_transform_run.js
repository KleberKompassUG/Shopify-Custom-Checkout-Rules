// @ts-check

/**
 * @typedef {import("../generated/api").CartPaymentMethodsTransformRunInput} CartPaymentMethodsTransformRunInput
 * @typedef {import("../generated/api").CartPaymentMethodsTransformRunResult} CartPaymentMethodsTransformRunResult
 */

const NO_CHANGES = {
  operations: [],
};

/**
 * @param {CartPaymentMethodsTransformRunInput} input
 * @returns {CartPaymentMethodsTransformRunResult}
 */
export function cartPaymentMethodsTransformRun(input) {

  /** @type {{ enabled?: boolean, paymentMethodNameIncludes?: string } | null} */
  let config = null;

  const rawConfig =
    input.shop?.metafield?.value ??
    input.shop?.metafield?.jsonValue ??
    null;

  if (typeof rawConfig === "string") {
    try {
      config = JSON.parse(rawConfig);
    } catch (_error) {
      config = null;
    }
  } else if (rawConfig && typeof rawConfig === "object") {
    config = rawConfig;
  }

  const enabled = config?.enabled ?? true;
  const paymentMethodNameIncludes =
    typeof config?.paymentMethodNameIncludes === "string" &&
    config.paymentMethodNameIncludes.trim() !== ""
      ? config.paymentMethodNameIncludes.trim()
      : "Rechnung";

  if (!enabled) {
    return NO_CHANGES;
  }

  const isB2B = input.cart?.buyerIdentity?.customer?.hasAnyTag ?? false;

  const company =
    input.cart?.deliveryGroups?.[0]?.deliveryAddress?.company ?? "";

  const hasCompany = company.trim() !== "";

  const allowInvoice = isB2B || hasCompany;

  console.error("enabled", enabled);
  console.error("paymentMethodNameIncludes", paymentMethodNameIncludes);


  // Wenn Kunde NICHT B2B ist → Rechnung verstecken
  if (!allowInvoice) {

    const invoiceMethod = input.paymentMethods
      .find(method => method.name.includes(paymentMethodNameIncludes));

    if (!invoiceMethod) {
      return NO_CHANGES;
    }

    return {
      operations: [{
        paymentMethodHide: {
          paymentMethodId: invoiceMethod.id
        }
      }]
    };
  }

  return NO_CHANGES;
}