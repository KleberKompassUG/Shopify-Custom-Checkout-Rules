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

  const isB2B = input.cart?.buyerIdentity?.customer?.hasAnyTag ?? false;

  const company =
    input.cart?.deliveryGroups?.[0]?.deliveryAddress?.company ?? "";

  const hasCompany = company.trim() !== "";

  const allowInvoice = isB2B || hasCompany;


  // Wenn Kunde NICHT B2B ist → Rechnung verstecken
  if (!allowInvoice) {

    const invoiceMethod = input.paymentMethods
      .find(method => method.name.includes("Rechnung"));

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