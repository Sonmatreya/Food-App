import React, {
  createContext,
  useContext,
  useState,
} from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);

  // ==========================================
  // ADD ITEM TO CART
  // ==========================================

  const addToCart = (
    food,
    quantity = 1,
    cookingRequest = ""
  ) => {
    setCartItems((currentItems) => {
      const existingItem = currentItems.find(
        (item) => item.id === food.id
      );

      // If item already exists
      if (existingItem) {
        return currentItems.map((item) =>
          item.id === food.id
            ? {
                ...item,

                quantity:
                  item.quantity + quantity,

                // Update cooking request if a
                // new request was provided
                cookingRequest:
                  cookingRequest ||
                  item.cookingRequest ||
                  "",
              }
            : item
        );
      }

      // Add new item
      return [
        ...currentItems,
        {
          ...food,

          quantity: quantity,

          cookingRequest:
            cookingRequest || "",
        },
      ];
    });
  };

  // ==========================================
  // INCREASE QUANTITY
  // ==========================================

  const increaseQuantity = (id) => {
    setCartItems((currentItems) =>
      currentItems.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item
      )
    );
  };

  // ==========================================
  // DECREASE QUANTITY
  // ==========================================

  const decreaseQuantity = (id) => {
    setCartItems((currentItems) =>
      currentItems
        .map((item) =>
          item.id === id
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item
        )
        .filter(
          (item) => item.quantity > 0
        )
    );
  };

  // ==========================================
  // REMOVE ITEM
  // ==========================================

  const removeFromCart = (id) => {
    setCartItems((currentItems) =>
      currentItems.filter(
        (item) => item.id !== id
      )
    );
  };

  // ==========================================
  // CLEAR CART (after successful order)
  // ==========================================

  const clearCart = () => {
    setCartItems([]);
  };

  // ==========================================
  // CALCULATE CART TOTAL
  // ==========================================

  const getCartTotal = () => {
    return cartItems.reduce(
      (total, item) =>
        total +
        item.price * item.quantity,
      0
    );
  };

  // ==========================================
  // CONTEXT
  // ==========================================

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        increaseQuantity,
        decreaseQuantity,
        removeFromCart,
        getCartTotal,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// ==========================================
// CUSTOM HOOK
// ==========================================

export function useCart() {
  return useContext(CartContext);
}