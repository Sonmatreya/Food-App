import React from "react";
import { Link } from "react-router-dom";
import { FaArrowRight, FaPlus } from "react-icons/fa";
import "../Styles/Menu.css";

function MenuItem({ id, image, name, price, category, rating, isAvailable }) {
  const numericPrice = Number(price);
  const numericRating = Number(rating || 0);

  return (
    <article className="menuCard">
      <Link
        to={`/food/${id}`}
        className="menuCardLink"
        aria-label={`View details for ${name}`}
      >
        <div
          className="menuImage"
          style={{ backgroundImage: `url(${image})` }}
          role="img"
          aria-label={name}
        >
          {!isAvailable && (
            <span className="menuAvailability">Currently Unavailable</span>
          )}
        </div>

        <div className="menuContent">
          <div className="menuMeta">
            <span className="menuCategory">{category}</span>
            <span className="menuRating">★ {numericRating.toFixed(1)}</span>
          </div>

          <h2>{name}</h2>

          <div className="menuCardFooter">
            <p className="menuPrice">
              {Number.isFinite(numericPrice)
                ? `$${numericPrice.toFixed(2)}`
                : "Price unavailable"}
            </p>

            <span className="menuViewDetails">
              View details <FaArrowRight aria-hidden="true" />
            </span>
          </div>
        </div>
      </Link>

      {isAvailable && (
        <Link
          to={`/food/${id}`}
          className="menuAddButton"
          aria-label={`View ${name} and add it to cart`}
        >
          <FaPlus aria-hidden="true" />
          <span>Add to cart</span>
        </Link>
      )}
    </article>
  );
}

export default MenuItem;
