import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { API_URL } from "../config/api";
import { useCart } from "../context/CartContext";
import "../Styles/AIAssistant.css";

const suggestions = [
  "Suggest something under ₹300",
  "What is the best rated food?",
  "I want something vegetarian",
];

function AIAssistant() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hi! I’m FoodAI 👋 Tell me what you’re craving and I’ll help you choose from our menu." },
  ]);
  const [loading, setLoading] = useState(false);
  const { cartItems } = useCart();

  if (location.pathname.startsWith("/admin")) return null;

  const sendMessage = async (value = message) => {
    const text = value.trim();
    if (!text || loading) return;
    setMessage("");
    setMessages((current) => [...current, { role: "user", text }]);
    setLoading(true);
    try {
      const response = await fetch(API_URL + "/api/ai/chat", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({\n          message: text,\n          cartItems: cartItems.map((item) => ({ name: item.name, category: item.category, price: item.price, quantity: item.quantity, cookingRequest: item.cookingRequest || "" })),\n        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Assistant unavailable.");
      setMessages((current) => [...current, { role: "assistant", text: data.reply }]);
    } catch (error) {
      setMessages((current) => [...current, { role: "assistant", text: error.message || "Sorry, I couldn't connect right now." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {open && (
        <section className="aiAssistantPanel" aria-label="FoodAI assistant">
          <header className="aiAssistantHeader">
            <div className="aiAssistantIdentity">
              <span className="aiAssistantAvatar">✦</span>
              <div><strong>FoodAI</strong><small><span /> Online assistant</small></div>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close FoodAI">×</button>
          </header>

          <div className="aiAssistantMessages">
            {messages.map((item, index) => (
              <div className={"aiMessage " + item.role} key={item.role + "-" + index}>
                {item.text.split("\n").map((line, lineIndex) => (
                  <React.Fragment key={lineIndex}>{line}{lineIndex < item.text.split("\n").length - 1 && <br />}</React.Fragment>
                ))}
              </div>
            ))}
            {loading && <div className="aiMessage assistant aiTyping"><span /><span /><span /></div>}
          </div>

          {messages.length === 1 && (
            <div className="aiSuggestions">
              {suggestions.map((item) => <button type="button" key={item} onClick={() => sendMessage(item)}>{item}</button>)}
            </div>
          )}

          <form className="aiAssistantInput" onSubmit={(event) => { event.preventDefault(); sendMessage(); }}>
            <input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Ask FoodAI anything..." maxLength={500} aria-label="Message FoodAI" />
            <button type="submit" disabled={loading || !message.trim()} aria-label="Send message">➤</button>
          </form>
        </section>
      )}

      <button type="button" className={open ? "aiAssistantFab open" : "aiAssistantFab"} onClick={() => setOpen((current) => !current)} aria-label="Open FoodAI" aria-expanded={open}>
        <span>✦</span>{!open && <b>FoodAI</b>}
      </button>
    </>
  );
}

export default AIAssistant;
