import { boundary } from "@shopify/shopify-app-react-router/server";
import { redirect } from "react-router";
import { authenticate } from "../shopify.server";


const FUNCTION_ID = "4f8a281d-8599-ed4f-dd32-1297c2872b96939fbf00";

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);

  // prüfen ob Regel existiert
  const existing = await admin.graphql(`
    {
      paymentCustomizations(first: 10) {
        nodes {
          id
          title
        }
      }
    }
  `);

  const existingJson = await existing.json();

  const alreadyExists = existingJson.data.paymentCustomizations.nodes.find(
    (c) => c.title === "Custom Checkout Rules"
  );

  if (!alreadyExists) {
    await admin.graphql(
      `
      mutation activateRule($functionId: String!) {
        paymentCustomizationCreate(
          paymentCustomization: {
            title: "Custom Checkout Rules"
            enabled: true
            functionId: $functionId
          }
        ) {
          paymentCustomization {
            id
          }
        }
      }
    `,
      {
        variables: {
          functionId: FUNCTION_ID,
        },
      }
    );
  }

  return redirect(`/app?shop=${session.shop}`);
};

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
