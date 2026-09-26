import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { API_URL } from "../config/api";
import "../Styles/Cart.css";
import FoodRecommendations from "../Components/FoodRecommendations";

function Cart() {
  const navigate = useNavigate();
  const { cartItems, increaseQuantity, decreaseQuantity, removeFromCart, getCartTotal } = useCart();
  const { showToast } = useToast();
  const [deliveryType, setDeliveryType] = useState("delivery");
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponMessage, setCouponMessage] = useState("");
  const [couponLoading, setCouponLoading] = useState(true);

  const loadCoupons = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/coupons`);
      const data = await response.json();
      if (response.ok && data.success) setAvailableCoupons(data.coupons || []);
    } catch (error) { console.error("Load coupons error:", error); }
    finally { setCouponLoading(false); }
  }, []);

  useEffect(() => { loadCoupons(); }, [loadCoupons]);

  const subtotal = getCartTotal();
  const totalQuantity = cartItems.reduce((total, item) => total + item.quantity, 0);
  const discount = appliedCoupon && subtotal >= Number(appliedCoupon.minimum)
    ? Math.min(
        appliedCoupon.type === "percentage"
          ? (subtotal * Number(appliedCoupon.value)) / 100
          : Math.min(Number(appliedCoupon.value), subtotal),
        appliedCoupon.maxDiscount !== null && appliedCoupon.maxDiscount !== undefined && Number.isFinite(Number(appliedCoupon.maxDiscount))
          ? Number(appliedCoupon.maxDiscount)
          : Infinity,
        subtotal
      )
    : 0;
  const discountedSubtotal = Math.max(subtotal - discount, 0);
  const deliveryFee = deliveryType === "pickup" ? 0 : discountedSubtotal >= 40 ? 0 : 2.99;
  const serviceFee = deliveryType === "delivery" ? 1.49 : 0;
  const tax = (discountedSubtotal + serviceFee) * 0.05;
  const grandTotal = discountedSubtotal + deliveryFee + serviceFee + tax;

  useEffect(() => {
    if (appliedCoupon && subtotal < Number(appliedCoupon.minimum)) {
      setCouponMessage(`Coupon ${appliedCoupon.code} was removed because the minimum order value is ₹${Number(appliedCoupon.minimum).toFixed(2)}.`);
      setAppliedCoupon(null);
      setCouponCode("");
    }
  }, [subtotal, appliedCoupon]);

  const handleApplyCoupon = () => {
    const enteredCode = couponCode.trim().toUpperCase();
    if (!enteredCode) return setCouponMessage("Please enter a coupon code.");
    const coupon = availableCoupons.find((item) => item.code === enteredCode && item.active);
    if (!coupon) return setCouponMessage("Invalid or inactive coupon code. Please try another one.");
    if (subtotal < Number(coupon.minimum)) return setCouponMessage(`Minimum order value for this coupon is ₹${Number(coupon.minimum).toFixed(2)}.`);
    setAppliedCoupon(coupon);
    setCouponCode(coupon.code);
    setCouponMessage(`Coupon ${coupon.code} applied successfully!`);
  };

  const handleRemoveCoupon = () => { setAppliedCoupon(null); setCouponCode(""); setCouponMessage(""); showToast("Coupon removed", "info"); };
  const handleSelectCoupon = (coupon) => { setCouponCode(coupon.code); setCouponMessage(""); };
  const handleProceedToCheckout = () => {
    const checkoutState = {
      cartItems,
      subtotal,
      discount,
      deliveryFee,
      serviceFee,
      tax,
      grandTotal,
      deliveryType,
      coupon: appliedCoupon,
    };

    // Pickup orders do not need a delivery address.
    navigate(deliveryType === "pickup" ? "/payment" : "/delivery-address", {
      state: checkoutState,
    });
  };
  const getCartItemKey = (item) => item.cartItemId || item._id || item.id;

  if (!cartItems.length) return <div className="emptyCart"><div className="emptyCartIcon">🛒</div><h1>Your Cart is Empty</h1><p>Looks like you haven't added anything to your cart yet.</p><Link to="/menu"><button className="continueShopping">Browse Menu</button></Link></div>;

  return (
    <div className="cartPage">
      <div className="cartPageHeader"><div><h1>Your Cart</h1><p>{totalQuantity} {totalQuantity === 1 ? "item" : "items"} in your cart</p></div><Link to="/menu">← Continue Shopping</Link></div>
      <div className="cartLayout">
        <div className="cartMain">
          <div className="cartCard"><div className="cartCardHeader"><h2>Order Items</h2><span>{totalQuantity} {totalQuantity === 1 ? "item" : "items"}</span></div><div className="cartItems">
            {cartItems.map((item) => { const itemId = getCartItemKey(item); return <div className="cartItem" key={itemId}>
              <div className="cartItemImage" style={{ backgroundImage: `url(${item.image})` }}></div>
              <div className="cartItemDetails"><span className="cartItemCategory">{item.category}</span><h3>{item.name}</h3><p className="cartItemUnitPrice">₹{Number(item.price).toFixed(2)} each</p>
                {item.cookingRequest && <div className="cartCookingRequest"><span>Cooking request:</span><p>{item.cookingRequest}</p></div>}
                <div className="cartItemBottom"><div className="cartQuantity"><button type="button" onClick={() => decreaseQuantity(itemId)} aria-label={`Decrease quantity of ${item.name}`}>−</button><span>{item.quantity}</span><button type="button" onClick={() => increaseQuantity(itemId)} aria-label={`Increase quantity of ${item.name}`}>+</button></div><button type="button" className="removeButton" onClick={() => removeFromCart(itemId)}>Remove</button></div>
              </div>
              <div className="cartItemTotal">₹{(item.price * item.quantity).toFixed(2)}</div>
            </div>; })}
          </div></div>

          <div className="cartCard"><div className="cartCardHeader"><h2>Delivery Method</h2></div><div className="deliveryOptions">
            {[{ key: "delivery", icon: "🛵", title: "Delivery", text: "Get your food delivered" }, { key: "pickup", icon: "🏪", title: "Pickup", text: "Pick up from restaurant" }].map((option) => <button type="button" key={option.key} className={`deliveryOption ${deliveryType === option.key ? "active" : ""}`} onClick={() => setDeliveryType(option.key)}><span className="deliveryIcon">{option.icon}</span><span><strong>{option.title}</strong><small>{option.text}</small></span><span className="deliveryCheck">{deliveryType === option.key ? "✓" : ""}</span></button>)}
          </div></div>

          {deliveryType === "pickup" && <div className="cartCard"><div className="cartCardHeader"><h2>Pickup Information</h2></div><div className="addressNote">🏪 You will collect your order from our restaurant.</div></div>}

          <div className="cartCard"><div className="cartCardHeader"><h2>Offers & Coupons</h2></div><div className="couponBox">
            <div className="couponInput"><span>🏷️</span><input type="text" value={couponCode} onChange={(event) => { setCouponCode(event.target.value.toUpperCase()); setCouponMessage(""); }} onKeyDown={(event) => event.key === "Enter" && handleApplyCoupon()} placeholder="Enter coupon code" maxLength={20}/><button type="button" onClick={handleApplyCoupon} disabled={!couponCode.trim() || couponLoading}>Apply</button></div>
            {couponMessage && <p className={`couponMessage ${appliedCoupon ? "success" : "error"}`}>{couponMessage}</p>}
            <div className="availableCoupons"><p>Available Coupons</p>{availableCoupons.map((coupon) => <button type="button" key={coupon.id || coupon.code} onClick={() => handleSelectCoupon(coupon)}><strong>{coupon.code}</strong><span>{coupon.type === "percentage" ? `${coupon.value}% OFF` : `₹${Number(coupon.value).toFixed(2)} OFF`} on orders above ₹{Number(coupon.minimum).toFixed(2)}</span></button>)}{!couponLoading && !availableCoupons.length && <small>No active coupons available right now.</small>}</div>
            {appliedCoupon && <div className="appliedCoupon"><span className="couponAppliedIcon">✓</span><div><strong>{appliedCoupon.code}</strong><p>Coupon applied</p></div><button type="button" onClick={handleRemoveCoupon}>Remove</button></div>}
          </div></div>
        </div>

        <aside className="cartSummary">
          {deliveryType === "delivery" && deliveryFee > 0 && <div className="deliveryProgress"><div><strong>₹{Math.max(40 - discountedSubtotal, 0).toFixed(2)}</strong> away from FREE delivery</div><div className="deliveryProgressBar"><span style={{ width: `${Math.min((discountedSubtotal / 40) * 100, 100)}%` }} /></div></div><div className="summaryHeader"><h2>Order Summary</h2></div><div className="summaryRows">
          <div className="summaryRow"><span>Subtotal</span><strong>₹{subtotal.toFixed(2)}</strong></div>
          {discount > 0 && <div className="summaryRow discountRow"><span>Discount</span><strong>-₹{discount.toFixed(2)}</strong></div>}
          <div className="summaryRow"><span>Delivery Fee</span><strong>{deliveryFee === 0 ? "FREE" : `₹${deliveryFee.toFixed(2)}`}</strong></div>
          <div className="summaryRow"><span>Service Fee</span><strong>₹{serviceFee.toFixed(2)}</strong></div>
          <div className="summaryRow"><span>Tax</span><strong>₹{tax.toFixed(2)}</strong></div>
        </div>
        {deliveryType === "delivery" && deliveryFee === 0 && <p className="freeDeliveryMessage">🎉 You unlocked FREE delivery!</p>}
        <div className="summaryDivider"></div><div className="summaryRow grandTotal"><span>Total</span><strong>₹{grandTotal.toFixed(2)}</strong></div>
        {discount > 0 && <p className="totalSavings">You saved ₹{discount.toFixed(2)}</p>}
        <button type="button" className="checkoutButton" onClick={handleProceedToCheckout}>{deliveryType === "delivery" ? "Proceed to Address" : "Proceed to Checkout"}<span>→</span></button><p className="secureCheckout">🔒 Secure checkout</p></aside>
      </div>
    </div>
  );
}

export default Cart;
