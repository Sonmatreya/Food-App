import React from "react";
import { Link, useSearchParams } from "react-router-dom";

function PaymentResult() {
  const [params] = useSearchParams();
  const status = params.get("status");
  const isFailed = status !== "success";
  const orderId = params.get("orderId");
  const hasOrderId = Boolean(orderId && /^[a-f0-9]{24}$/i.test(orderId));

  return (
    <main style={{ maxWidth: 680, margin: "70px auto", padding: "28px 20px", textAlign: "center" }}>
      <div style={{ fontSize: 52 }} aria-hidden="true">{isFailed ? "⚠️" : "✓"}</div>
      <h1>{isFailed ? "Payment was not completed" : "Payment successful"}</h1>
      <p>{isFailed
        ? "The PayU test checkout did not complete successfully. The order remains unpaid. No live payment was processed."
        : "Your PayU test payment was confirmed."}</p>
      {isFailed ? (
        <>
          <p>Your order may still appear in My Orders. Check its payment status before attempting checkout again to avoid placing a duplicate order.</p>
          {hasOrderId && (
            <Link to={`/order-success/${orderId}`} style={{ display: "inline-block", marginTop: 16, padding: "12px 20px", borderRadius: 10, background: "#e31837", color: "#fff", textDecoration: "none" }}>
              View Order Status
            </Link>
          )}
          <div>
            <Link to="/profile" style={{ display: "inline-block", marginTop: 12, padding: "10px 16px", color: "inherit" }}>
              Go to My Orders
            </Link>
          </div>
        </>
      ) : (
        <Link to="/menu" style={{ display: "inline-block", marginTop: 16, padding: "12px 20px", borderRadius: 10, background: "#222", color: "#fff", textDecoration: "none" }}>
          Continue to Menu
        </Link>
      )}
    </main>
  );
}

export default PaymentResult;
