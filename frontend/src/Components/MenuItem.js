import React, { useState } from "react";
import { useCart } from "../context/CartContext";
import "../Styles/Menu.css";

function MenuItem({ id, image, name, price, category, rating, isAvailable }) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  const food = {
    id,
    image,
    name,
    price,
    category,
    rating,
    isAvailable,
  };

  const handleAddToCart = () => {
    if (!isAvailable) return;

    addToCart(food, 1);
    setAdded(true);
  };

  return (
    <div className="menuCard">
      <div
        className="menuImage"
        style={{ backgroundImage: `url(${image})` }}
        role="img"
        aria-label={name}
      ></div>

      <div className="menuContent">
        <span className="menuCategory">{category}</span>

        <h2>{name}</h2>

        <p className="menuRating">⭐ {rating}</p>

        <p className="menuPrice">${price.toFixed(2)}</p>

        {!isAvailable && (
          <p className="outOfStock">Currently Unavailable</p>
        )}

        <button
          className={`orderButton addCardButton${added ? " added" : ""}`}
          type="button"
          onClick={handleAddToCart}
          disabled={!isAvailable}
          aria-live="polite"
        >
          {!isAvailable
            ? "Unavailable"
            : added
              ? "✓ Added to Cart"
              : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}

export default MenuItem;
