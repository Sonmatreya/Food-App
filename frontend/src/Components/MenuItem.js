import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import WishlistToast from "./WishlistToast";
import { FaArrowRight, FaHeart, FaShoppingBag } from "react-icons/fa";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import "../Styles/Menu.css";
import { resolveFoodImage } from "../utils/foodImage";

const FALLBACK_FOOD_IMAGE = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80";

function MenuItem({ id, image, name, price, category, rating, ratingCount, description, isAvailable }) {
  const numericPrice = Number(price);
  const numericRating = Number(rating);
  const hasRating = Number.isFinite(numericRating) && numericRating > 0 && Number(ratingCount) > 0;
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistToast, setWishlistToast] = useState({
    visible: false,
    action: "",
    foodName: "",
  });

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

    const timer = setTimeout(
      () =>
        setWishlistToast({
          visible: false,
          action: "",
          foodName: "",
        }),
      3000
    );

    return () => clearTimeout(timer);
  }, [wishlistToast.visible]);

  const handleQuickAdd = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!isAvailable || !Number.isFinite(numericPrice) || numericPrice <= 0) {
      showToast("This item cannot be added right now", "error");
      return;
    }

    addToCart(
      {
        _id: id,
        image,
        name,
        price: numericPrice,
        category,
        rating,
        isAvailable,
      },
      1
    );

    showToast(`${name} added to cart`);
  };

  const toggleWishlist = (event) => {
    event.preventDefault();
    event.stopPropagation();

    try {
      const saved = JSON.parse(
        localStorage.getItem("foodWishlist") || "[]"
      ).map(String);

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
    } catch {
      // Ignore invalid localStorage data.
    }
  };

  return (
    <article className="menuCard">
      <div className="menuCardVisual">
        <Link
          to={`/food/${id}`}
          className="menuCardLink"
          aria-label={`View details for ${name}`}
        >
          <div className="menuImage">
            <img
              src={resolveFoodImage(image) || FALLBACK_FOOD_IMAGE}
              alt={name ? `${name} food photograph` : "Food item"}
              loading="lazy"
              decoding="async"
              onError={(event) => {
                if (event.currentTarget.src !== FALLBACK_FOOD_IMAGE) {
                  event.currentTarget.src = FALLBACK_FOOD_IMAGE;
                } else {
                  event.currentTarget.style.visibility = "hidden";
                }
              }}
            />
            {!isAvailable && (
              <span className="menuAvailability">Currently Unavailable</span>
            )}
          </div>
        </Link>

        <button
          type="button"
          className={
            wishlisted
              ? "menuWishlistButton active"
              : "menuWishlistButton"
          }
          onClick={toggleWishlist}
          aria-label={
            wishlisted
              ? `Remove ${name} from wishlist`
              : `Add ${name} to wishlist`
          }
          title={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <FaHeart aria-hidden="true" />
        </button>
      </div>

      <Link to={`/food/${id}`} className="menuCardLink">
        <div className="menuContent">
          <div className="menuMeta">
            <span className="menuCategory">{category}</span>
            {hasRating ? <span className="menuRating" aria-label={`${numericRating.toFixed(1)} out of 5 from ${ratingCount} ratings`}>★ {numericRating.toFixed(1)} <small>({ratingCount})</small></span> : <span className="menuRating unrated">New dish</span>}
          </div>

          <h2>{name}</h2>
          {description && <p className="menuItemDescription">{description}</p>}

          <div className="menuCardFooter">
            <p className="menuPrice">
              {Number.isFinite(numericPrice)
                ? `₹${numericPrice.toFixed(2)}`
                : "Price unavailable"}
            </p>
            <span className="menuViewDetails">
              View details <FaArrowRight aria-hidden="true" />
            </span>
          </div>
        </div>
      </Link>

      <button
        type="button"
        className="menuQuickAdd"
        onClick={handleQuickAdd}
        disabled={!isAvailable || !Number.isFinite(numericPrice) || numericPrice <= 0}
      >
        <FaShoppingBag /> {isAvailable ? "Add to Cart" : "Unavailable"}
      </button>

      <WishlistToast
        visible={wishlistToast.visible}
        action={wishlistToast.action}
        foodName={wishlistToast.foodName}
        onClose={() =>
          setWishlistToast({
            visible: false,
            action: "",
            foodName: "",
          })
        }
      />
    </article>
  );
}

export default MenuItem;
