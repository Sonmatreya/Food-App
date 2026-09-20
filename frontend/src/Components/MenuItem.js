import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import WishlistToast from "./WishlistToast";
import { FaArrowRight, FaHeart } from "react-icons/fa";
import "../Styles/Menu.css";

function MenuItem({ id, image, name, price, category, rating, isAvailable }) {
  const numericPrice = Number(price);
  const numericRating = Number(rating || 0);
  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistToast, setWishlistToast] = useState({ visible: false, action: "", foodName: "" });

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("foodWishlist") || "[]");
      setWishlisted(saved.map(String).includes(String(id)));
    } catch {
      setWishlisted(false);
    }
  }, [id]);

  useEffect(() => {
    if (!wishlistToast.visible) return undefined;
    const timer = setTimeout(() => setWishlistToast({ visible: false, action: "", foodName: "" }), 3000);
    return () => clearTimeout(timer);
  }, [wishlistToast.visible]);

  const toggleWishlist = (event) => {
    event.preventDefault();
    event.stopPropagation();
    try {
      const saved = JSON.parse(localStorage.getItem("foodWishlist") || "[]").map(String);
      const next = saved.includes(String(id))
        ? saved.filter((itemId) => itemId !== String(id))
        : [...saved, String(id)];
      const isNowWishlisted = next.includes(String(id));
      localStorage.setItem("foodWishlist", JSON.stringify(next));
      setWishlisted(isNowWishlisted);
      setWishlistToast({
        visible: true,
        action: isNowWishlisted ? "added" : "removed",
        foodName: name,
      });
    } catch {}
  };

  return (
    <article className="menuCard">
      <div className="menuCardVisual">
        <Link to={`/food/${id}`} className="menuCardLink" aria-label={`View details for ${name}`}>
          <div className="menuImage" style={{ backgroundImage: `url(${image})` }} role="img" aria-label={name}>
            {!isAvailable && <span className="menuAvailability">Currently Unavailable</span>}
          </div>
        </Link>
        <button
          type="button"
          className={wishlisted ? "menuWishlistButton active" : "menuWishlistButton"}
          onClick={toggleWishlist}
          aria-label={wishlisted ? `Remove ${name} from wishlist` : `Add ${name} to wishlist`}
          title={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <FaHeart aria-hidden="true" />
        </button>
      </div>

      <Link to={`/food/${id}`} className="menuCardLink">
        <div className="menuContent">
          <div className="menuMeta">
            <span className="menuCategory">{category}</span>
            <span className="menuRating">★ {numericRating.toFixed(1)}</span>
          </div>
          <h2>{name}</h2>
          <div className="menuCardFooter">
            <p className="menuPrice">
              {Number.isFinite(numericPrice) ? `$${numericPrice.toFixed(2)}` : "Price unavailable"}
            </p>
            <span className="menuViewDetails">View details <FaArrowRight aria-hidden="true" /></span>
          </div>
        </div>
      </Link>
      <WishlistToast
        visible={wishlistToast.visible}
        action={wishlistToast.action}
        foodName={wishlistToast.foodName}
        onClose={() => setWishlistToast({ visible: false, action: "", foodName: "" })}
      />
    </article>
  );
}

export default MenuItem;
