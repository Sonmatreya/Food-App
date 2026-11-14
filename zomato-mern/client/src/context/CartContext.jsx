import { createContext, useContext, useEffect, useState } from 'react';

const CartContext = createContext(null);
export const useCart = () => useContext(CartContext);

const empty = { restaurantId: null, restaurantName: '', items: {} };

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cart')) || empty;
    } catch {
      return empty;
    }
  });
  const [vegMode, setVegMode] = useState(() => localStorage.getItem('vegMode') === 'true');

  useEffect(() => localStorage.setItem('cart', JSON.stringify(cart)), [cart]);
  useEffect(() => localStorage.setItem('vegMode', String(vegMode)), [vegMode]);

  // item = { _id, name, price, isVeg }
  const add = (restaurant, item) => {
    setCart((c) => {
      let base = c;
      if (c.restaurantId && c.restaurantId !== restaurant._id) {
        if (!window.confirm(`Your cart has items from ${c.restaurantName}. Start a new cart?`)) return c;
        base = empty;
      }
      const existing = base.items[item._id];
      return {
        restaurantId: restaurant._id,
        restaurantName: restaurant.name,
        items: {
          ...base.items,
          [item._id]: { ...item, qty: (existing?.qty || 0) + 1 },
        },
      };
    });
  };

  const remove = (itemId) => {
    setCart((c) => {
      const it = c.items[itemId];
      if (!it) return c;
      const items = { ...c.items };
      if (it.qty <= 1) delete items[itemId];
      else items[itemId] = { ...it, qty: it.qty - 1 };
      return Object.keys(items).length ? { ...c, items } : empty;
    });
  };

  const clear = () => setCart(empty);

  const list = Object.values(cart.items);
  const count = list.reduce((s, i) => s + i.qty, 0);

  return (
    <CartContext.Provider value={{ cart, list, count, add, remove, clear, vegMode, setVegMode }}>
      {children}
    </CartContext.Provider>
  );
}
