import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { MenuList } from "../helpers/MenuList";
import { useCart } from "../context/CartContext";
import "../Styles/FoodDetails.css";

function FoodDetails() {
  const { id } = useParams();
  const food = MenuList.find((item) => item.id === Number(id));

  const [quantity, setQuantity] = useState(1);

  const { addToCart } = useCart();

  if (!food) {
    return (
      <div className="foodNotFound">
        <h1>Food Not Found</h1>
        <p>The food item you are looking for does not exist.</p>

        <Link to="/menu">
          <button>Back to Menu</button>
        </Link>
      </div>
    );
  }

  const increaseQuantity = () => {
    setQuantity((currentQuantity) => currentQuantity + 1);
  };

  const decreaseQuantity = () => {
    setQuantity((currentQuantity) => {
      if (currentQuantity > 1) {
        return currentQuantity - 1;
      }

      return currentQuantity;
    });
  };

  const totalPrice = food.price * quantity;

  const handleAddToCart = () => {
    addToCart(food, quantity);
    alert(`${food.name} added to cart!`);
  };

  return (
    <div className="foodDetails">
      <div className="foodDetailsImage">
        <img src={food.image} alt={food.name} />
      </div>

      <div className="foodDetailsContent">
        <span className="foodCategory">{food.category}</span>

        <h1>{food.name}</h1>

        <div className="foodRating">
          ⭐ {food.rating} / 5
        </div>

        <h2>${food.price.toFixed(2)}</h2>

        <p className="foodDescription">
          {food.description}
        </p>

        <div className="ingredients">
          <h3>Ingredients</h3>

          <ul>
            {food.ingredients.map((ingredient, index) => (
              <li key={index}>{ingredient}</li>
            ))}
          </ul>
        </div>

        <div className="quantitySection">
          <h3>Quantity</h3>

          <div className="quantityControls">
            <button onClick={decreaseQuantity}>−</button>

            <span>{quantity}</span>

            <button onClick={increaseQuantity}>+</button>
          </div>
        </div>

        <div className="orderSummary">
          <strong>
            Total: ${totalPrice.toFixed(2)}
          </strong>
        </div>

        <button
          className="addToCartButton"
          onClick={handleAddToCart}
          disabled={!food.isAvailable}
        >
          {food.isAvailable
            ? "Add to Cart"
            : "Currently Unavailable"}
        </button>

        <Link to="/menu" className="backToMenu">
          ← Back to Menu
        </Link>
      </div>
    </div>
  );
}

export default FoodDetails;