import { useFetcher } from "react-router";
import { authenticate } from "../shopify.server";

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  // Function ID holen
  const functionResponse = await admin.graphql(`
    {
      shopifyFunctions(first: 10) {
        nodes {
          id
          title
        }
      }
    }
  `);

  const functionJson = await functionResponse.json();

  const paymentFunction = functionJson.data.shopifyFunctions.nodes.find(
    f => f.title.includes("payment")
  );

  const functionId = paymentFunction.id;

  // Payment Rule erstellen
  const response = await admin.graphql(`
    mutation createPaymentCustomization($functionId: String!) {
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
        userErrors {
          message
        }
      }
    }
  `, {
    variables: { functionId }
  });

  const jsonResponse = await response.json();

  return Response.json(jsonResponse);
};

export default function ActivateRule() {
  const fetcher = useFetcher();

  return (
    <div style={{padding:20}}>
      <h1>Activate Checkout Rule</h1>

      <fetcher.Form method="post">
        <button type="submit">
          Activate Payment Rule
        </button>
      </fetcher.Form>

      {fetcher.data && (
        <pre>{JSON.stringify(fetcher.data, null, 2)}</pre>
      )}
    </div>
  );
}