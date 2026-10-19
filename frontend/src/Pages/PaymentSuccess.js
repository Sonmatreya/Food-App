import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { API_URL } from "../config/api";
import { useCart } from "../context/CartContext";
import "../Styles/PaymentSuccess.css";

function PaymentSuccess() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { clearCart } = useCart();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const loadOrder = async () => {
      try {
        if (params.get("payment") !== "success") {
          throw new Error("Payment confirmation could not be verified from this link.");
        }
        const response = await fetch(`${API_URL}/api/orders/${orderId}`, {
          method: "GET",
          credentials: "include",
        });
        const data = await response.json();
        if (!response.ok || !data.success || !data.order) {
          throw new Error(data.message || "We couldn't load your order confirmation.");
        }
        if (String(data.order.paymentStatus || "").toLowerCase() !== "paid") {
          throw new Error("Your payment is not marked as paid yet. Please check your order status before trying again.");
        }
        if (active) {
          setOrder(data.order);
          clearCart();
          // Match the original checkout journey: show Payment Successful briefly,
          // then continue automatically to the full Order Placed Successfully page.
          window.setTimeout(() => {
            navigate(`/order-success/${orderId}?payment=success`, { replace: true });
          }, 2200);
        }
      } catch (err) {
        if (active) setError(err.message || "Unable to verify your payment.");
      } finally {
        if (active) setLoading(false);
      }
    };
    loadOrder();
    return () => { active = false; };
  }, [orderId, params, clearCart, navigate]);

  if (loading) {
    return <main className="paymentSuccessPage"><div className="paymentSuccessCard"><div className="paymentSuccessSpinner" /><h1>Confirming your payment</h1><p>Please wait while we verify your order.</p></div></main>;
  }

  if (error || !order) {
    return <main className="paymentSuccessPage"><div className="paymentSuccessCard"><div className="paymentSuccessWarning">!</div><h1>Payment confirmation unavailable</h1><p>{error || "We couldn't load this order."}</p><Link className="paymentSuccessSecondary" to="/payment-history">View payment history</Link><Link className="paymentSuccessTextLink" to="/menu">Back to menu</Link></div></main>;
  }

  const amount = Number(order.pricing?.grandTotal || 0);
  const orderRef = order.orderNumber || order._id || order.id || orderId;

  return (
    <main className="paymentSuccessPage">
      <section className="paymentSuccessCard" aria-labelledby="payment-success-title">
        <div className="paymentSuccessIcon" aria-hidden="true"><span>✓</span></div>
        <p className="paymentSuccessEyebrow">PAYMENT CONFIRMED</p>
        <h1 id="payment-success-title">Payment Successful!</h1>
        <p className="paymentSuccessLead">Your payment has been verified. Your food order is now confirmed.</p>
        <div className="paymentSuccessAmount"><span>Amount paid</span><strong>₹{amount.toLocaleString("en-IN", {minimumFractionDigits:2, maximumFractionDigits:2})}</strong></div>
        <div className="paymentSuccessReference"><span>Order reference</span><strong>{orderRef}</strong></div>
        <div className="paymentSuccessBadge"><span>✓</span> Payment status: Paid</div>
        <Link className="paymentSuccessPrimary" to={`/order-success/${orderId}?payment=success`}>View Order Details <span aria-hidden="true">→</span></Link>
        <Link className="paymentSuccessTextLink" to="/menu">Continue browsing menu</Link>
        <p className="paymentSuccessNote">Keep your order reference for future support.</p>
      </section>
    </main>
  );
}

export default PaymentSuccess;
