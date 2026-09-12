import React, { useEffect, useState } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import { API_URL } from "../config/api";
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

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
  }, [orderId]);

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
    location = {},
    createdAt,
  } = order;

  const locationText = location.locationText || "";
  const grandTotal = pricing.grandTotal ?? 0;
  const orderDate = createdAt;
  const cartItems = items;

  // Phase 2D — celebration hero only right after checkout
  const justPlaced = Boolean(
    routerLocation.state?.justPlaced
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
    cod: "Cash on Delivery",
  };

  const formattedPaymentMethod =
    paymentMethodNames[paymentMethod] ||
    "Online Payment";

  const formattedDate = orderDate
    ? new Date(orderDate).toLocaleString()
    : new Date().toLocaleString();

  return (
    <div className="orderSuccessPage">

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
          {timelineSteps.map((step, index) => (
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

                  </div>

                  <strong>
                    $
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

                <p>
                  {paymentMethod === "cod"
                    ? "Payment will be collected when your order is delivered."
                    : "Payment will be processed securely through the payment gateway."}
                </p>

              </div>

              <strong>
                ${grandTotal.toFixed(2)}
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

          <div className="successTotal">

            <span>
              Total Amount
            </span>

            <strong>
              ${grandTotal.toFixed(2)}
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