export default function Privacy() {
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 20px", fontFamily: "sans-serif", lineHeight: 1.6 }}>
      <h1>Privacy Policy</h1>
      <p><strong>Hide Invoice for non-B2B</strong> — Shopify App</p>
      <p>Last updated: March 2026</p>

      <h2>1. Data We Collect</h2>
      <p>
        This app stores only a single shop-level metafield containing the app configuration
        (enabled status and payment method name). No personal customer data is collected or stored.
      </p>

      <h2>2. How We Use Data</h2>
      <p>
        The metafield is used exclusively to configure which payment methods are hidden during
        checkout for non-B2B customers. It is not shared with any third party.
      </p>

      <h2>3. Data Retention</h2>
      <p>
        The metafield is stored on your Shopify store and is automatically removed when you
        uninstall the app. No data is retained on our servers after uninstallation.
      </p>

      <h2>4. GDPR Compliance</h2>
      <p>
        This app complies with the GDPR mandatory webhook requirements:
      </p>
      <ul>
        <li><strong>Customer Data Request:</strong> We hold no personal customer data. Upon request, we confirm this to the shop owner.</li>
        <li><strong>Customer Redact:</strong> No customer data to redact.</li>
        <li><strong>Shop Redact:</strong> Upon uninstallation, all configuration data is removed.</li>
      </ul>

      <h2>5. Contact</h2>
      <p>
        For privacy-related inquiries, contact us at:{" "}
        <a href="mailto:max.wieber@kleberkompass.de">max.wieber@kleberkompass.de</a>
      </p>
    </div>
  );
}
