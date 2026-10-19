import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { API_URL } from "../config/api";
import { createSocket } from "../config/socket";
import "../Styles/OrderSuccess.css";

const STATUS_TIMELINE = {
  placed: { completed: 0, active: 0 },
  confirmed: { completed: 1, active: 1 },
  preparing: { completed: 1, active: 1 },
  ready: { completed: 2, active: 2 },
  out_for_delivery: { completed: 2, active: 2 },
  delivered: { completed: 4, active: -1 },
  picked_up: { completed: 4, active: -1 },
  cancelled: { completed: 0, active: -1 },
};

const ACTIVE_STATUSES = [
  "placed",
  "confirmed",
  "preparing",
  "ready",
  "out_for_delivery",
];

function OrderSuccess() {
  const { orderId } = useParams();
  const routerLocation = useLocation();
  const { clearCart } = useCart();
  const payuCartCleared = useRef(false);

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [handoverCode, setHandoverCode] = useState("");
  const [enteredHandoverCode, setEnteredHandoverCode] = useState("");
  const [handoverMessage, setHandoverMessage] = useState("");
  const [handoverError, setHandoverError] = useState("");
  const [handoverLoading, setHandoverLoading] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);

  // Fetch the real order from the backend
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/orders/${orderId}`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        let data = {};

        try {
          data = await response.json();
        } catch {
          // Non-JSON response
        }

        if (!response.ok || !data.success || !data.order) {
          setError(
            response.status === 401
              ? "Your session has expired. Please log in again to view your order."
              : data.message ||
                "We could not find your order information."
          );
          setOrder(null);
        } else {
          setOrder(data.order);
          setError("");

          // A query string is not proof of payment: clear the cart only after the API confirms paid status.
          const paymentReturn = new URLSearchParams(routerLocation.search).get("payment") === "success";
          if (paymentReturn && String(data.order.paymentStatus || "").toLowerCase() === "paid" && !payuCartCleared.current) {
            payuCartCleared.current = true;
            clearCart();
          }
        }
      } catch (fetchError) {
        console.error("Fetch order error:", fetchError);

        setError(
          "Unable to reach the server. Please check your connection."
        );
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    } else {
      setError("We could not find your order information.");
      setLoading(false);
    }
  }, [orderId, routerLocation.search, clearCart]);

  const refreshOrder = useCallback(async () => {
    const response = await fetch(
      API_URL + "/api/orders/" + orderId,
      { method: "GET", credentials: "include" }
    );
    const data = await response.json();
    if (!response.ok || !data.success || !data.order) {
      throw new Error(data.message || "Unable to refresh order.");
    }
    setOrder(data.order);
  }, [orderId]);

  // Keep this order page synchronized with admin status changes in real time.
  // The REST refresh on connect also reconciles status changes missed while offline.
  useEffect(() => {
    if (!orderId) return undefined;

    const socket = createSocket();

    const handleConnect = () => {
      setSocketConnected(true);
      refreshOrder().catch((refreshError) => {
        console.error("Order refresh after socket connection failed:", refreshError);
      });
    };

    const handleDisconnect = () => setSocketConnected(false);

    const handleStatusUpdate = (payload) => {
      if (String(payload?.orderId || "") !== String(orderId)) return;

      setOrder((currentOrder) => {
        if (!currentOrder) return currentOrder;
        return {
          ...currentOrder,
          status: payload.status || currentOrder.status,
          statusHistory: Array.isArray(payload.statusHistory)
            ? payload.statusHistory
            : currentOrder.statusHistory,
          updatedAt: payload.updatedAt || currentOrder.updatedAt,
        };
      });
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", (socketError) => {
      setSocketConnected(false);
      console.error("Order status socket error:", socketError.message);
    });
    socket.on("order:status-updated", handleStatusUpdate);
    socket.connect();

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error");
      socket.off("order:status-updated", handleStatusUpdate);
      socket.disconnect();
      setSocketConnected(false);
    };
  }, [orderId, refreshOrder]);

  const handleGenerateHandoverCode = async () => {
    if (handoverLoading) return;
    setHandoverLoading(true);
    setHandoverMessage("");
    setHandoverError("");
    setHandoverCode("");
    try {
      const response = await fetch(
        API_URL + "/api/orders/" + orderId + "/handover-code",
        { method: "POST", credentials: "include" }
      );
      const data = await response.json();
      if (!response.ok || !data.success || !data.handover?.code) {
        throw new Error(data.message || "Unable to generate handover code.");
      }
      setHandoverCode(data.handover.code);
      setHandoverMessage("Show this 6-digit code to " + (isPickup ? "restaurant staff" : "the delivery partner") + ".");
    } catch (handoverError) {
      setHandoverError(handoverError.message);
    } finally {
      setHandoverLoading(false);
    }
  };

  const handleVerifyHandoverCode = async () => {
    if (handoverLoading) return;
    setHandoverLoading(true);
    setHandoverMessage("");
    setHandoverError("");
    try {
      const response = await fetch(
        API_URL + "/api/orders/" + orderId + "/handover-verify",
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: enteredHandoverCode }),
        }
      );
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to verify handover code.");
      }
      setEnteredHandoverCode("");
      setHandoverCode("");
      setHandoverMessage(data.message || "Handover confirmed successfully.");
      await refreshOrder();
    } catch (handoverError) {
      setHandoverError(handoverError.message);
    } finally {
      setHandoverLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="orderSuccessEmpty">
        <div className="orderSuccessEmptyIcon">⏳</div>

        <h1>Loading your order...</h1>

        <p>
          Please wait while we fetch your order details.
        </p>
      </div>
    );
  }

  // Error / not-found state
  if (error || !order) {
    return (
      <div className="orderSuccessEmpty">
        <div className="orderSuccessEmptyIcon">📦</div>

        <h1>Order Information Not Found</h1>

        <p>
          {error ||
            "We could not find your order information. Please place an order first."}
        </p>

        <Link to="/menu">
          <button className="goToMenuButton">
            Browse Menu
          </button>
        </Link>
      </div>
    );
  }

  // Real order data from the backend — aliased so the
  // existing display markup below stays unchanged
  const {
    orderNumber,
    items = [],
    pricing = {},
    deliveryType = "delivery",
    paymentMethod = "upi",
    address = {},
    createdAt,
  } = order;

  const locationText = order.location?.locationText || "";
  const grandTotal = pricing.grandTotal ?? 0;
  const orderDate = createdAt;
  const cartItems = items;

  // Phase 2D — celebration hero only right after checkout
  const justPlaced = Boolean(
    routerLocation.state?.justPlaced ||
    (new URLSearchParams(routerLocation.search).get("payment") === "success" &&
      String(order.paymentStatus || "").toLowerCase() === "paid")
  );

  const isPickup = deliveryType === "pickup";

  const statusProgress =
    STATUS_TIMELINE[order.status] ||
    STATUS_TIMELINE.placed;

  const completedCount = statusProgress.completed;
  const activeIndex = statusProgress.active;

  const showEstimatedTime =
    ACTIVE_STATUSES.includes(order.status);

  const timelineSteps = [
    {
      icon: "✓",
      title: "Order Confirmed",
      subtitle: "Your order has been received",
    },
    {
      icon: "🍳",
      title: "Preparing",
      subtitle: "Restaurant is preparing your food",
    },
    {
      icon: isPickup ? "🏪" : "🛵",
      title: isPickup ? "Ready for Pickup" : "On the Way",
      subtitle: isPickup
        ? "We will keep your order ready"
        : "Your order will be delivered",
    },
    {
      icon: isPickup ? "🧾" : "🏠",
      title: isPickup ? "Collected" : "Delivered",
      subtitle: "Enjoy your food",
    },
  ];

  const paymentMethodNames = {
    upi: "UPI",
    card: "Credit / Debit Card",
    netbanking: "Net Banking",
    wallet: "Wallet",
    payu: "PayU Test Checkout",
    cod: "Cash on Delivery",
    demo: "Demo Payment",
  };

  const formattedPaymentMethod =
    paymentMethodNames[paymentMethod] ||
    "Online Payment";

  const paymentStatus = String(order.paymentStatus || "pending").toLowerCase();
  const paymentStatusLabel = {
    paid: "Paid",
    pending: "Awaiting payment confirmation",
    failed: "Payment failed",
    cod_pending: "Pay on delivery",
  }[paymentStatus] || "Payment status unavailable";

  const paymentStatusMessage = paymentStatus === "paid"
    ? "Payment confirmed successfully."
    : paymentStatus === "failed"
    ? "The payment attempt failed. Check My Orders before retrying to avoid duplicate orders."
    : paymentStatus === "cod_pending"
    ? "Payment will be collected when your order is delivered."
    : "Payment has not yet been confirmed. Refresh this page in a moment or check My Orders before trying again.";

  const formattedDate = orderDate
    ? new Date(orderDate).toLocaleString()
    : new Date().toLocaleString();

  return (
    <div className="orderSuccessPage">
      {/* Dedicated document used only by the browser's Print / Save as PDF action */}
      <section className="invoicePrintOnly" aria-label="Printable invoice">
        <header className="invoicePrintHeader">
          <div>
            <div className="invoiceBrand">FOOD<span>APP</span></div>
            <p>Food order invoice</p>
          </div>
          <div className="invoiceTitleBlock">
            <h1>INVOICE</h1>
            <p><strong>Invoice / Order No.</strong><br />{order?.orderNumber || order?._id || orderId}</p>
            <p><strong>Date</strong><br />{order?.createdAt ? new Date(order.createdAt).toLocaleString() : new Date().toLocaleString()}</p>
          </div>
        </header>
        <div className="invoicePrintStatus">{(order?.paymentStatus || "ORDER RECEIVED").replaceAll("_", " ").toUpperCase()}</div>
        <section className="invoicePrintParties">
          <div className="invoicePrintInfoCard">
            <h2>BILL TO / CUSTOMER</h2>
            <p className="invoicePrintCustomerName">{order?.address?.name || "Customer"}</p>
            {order?.address?.phone && <p>Phone: {order.address.phone}</p>}
            <p>Order type: {order?.deliveryType === "pickup" ? "Restaurant pickup" : "Home delivery"}</p>
          </div>
          <div className="invoicePrintInfoCard">
            <h2>SHIP TO / DELIVERY ADDRESS</h2>
            {order?.deliveryType === "pickup" ? <p>Restaurant pickup</p> : <>
              {order?.address?.addressLine && <p>{order.address.addressLine}</p>}
              {[order?.address?.city, order?.address?.state, order?.address?.pincode].filter(Boolean).join(", ") && <p>{[order?.address?.city, order?.address?.state, order?.address?.pincode].filter(Boolean).join(", ")}</p>}
              {order?.address?.landmark && <p>Landmark: {order.address.landmark}</p>}
              {locationText && <p>Location: {locationText}</p>}
            </>}
          </div>
        </section>
        <section className="invoicePrintMeta">
          <div><span>Order reference</span><strong>{order?.orderNumber || order?._id || orderId}</strong></div>
          <div><span>Order date</span><strong>{order?.createdAt ? new Date(order.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}</strong></div>
          <div><span>Payment method</span><strong>{(order?.paymentMethod || "online").replaceAll("_", " ").toUpperCase()}</strong></div>
          <div><span>Order status</span><strong>{(order?.status || "placed").replaceAll("_", " ").toUpperCase()}</strong></div>
        </section>
        <div className="invoicePrintSectionTitle">ORDERED ITEMS</div>
        <table className="invoicePrintTable">
          <thead><tr><th>Item Description</th><th>Qty</th><th>Unit Price</th><th>Amount</th></tr></thead>
          <tbody>
            {(order?.items || []).map((item, index) => (
              <tr key={item.foodId || item.name || index}>
                <td>{item.name || "Food item"}{item.cookingRequest ? <small className="invoicePrintNote">Note: {item.cookingRequest}</small> : null}</td>
                <td>{Number(item.quantity || 0)}</td>
                <td>₹{Number(item.price || 0).toFixed(2)}</td>
                <td>₹{(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <section className="invoicePrintTotals">
          <div><span>Subtotal</span><strong>₹{Number(order?.pricing?.subtotal || 0).toFixed(2)}</strong></div>
          {Number(order?.pricing?.discount || 0) > 0 && <div><span>Discount{order?.pricing?.couponCode ? ` (${order.pricing.couponCode})` : ""}</span><strong>-₹{Number(order.pricing.discount).toFixed(2)}</strong></div>}
          <div><span>Delivery fee</span><strong>{Number(order?.pricing?.deliveryFee || 0) === 0 ? "FREE" : `₹${Number(order.pricing.deliveryFee).toFixed(2)}`}</strong></div>
          <div><span>Service fee</span><strong>₹{Number(order?.pricing?.serviceFee || 0).toFixed(2)}</strong></div>
          <div><span>Tax</span><strong>₹{Number(order?.pricing?.tax || 0).toFixed(2)}</strong></div>
          <div className="invoicePrintGrandTotal"><span>Total paid / due</span><strong>₹{Number(order?.pricing?.grandTotal || 0).toFixed(2)}</strong></div>
        </section>
        <footer className="invoicePrintFooter">
          <strong>Thank you for ordering with FoodApp!</strong>
          <p>This is a computer-generated order invoice.</p>
        </footer>
      </section>

      {/* ================= SUCCESS MESSAGE ================= */}

      <div
        className={`successHero ${
          justPlaced ? "" : "neutral"
        }`}
      >

        <div className="successIcon">
          {justPlaced ? "✓" : "🧾"}
        </div>

        <h1>
          {justPlaced
            ? "Order Placed Successfully!"
            : "Order Details"}
        </h1>

        <p>
          {justPlaced
            ? "Thank you for your order. Your food is being prepared."
            : `Placed on ${formattedDate}`}
        </p>

        <div className="orderNumber">
          Order ID: <strong>{orderNumber}</strong>
        </div>

      </div>

      {/* ================= ORDER STATUS ================= */}

      {order.status === "cancelled" ? (
        <div className="orderCancelledBanner">
          <strong>⚠️ Order Cancelled</strong>

          <p>
            This order was cancelled. If this was
            unexpected, please contact support.
          </p>
        </div>
      ) : (
        <div className="orderStatusCard">
          <div className="orderLiveStatus" role="status" aria-live="polite">
            <span className={socketConnected ? "orderLiveDot connected" : "orderLiveDot"}></span>
            {socketConnected ? "Live order updates" : "Reconnecting to live updates..."}
          </div>          {timelineSteps.map((step, index) => (
            <React.Fragment key={step.title}>
              {index > 0 && (
                <div
                  className={`statusLine ${
                    index <= completedCount
                      ? "active"
                      : ""
                  }`}
                ></div>
              )}

              <div
                className={`statusStep ${
                  index < completedCount
                    ? "completed"
                    : index === activeIndex
                    ? "active"
                    : ""
                }`}
              >
                <div className="statusIcon">
                  {step.icon}
                </div>

                <div>
                  <strong>{step.title}</strong>

                  <span>{step.subtitle}</span>
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* ================= MAIN CONTENT ================= */}

      <div className="orderSuccessLayout">

        {/* ================= LEFT ================= */}

        <div className="orderSuccessMain">

          {/* ORDER DETAILS */}

          <div className="successCard">

            <div className="successCardHeader">

              <div>
                <h2>
                  Order Details
                </h2>

                <p>
                  Order placed on {formattedDate}
                </p>
              </div>

            </div>

            <div className="successOrderItems">

              {cartItems.map((item) => (

                <div
                  className="successOrderItem"
                  key={item.foodId || item.name}
                >

                  <div
                    className="successItemImage"
                    style={{
                      backgroundImage:
                        `url(${item.image})`,
                    }}
                  ></div>

                  <div className="successItemInfo">

                    <h3>
                      {item.name}
                    </h3>

                    <p>
                      {item.category}
                    </p>

                    <span>
                      Quantity: {item.quantity}
                    </span>

                    {item.cookingRequest && (
                      <small className="successCookingRequest">
                        Cooking request: {item.cookingRequest}
                      </small>
                    )}

                  </div>

                  <strong>
                    ₹
                    {(
                      item.price *
                      item.quantity
                    ).toFixed(2)}
                  </strong>

                </div>

              ))}

            </div>

          </div>

          {/* DELIVERY INFORMATION */}

          <div className="successCard">

            <div className="successCardHeader">

              <h2>
                {deliveryType === "delivery"
                  ? "Delivery Information"
                  : "Pickup Information"}
              </h2>

            </div>

            {deliveryType === "delivery" ? (

              <div className="successAddress">

                <div className="successAddressIcon">
                  📍
                </div>

                <div>

                  {address.name && (
                    <h3>
                      {address.name}
                    </h3>
                  )}

                  {address.phone && (
                    <p>
                      📞 {address.phone}
                    </p>
                  )}

                  {address.addressLine && (
                    <p>
                      {address.addressLine}
                    </p>
                  )}

                  {address.city && (
                    <p>
                      {address.city}
                      {address.state
                        ? `, ${address.state}`
                        : ""}
                      {address.pincode
                        ? ` - ${address.pincode}`
                        : ""}
                    </p>
                  )}

                  {address.landmark && (
                    <p>
                      🏷️ Landmark: {address.landmark}
                    </p>
                  )}

                  {locationText && (
                    <p className="successLocationText">
                      📍 {locationText}
                    </p>
                  )}

                </div>

              </div>

            ) : (

              <div className="pickupSuccess">

                <div className="pickupSuccessIcon">
                  🏪
                </div>

                <div>

                  <h3>
                    Restaurant Pickup
                  </h3>

                  <p>
                    Your order will be prepared and
                    kept ready for pickup.
                  </p>

                </div>

              </div>

            )}

          </div>

          {/* HANDOVER CODE */}
          {((isPickup && order.status === "ready") || (!isPickup && order.status === "out_for_delivery")) && (
            <div className="successCard handoverCard">
              <div className="successCardHeader">
                <h2>Order Handover</h2>
                <p>Generate a one-time code when you are ready to {isPickup ? "collect your order" : "receive your delivery"}.</p>
              </div>

              {handoverCode ? (
                <div className="handoverCodeBox">
                  <span>Your Handover Code</span>
                  <strong>{handoverCode}</strong>
                  <p>{handoverMessage}</p>
                </div>
              ) : (
                <button type="button" className="handoverGenerateButton" onClick={handleGenerateHandoverCode} disabled={handoverLoading}>
                  {handoverLoading ? "Generating..." : "Generate 6-Digit Code"}
                </button>
              )}

              {handoverCode && (
                <div className="handoverVerifyBox">
                  <label htmlFor="handoverCode">Enter code after handover</label>
                  <div className="handoverVerifyRow">
                    <input
                      id="handoverCode"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength="6"
                      value={enteredHandoverCode}
                      onChange={(event) => setEnteredHandoverCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="6-digit code"
                    />
                    <button type="button" onClick={handleVerifyHandoverCode} disabled={handoverLoading || enteredHandoverCode.length !== 6}>
                      {handoverLoading ? "Verifying..." : "Confirm Handover"}
                    </button>
                  </div>
                </div>
              )}

              {handoverMessage && !handoverCode && <div className="handoverSuccessMessage">{handoverMessage}</div>}
              {handoverError && <div className="handoverErrorMessage" role="alert">{handoverError}</div>}
            </div>
          )}

          {/* ORDER INFORMATION */}

          <div className="successCard">
            <div className="successCardHeader">
              <div>
                <h2>Order Information</h2>
                <p>Quick reference for this order</p>
              </div>
            </div>

            <div className="successOrderMetaGrid">
              <div>
                <span>Order Number</span>
                <strong>{orderNumber}</strong>
              </div>
              <div>
                <span>Order Status</span>
                <strong>{order.status === "cancelled" ? "Cancelled" : (order.status || "Placed").replaceAll("_", " ")}</strong>
              </div>
              <div>
                <span>Order Type</span>
                <strong>{isPickup ? "Restaurant Pickup" : "Home Delivery"}</strong>
              </div>
              <div>
                <span>Placed On</span>
                <strong>{formattedDate}</strong>
              </div>
            </div>
          </div>

          {/* PAYMENT INFORMATION */}

          <div className="successCard">

            <div className="successCardHeader">

              <h2>
                Payment Information
              </h2>

            </div>

            <div className="paymentSuccessInfo">

              <div className="paymentSuccessIcon">
                💳
              </div>

              <div>

                <h3>
                  {formattedPaymentMethod}
                </h3>

                <p className={`paymentStatusMessage paymentStatus-${paymentStatus}`} role="status">
                  <strong>{paymentStatusLabel}.</strong> {paymentMethod === "demo"
                    ? "Demo payment only; no real money was charged."
                    : paymentStatusMessage}
                </p>

              </div>

              <strong>
                {grandTotal.toFixed(2)}
              </strong>

            </div>

          </div>

        </div>

        {/* ================= RIGHT ================= */}

        <aside className="successSummary">

          <div className="successSummaryHeader">

            <h2>
              Order Summary
            </h2>

          </div>

          <div className="successSummaryRow">

            <span>
              Items
            </span>

            <strong>
              {cartItems.reduce(
                (total, item) =>
                  total + item.quantity,
                0
              )}
            </strong>

          </div>

          <div className="successSummaryRow">

            <span>
              Payment
            </span>

            <strong>
              {formattedPaymentMethod}
            </strong>

          </div>

          <div className="successSummaryDivider"></div>

          <div className="successSummaryRow">
            <span>Subtotal</span>
            <strong>₹{Number(pricing.subtotal || 0).toFixed(2)}</strong>
          </div>

          {Number(pricing.discount || 0) > 0 && (
            <div className="successSummaryRow successDiscountRow">
              <span>
                Discount{pricing.couponCode ? ` (${pricing.couponCode})` : ""}
              </span>
              <strong>-₹{Number(pricing.discount).toFixed(2)}</strong>
            </div>
          )}

          <div className="successSummaryRow">
            <span>Delivery Fee</span>
            <strong>
              {Number(pricing.deliveryFee || 0) === 0
                ? "FREE"
                : `₹${Number(pricing.deliveryFee).toFixed(2)}`}
            </strong>
          </div>

          <div className="successSummaryRow">
            <span>Service Fee</span>
            <strong>₹{Number(pricing.serviceFee || 0).toFixed(2)}</strong>
          </div>

          <div className="successSummaryRow">
            <span>Tax</span>
            <strong>₹{Number(pricing.tax || 0).toFixed(2)}</strong>
          </div>

          <div className="successSummaryDivider"></div>

          <div className="successTotal">

            <span>
              Total Amount
            </span>

            <strong>
              {grandTotal.toFixed(2)}
            </strong>

          </div>

          {showEstimatedTime && (
            <div className="estimatedTime">

              <span>
                ⏱️
              </span>

              <div>

                <strong>
                  Estimated Delivery
                </strong>

                <p>
                  30 - 45 minutes
                </p>

              </div>

            </div>
          )}

          <Link
            to="/menu"
            className="successPrimaryButton"
          >
            {justPlaced ? "Order More Food" : "Browse Menu"}
            <span>→</span>
          </Link>

          <button
            type="button"
            className="successInvoiceButton"
            onClick={() => window.print()}
          >
            Print / Save Invoice
          </button>

          <Link
            to="/contact"
            className="successSecondaryButton"
          >
            Need Help with This Order?
          </Link>

          <Link
            to={justPlaced ? "/" : "/profile"}
            className="successSecondaryButton"
          >
            {justPlaced ? "Back to Home" : "Back to My Orders"}
          </Link>

        </aside>

      </div>

      {/* ================= FOOTER MESSAGE ================= */}

      {justPlaced && (
        <div className="successThankYou">

          <div>
            🍕
          </div>

          <h2>
            Thank you for ordering with us!
          </h2>

          <p>
            We hope you enjoy your meal. Have a
            wonderful day!
          </p>

        </div>
      )}

    </div>
  );
}

export default OrderSuccess;