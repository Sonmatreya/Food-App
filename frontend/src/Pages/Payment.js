import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { API_URL } from "../config/api";
import { useCart } from "../context/CartContext";
import "../Styles/Payment.css";

function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const { clearCart } = useCart();

  const orderData = location.state;

  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [upiId, setUpiId] = useState("");
  const [demoCardNumber, setDemoCardNumber] = useState("");
  const [demoExpiry, setDemoExpiry] = useState("");
  const [demoCvv, setDemoCvv] = useState("");
  const [demoPaymentState, setDemoPaymentState] = useState("idle");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState("");

  /*
    If someone directly opens /payment without coming
    from the Delivery Address page, send them back.
  */
  if (!orderData) {
    return (
      <div className="paymentPageEmpty">
        <div className="paymentEmptyIcon">💳</div>

        <h1>Payment Information Not Found</h1>

        <p>
          Please complete your delivery address before
          proceeding to payment.
        </p>

        <Link to="/cart">
          <button className="backToCartButton">
            Back to Cart
          </button>
        </Link>
      </div>
    );
  }

  const {
    cartItems = [],
    subtotal = 0,
    discount = 0,
    deliveryFee = 0,
    serviceFee = 0,
    tax = 0,
    grandTotal = 0,
    deliveryType = "delivery",
    address = {},
    coupon = null,
    latitude = null,
    longitude = null,
    locationText = "",
  } = orderData;

  const totalQuantity = cartItems.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const handlePlaceOrder = async () => {
    if (isPlacingOrder) {
      return;
    }

    setOrderError("");
    setDemoPaymentState("idle");
    if (paymentMethod === "demo") {
      const cardDigits = demoCardNumber.replace(/\D/g, "");
      if (!/^4111111111111111$/.test(cardDigits) || !/^\d{2}\/\d{2}$/.test(demoExpiry) || !/^\d{3}$/.test(demoCvv)) {
        setOrderError("Use the demo card 4111 1111 1111 1111, expiry MM/YY and a 3-digit CVV.");
        return;
      }
      setDemoPaymentState("processing");
    }
    setIsPlacingOrder(true);

    try {
      // Backend recomputes all pricing — client totals
      // are never sent or trusted.
      const response = await fetch(
        `${API_URL}/api/orders`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            items: cartItems.map((item) => ({
              foodId: String(item._id ?? item.id ?? item.cartItemId ?? ""),
              name: item.name,
              category: item.category ?? "",
              price: item.price,
              quantity: item.quantity,
              cookingRequest: item.cookingRequest ?? "",
              image: /^https?:\/\//.test(item.image ?? "")
                ? item.image
                : "",
            })),
            deliveryType,
            address:
              deliveryType === "delivery"
                ? {
                    name: address.name,
                    phone: address.phone,
                    addressLine: address.addressLine,
                    city: address.city,
                    pincode: address.pincode,
                  }
                : undefined,
            location:
              deliveryType === "delivery"
                ? { latitude, longitude, locationText }
                : undefined,
            paymentMethod,
            demoCardNumber: paymentMethod === "demo" ? demoCardNumber : undefined,
            couponCode: coupon?.code ?? "",
          }),
        }
      );

      let data = {};

      try {
        data = await response.json();
      } catch {
        // Non-JSON response
      }

      if (response.status === 401) {
        setOrderError(
          "Your session has expired. Please log in again."
        );
        return;
      }

      if (!response.ok || !data.success || !data.order) {
        setOrderError(
          data.message ||
            "Unable to place your order. Please try again."
        );
        return;
      }

      // Order saved on the server — clear the cart and
      // show the real order confirmation.
      clearCart();

      navigate(`/order-success/${data.order.id}`, {
        state: { justPlaced: true },
      });
    } catch (placeError) {
      console.error("Place order error:", placeError);

      setOrderError(
        "Unable to reach the server. Please check your connection and try again."
      );
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <div className="paymentPage">

      {/* ================= HEADER ================= */}

      <div className="paymentHeader">

        <div>
          <h1>Payment</h1>

          <p>
            Choose your preferred payment method
          </p>
        </div>

        <Link
          to={deliveryType === "delivery" ? "/delivery-address" : "/cart"}
          state={deliveryType === "delivery" ? orderData : undefined}
          className="backToAddress"
        >
          {deliveryType === "delivery" ? "← Change Address" : "← Back to Cart"}
        </Link>

      </div>

      {/* ================= CHECKOUT STEPS ================= */}

      <div className="paymentSteps">

        <div className="paymentStep completed">
          <span>✓</span>
          <div>
            <strong>Cart</strong>
            <small>Order items</small>
          </div>
        </div>

        <div className="paymentStepLine completed"></div>

        <div className="paymentStep completed">
          <span>✓</span>
          <div>
            <strong>Address</strong>
            <small>Delivery location</small>
          </div>
        </div>

        <div className="paymentStepLine active"></div>

        <div className="paymentStep active">
          <span>3</span>
          <div>
            <strong>Payment</strong>
            <small>Choose payment</small>
          </div>
        </div>

        <div className="paymentStepLine"></div>

        <div className="paymentStep">
          <span>4</span>
          <div>
            <strong>Complete</strong>
            <small>Order placed</small>
          </div>
        </div>

      </div>

      {/* ================= MAIN CONTENT ================= */}

      <div className="paymentLayout">

        {/* ================= LEFT SIDE ================= */}

        <div className="paymentMain">

          {/* DELIVERY ADDRESS */}

          {deliveryType === "delivery" && (
            <div className="paymentCard">

              <div className="paymentCardHeader">

                <div>
                  <h2>Delivery Address</h2>

                  <p>
                    Your order will be delivered here
                  </p>
                </div>

                <Link
                  to="/delivery-address"
                  state={orderData}
                  className="editAddressButton"
                >
                  Edit
                </Link>

              </div>

              <div className="paymentAddress">

                <div className="paymentAddressIcon">
                  📍
                </div>

                <div className="paymentAddressContent">

                  {address.name && (
                    <h3>{address.name}</h3>
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
                    <p className="selectedLocationText">
                      📍 {locationText}
                    </p>
                  )}

                  {latitude !== null &&
                    longitude !== null && (
                      <small className="coordinates">
                        Location selected on map
                      </small>
                    )}

                </div>

              </div>

            </div>
          )}

          {/* PICKUP INFORMATION */}

          {deliveryType === "pickup" && (
            <div className="paymentCard">

              <div className="paymentCardHeader">

                <div>
                  <h2>Pickup Order</h2>

                  <p>
                    You will collect your order from
                    our restaurant.
                  </p>
                </div>

              </div>

              <div className="pickupInformation">

                <div className="pickupIcon">
                  🏪
                </div>

                <div>
                  <h3>Restaurant Pickup</h3>

                  <p>
                    Your order will be prepared and
                    kept ready for pickup.
                  </p>

                  <span>
                    Pickup fee: FREE
                  </span>
                </div>

              </div>

            </div>
          )}

          {/* PAYMENT METHODS */}

          <div className="paymentCard">

            <div className="paymentCardHeader">

              <div>
                <h2>Payment Method</h2>

                <p>
                  Select how you want to pay
                </p>
              </div>

            </div>

            <div className="paymentMethods">

              {/* UPI */}

              <button
                type="button"
                className={`paymentMethod ${
                  paymentMethod === "upi"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setPaymentMethod("upi")
                }
              >

                <div className="paymentMethodIcon">
                  📱
                </div>

                <div className="paymentMethodInfo">
                  <strong>UPI</strong>

                  <span>
                    Pay using Google Pay, PhonePe,
                    Paytm or other UPI apps
                  </span>
                </div>

                <div className="paymentMethodRadio">
                  {paymentMethod === "upi"
                    ? "●"
                    : "○"}
                </div>

              </button>

              {/* CARD */}

              <button
                type="button"
                className={`paymentMethod ${
                  paymentMethod === "card"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setPaymentMethod("card")
                }
              >

                <div className="paymentMethodIcon">
                  💳
                </div>

                <div className="paymentMethodInfo">
                  <strong>Credit / Debit Card</strong>

                  <span>
                    Visa, Mastercard, RuPay and
                    other supported cards
                  </span>
                </div>

                <div className="paymentMethodRadio">
                  {paymentMethod === "card"
                    ? "●"
                    : "○"}
                </div>

              </button>

              {/* NET BANKING */}

              <button
                type="button"
                className={`paymentMethod ${
                  paymentMethod === "netbanking"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setPaymentMethod("netbanking")
                }
              >

                <div className="paymentMethodIcon">
                  🏦
                </div>

                <div className="paymentMethodInfo">
                  <strong>Net Banking</strong>

                  <span>
                    Pay directly through your bank
                  </span>
                </div>

                <div className="paymentMethodRadio">
                  {paymentMethod === "netbanking"
                    ? "●"
                    : "○"}
                </div>

              </button>

              {/* DEMO PAYMENT */}

              <button
                type="button"
                className={`paymentMethod ${paymentMethod === "demo" ? "active" : ""}`}
                onClick={() => {
                  setPaymentMethod("demo");
                  setOrderError("");
                }}
              >
                <div className="paymentMethodIcon">🧪</div>
                <div className="paymentMethodInfo">
                  <strong>Demo Payment</strong>
                  <span>Test checkout — no real money is charged</span>
                </div>
                <div className="paymentMethodRadio">
                  {paymentMethod === "demo" ? "●" : "○"}
                </div>
              </button>

              {/* CASH ON DELIVERY */}

              {deliveryType === "delivery" && (
                <button
                  type="button"
                  className={`paymentMethod ${
                    paymentMethod === "cod"
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    setPaymentMethod("cod")
                  }
                >

                  <div className="paymentMethodIcon">
                    💵
                  </div>

                  <div className="paymentMethodInfo">
                    <strong>
                      Cash on Delivery
                    </strong>

                    <span>
                      Pay with cash when your order
                      arrives
                    </span>
                  </div>

                  <div className="paymentMethodRadio">
                    {paymentMethod === "cod"
                      ? "●"
                      : "○"}
                  </div>

                </button>
              )}

            </div>

            {/* UPI FORM */}

            {paymentMethod === "upi" && (
              <div className="paymentForm">

                <label htmlFor="upiId">
                  UPI ID
                </label>

                <div className="upiInputWrapper">

                  <input
                    id="upiId"
                    type="text"
                    value={upiId}
                    onChange={(event) =>
                      setUpiId(event.target.value)
                    }
                    placeholder="example@upi"
                  />

                </div>

                <p className="paymentFormNote">
                  You will be redirected to your UPI
                  app during real payment processing.
                </p>

              </div>
            )}

            {/* CARD INFORMATION */}

            {paymentMethod === "card" && (
              <div className="paymentInfoBox">

                <div className="paymentInfoIcon">
                  🔒
                </div>

                <div>
                  <strong>
                    Secure Card Payment
                  </strong>

                  <p>
                    Card payment will be securely
                    processed through our payment
                    gateway.
                  </p>
                </div>

              </div>
            )}

            {/* NET BANKING */}

            {paymentMethod === "netbanking" && (
              <div className="paymentInfoBox">

                <div className="paymentInfoIcon">
                  🏦
                </div>

                <div>
                  <strong>
                    Net Banking
                  </strong>

                  <p>
                    You will be redirected to your
                    selected bank during real payment
                    processing.
                  </p>
                </div>

              </div>
            )}

            {/* COD */}

            {paymentMethod === "cod" && (
              <div className="paymentInfoBox">

                <div className="paymentInfoIcon">
                  💵
                </div>

                <div>
                  <strong>
                    Cash on Delivery
                  </strong>

                  <p>
                    Please keep the exact amount ready
                    when your order is delivered.
                  </p>
                </div>

              </div>
            )}

          </div>

          {/* SECURITY INFORMATION */}

          <div className="securePaymentBox">

            <span className="securePaymentIcon">
              🔒
            </span>

            <div>

              <strong>
                Secure Payment
              </strong>

              <p>
                Your payment information is protected.
                We do not store your complete card
                details.
              </p>

            </div>

          </div>

        </div>

        {/* ================= RIGHT SIDE ================= */}

        <aside className="paymentSummary">

          <div className="paymentSummaryHeader">

            <h2>Order Summary</h2>

            <span>
              {totalQuantity}{" "}
              {totalQuantity === 1
                ? "item"
                : "items"}
            </span>

          </div>

          {/* ORDER ITEMS */}

          <div className="paymentItems">

            {cartItems.map((item, index) => (

              <div
                className="paymentItem"
                key={`${item._id || item.id || item.cartItemId || "item"}-${index}`}
              >

                <div
                  className="paymentItemImage"
                  style={{
                    backgroundImage:
                      `url(${item.image})`,
                  }}
                ></div>

                <div className="paymentItemInfo">

                  <h3>
                    {item.name}
                  </h3>

                  <p>
                    Qty: {item.quantity}
                  </p>

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

          <div className="paymentSummaryDivider"></div>

          {/* PRICE DETAILS */}

          <div className="paymentPriceRows">

            <div className="paymentPriceRow">

              <span>
                Subtotal
              </span>

              <strong>
                ₹{subtotal.toFixed(2)}
              </strong>

            </div>

            {discount > 0 && (
              <div className="paymentPriceRow discount">

                <span>
                  Discount
                  {coupon
                    ? ` (${coupon.code})`
                    : ""}
                </span>

                <strong>
                  -₹{discount.toFixed(2)}
                </strong>

              </div>
            )}

            <div className="paymentPriceRow">

              <span>
                Delivery Fee
              </span>

              <strong>
                {deliveryFee === 0
                  ? "FREE"
                  : `₹${deliveryFee.toFixed(2)}`}
              </strong>

            </div>

            <div className="paymentPriceRow">

              <span>
                Service Fee
              </span>

              <strong>
                ₹{serviceFee.toFixed(2)}
              </strong>

            </div>

            <div className="paymentPriceRow">

              <span>
                Tax
              </span>

              <strong>
                ₹{tax.toFixed(2)}
              </strong>

            </div>

          </div>

          {deliveryFee === 0 &&
            deliveryType === "delivery" && (
              <div className="freeDeliveryNotice">
                🎉 Free delivery applied
              </div>
            )}

          <div className="paymentSummaryDivider"></div>

          {/* TOTAL */}

          <div className="paymentGrandTotal">

            <span>
              Total Amount
            </span>

            <strong>
              ₹{grandTotal.toFixed(2)}
            </strong>

          </div>

          {/* PLACE ORDER */}

          {orderError && (
            <div
              role="alert"
              style={{
                margin: "0 0 12px",
                padding: "10px 12px",
                borderRadius: "8px",
                background: "#fdecec",
                border: "1px solid #f5c6cb",
                color: "#b31226",
                fontSize: "12px",
                lineHeight: 1.4,
              }}
            >
              {orderError}
            </div>
          )}

          <button
            type="button"
            className="placeOrderButton"
            onClick={handlePlaceOrder}
            disabled={isPlacingOrder}
          >

            {isPlacingOrder ? (
              <>
                <span className="loadingSpinner"></span>
                {paymentMethod === "demo" ? "Processing Demo Payment..." : "Processing..."}
              </>
            ) : (
              <>
                {paymentMethod === "demo" ? "Pay ₹" + grandTotal.toFixed(2) : "Place Order"}
                <span>→</span>
              </>
            )}

          </button>

          <p className="paymentTerms">
            By placing this order, you agree to our
            terms and conditions.
          </p>

        </aside>

      </div>

    </div>
  );
}

export default Payment;