import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { API_URL } from "../config/api";
import { resolveFoodImage } from "../utils/foodImage";
import { useCart } from "../context/CartContext";
import "../Styles/Payment.css";

function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const { clearCart } = useCart();

  const orderData = location.state;

  const [paymentMethod, setPaymentMethod] = useState(orderData?.deliveryType === "pickup" ? "payu" : "cod");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  // A ref closes the tiny window before React re-renders a disabled button.
  // This prevents rapid double-clicks from creating two orders or payment sessions.
  const submissionLock = useRef(false);
  const [orderError, setOrderError] = useState("");
  const [availableFoodiePoints, setAvailableFoodiePoints] = useState(0);
  const [rewardPointsLoading, setRewardPointsLoading] = useState(true);
  const [rewardsPointsRedeemed, setRewardsPointsRedeemed] = useState(0);

  useEffect(() => {
    let active = true;
    fetch(`${API_URL}/api/rewards`, { credentials: "include" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || "Unable to load Foodie Rewards.");
        if (active) setAvailableFoodiePoints(Math.max(0, Number(data.points || 0)));
      })
      .catch((error) => { if (active) console.error("Foodie Rewards balance:", error.message); })
      .finally(() => { if (active) setRewardPointsLoading(false); });
    return () => { active = false; };
  }, []);

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
  const maxRedeemablePoints = Math.min(availableFoodiePoints, Math.floor(Math.max(0, subtotal - discount)) * 10);
  const safeRedeemedPoints = Math.min(maxRedeemablePoints, Math.max(0, Math.floor(Number(rewardsPointsRedeemed) / 10) * 10));
  const rewardsDiscount = safeRedeemedPoints / 10;
  const payableTotal = Math.max(0, grandTotal - rewardsDiscount);

const handlePlaceOrder = async () => {
    if (submissionLock.current || isPlacingOrder) return;
    submissionLock.current = true;
    setOrderError("");

    setIsPlacingOrder(true);
    try {
      const orderPayload = {
        items: cartItems.map((item) => ({
          foodId: String(item._id ?? item.id ?? item.cartItemId ?? ""),
          name: item.name,
          category: item.category ?? "",
          price: item.price,
          quantity: item.quantity,
          cookingRequest: item.cookingRequest ?? "",
          image: String(item.image ?? "").startsWith("https://") || String(item.image ?? "").startsWith("http://") ? item.image : "",
        })),
        deliveryType,
        address: deliveryType === "delivery" ? {
          name: address.name,
          phone: address.phone,
          addressLine: address.addressLine,
          city: address.city,
          pincode: address.pincode,
          landmark: address.landmark || "",
        } : undefined,
        location: deliveryType === "delivery" ? { latitude, longitude, locationText } : undefined,
        paymentMethod,
        couponCode: coupon?.code ?? "",
        rewardsPointsRedeemed: safeRedeemedPoints,
      };

      const isPayU = paymentMethod === "payu";
      // Required by the backend's PayU initiation validation; PayU's hosted checkout handles the available methods.
      if (isPayU) orderPayload.channel = "upi";
      const response = await fetch(
        isPayU ? `${API_URL}/api/payments/payu/initiate` : `${API_URL}/api/orders`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orderPayload),
        }
      );

      let data = {};
      try { data = await response.json(); } catch { /* Non-JSON response */ }

      if (response.status === 401) {
        setOrderError("Your session has expired. Please log in again.");
        return;
      }
      if (!response.ok || !data.success) {
        setOrderError(data.message || "Unable to start checkout. Please try again.");
        return;
      }

      if (isPayU) {
        if (!data.action || !data.fields) {
          setOrderError("PayU did not return valid test checkout details.");
          return;
        }
        const form = document.createElement("form");
        form.method = "POST";
        form.action = data.action;
        Object.entries(data.fields).forEach(([name, value]) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = name;
          input.value = String(value ?? "");
          form.appendChild(input);
        });
        document.body.appendChild(form);
        form.submit();
        return;
      }

      if (!data.order) {
        setOrderError(data.message || "Unable to place your order. Please try again.");
        return;
      }
      clearCart();
      navigate(`/order-success/${data.order.id}`, { state: { justPlaced: true } });
    } catch (placeError) {
      console.error("Place order error:", placeError);
      setOrderError("Unable to reach the server. Please check your connection and try again.");
    } finally {
      submissionLock.current = false;
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

              <button
                type="button"
                className={`paymentMethod ${paymentMethod === "payu" ? "active" : ""}`}
                onClick={() => { setPaymentMethod("payu"); setOrderError(""); }}
              >
                <div className="paymentMethodIcon">🔐</div>
                <div className="paymentMethodInfo">
                  <strong>PayU Test Checkout</strong>
                  <span>Hosted test payment only — no live transactions</span>
                </div>
                <div className="paymentMethodRadio">{paymentMethod === "payu" ? "●" : "○"}</div>
              </button>

            </div>



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
                      `url("${resolveFoodImage(item.image) || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80"}")`,
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

          <section className="foodie-redeem-panel" aria-label="Foodie Rewards redemption">
            <div><strong>⭐ Foodie Rewards</strong><small>{rewardPointsLoading ? "Checking your balance…" : `${availableFoodiePoints.toLocaleString("en-IN")} points available · 10 points = ₹1`}</small></div>
            <label htmlFor="foodie-points-redeem">Use points</label>
            <div className="foodie-redeem-controls">
              <input id="foodie-points-redeem" type="number" min="0" max={maxRedeemablePoints} step="10" value={safeRedeemedPoints} disabled={rewardPointsLoading || maxRedeemablePoints < 10} onChange={(event) => setRewardsPointsRedeemed(Math.max(0, Math.min(maxRedeemablePoints, Math.floor(Number(event.target.value || 0) / 10) * 10)))} />
              <button type="button" disabled={rewardPointsLoading || maxRedeemablePoints < 10} onClick={() => setRewardsPointsRedeemed(safeRedeemedPoints === maxRedeemablePoints ? 0 : maxRedeemablePoints)}>{safeRedeemedPoints === maxRedeemablePoints && safeRedeemedPoints > 0 ? "Remove" : "Use max"}</button>
            </div>
            {safeRedeemedPoints > 0 && <small className="foodie-redeem-applied">You save ₹{rewardsDiscount.toFixed(2)} with Foodie Points.</small>}
          </section>

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

          {rewardsDiscount > 0 && <div className="paymentPriceRow discount foodie-rewards-discount"><span>Foodie Points ({safeRedeemedPoints})</span><strong>-₹{rewardsDiscount.toFixed(2)}</strong></div>}

          <div className="paymentSummaryDivider"></div>

          {/* TOTAL */}

          <div className="paymentGrandTotal">

            <span>
              Total Amount
            </span>

            <strong>
              ₹{payableTotal.toFixed(2)}
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
                {paymentMethod === "payu" ? "Opening PayU test checkout..." : "Placing COD order..."}
              </>
            ) : (
              <>
                {paymentMethod === "payu" ? "Continue to PayU Test" : "Place COD Order"}
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