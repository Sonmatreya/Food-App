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

  const [paymentMethod, setPaymentMethod] = useState("demo");
  const [upiId, setUpiId] = useState("");
  const [demoChannel, setDemoChannel] = useState("upi");
  const [demoApp, setDemoApp] = useState("Google Pay");
  const [demoBank, setDemoBank] = useState("State Bank of India");
  const [demoWallet, setDemoWallet] = useState("Paytm Wallet");
  const [showAdvancedDemo, setShowAdvancedDemo] = useState(false);
  const [demoOutcome, setDemoOutcome] = useState("success");
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
    if (isPlacingOrder) return;
    setOrderError("");

    if (paymentMethod === "demo" && demoOutcome !== "success") {
      const outcomeMessage = demoOutcome === "failure"
        ? "Demo payment failed. No order was created and no money was charged."
        : "Demo payment cancelled. No order was created and no money was charged.";
      setOrderError(outcomeMessage);
      return;
    }

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
        demoChannel: paymentMethod === "demo" ? demoChannel : undefined,
        demoOutcome: paymentMethod === "demo" ? demoOutcome : undefined,
        couponCode: coupon?.code ?? "",
      };

      const isPayU = paymentMethod === "payu";
      if (isPayU) orderPayload.channel = demoChannel;
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
                className={`paymentMethod ${paymentMethod === "demo" && demoChannel === "upi" ? "active" : ""}`}
                onClick={() => { setPaymentMethod("demo"); setDemoChannel("upi"); setOrderError(""); }}
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
                  {paymentMethod === "demo" && demoChannel === "upi" ? "●" : "○"}
                </div>

              </button>

              {/* CARD */}

              <button
                type="button"
                className={`paymentMethod ${paymentMethod === "demo" && demoChannel === "card" ? "active" : ""}`}
                onClick={() => { setPaymentMethod("demo"); setDemoChannel("card"); setOrderError(""); }}
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
                  {paymentMethod === "demo" && demoChannel === "card" ? "●" : "○"}
                </div>

              </button>

              {/* NET BANKING */}

              <button
                type="button"
                className={`paymentMethod ${paymentMethod === "demo" && demoChannel === "netbanking" ? "active" : ""}`}
                onClick={() => { setPaymentMethod("demo"); setDemoChannel("netbanking"); setOrderError(""); }}
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
                  {paymentMethod === "demo" && demoChannel === "netbanking" ? "●" : "○"}
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



            {(paymentMethod === "demo" || paymentMethod === "payu") && (
              <div className="gatewayDemo" aria-label="Sandbox payment checkout">
                <div className="gatewayDemoTop">
                  <div>
                    <span className="gatewayDemoEyebrow"><span className="gatewayLiveDot" /> {paymentMethod === "payu" ? "PAYU TEST MODE" : "SANDBOX CHECKOUT"}</span>
                    <h3>Complete your payment</h3>
                    <p>{paymentMethod === "payu" ? "Continue to PayU’s hosted test checkout. Only test credentials are enabled; no live payment is processed." : "Choose a payment option below. This demo does not contact a bank, UPI app, or card network."}</p>
                  </div>
                  <div className="gatewayAmount">
                    <span>AMOUNT DUE</span>
                    <strong>₹{grandTotal.toFixed(2)}</strong>
                  </div>
                </div>

                <div className="gatewayMethodTabs" role="group" aria-label="Demo payment method">
                  {[
                    { value: "upi", label: "UPI", icon: "⌁" },
                    { value: "card", label: "Cards", icon: "▤" },
                    { value: "netbanking", label: "Net banking", icon: "▥" },
                    { value: "wallet", label: "Wallets", icon: "▣" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`gatewayMethodTab ${demoChannel === option.value ? "active" : ""}`}
                      aria-pressed={demoChannel === option.value}
                      onClick={() => { setDemoChannel(option.value); setOrderError(""); }}
                    >
                      <span aria-hidden="true">{option.icon}</span>
                      {option.label}
                    </button>
                  ))}
                </div>

                {demoChannel === "upi" && (
                  <div className="gatewayOptionContent">
                    <h4>Pay with UPI</h4>
                    <p className="gatewayMuted">Select a familiar app to preview the flow.</p>
                    <div className="gatewayAppChoices">
                      {["Google Pay", "PhonePe", "Paytm", "Other UPI"].map((app) => (
                        <button type="button" key={app} className={`gatewayAppChoice ${demoApp === app ? "active" : ""}`} onClick={() => setDemoApp(app)} aria-pressed={demoApp === app}>
                          <span className={`gatewayAppLogo appLogo${app.replace(/\s/g, "")}`}>{app === "Google Pay" ? "G" : app === "PhonePe" ? "पे" : app === "Paytm" ? "P" : "UPI"}</span>
                          <span>{app}</span>
                        </button>
                      ))}
                    </div>
                    <div className="gatewayInfoStrip"><span>ⓘ</span><p><strong>{demoApp} demo</strong><br />In a live gateway this would open the selected app. Here, continue to simulate the checkout only.</p></div>
                  </div>
                )}

                {demoChannel === "card" && (
                  <div className="gatewayOptionContent">
                    <h4>Credit or debit card</h4>
                    <div className="gatewayCardPreview">
                      <div className="gatewayCardPreviewTop"><span>FOOD APP</span><span>DEMO CARD</span></div>
                      <div className="gatewayCardNumber">•••• &nbsp; •••• &nbsp; •••• &nbsp; 4242</div>
                      <div className="gatewayCardPreviewBottom"><span>TEST PAYMENT</span><strong>VISA</strong></div>
                    </div>
                    <div className="gatewayInfoStrip"><span>ⓘ</span><p>This sample card is only a visual preview. <strong>Do not enter real card details.</strong> No card data is needed for this simulation.</p></div>
                  </div>
                )}

                {demoChannel === "netbanking" && (
                  <div className="gatewayOptionContent">
                    <h4>Choose your bank</h4>
                    <label className="gatewayFieldLabel" htmlFor="demoBank">Bank for demo</label>
                    <select id="demoBank" className="gatewaySelect" value={demoBank} onChange={(event) => setDemoBank(event.target.value)}>
                      {["State Bank of India", "HDFC Bank", "ICICI Bank", "Axis Bank", "Kotak Mahindra Bank", "Punjab National Bank"].map((bank) => <option key={bank} value={bank}>{bank}</option>)}
                    </select>
                    <div className="gatewayInfoStrip"><span>ⓘ</span><p><strong>{demoBank}</strong> is selected for display only. This demo will not open a bank website or request bank credentials.</p></div>
                  </div>
                )}

                {demoChannel === "wallet" && (
                  <div className="gatewayOptionContent">
                    <h4>Choose a wallet</h4>
                    <div className="gatewayWalletChoices">
                      {["Paytm Wallet", "Amazon Pay", "Mobikwik"].map((wallet) => (
                        <button type="button" key={wallet} className={`gatewayWalletChoice ${demoWallet === wallet ? "active" : ""}`} onClick={() => setDemoWallet(wallet)} aria-pressed={demoWallet === wallet}>
                          <span>{wallet === "Paytm Wallet" ? "P" : wallet === "Amazon Pay" ? "a" : "M"}</span>
                          {wallet}
                        </button>
                      ))}
                    </div>
                    <div className="gatewayInfoStrip"><span>ⓘ</span><p><strong>{demoWallet}</strong> selected for demo. No wallet account is connected.</p></div>
                  </div>
                )}

                {paymentMethod === "demo" && (<details className="gatewayAdvancedDemo" open={showAdvancedDemo} onToggle={(event) => setShowAdvancedDemo(event.currentTarget.open)}>
                  <summary>Developer test scenarios <span>Optional</span></summary>
                  <p>For project demonstrations only, choose what the mock gateway returns after you click Pay.</p>
                  <div className="gatewayScenarioChoices">
                    <button type="button" className={`gatewayScenario ${demoOutcome === "success" ? "active" : ""}`} onClick={() => { setDemoOutcome("success"); setOrderError(""); }}>✓ Success</button>
                    <button type="button" className={`gatewayScenario ${demoOutcome === "failure" ? "active" : ""}`} onClick={() => { setDemoOutcome("failure"); setOrderError(""); }}>✕ Failure</button>
                    <button type="button" className={`gatewayScenario ${demoOutcome === "cancel" ? "active" : ""}`} onClick={() => { setDemoOutcome("cancel"); setOrderError(""); }}>↩ Cancel</button>
                  </div>
                </details>)}
                <div className="gatewayDemoFooter"><span>🔒</span> {paymentMethod === "payu" ? "PayU test environment · No live payment" : "Demo simulation · No real payment · No credentials required"}</div>
              </div>
            )}

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
                {paymentMethod === "demo" ? "Authorizing demo payment..." : paymentMethod === "payu" ? "Opening PayU test checkout..." : "Processing..."}
              </>
            ) : (
              <>
                {paymentMethod === "demo" ? "Pay ₹" + grandTotal.toFixed(2) + " · Demo" : paymentMethod === "payu" ? "Continue to PayU Test" : "Place Order"}
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