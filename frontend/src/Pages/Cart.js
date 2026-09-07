import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import "../Styles/Cart.css";

function Cart() {
  const navigate = useNavigate();

  const {
    cartItems,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    getCartTotal,
  } = useCart();

  const [deliveryType, setDeliveryType] = useState("delivery");

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponMessage, setCouponMessage] = useState("");

  // -----------------------------------------
  // AVAILABLE COUPONS
  // -----------------------------------------

  const availableCoupons = [
    {
      code: "WELCOME20",
      description: "20% OFF on orders above $20",
      type: "percentage",
      value: 20,
      minimum: 20,
    },
    {
      code: "SAVE10",
      description: "$10 OFF on orders above $30",
      type: "fixed",
      value: 10,
      minimum: 30,
    },
    {
      code: "FOOD5",
      description: "$5 OFF on orders above $15",
      type: "fixed",
      value: 5,
      minimum: 15,
    },
  ];

  // -----------------------------------------
  // CART CALCULATIONS
  // -----------------------------------------

  const subtotal = getCartTotal();

  const totalQuantity = cartItems.reduce(
    (total, item) => total + item.quantity,
    0
  );

  // -----------------------------------------
  // DISCOUNT
  // -----------------------------------------

  const calculateDiscount = () => {
    if (!appliedCoupon) {
      return 0;
    }

    if (subtotal < appliedCoupon.minimum) {
      return 0;
    }

    if (appliedCoupon.type === "percentage") {
      return (subtotal * appliedCoupon.value) / 100;
    }

    return appliedCoupon.value;
  };

  const discount = calculateDiscount();

  const discountedSubtotal = Math.max(
    subtotal - discount,
    0
  );

  // -----------------------------------------
  // DELIVERY FEE
  // -----------------------------------------

  const deliveryFee =
    deliveryType === "pickup"
      ? 0
      : discountedSubtotal >= 40
      ? 0
      : 2.99;

  // -----------------------------------------
  // SERVICE FEE
  // -----------------------------------------

  const serviceFee =
    deliveryType === "delivery"
      ? 1.49
      : 0;

  // -----------------------------------------
  // TAX
  // -----------------------------------------

  const tax =
    (discountedSubtotal + serviceFee) * 0.05;

  // -----------------------------------------
  // FINAL TOTAL
  // -----------------------------------------

  const grandTotal =
    discountedSubtotal +
    deliveryFee +
    serviceFee +
    tax;

  // -----------------------------------------
  // APPLY COUPON
  // -----------------------------------------

  const handleApplyCoupon = () => {
    const enteredCode = couponCode
      .trim()
      .toUpperCase();

    if (!enteredCode) {
      setCouponMessage(
        "Please enter a coupon code."
      );
      return;
    }

    const coupon = availableCoupons.find(
      (item) => item.code === enteredCode
    );

    if (!coupon) {
      setCouponMessage(
        "Invalid coupon code."
      );
      setAppliedCoupon(null);
      return;
    }

    if (subtotal < coupon.minimum) {
      setCouponMessage(
        `Minimum order value for this coupon is $${coupon.minimum.toFixed(
          2
        )}.`
      );
      setAppliedCoupon(null);
      return;
    }

    setAppliedCoupon(coupon);
    setCouponCode(coupon.code);

    setCouponMessage(
      `Coupon ${coupon.code} applied successfully!`
    );
  };

  // -----------------------------------------
  // REMOVE COUPON
  // -----------------------------------------

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponMessage("");
  };

  // -----------------------------------------
  // GO TO DELIVERY ADDRESS
  // -----------------------------------------

  const handleProceedToCheckout = () => {
    navigate("/delivery-address", {
      state: {
        cartItems,
        subtotal,
        discount,
        deliveryFee,
        serviceFee,
        tax,
        grandTotal,
        deliveryType,
        coupon: appliedCoupon,
      },
    });
  };

  // -----------------------------------------
  // EMPTY CART
  // -----------------------------------------

  if (cartItems.length === 0) {
    return (
      <div className="emptyCart">

        <div className="emptyCartIcon">
          🛒
        </div>

        <h1>Your Cart is Empty</h1>

        <p>
          Looks like you haven't added anything to your
          cart yet.
        </p>

        <Link to="/menu">
          <button className="continueShopping">
            Browse Menu
          </button>
        </Link>

      </div>
    );
  }

  // -----------------------------------------
  // MAIN CART
  // -----------------------------------------

  return (
    <div className="cartPage">

      {/* =====================================
          PAGE HEADER
      ===================================== */}

      <div className="cartPageHeader">

        <div>

          <h1>Your Cart</h1>

          <p>
            {totalQuantity}{" "}
            {totalQuantity === 1
              ? "item"
              : "items"}{" "}
            in your cart
          </p>

        </div>

        <Link to="/menu">
          ← Continue Shopping
        </Link>

      </div>

      <div className="cartLayout">

        {/* =====================================
            LEFT SIDE
        ===================================== */}

        <div className="cartMain">

          {/* ===================================
              CART ITEMS
          =================================== */}

          <div className="cartCard">

            <div className="cartCardHeader">

              <h2>
                Order Items
              </h2>

              <span>
                {totalQuantity} items
              </span>

            </div>

            <div className="cartItems">

              {cartItems.map((item) => (

                <div
                  className="cartItem"
                  key={item.id}
                >

                  {/* IMAGE */}

                  <div
                    className="cartItemImage"
                    style={{
                      backgroundImage:
                        `url(${item.image})`,
                    }}
                  ></div>

                  {/* DETAILS */}

                  <div className="cartItemDetails">

                    <span className="cartItemCategory">
                      {item.category}
                    </span>

                    <h3>
                      {item.name}
                    </h3>

                    <p className="cartItemUnitPrice">
                      ${item.price.toFixed(2)} each
                    </p>

                    <div className="cartItemBottom">

                      {/* QUANTITY */}

                      <div className="cartQuantity">

                        <button
                          type="button"
                          onClick={() =>
                            decreaseQuantity(item.id)
                          }
                        >
                          −
                        </button>

                        <span>
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            increaseQuantity(item.id)
                          }
                        >
                          +
                        </button>

                      </div>

                      {/* REMOVE */}

                      <button
                        type="button"
                        className="removeButton"
                        onClick={() =>
                          removeFromCart(item.id)
                        }
                      >
                        Remove
                      </button>

                    </div>

                  </div>

                  {/* ITEM TOTAL */}

                  <div className="cartItemTotal">

                    $
                    {(
                      item.price *
                      item.quantity
                    ).toFixed(2)}

                  </div>

                </div>

              ))}

            </div>

          </div>

          {/* ===================================
              DELIVERY METHOD
          =================================== */}

          <div className="cartCard">

            <div className="cartCardHeader">

              <h2>
                Delivery Method
              </h2>

            </div>

            <div className="deliveryOptions">

              {/* DELIVERY */}

              <button
                type="button"
                className={`deliveryOption ${
                  deliveryType === "delivery"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setDeliveryType("delivery")
                }
              >

                <span className="deliveryIcon">
                  🛵
                </span>

                <span>

                  <strong>
                    Delivery
                  </strong>

                  <small>
                    Get your food delivered
                  </small>

                </span>

                <span className="deliveryCheck">

                  {deliveryType === "delivery"
                    ? "✓"
                    : ""}

                </span>

              </button>

              {/* PICKUP */}

              <button
                type="button"
                className={`deliveryOption ${
                  deliveryType === "pickup"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setDeliveryType("pickup")
                }
              >

                <span className="deliveryIcon">
                  🏪
                </span>

                <span>

                  <strong>
                    Pickup
                  </strong>

                  <small>
                    Pick up from restaurant
                  </small>

                </span>

                <span className="deliveryCheck">

                  {deliveryType === "pickup"
                    ? "✓"
                    : ""}

                </span>

              </button>

            </div>

          </div>

          {/* ===================================
              LOCATION INFORMATION
          =================================== */}

          {deliveryType === "delivery" && (
            <div className="cartCard">

              <div className="cartCardHeader">

                <h2>
                  Delivery Location
                </h2>

              </div>

              <div className="addressNote">

                📍 Your delivery address and exact
                location will be selected on the next
                step using the map.

              </div>

              <button
                type="button"
                className="checkoutButton"
                onClick={handleProceedToCheckout}
              >
                Select Delivery Location
                <span>→</span>
              </button>

            </div>
          )}

          {/* ===================================
              PICKUP INFORMATION
          =================================== */}

          {deliveryType === "pickup" && (
            <div className="cartCard">

              <div className="cartCardHeader">

                <h2>
                  Pickup Information
                </h2>

              </div>

              <div className="addressNote">

                🏪 You will collect your order from
                our restaurant.

              </div>

            </div>
          )}

          {/* ===================================
              COUPONS
          =================================== */}

          <div className="cartCard">

            <div className="cartCardHeader">

              <h2>
                Offers & Coupons
              </h2>

            </div>

            <div className="couponBox">

              {/* INPUT */}

              <div className="couponInput">

                <span>
                  🏷️
                </span>

                <input
                  type="text"
                  value={couponCode}
                  onChange={(event) =>
                    setCouponCode(
                      event.target.value
                    )
                  }
                  placeholder="Enter coupon code"
                />

                <button
                  type="button"
                  onClick={handleApplyCoupon}
                >
                  Apply
                </button>

              </div>

              {/* MESSAGE */}

              {couponMessage && (
                <p
                  className={`couponMessage ${
                    appliedCoupon
                      ? "success"
                      : "error"
                  }`}
                >
                  {couponMessage}
                </p>
              )}

              {/* AVAILABLE COUPONS */}

              <div className="availableCoupons">

                <p>
                  Available Coupons
                </p>

                {availableCoupons.map(
                  (coupon) => (

                    <button
                      type="button"
                      key={coupon.code}
                      onClick={() => {
                        setCouponCode(
                          coupon.code
                        );
                        setCouponMessage("");
                      }}
                    >

                      <strong>
                        {coupon.code}
                      </strong>

                      <span>
                        {coupon.description}
                      </span>

                    </button>

                  )
                )}

              </div>

              {/* APPLIED COUPON */}

              {appliedCoupon && (

                <div className="appliedCoupon">

                  <span className="couponAppliedIcon">
                    ✓
                  </span>

                  <div>

                    <strong>
                      {appliedCoupon.code}
                    </strong>

                    <p>
                      Coupon applied
                    </p>

                  </div>

                  <button
                    type="button"
                    onClick={
                      handleRemoveCoupon
                    }
                  >
                    Remove
                  </button>

                </div>

              )}

            </div>

          </div>

        </div>

        {/* =====================================
            RIGHT SIDE
        ===================================== */}

        <aside className="cartSummary">

          <div className="summaryHeader">

            <h2>
              Order Summary
            </h2>

          </div>

          <div className="summaryRows">

            {/* SUBTOTAL */}

            <div className="summaryRow">

              <span>
                Subtotal
              </span>

              <strong>
                ${subtotal.toFixed(2)}
              </strong>

            </div>

            {/* DISCOUNT */}

            {discount > 0 && (

              <div className="summaryRow discountRow">

                <span>
                  Discount
                </span>

                <strong>
                  -${discount.toFixed(2)}
                </strong>

              </div>

            )}

            {/* DELIVERY */}

            <div className="summaryRow">

              <span>
                Delivery Fee
              </span>

              <strong>

                {deliveryFee === 0
                  ? "FREE"
                  : `$${deliveryFee.toFixed(2)}`}

              </strong>

            </div>

            {/* SERVICE */}

            <div className="summaryRow">

              <span>
                Service Fee
              </span>

              <strong>
                ${serviceFee.toFixed(2)}
              </strong>

            </div>

            {/* TAX */}

            <div className="summaryRow">

              <span>
                Tax
              </span>

              <strong>
                ${tax.toFixed(2)}
              </strong>

            </div>

          </div>

          {/* FREE DELIVERY */}

          {deliveryType === "delivery" &&
            deliveryFee === 0 && (

              <p className="freeDeliveryMessage">
                🎉 You unlocked FREE delivery!
              </p>

            )}

          {/* DIVIDER */}

          <div className="summaryDivider"></div>

          {/* TOTAL */}

          <div className="summaryRow grandTotal">

            <span>
              Total
            </span>

            <strong>
              ${grandTotal.toFixed(2)}
            </strong>

          </div>

          {/* SAVINGS */}

          {discount > 0 && (

            <p className="totalSavings">
              You saved ${discount.toFixed(2)}
            </p>

          )}

          {/* MAIN CHECKOUT BUTTON */}

          <button
            type="button"
            className="checkoutButton"
            onClick={handleProceedToCheckout}
          >

            {deliveryType === "delivery"
              ? "Proceed to Address"
              : "Proceed to Checkout"}

            <span>
              →
            </span>

          </button>

          <p className="secureCheckout">
            🔒 Secure checkout
          </p>

        </aside>

      </div>

    </div>
  );
}

export default Cart;