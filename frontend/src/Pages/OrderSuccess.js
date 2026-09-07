import React from "react";
import { Link, useLocation } from "react-router-dom";
import "../Styles/OrderSuccess.css";

function OrderSuccess() {
  const location = useLocation();
  const orderData = location.state;

  if (!orderData) {
    return (
      <div className="orderSuccessEmpty">
        <div className="orderSuccessEmptyIcon">📦</div>

        <h1>Order Information Not Found</h1>

        <p>
          We could not find your order information.
          Please place an order first.
        </p>

        <Link to="/menu">
          <button className="goToMenuButton">
            Browse Menu
          </button>
        </Link>
      </div>
    );
  }

  const {
    orderId,
    cartItems = [],
    grandTotal = 0,
    deliveryType = "delivery",
    paymentMethod = "upi",
    address = {},
    locationText = "",
    orderDate,
  } = orderData;

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

      <div className="successHero">

        <div className="successIcon">
          ✓
        </div>

        <h1>
          Order Placed Successfully!
        </h1>

        <p>
          Thank you for your order. Your food is
          being prepared.
        </p>

        <div className="orderNumber">
          Order ID: <strong>{orderId}</strong>
        </div>

      </div>

      {/* ================= ORDER STATUS ================= */}

      <div className="orderStatusCard">

        <div className="statusStep completed">

          <div className="statusIcon">
            ✓
          </div>

          <div>
            <strong>
              Order Confirmed
            </strong>

            <span>
              Your order has been received
            </span>
          </div>

        </div>

        <div className="statusLine active"></div>

        <div className="statusStep active">

          <div className="statusIcon">
            🍳
          </div>

          <div>
            <strong>
              Preparing
            </strong>

            <span>
              Restaurant is preparing your food
            </span>
          </div>

        </div>

        <div className="statusLine"></div>

        <div className="statusStep">

          <div className="statusIcon">
            🛵
          </div>

          <div>
            <strong>
              On the Way
            </strong>

            <span>
              Your order will be delivered
            </span>
          </div>

        </div>

        <div className="statusLine"></div>

        <div className="statusStep">

          <div className="statusIcon">
            🏠
          </div>

          <div>
            <strong>
              Delivered
            </strong>

            <span>
              Enjoy your food
            </span>
          </div>

        </div>

      </div>

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
                  key={item.id}
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

                  {address.address && (
                    <p>
                      {address.address}
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
              Total Paid
            </span>

            <strong>
              ${grandTotal.toFixed(2)}
            </strong>

          </div>

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

          <Link
            to="/menu"
            className="successPrimaryButton"
          >
            Order More Food
            <span>→</span>
          </Link>

          <Link
            to="/"
            className="successSecondaryButton"
          >
            Back to Home
          </Link>

        </aside>

      </div>

      {/* ================= FOOTER MESSAGE ================= */}

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

    </div>
  );
}

export default OrderSuccess;