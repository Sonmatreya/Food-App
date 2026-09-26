import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { API_URL } from "../config/api";
import "../Styles/FoodRecommendations.css";

export default function FoodRecommendations({ currentFoodId, title = "You may also like", subtitle = "More dishes selected from our current menu." }) {
  const [foods, setFoods] = useState([]);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_URL}/api/foods?available=true`, { credentials: "include" })
      .then((response) => response.json())
      .then((data) => {
        if (!cancelled && data.success) setFoods(Array.isArray(data.foods) ? data.foods : []);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const recommendations = useMemo(() => foods
    .filter((food) => String(food._id) !== String(currentFoodId))
    .sort((a, b) => {
      const featured = Number(b.isFeatured) - Number(a.isFeatured);
      if (featured) return featured;
      return Number(b.rating || 0) - Number(a.rating || 0);
    })
    .slice(0, 4), [foods, currentFoodId]);

  if (!recommendations.length) return null;

  return (
    <section className="recommendationSection">
      <div className="recommendationHeader">
        <div><span>RECOMMENDED FOR YOU</span><h2>{title}</h2><p>{subtitle}</p></div>
        <Link to="/menu">View all →</Link>
      </div>
      <div className="recommendationGrid">
        {recommendations.map((food) => (
          <Link className="recommendationCard" to={`/food/${food._id}`} key={food._id}>
            <img src={food.image} alt={food.name} loading="lazy" />
            <div><span>{food.category}</span><h3>{food.name}</h3><p>★ {Number(food.rating || 0).toFixed(1)} <strong>₹{Number(food.price || 0).toFixed(2)}</strong></p></div>
          </Link>
        ))}
      </div>
    </section>
  );
}
