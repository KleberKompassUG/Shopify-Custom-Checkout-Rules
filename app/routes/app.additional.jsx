import { useLocation } from "react-router";

export default function AdditionalPage() {
  const location = useLocation();
  const search = location.search || "";

  return (
    <s-page heading="Help & documentation">
      <s-section heading="About this app">
        <s-card>
          <s-paragraph>
            <strong>Custom Checkout Rules</strong> lets you hide specific payment methods at checkout based on the
            customer context (for example, B2B eligibility) and the shipping address company field.
          </s-paragraph>
          <s-paragraph>
            The app runs as a Shopify <strong>Payment Customization Function</strong>. Settings are stored per shop
            in a Shop metafield.
          </s-paragraph>
        </s-card>
      </s-section>

      <s-section heading="Quick start (recommended)">
        <s-card>
          <s-unordered-list>
            <s-list-item>
              <strong>Open</strong>{" "}
              <s-link href={`/app/rules/payment${search}`}>Payment rule</s-link> and enable the rule.
            </s-list-item>
            <s-list-item>
              <strong>Set</strong> “Payment method name contains” to match the payment method you want to hide (for
              example: “Invoice”, “Rechnung”, “Purchase order”).
            </s-list-item>
            <s-list-item>
              <strong>Test</strong> two checkouts:
              <s-unordered-list>
                <s-list-item>
                  Customer without tag + empty company → payment method should be hidden
                </s-list-item>
                <s-list-item>
                  Customer with tag OR company filled → payment method should be available
                </s-list-item>
              </s-unordered-list>
            </s-list-item>
          </s-unordered-list>
        </s-card>
      </s-section>

      <s-section heading="FAQ">
        <s-card>
          <s-unordered-list>
            <s-list-item>
              <strong>Which customer tag is used?</strong> Currently the app checks for the <code>b2b</code> tag.
            </s-list-item>
            <s-list-item>
              <strong>Which address field is checked?</strong> The rule treats the checkout as eligible when the
              shipping address <code>company</code> field is not empty.
            </s-list-item>
            <s-list-item>
              <strong>What if the payment method name differs per language?</strong> Use a substring that matches
              your store’s configured payment method label in checkout.
            </s-list-item>
            <s-list-item>
              <strong>Why do I need to approve permissions after an update?</strong> If the app requests additional
              API scopes (for example, to store settings), Shopify requires re-authorization.
            </s-list-item>
          </s-unordered-list>
        </s-card>
      </s-section>

      <s-section heading="Troubleshooting">
        <s-card>
          <s-unordered-list>
            <s-list-item>
              <strong>Settings won’t save</strong>: confirm the app has <code>read_metafields</code> and{" "}
              <code>write_metafields</code> access, then re-open the app in the Shopify admin to accept new
              permissions.
            </s-list-item>
            <s-list-item>
              <strong>Rule doesn’t apply</strong>: make sure the Payment Customization is enabled in Shopify admin
              and the payment method name matches exactly (substring match).
            </s-list-item>
            <s-list-item>
              <strong>Rule applies when it shouldn’t</strong>: verify the customer tag and whether the checkout
              shipping address company field is populated.
            </s-list-item>
          </s-unordered-list>
        </s-card>
      </s-section>

      <s-section slot="aside" heading="Support">
        <s-card>
          <s-paragraph>
            <strong>Contact</strong>: <s-link href="mailto:support@example.com">support@example.com</s-link>
          </s-paragraph>
          <s-paragraph>
            <strong>Response time</strong>: within 2 business days (placeholder)
          </s-paragraph>
        </s-card>
      </s-section>

      <s-section slot="aside" heading="Privacy & data">
        <s-card>
          <s-paragraph>
            <strong>Data stored</strong>: rule settings are stored in a Shop metafield (app namespace).
          </s-paragraph>
          <s-paragraph>
            <strong>Customer data</strong>: the function evaluates customer tags and the checkout address company
            field at runtime to decide whether to hide a payment method.
          </s-paragraph>
          <s-paragraph>
            <strong>Placeholder policy</strong>: replace this section with your real privacy policy and data
            handling details before publishing.
          </s-paragraph>
        </s-card>
      </s-section>
    </s-page>
  );
}
