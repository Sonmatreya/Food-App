import React from "react";
import { FaCheck, FaHeart, FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "../Styles/WishlistToast.css";

function WishlistToast({ visible, action, foodName, onClose }) {
  const navigate = useNavigate();

  if (!visible) return null;

  const added = action === "added";

  const handleViewWishlist = () => {
    onClose();
    navigate("/wishlist");
  };

  return (
    <div className={added ? "wishlistToast added" : "wishlistToast removed"} role="status" aria-live="polite">
      <div className="wishlistToastIcon">
        {added ? <FaCheck aria-hidden="true" /> : <FaHeart aria-hidden="true" />}
      </div>

      <div className="wishlistToastContent">
        <strong>{added ? "Added to Wishlist" : "Removed from Wishlist"}</strong>
        <p>{foodName} {added ? "has been added to your wishlist." : "has been removed from your wishlist."}</p>
        <button type="button" onClick={handleViewWishlist}>View Wishlist</button>
      </div>

      <button type="button" className="wishlistToastClose" onClick={onClose} aria-label="Close notification">
        <FaTimes aria-hidden="true" />
      </button>
    </div>
  );
}

export default WishlistToast;
