import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import "../Styles/Checkout.css";

function Checkout() {
  const { cartItems, getCartTotal } = useCart();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    pincode: "",
  });

  const [paymentMethod, setPaymentMethod] = useState("card");

  const deliveryFee = 2.99;
  const subtotal = getCartTotal();
  const total = subtotal + deliveryFee;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

   alert(
     `Order placed successfully!\nPayment Method: ${paymentMethod}`
   );

    console.log("Customer Details:", formData);
    console.log("Payment Method:", paymentMethod);
    console.log("Cart Items:", cartItems);
    console.log("Total:", total);
  };

  if (cartItems.length === 0) {
    return (
      <div className="emptyCheckout">
        <h1>Your Cart is Empty</h1>
        <p>Please add some food before going to checkout.</p>

        <Link to="/menu">
          <button>Browse Menu</button>
        </Link>
      </div>
    );
  }

  return (
    <div className="checkoutPage">
      <div className="checkoutContainer">

        <div className="checkoutHeader">
          <h1>Checkout</h1>
          <p>Complete your order securely.</p>
        </div>

        <div className="checkoutContent">

          {/* LEFT SIDE */}
          <div>

            {/* DELIVERY INFORMATION */}
            <form
              className="checkoutForm"
              onSubmit={handleSubmit}
            >
              <h2>Delivery Information</h2>

              <div className="formGroup">
                <label>Full Name</label>

                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className="formGroup">
                <label>Phone Number</label>

                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter your phone number"
                  required
                />
              </div>

              <div className="formGroup">
                <label>Address</label>

                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter your complete delivery address"
                  rows="4"
                  required
                ></textarea>
              </div>

              <div className="formRow">

                <div className="formGroup">
                  <label>City</label>

                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="City"
                    required
                  />
                </div>

                <div className="formGroup">
                  <label>PIN Code</label>

                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    placeholder="PIN Code"
                    required
                  />
                </div>

              </div>
            </form>

            {/* PAYMENT SECTION */}
            <div className="paymentBox">

              <div className="paymentHeader">
                <h2>Payment Options</h2>
                <span>100% Secure</span>
              </div>

              <div className="paymentLayout">

                {/* PAYMENT MENU */}
                <div className="paymentMenu">

                  <button
                    type="button"
                    className={
                      paymentMethod === "card"
                        ? "paymentMenuItem active"
                        : "paymentMenuItem"
                    }
                    onClick={() => setPaymentMethod("card")}
                  >
                    <span className="paymentIcon">💳</span>
                    <span>Credit / Debit Card</span>
                  </button>

                  <button
                    type="button"
                    className={
                      paymentMethod === "upi"
                        ? "paymentMenuItem active"
                        : "paymentMenuItem"
                    }
                    onClick={() => setPaymentMethod("upi")}
                  >
                    <span className="paymentIcon">📱</span>
                    <span>UPI</span>
                  </button>

                  <button
                    type="button"
                    className={
                      paymentMethod === "netbanking"
                        ? "paymentMenuItem active"
                        : "paymentMenuItem"
                    }
                    onClick={() =>
                      setPaymentMethod("netbanking")
                    }
                  >
                    <span className="paymentIcon">🏦</span>
                    <span>Net Banking</span>
                  </button>

                  <button
                    type="button"
                    className={
                      paymentMethod === "cod"
                        ? "paymentMenuItem active"
                        : "paymentMenuItem"
                    }
                    onClick={() => setPaymentMethod("cod")}
                  >
                    <span className="paymentIcon">💰</span>
                    <span>Cash on Delivery</span>
                  </button>

                  <button
                    type="button"
                    className={
                      paymentMethod === "wallet"
                        ? "paymentMenuItem active"
                        : "paymentMenuItem"
                    }
                    onClick={() => setPaymentMethod("wallet")}
                  >
                    <span className="paymentIcon">🎁</span>
                    <span>Wallet / Gift Card</span>
                  </button>

                </div>

                {/* PAYMENT CONTENT */}
                <div className="paymentDetails">

                  {/* CARD */}
                  {paymentMethod === "card" && (
                    <div className="paymentContent">

                      <h3>Credit / Debit Card</h3>

                      <p className="paymentDescription">
                        Enter your card details to continue.
                      </p>

                      <div className="paymentFormGroup">
                        <label>Card Number</label>

                        <input
                          type="text"
                          placeholder="XXXX XXXX XXXX XXXX"
                          maxLength="19"
                        />
                      </div>

                      <div className="paymentFormRow">

                        <div className="paymentFormGroup">
                          <label>Expiry Date</label>

                          <input
                            type="text"
                            placeholder="MM / YY"
                            maxLength="5"
                          />
                        </div>

                        <div className="paymentFormGroup">
                          <label>CVV</label>

                          <input
                            type="password"
                            placeholder="•••"
                            maxLength="3"
                          />
                        </div>

                      </div>

                      <label className="savePayment">
                        <input type="checkbox" />
                        Save card for future payments
                      </label>

                    </div>
                  )}

                  {/* UPI */}
                  {paymentMethod === "upi" && (
                    <div className="paymentContent">

                      <h3>Pay using UPI</h3>

                      <p className="paymentDescription">
                        Enter your UPI ID to make a secure payment.
                      </p>

                      <div className="paymentFormGroup">
                        <label>UPI ID</label>

                        <input
                          type="text"
                          placeholder="example@upi"
                        />
                      </div>

                      <button
                        type="button"
                        className="verifyButton"
                      >
                        Verify UPI ID
                      </button>

                      <div className="orDivider">
                        <span>OR</span>
                      </div>

                      <button
                        type="button"
                        className="qrButton"
                      >
                        Scan QR Code
                      </button>

                    </div>
                  )}

                  {/* NET BANKING */}
                  {paymentMethod === "netbanking" && (
                    <div className="paymentContent">

                      <h3>Net Banking</h3>

                      <p className="paymentDescription">
                        Select your bank to continue.
                      </p>

                      <div className="bankGrid">

                        <button type="button">
                          SBI
                        </button>

                        <button type="button">
                          HDFC Bank
                        </button>

                        <button type="button">
                          ICICI Bank
                        </button>

                        <button type="button">
                          Axis Bank
                        </button>

                      </div>

                      <select className="bankSelect">
                        <option value="">
                          Select Other Bank
                        </option>

                        <option>Bank of India</option>
                        <option>Canara Bank</option>
                        <option>Punjab National Bank</option>
                        <option>Union Bank</option>
                      </select>

                    </div>
                  )}

                  {/* COD */}
                  {paymentMethod === "cod" && (
                    <div className="paymentContent codContent">

                      <div className="codIcon">
                        💰
                      </div>

                      <h3>Cash on Delivery</h3>

                      <p>
                        Pay in cash when your order is delivered
                        to your doorstep.
                      </p>

                      <div className="codInfo">
                        ✓ No online payment required
                        <br />
                        ✓ Pay after receiving your order
                        <br />
                        ✓ Keep exact change if possible
                      </div>

                    </div>
                  )}

                  {/* WALLET */}
                  {paymentMethod === "wallet" && (
                    <div className="paymentContent">

                      <h3>Wallet / Gift Card</h3>

                      <p className="paymentDescription">
                        Enter your wallet or gift card details.
                      </p>

                      <div className="paymentFormGroup">
                        <label>Gift Card / Wallet Code</label>

                        <input
                          type="text"
                          placeholder="Enter code"
                        />
                      </div>

                      <button
                        type="button"
                        className="verifyButton"
                      >
                        Apply Code
                      </button>

                    </div>
                  )}

                </div>

              </div>

              {/* PLACE ORDER */}
              <button
                type="submit"
                className="placeOrderButton"
                onClick={handleSubmit}
              >
                Place Order — ${total.toFixed(2)}
              </button>

            </div>

          </div>

          {/* RIGHT SIDE - ORDER SUMMARY */}
          <div className="checkoutSummary">

            <h2>Your Order</h2>

            <div className="checkoutItems">

              {cartItems.map((item) => (
                <div
                  className="checkoutItem"
                  key={item.id}
                >
                  <img
                    src={item.image}
                    alt={item.name}
                  />

                  <div className="checkoutItemInfo">
                    <h3>{item.name}</h3>

                    <p>
                      Qty: {item.quantity}
                    </p>
                  </div>

                  <strong>
                    ${(item.price * item.quantity).toFixed(2)}
                  </strong>
                </div>
              ))}

            </div>

            <div className="checkoutDivider"></div>

            <div className="checkoutSummaryRow">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>

            <div className="checkoutSummaryRow">
              <span>Delivery Fee</span>
              <span>${deliveryFee.toFixed(2)}</span>
            </div>

            <div className="checkoutTotal">
              <span>Total</span>
              <strong>${total.toFixed(2)}</strong>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

export default Checkout;

