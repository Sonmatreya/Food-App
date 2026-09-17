import React from "react";
import { Link } from "react-router-dom";
import "../Styles/Menu.css";

function MenuItem({ id, image, name, price, category, rating, isAvailable }) {
  const numericPrice = Number(price);

  return (
    <Link
      to={`/food/${id}`}
      className="menuCard"
      aria-label={`View details for ${name}`}
    >
      <div
        className="menuImage"
        style={{ backgroundImage: `url(${image})` }}
        role="img"
        aria-label={name}
      ></div>

      <div className="menuContent">
        <span className="menuCategory">{category}</span>
        <h2>{name}</h2>
        <p className="menuRating">⭐ {Number(rating || 0).toFixed(1)}</p>
        <p className="menuPrice">
          {Number.isFinite(numericPrice) ? `$${numericPrice.toFixed(2)}` : "Price unavailable"}
        </p>

        {!isAvailable && (
          <p className="outOfStock">Currently Unavailable</p>
        )}
      </div>
    </Link>
  );
}

export default MenuItem;
