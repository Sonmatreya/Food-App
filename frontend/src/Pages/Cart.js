import React from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import "../Styles/Cart.css";

function Cart() {
  const {
    cartItems,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    getCartTotal,
  } = useCart();

  const total = getCartTotal();

  if (cartItems.length === 0) {
    return (
      <div className="emptyCart">
        <div className="emptyCartIcon">🛒</div>

        <h1>Your Cart is Empty</h1>

        <p>
          Looks like you haven't added any delicious food yet.
        </p>

        <Link to="/menu">
          <button className="continueShopping">
            Browse Menu
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="cartPage">
      <div className="cartContainer">

        <div className="cartHeader">
          <h1>Your Cart</h1>
          <p>{cartItems.length} item(s) in your cart</p>
        </div>

        <div className="cartContent">

          {/* CART ITEMS */}

          <div className="cartItems">

            {cartItems.map((item) => (
              <div className="cartItem" key={item.id}>

                <img
                  src={item.image}
                  alt={item.name}
                  className="cartItemImage"
                />

                <div className="cartItemDetails">

                  <h2>{item.name}</h2>

                  <p className="cartItemCategory">
                    {item.category}
                  </p>

                  <p className="cartItemPrice">
                    ${item.price.toFixed(2)}
                  </p>

                  <div className="cartItemActions">

                    <div className="cartQuantity">

                      <button
                        onClick={() => decreaseQuantity(item.id)}
                      >
                        −
                      </button>

                      <span>{item.quantity}</span>

                      <button
                        onClick={() => increaseQuantity(item.id)}
                      >
                        +
                      </button>

                    </div>

                    <button
                      className="removeButton"
                      onClick={() => removeFromCart(item.id)}
                    >
                      Remove
                    </button>

                  </div>

                </div>

                <div className="cartItemSubtotal">
                  ${(item.price * item.quantity).toFixed(2)}
                </div>

              </div>
            ))}

          </div>

          {/* ORDER SUMMARY */}

          <div className="cartSummary">

            <h2>Order Summary</h2>

            <div className="summaryRow">
              <span>Subtotal</span>
              <span>${total.toFixed(2)}</span>
            </div>

            <div className="summaryRow">
              <span>Delivery Fee</span>
              <span>$2.99</span>
            </div>

            <div className="summaryDivider"></div>

            <div className="summaryTotal">
              <span>Total</span>
              <strong>${(total + 2.99).toFixed(2)}</strong>
            </div>

            <Link to="/checkout">
              <button className="checkoutButton">
                Proceed to Checkout
              </button>
            </Link>

            <Link to="/menu" className="continueShoppingLink">
              ← Continue Shopping
            </Link>

          </div>

        </div>

      </div>
    </div>
  );
}

export default Cart;