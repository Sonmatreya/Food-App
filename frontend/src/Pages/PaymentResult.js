import React from "react";
import { Link, useSearchParams } from "react-router-dom";

function PaymentResult() {
  const [params] = useSearchParams();
  const status = params.get("status");
  const isFailed = status !== "success";

  return (
    <main style={{ maxWidth: 680, margin: "70px auto", padding: "28px 20px", textAlign: "center" }}>
      <div style={{ fontSize: 52 }} aria-hidden="true">{isFailed ? "⚠️" : "✓"}</div>
      <h1>{isFailed ? "Payment was not completed" : "Payment successful"}</h1>
      <p>{isFailed
        ? "The PayU test checkout did not complete successfully. The order remains unpaid. No live payment was processed."
        : "Your PayU test payment was confirmed."}</p>
      <p>You can return to your cart and try the test checkout again.</p>
      <Link to="/cart" style={{ display: "inline-block", marginTop: 16, padding: "12px 20px", borderRadius: 10, background: "#222", color: "#fff", textDecoration: "none" }}>
        Return to Cart
      </Link>
    </main>
  );
}

export default PaymentResult;
