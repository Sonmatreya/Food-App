import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const CartContext = createContext();
const CART_STORAGE_KEY = "food-app-cart";

const getFoodId = (food) => food?._id || food?.id || food?.cartItemId || "";

const isValidFoodId = (id) =>
  /^[a-f\\d]{24}$/i.test(String(id || "").trim());

const normalizeCartItems = (items) =>
  Array.isArray(items)
    ? items
        .filter((item) => isValidFoodId(getFoodId(item)))
        .map((item) => ({
          ...item,
          quantity:
            Number.isInteger(Number(item.quantity)) && Number(item.quantity) > 0
              ? Number(item.quantity)
              : 1,
          cookingRequest: String(item.cookingRequest || "").slice(0, 100),
        }))
    : [];

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (!savedCart) return [];

      const parsedCart = JSON.parse(savedCart);
      return normalizeCartItems(parsedCart);
    } catch (error) {
      console.error("Unable to restore cart:", error);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify(cartItems)
      );
    } catch (error) {
      console.error("Unable to save cart:", error);
    }
  }, [cartItems]);

  // ==========================================
  // ADD ITEM TO CART
  // ==========================================

  const addToCart = (
    food,
    quantity = 1,
    cookingRequest = ""
  ) => {
    const foodId = getFoodId(food);

    if (!isValidFoodId(foodId)) {
      console.error("Cannot add food without a valid MongoDB food ID.");
      return;
    }

    const safeQuantity =
      Number.isInteger(Number(quantity)) && Number(quantity) > 0
        ? Number(quantity)
        : 1;

    setCartItems((currentItems) => {
      const existingItem = currentItems.find(
        (item) => getFoodId(item) === String(foodId)
      );

      if (existingItem) {
        return currentItems.map((item) =>
          getFoodId(item) === String(foodId)
            ? {
                ...item,
                quantity: item.quantity + safeQuantity,
                cookingRequest:
                  cookingRequest ||
                  item.cookingRequest ||
                  "",
              }
            : item
        );
      }

      return [
        ...currentItems,
        {
          ...food,
          quantity: safeQuantity,
          cookingRequest: cookingRequest || "",
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
        getFoodId(item) === String(id)
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
          getFoodId(item) === String(id)
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  // ==========================================
  // REMOVE ITEM
  // ==========================================

  const removeFromCart = (id) => {
    setCartItems((currentItems) =>
      currentItems.filter((item) => getFoodId(item) !== String(id))
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
        total + item.price * item.quantity,
      0
    );
  };

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

export function useCart() {
  return useContext(CartContext);
}