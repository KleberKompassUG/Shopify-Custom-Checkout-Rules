import { redirect, Form, useLoaderData } from "react-router";
import { login } from "../../shopify.server";
import styles from "./styles.module.css";

export const loader = async ({ request }) => {
  const url = new URL(request.url);

  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  return { showForm: Boolean(login) };
};

export default function App() {
  const { showForm } = useLoaderData();

  return (
    <div className={styles.index}>
      <div className={styles.content}>
        <h1 className={styles.heading}>Hide Payment Methods for Non-B2B Customers</h1>
        <p className={styles.text}>
          Control which payment methods appear at checkout based on your customer's B2B status.
        </p>
        {showForm && (
          <Form className={styles.form} method="post" action="/auth/login">
            <label className={styles.label}>
              <span>Shop domain</span>
              <input className={styles.input} type="text" name="shop" />
              <span>e.g: my-shop-domain.myshopify.com</span>
            </label>
            <button className={styles.button} type="submit">
              Log in
            </button>
          </Form>
        )}
        <ul className={styles.list}>
          <li>
            <strong>B2B-aware checkout</strong>. Automatically hide or show payment methods based on whether a customer is a verified B2B buyer.
          </li>
          <li>
            <strong>No code required</strong>. Configure your rules directly from the Shopify admin — no theme changes needed.
          </li>
          <li>
            <strong>Powered by Shopify Functions</strong>. Runs natively at checkout for fast, reliable payment method filtering.
          </li>
        </ul>
      </div>
    </div>
  );
}
