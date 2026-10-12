import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { API_URL } from "../config/api";
import "../Styles/CustomerTools.css";

const readWishlistIds = () => {
  try {
    const stored = JSON.parse(localStorage.getItem("foodWishlist") || "[]");
    return Array.isArray(stored) ? stored.map(String) : [];
  } catch {
    localStorage.removeItem("foodWishlist");
    return [];
  }
};

export default function Wishlist() {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const ids = readWishlistIds();
      if (!ids.length) {
        setItems([]);
        return;
      }

      const response = await fetch(`${API_URL}/api/foods?available=true`, { credentials: "include" });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load your wishlist.");
      }

      const allFoods = Array.isArray(data.foods) ? data.foods : [];
      const availableItems = ids
        .map((id) => allFoods.find((food) => String(food._id) === id))
        .filter(Boolean);
      setItems(availableItems);

      // Remove deleted or unavailable foods so the saved list stays accurate.
      const availableIds = new Set(availableItems.map((food) => String(food._id)));
      localStorage.setItem("foodWishlist", JSON.stringify(ids.filter((id) => availableIds.has(id))));
    } catch (loadError) {
      setError(loadError.message || "Unable to load your wishlist. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const addItem = (food) => {
    addToCart(food, 1);
    showToast(`${food.name} added to cart.`, "success");
  };

  const remove = (id) => {
    const next = readWishlistIds().filter((savedId) => savedId !== String(id));
    localStorage.setItem("foodWishlist", JSON.stringify(next));
    setItems((current) => current.filter((food) => String(food._id) !== String(id)));
    showToast("Removed from your wishlist.", "info");
  };

  return (
    <main className="customer-tool-page">
      <section className="customer-tool-hero">
        <span>YOUR FAVORITES</span>
        <h1>Wishlist</h1>
        <p>Keep the dishes you love close to your next order.</p>
      </section>
      <section className="customer-tool-content">
        {loading ? (
          <div className="tool-state">Loading favorites...</div>
        ) : error ? (
          <div className="tool-state error" role="alert">
            <h2>Wishlist could not be loaded</h2>
            <p>{error}</p>
            <button type="button" onClick={load}>Try again</button>
          </div>
        ) : !items.length ? (
          <div className="tool-state">
            <h2>Your wishlist is empty</h2>
            <p>Open a food item and add it to your favorites.</p>
            <button type="button" onClick={() => navigate("/menu")}>Explore Menu</button>
          </div>
        ) : (
          <div className="wishlist-grid">
            {items.map((food) => (
              <article className="wishlist-card" key={food._id}>
                <img src={food.image} alt={food.name} loading="lazy" />
                <div>
                  <span>{food.category}</span>
                  <h2>{food.name}</h2>
                  <p>⭐ {Number(food.rating || 0).toFixed(1)} · ₹{Number(food.price || 0).toFixed(2)}</p>
                  <div>
                    <button type="button" onClick={() => navigate(`/food/${food._id}`)}>View Food</button>
                    <button type="button" onClick={() => addItem(food)}>Add to Cart</button>
                    <button type="button" className="danger" onClick={() => remove(food._id)}>Remove</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
