import React from "react";
import { Link } from "react-router-dom";
import "../Styles/Menu.css";

function MenuItem({ id, image, name, price, category, rating, isAvailable }) {
  return (
    <div className="menuCard">
      <div
        className="menuImage"
        style={{ backgroundImage: `url(${image})` }}
      ></div>

      <div className="menuContent">
        <span className="menuCategory">{category}</span>

        <h2>{name}</h2>

        <p className="menuRating">⭐ {rating}</p>

        <p className="menuPrice">${price.toFixed(2)}</p>

        {!isAvailable && (
          <p className="outOfStock">Currently Unavailable</p>
        )}

        <Link to={`/food/${id}`}>
          <button className="orderButton" disabled={!isAvailable}>
            {isAvailable ? "View Details" : "Unavailable"}
          </button>
        </Link>
      </div>
    </div>
  );
}

export default MenuItem;