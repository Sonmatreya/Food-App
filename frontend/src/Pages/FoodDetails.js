import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { API_URL } from "../config/api";
import "../Styles/FoodDetails.css";

const FALLBACK_IMAGE = "https://loremflickr.com/800/600/food?lock=999";

function FoodDetails() {
  const { id } = useParams();
  const [food, setFood] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [cookingRequest, setCookingRequest] = useState("");

  const { addToCart } = useCart();

  useEffect(() => {
    let cancelled = false;

    const loadFood = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_URL}/api/foods/${id}`, {
          credentials: "include",
        });
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Unable to load food details.");
        }

        if (!cancelled) setFood(data.food);
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
    return () => {
      cancelled = true;
    };
  }, [id]);

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
        <Link to="/menu">
          <button type="button">Back to Menu</button>
        </Link>
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

  const handleAddToCart = () => {
    addToCart(food, quantity, cookingRequest.trim());
    setAdded(true);
  };

  return (
    <div className="foodDetailsPage">
      <div className="foodBreadcrumb">
        <Link to="/">Home</Link>
        <span>›</span>
        <Link to="/menu">Menu</Link>
        <span>›</span>
        <span>{food.name}</span>
      </div>

      <section className="foodDetails">
        <div className="foodDetailsImageWrapper">
          <div
            className="foodDetailsImage"
            style={{ backgroundImage: `url("${imageUrl}")` }}
            role="img"
            aria-label={food.name}
          >
            <div className="foodImageBadge">⭐ {rating.toFixed(1)}</div>
            {!food.isAvailable && (
              <div className="unavailableBadge">Currently Unavailable</div>
            )}
          </div>
        </div>

        <div className="foodDetailsContent">
          <span className="foodCategory">{food.category}</span>

          <h1>{food.name}</h1>

          <div className="foodRatingRow">
            <span className="ratingStars">★★★★★</span>
            <strong>{rating.toFixed(1)}</strong>
            <span className="ratingText">Customer Rating</span>
          </div>

          <div className="foodPrice">${price.toFixed(2)}</div>

          <p className="foodDescription">{food.description}</p>

          <div className="foodInfoGrid">
            <div className="foodInfoItem">
              <span className="foodInfoIcon">🚚</span>
              <div>
                <strong>Fast Delivery</strong>
                <p>30–45 min</p>
              </div>
            </div>
            <div className="foodInfoItem">
              <span className="foodInfoIcon">🥗</span>
              <div>
                <strong>Fresh Ingredients</strong>
                <p>Prepared fresh</p>
              </div>
            </div>
          </div>

          <div className="ingredients">
            <h3>Ingredients</h3>
            <div className="ingredientList">
              {ingredients.map((ingredient, index) => (
                <span className="ingredientTag" key={`${ingredient}-${index}`}>
                  ✓ {ingredient}
                </span>
              ))}
            </div>
          </div>

          <div className="cookingRequest">
            <h3>
              Add a cooking request <span>(optional)</span>
            </h3>
            <p>
              The restaurant will try its best to fulfil your requests. However,
              refunds or cancellations related to such requests won't be possible.
            </p>
            <div className="cookingRequestInput">
              <textarea
                value={cookingRequest}
                onChange={handleCookingRequestChange}
                placeholder="e.g. Don't make it too spicy"
                maxLength={100}
                disabled={!food.isAvailable}
              />
              <span>{cookingRequest.length}/100</span>
            </div>
          </div>

          <div className="quantitySection">
            <h3>Quantity</h3>
            <div className="quantityControls">
              <button
                type="button"
                onClick={decreaseQuantity}
                disabled={!food.isAvailable || quantity === 1}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span>{quantity}</span>
              <button
                type="button"
                onClick={increaseQuantity}
                disabled={!food.isAvailable}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>

          <div className="orderSummary">
            <div>
              <span>Price</span>
              <strong>${price.toFixed(2)}</strong>
            </div>
            <div>
              <span>Quantity</span>
              <strong>× {quantity}</strong>
            </div>
            <div className="summaryTotal">
              <span>Total</span>
              <strong>${totalPrice.toFixed(2)}</strong>
            </div>
          </div>

          <button
            type="button"
            className={added ? "addToCartButton added" : "addToCartButton"}
            onClick={handleAddToCart}
            disabled={!food.isAvailable}
            aria-live="polite"
          >
            {!food.isAvailable
              ? "Currently Unavailable"
              : added
              ? "✓ Added to Cart"
              : "Add to Cart"}
          </button>

          {added && (
            <Link to="/cart" className="viewCartButton">
              View Cart →
            </Link>
          )}

          <Link to="/menu" className="backToMenu">
            ← Back to Menu
          </Link>
        </div>
      </section>

      <section className="foodExtraSection">
        <div className="foodExtraCard">
          <span>🍴</span>
          <div>
            <h3>Quality Food</h3>
            <p>Carefully prepared using quality ingredients.</p>
          </div>
        </div>
        <div className="foodExtraCard">
          <span>⚡</span>
          <div>
            <h3>Quick Preparation</h3>
            <p>Your order is prepared fresh after ordering.</p>
          </div>
        </div>
        <div className="foodExtraCard">
          <span>🔒</span>
          <div>
            <h3>Secure Ordering</h3>
            <p>Your order information is handled securely.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default FoodDetails;
