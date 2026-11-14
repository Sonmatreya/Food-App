import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { API_URL } from "../config/api";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { resolveFoodImage } from "../utils/foodImage";
import "../Styles/AIAssistant.css";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80";
const PROMPTS = ["Suggest something under ₹300", "I want something vegetarian", "What is the best rated food?"];

function FoodCard({ food, onAdd, compact = false }) {
  const restaurant = food.restaurantName || "Food App Kitchen";
  const deliveryTime = food.deliveryTime || "20-30 min";
  const distance = Number(food.distanceKm ?? 3.5).toFixed(1);
  return <article className={compact ? "foodAiCard compact" : "foodAiCard"}>
    <img src={resolveFoodImage(food.image) || FALLBACK_IMAGE} alt={food.name} onError={(event) => { event.currentTarget.src = FALLBACK_IMAGE; }} />
    <div><em>{restaurant}</em><strong>{food.name}</strong><small>{Number(food.rating || 0) ? `★ ${Number(food.rating).toFixed(1)}` : "New"} · {deliveryTime} · {distance} km</small>{food.offerText && <small className="foodAiOffer">{food.offerText}</small>}</div>
    {!compact && <button type="button" onClick={() => onAdd(food)}>ADD</button>}
  </article>;
}

export default function AIAssistant() {
  const location = useLocation();
  const navigate = useNavigate();
  const { cartItems, addToCart } = useCart();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [feedFoods, setFeedFoods] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_URL}/api/foods?available=true&limit=9&sort=rating`, { credentials: "include" })
      .then((response) => response.json())
      .then((data) => { if (!cancelled && data.success) setFeedFoods(Array.isArray(data.foods) ? data.foods.slice(0, 6) : []); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const openFoodAi = () => setOpen(true);
    window.addEventListener("open-food-ai", openFoodAi);
    return () => window.removeEventListener("open-food-ai", openFoodAi);
  }, []);

  if (location.pathname.startsWith("/admin")) return null;

  const sendMessage = async (value = message) => {
    const text = value.trim();
    if (!text || loading) return;
    setMessage("");
    setMessages((current) => [...current, { role: "user", text }]);
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/ai/chat`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: text, cartItems }) });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "FoodAI is unavailable.");
      setMessages((current) => [...current, { role: "assistant", text: data.reply, foods: Array.isArray(data.recommendations) ? data.recommendations : [] }]);
    } catch (error) {
      setMessages((current) => [...current, { role: "assistant", text: error.message || "FoodAI is unavailable.", foods: [] }]);
    } finally { setLoading(false); }
  };

  const addFood = (food) => { addToCart(food); showToast(`${food.name} added to cart`); };

  return <>
    <button type="button" className="foodAiLauncher" onClick={() => setOpen(true)} aria-label="Open FoodAI"><span>✦</span> Match my taste</button>
    {open && <section className="foodAiScreen" aria-label="FoodAI food discovery">
      <header className="foodAiTopbar"><button type="button" onClick={() => setOpen(false)} aria-label="Close FoodAI">←</button><strong>Your feed⌄</strong><span aria-hidden="true">☰</span></header>
      <main className="foodAiContent">
        {messages.length === 0 && !loading && <section className="foodAiLanding">
          <div className="foodAiOrb orbOne">🍜</div><div className="foodAiOrb orbTwo">🍲</div>
          <h1>Match my<br />taste <b>›</b></h1><p><b>↪ Skip</b> the usuals?</p>
          <div className="foodAiNudge"><span>Want to try something similar to your usuals?</span><button type="button" onClick={() => sendMessage("Suggest popular dishes for me")}>Explore FoodAI ›</button></div>
          <h2>Flavours you like <small>just a slightly new direction</small></h2>
          <div className="foodAiShelf">{feedFoods.map((food) => <FoodCard key={food._id} food={food} compact onAdd={addFood} />)}</div>
        </section>}
        {messages.map((item, index) => <React.Fragment key={`${item.role}-${index}`}>
          {item.role === "user" ? <p className="foodAiUserMessage">{item.text}</p> : <p className="foodAiReply">{item.text}</p>}
          {item.role === "assistant" && item.foods?.length > 0 && <div className="foodAiResults">{item.foods.map((food) => <FoodCard key={food._id} food={food} onAdd={addFood} />)}</div>}
        </React.Fragment>)}
        {loading && <div className="foodAiThinking"><i>✦</i><strong>Finding the best food for you…</strong></div>}
      </main>
      {messages.length === 0 && <div className="foodAiPrompts">{PROMPTS.map((prompt) => <button type="button" key={prompt} onClick={() => sendMessage(prompt)}>{prompt}</button>)}</div>}
      <form className="foodAiComposer" onSubmit={(event) => { event.preventDefault(); sendMessage(); }}><button type="button" aria-label="Show FoodAI prompts" onClick={() => setMessage("Suggest something ")}>＋</button><button type="button" className="foodAiCartButton" aria-label="Open cart" onClick={() => navigate("/cart")}>🛒</button><input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="What do you feel like eating?" maxLength={500} /><button type="submit" disabled={loading || !message.trim()} aria-label="Send message">➜</button></form>
      <small className="foodAiNote">AI-powered responses. Please check important details.</small>
    </section>}
  </>;
}
