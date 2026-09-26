import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_URL } from "../config/api";
import "../Styles/FoodRecommendations.css";

export default function RecentlyViewed() {
  const [foods, setFoods] = useState([]);
  useEffect(() => {
    const ids = JSON.parse(localStorage.getItem("foodRecentlyViewed") || "[]").map(String);
    if (!ids.length) return;
    let cancelled = false;
    fetch(`${API_URL}/api/foods?available=true`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled || !data.success) return;
        const byId = new Map((data.foods || []).map((food) => [String(food._id), food]));
        setFoods(ids.map((id) => byId.get(id)).filter(Boolean).slice(0, 4));
      }).catch(() => {});
    return () => { cancelled = true; };
  }, []);
  if (!foods.length) return null;
  return (
    <section className="recommendationSection recentlyViewedSection">
      <div className="recommendationHeader"><div><span>YOUR ACTIVITY</span><h2>Recently viewed</h2><p>Pick up where you left off.</p></div><Link to="/menu">Browse menu →</Link></div>
      <div className="recommendationGrid">
        {foods.map((food) => <Link className="recommendationCard" to={`/food/${food._id}`} key={food._id}><img src={food.image} alt={food.name} loading="lazy" /><div><span>{food.category}</span><h3>{food.name}</h3><p>★ {Number(food.rating || 0).toFixed(1)} <strong>₹{Number(food.price || 0).toFixed(2)}</strong></p></div></Link>)}
      </div>
    </section>
  );
}
