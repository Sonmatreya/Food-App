import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { API_URL } from "../config/api";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { resolveFoodImage } from "../utils/foodImage";
import "../Styles/AIAssistant.css";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80";
const PROMPTS = [
  "Suggest something under ₹200",
  "Show vegetarian dishes",
  "Find spicy food",
  "What is highest rated?",
  "Suggest something for my cart",
  "Show me pizza",
];

const DISCOVERY = [
  { label: "Veg Mode", icon: "🌱", prompt: "Show vegetarian dishes" },
  { label: "Under ₹150", icon: "₹", prompt: "Suggest something under ₹150" },
  { label: "Top rated", icon: "★", prompt: "Show the highest rated dishes" },
  { label: "Spicy cravings", icon: "🌶️", prompt: "Find spicy food" },
  { label: "Pizza", icon: "🍕", prompt: "Show me pizza" },
  { label: "For my cart", icon: "🛒", prompt: "Suggest something for my cart" },
];

function FoodCard({ food, onAdd }) {
  const [imageFailed, setImageFailed] = useState(false);
  const image = !imageFailed ? resolveFoodImage(food.image) || FALLBACK_IMAGE : FALLBACK_IMAGE;
  const rating = Number(food.rating || 0);
  const ratingCount = Number(food.ratingCount || 0);
  return (
    <article className="foodAiCard">
      <img src={image} alt={food.name || "Recommended food"} loading="lazy" onError={() => setImageFailed(true)} />
      <div className="foodAiCardBody">
        <em>{food.category || "Menu recommendation"}</em>
        <strong>{food.name}</strong>
        <small>{rating > 0 && ratingCount > 0 ? `★ ${rating.toFixed(1)} · ${ratingCount} reviews` : "Not rated yet"}</small>
        {food.description && <p>{food.description}</p>}
        <b className="foodAiPrice">₹{Number(food.price || 0).toFixed(2)}</b>
      </div>
      <button type="button" onClick={() => onAdd(food)}>Add to cart</button>
    </article>
  );
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
  const [feedLoading, setFeedLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedError, setFeedError] = useState("");
  const [vegMode, setVegMode] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setFeedLoading(true);
    fetch(`${API_URL}/api/foods?available=true&limit=9&sort=rating`, { credentials: "include" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || "Could not load menu suggestions.");
        if (!cancelled) setFeedFoods(Array.isArray(data.foods) ? data.foods.slice(0, 6) : []);
      })
      .catch((error) => { if (!cancelled) setFeedError(error.message || "Could not load menu suggestions."); })
      .finally(() => { if (!cancelled) setFeedLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const openFoodAi = () => setOpen(true);
    window.addEventListener("open-food-ai", openFoodAi);
    return () => window.removeEventListener("open-food-ai", openFoodAi);
  }, []);

  useEffect(() => {
    if (contentRef.current) contentRef.current.scrollTop = contentRef.current.scrollHeight;
  }, [messages, loading]);

  if (location.pathname.startsWith("/admin")) return null;

  const sendMessage = async (value = message) => {
    const text = String(value || "").trim();
    if (!text || loading) return;
    setMessage("");
    setMessages((current) => [...current, { role: "user", text }]);
    setLoading(true);
    try {
      const safeCart = (Array.isArray(cartItems) ? cartItems : []).map((item) => ({
        name: String(item.name || "").slice(0, 100),
        quantity: Math.max(1, Number(item.quantity) || 1),
        price: Math.max(0, Number(item.price) || 0),
      }));
      const conversationHistory = messages
        .slice(-8)
        .filter((item) => ["user", "assistant"].includes(item.role) && typeof item.text === "string")
        .map((item) => ({ role: item.role, content: item.text.slice(0, 500) }));
      const response = await fetch(`${API_URL}/api/ai/chat`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, cartItems: safeCart, history: conversationHistory }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "FoodAI is unavailable. Please try again.");
      setMessages((current) => [...current, {
        role: "assistant",
        text: data.reply || "I couldn't prepare a response. Please try another request.",
        foods: Array.isArray(data.recommendations) ? data.recommendations : [],
        mode: data.mode || "ai",
      }]);
    } catch (error) {
      setMessages((current) => [...current, { role: "assistant", text: error.message || "FoodAI is unavailable. Please try again.", foods: [], error: true }]);
    } finally {
      setLoading(false);
    }
  };

  const addFood = (food) => {
    addToCart(food);
    showToast(`${food.name} added to cart`);
  };

  const startNewChat = () => {
    setMessages([]);
    setMessage("");
  };

  return <>
    <button type="button" className="foodAiLauncher" onClick={() => setOpen(true)} aria-label="Open FoodAI">
      <span aria-hidden="true">✦</span> Ask FoodAI
    </button>
    {open && <section className="foodAiScreen" aria-label="FoodAI food assistant">
      <header className="foodAiTopbar">
        <button type="button" onClick={() => setOpen(false)} aria-label="Close FoodAI">×</button>
        <div><strong>FoodAI</strong><small>Your food discovery assistant</small></div>
        <button type="button" onClick={startNewChat} aria-label="Start a new chat" title="New chat">＋</button>
      </header>
      <main className="foodAiContent" ref={contentRef} aria-live="polite">
        {messages.length === 0 && <section className="foodAiLanding">
          <div className="foodAiHeroIcon">✦</div>
          <span className="foodAiEyebrow">GOOD FOOD, JUST A QUESTION AWAY</span>
          <h1>What are you<br />craving today?</h1>
          <p>Discover dishes from our menu. Tell FoodAI your taste, budget or dietary preference and get suggestions picked for you.</p>
          <div className="foodAiSearchHint"><span>✦</span> Ask for a dish, mood, ingredient or budget below</div>
          <div className="foodAiDiscoveryHeading"><h2>Explore your way</h2><span>Quick picks</span></div>
          <div className="foodAiDiscoveryGrid">
            {DISCOVERY.map((item) => <button type="button" key={item.label} className={item.label === "Veg Mode" && vegMode ? "foodAiDiscovery active" : "foodAiDiscovery"} onClick={() => { if (item.label === "Veg Mode") setVegMode((value) => !value); sendMessage(item.prompt); }}><span>{item.icon}</span><strong>{item.label}</strong><i>›</i></button>)}
          </div>
          <div className="foodAiShelfHeading"><h2>Popular from our menu</h2><span>Available dishes</span></div>
          {feedLoading && <p className="foodAiEmpty">Loading menu suggestions…</p>}
          {feedError && <p className="foodAiEmpty">{feedError}</p>}
          {!feedLoading && !feedError && feedFoods.length === 0 && <p className="foodAiEmpty">No menu suggestions are available right now. Try asking about a dish.</p>}
          <div className="foodAiShelf">{feedFoods.map((food) => <FoodCard key={food._id} food={food} onAdd={addFood} />)}</div>
        </section>}
        {messages.map((item, index) => <React.Fragment key={`${item.role}-${index}`}>
          {item.role === "user"
            ? <p className="foodAiUserMessage">{item.text}</p>
            : <div className={item.error ? "foodAiReply foodAiError" : "foodAiReply"}><span className="foodAiReplyLabel">✦ FoodAI</span><p>{item.text}</p>{item.mode === "catalogue-fallback" && <small className="foodAiFallbackNote">Menu-based suggestions · AI service unavailable</small>}</div>}
          {item.role === "assistant" && item.foods?.length > 0 && <div className="foodAiResults">{item.foods.map((food) => <FoodCard key={food._id} food={food} onAdd={addFood} />)}</div>}
        </React.Fragment>)}
        {loading && <div className="foodAiThinking"><i>✦</i><span>Checking the menu for you…</span></div>}
      </main>
      {messages.length > 0 && <div className="foodAiQuickPrompts">{PROMPTS.slice(0, 4).map((prompt) => <button type="button" key={prompt} onClick={() => sendMessage(prompt)} disabled={loading}>{prompt}</button>)}</div>}
      <form className="foodAiComposer" onSubmit={(event) => { event.preventDefault(); sendMessage(); }}>
        <button type="button" className="foodAiCartButton" aria-label="Open cart" onClick={() => { setOpen(false); navigate("/cart"); }}>🛒</button>
        <input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Search dishes or ask FoodAI anything…" maxLength={500} aria-label="Ask FoodAI" />
        <button type="submit" disabled={loading || !message.trim()} aria-label="Send message">➤</button>
      </form>
      <small className="foodAiNote">FoodAI uses our available menu to make suggestions. Please check dish details and ingredients before ordering.</small>
    </section>}
  </>;
}
