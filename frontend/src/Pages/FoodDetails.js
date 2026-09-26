import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../config/api";
import WishlistToast from "../Components/WishlistToast";
import FoodRecommendations from "../Components/FoodRecommendations";
import { useToast } from "../context/ToastContext";
import "../Styles/FoodDetails.css";

const FALLBACK_IMAGE = "https://loremflickr.com/800/600/food?lock=999";

function FoodDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [food, setFood] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistToast, setWishlistToast] = useState({ visible: false, action: "", foodName: "" });
  const [cookingRequest, setCookingRequest] = useState("");

  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewOrderId, setReviewOrderId] = useState("");
  const [eligibleOrders, setEligibleOrders] = useState([]);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMessage, setReviewMessage] = useState("");

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

  useEffect(() => {
    let cancelled = false;

    const loadFood = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await fetch(`${API_URL}/api/foods/${id}`, { credentials: "include" });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || "Unable to load food details.");
        if (!cancelled) setFood(data.food);
        if (!cancelled && data.food) {
          const viewed = JSON.parse(localStorage.getItem("foodRecentlyViewed") || "[]").filter((item) => String(item) !== String(id));
          localStorage.setItem("foodRecentlyViewed", JSON.stringify([id, ...viewed].slice(0, 8)));
        }
      } catch (requestError) {
        if (!cancelled) {
          setFood(null);
          setError(requestError.message || "Unable to load food details.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadFood();
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    let cancelled = false;

    const loadReviews = async () => {
      setReviewsLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/reviews/food/${id}`);
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || "Unable to load reviews.");
        if (!cancelled) setReviews(data.reviews || []);
      } catch (requestError) {
        if (!cancelled) setReviewMessage(requestError.message || "Unable to load reviews.");
      } finally {
        if (!cancelled) setReviewsLoading(false);
      }
    };

    if (id) loadReviews();
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    let cancelled = false;

    const loadEligibleOrders = async () => {
      if (!user || !id) {
        setEligibleOrders([]);
        setReviewOrderId("");
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/orders?limit=50`, {
          credentials: "include",
        });
        const data = await response.json();
        if (!response.ok || !data.success) return;

        const completed = (data.orders || []).filter(
          (order) =>
            ["delivered", "picked_up"].includes(order.status) &&
            order.items?.some((item) => String(item.foodId) === String(id))
        );

        if (!cancelled) {
          setEligibleOrders(completed);
          setReviewOrderId((current) => current || completed[0]?.id || "");
        }
      } catch {
        // Reviews remain available even if order history cannot be loaded.
      }
    };

    loadEligibleOrders();
    return () => { cancelled = true; };
  }, [id, user]);

  if (loading) {
    return (
      <div className="foodNotFound">
        <div className="notFoundIcon">🍽️</div>
        <h1>Loading Food...</h1>
        <p>Fetching the latest food details.</p>
      </div>
    );
  }

  if (!food) {
    return (
      <div className="foodNotFound">
        <div className="notFoundIcon">{error ? "⚠️" : "🍽️"}</div>
        <h1>{error ? "Unable to Load Food" : "Food Not Found"}</h1>
        <p>{error || "The food item you are looking for does not exist or may have been removed."}</p>
        <Link to="/menu"><button type="button">Back to Menu</button></Link>
      </div>
    );
  }

  const imageUrl = food.image || FALLBACK_IMAGE;
  const rating = Number(food.rating || 0);
  const price = Number(food.price || 0);
  const totalPrice = price * quantity;
  const ingredients = Array.isArray(food.ingredients) ? food.ingredients : [];

  const increaseQuantity = () => {
    setQuantity((currentQuantity) => currentQuantity + 1);
    setAdded(false);
  };

  const decreaseQuantity = () => {
    setQuantity((currentQuantity) => Math.max(1, currentQuantity - 1));
    setAdded(false);
  };

  const handleCookingRequestChange = (event) => {
    const value = event.target.value;
    if (value.length <= 100) {
      setCookingRequest(value);
      setAdded(false);
    }
  };

  const toggleWishlist = () => {
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
        foodName: food?.name || "This food",
      });
    } catch {}
  };

  const handleAddToCart = () => {
    addToCart(food, quantity, cookingRequest.trim());
    setAdded(true);
  };

  const handleSubmitReview = async (event) => {
    event.preventDefault();
    if (reviewSubmitting) return;

    setReviewMessage("");

    if (!user) {
      setReviewMessage("Please log in to submit a review.");
      return;
    }

    if (!reviewOrderId) {
      setReviewMessage("A completed order containing this food is required.");
      return;
    }

    setReviewSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/reviews`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          foodId: id,
          orderId: reviewOrderId,
          rating: reviewRating,
          comment: reviewComment.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Unable to submit review.");

      setReviewMessage("Review submitted successfully. Thank you!");
      setReviewComment("");
      setEligibleOrders((current) => current.filter((order) => order.id !== reviewOrderId));
      setReviewOrderId("");

      const refreshResponse = await fetch(`${API_URL}/api/reviews/food/${id}`);
      const refreshData = await refreshResponse.json();
      if (refreshResponse.ok && refreshData.success) setReviews(refreshData.reviews || []);
    } catch (requestError) {
      setReviewMessage(requestError.message || "Unable to submit review.");
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <div className="foodDetailsPage">
      <div className="foodBreadcrumb">
        <Link to="/">Home</Link><span>›</span><Link to="/menu">Menu</Link><span>›</span><span>{food.name}</span>
      </div>

      <section className="foodDetails">
        <div className="foodDetailsImageWrapper">
          <div className="foodDetailsImage" style={{ backgroundImage: `url("${imageUrl}")` }} role="img" aria-label={food.name}>
            <div className="foodImageBadge">⭐ {rating.toFixed(1)}</div>
            {!food.isAvailable && <div className="unavailableBadge">Currently Unavailable</div>}
          </div>
        </div>

        <div className="foodDetailsContent">
          <span className="foodCategory">{food.category}</span>
          <h1>{food.name}</h1>
          <div className="foodRatingRow"><span className="ratingStars">★★★★★</span><strong>{rating.toFixed(1)}</strong><span className="ratingText">{Number(food.ratingCount || 0)} customer ratings</span></div>
          <div className="foodPrice">${price.toFixed(2)}</div>
          <p className="foodDescription">{food.description}</p>

          <div className="foodInfoGrid">
            <div className="foodInfoItem"><span className="foodInfoIcon">🚚</span><div><strong>Fast Delivery</strong><p>30–45 min</p></div></div>
            <div className="foodInfoItem"><span className="foodInfoIcon">🥗</span><div><strong>Fresh Ingredients</strong><p>Prepared fresh</p></div></div>
          </div>

          <div className="ingredients">
            <h3>Ingredients</h3>
            <div className="ingredientList">{ingredients.map((ingredient, index) => <span className="ingredientTag" key={`${ingredient}-${index}`}>✓ {ingredient}</span>)}</div>
          </div>

          <div className="cookingRequest">
            <h3>Add a cooking request <span>(optional)</span></h3>
            <p>The restaurant will try its best to fulfil your requests. However, refunds or cancellations related to such requests won't be possible.</p>
            <div className="cookingRequestInput"><textarea value={cookingRequest} onChange={handleCookingRequestChange} placeholder="e.g. Don't make it too spicy" maxLength={100} disabled={!food.isAvailable} /><span>{cookingRequest.length}/100</span></div>
          </div>

          <div className="quantitySection">
            <h3>Quantity</h3>
            <div className="quantityControls"><button type="button" onClick={decreaseQuantity} disabled={!food.isAvailable || quantity === 1}>−</button><span>{quantity}</span><button type="button" onClick={increaseQuantity} disabled={!food.isAvailable}>+</button></div>
          </div>

          <div className="orderSummary"><div><span>Price</span><strong>${price.toFixed(2)}</strong></div><div><span>Quantity</span><strong>× {quantity}</strong></div><div className="summaryTotal"><span>Total</span><strong>${totalPrice.toFixed(2)}</strong></div></div>

          <button
            type="button"
            className={wishlisted ? "wishlistDetailButton active" : "wishlistDetailButton"}
            onClick={toggleWishlist}
            aria-pressed={wishlisted}
          >
            {wishlisted ? "♥ Saved to Wishlist" : "♡ Add to Wishlist"}
          </button>

          <button type="button" className="buyNowButton" onClick={handleBuyNow} disabled={!food.isAvailable}>Buy Now →</button>\n          <button type="button" className={added ? "addToCartButton added" : "addToCartButton"} onClick={handleAddToCart} disabled={!food.isAvailable} aria-live="polite">
            {!food.isAvailable ? "Currently Unavailable" : added ? "✓ Added to Cart" : "Add to Cart"}
          </button>
          {added && <Link to="/cart" className="viewCartButton">View Cart →</Link>}
          <Link to="/menu" className="backToMenu">← Back to Menu</Link>
        </div>
      </section>

      <WishlistToast
        visible={wishlistToast.visible}
        action={wishlistToast.action}
        foodName={wishlistToast.foodName}
        onClose={() => setWishlistToast({ visible: false, action: "", foodName: "" })}
      />

      <section className="foodReviewsSection">
        <div className="foodReviewsHeader">
          <div><span className="foodReviewsEyebrow">CUSTOMER FEEDBACK</span><h2>Ratings & Reviews</h2><p>See what customers who ordered this food had to say.</p></div>
          <div className="foodReviewsAverage"><strong>{rating.toFixed(1)}</strong><span>★★★★★</span><small>{Number(food.ratingCount || 0)} ratings</small></div>
        </div>

        {user && eligibleOrders.length > 0 && (
          <form className="reviewForm" onSubmit={handleSubmitReview}>
            <h3>Review this food</h3>
            <label htmlFor="reviewOrder">Completed order</label>
            <select id="reviewOrder" value={reviewOrderId} onChange={(event) => setReviewOrderId(event.target.value)}>
              {eligibleOrders.map((order) => <option value={order.id} key={order.id}>{order.orderNumber} — {new Date(order.createdAt).toLocaleDateString()}</option>)}
            </select>
            <label>Rating</label>
            <div className="reviewRatingButtons">{[1, 2, 3, 4, 5].map((value) => <button type="button" key={value} className={value <= reviewRating ? "selected" : ""} onClick={() => setReviewRating(value)} aria-label={`${value} star rating`}>★</button>)}</div>
            <label htmlFor="reviewComment">Comment <span>(optional)</span></label>
            <textarea id="reviewComment" value={reviewComment} onChange={(event) => setReviewComment(event.target.value.slice(0, 500))} placeholder="Tell us about the taste, quality and portion..." maxLength={500} />
            <div className="reviewFormFooter"><small>{reviewComment.length}/500</small><button type="submit" disabled={reviewSubmitting}>{reviewSubmitting ? "Submitting..." : "Submit Review"}</button></div>
          </form>
        )}

        {reviewMessage && <div className="reviewMessage">{reviewMessage}</div>}

        {reviewsLoading ? (
          <div className="reviewsState">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="reviewsState"><span>⭐</span><strong>No reviews yet</strong><p>Be the first customer to review this food after completing an order.</p></div>
        ) : (
          <div className="reviewsList">{reviews.map((review) => (
            <article className="reviewItem" key={review.id}>
              <div className="reviewAvatar">{review.user?.profileImage ? <img src={review.user.profileImage} alt="" /> : (review.user?.name || "C").charAt(0).toUpperCase()}</div>
              <div className="reviewBody"><div className="reviewTop"><strong>{review.user?.name || "Customer"}</strong><span>{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span></div><small>{new Date(review.createdAt).toLocaleDateString()}</small>{review.comment && <p>{review.comment}</p>}</div>
            </article>
          ))}</div>
        )}
      </section>

      <section className="foodExtraSection">
        <div className="foodExtraCard"><span>🍴</span><div><h3>Quality Food</h3><p>Carefully prepared using quality ingredients.</p></div></div>
        <div className="foodExtraCard"><span>⚡</span><div><h3>Quick Preparation</h3><p>Your order is prepared fresh after ordering.</p></div></div>
        <div className="foodExtraCard"><span>🔒</span><div><h3>Secure Ordering</h3><p>Your order information is handled securely.</p></div></div>
      </section>
    </div>
  );
}

export default FoodDetails;
