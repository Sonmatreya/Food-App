const Food = require("../models/Food");

const fallbackReply = (message, foods) => {
  const text = String(message || "").toLowerCase();
  const available = foods.filter((food) => food.isAvailable !== false);
  if (!available.length) return "I could not find any available dishes right now. Please check the menu again shortly.";
  const budgetMatch = text.match(/(?:under|below|less than|within)\s*(?:$|rs\.?|inr)?\s*(\\d+(?:\\.\\d+)?)/i);
  const budget = budgetMatch ? Number(budgetMatch[1]) : null;
  let matches = available;
  if (budget !== null && Number.isFinite(budget)) matches = matches.filter((food) => Number(food.price) <= budget);
  const categoryWords = ["pizza", "burger", "pasta", "noodle", "drink", "beverage", "healthy"];
  const category = categoryWords.find((word) => text.includes(word));
  if (category) matches = matches.filter((food) => (String(food.name) + " " + String(food.category) + " " + String(food.description)).toLowerCase().includes(category));
  matches = [...matches].sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0)).slice(0, 3);
  if (!matches.length) return "I could not find a matching dish in the current catalogue. Try another category or a higher budget.";
  const recommendations = matches.map((food) => food.name + " — $" + Number(food.price).toFixed(2) + " (" + Number(food.rating || 0).toFixed(1) + "★)").join("\\n");
  return "Here are a few options from our current menu:\\n\\n" + recommendations + "\\n\\nOpen the Menu to explore them and choose what you like.";
};

const chatWithAssistant = async (req, res) => {
  try {
    const message = String(req.body?.message || "").trim();
    if (!message || message.length > 500) return res.status(400).json({ success: false, message: "Please enter a message between 1 and 500 characters." });
    const foods = await Food.find({ isAvailable: true }).select("name description category price rating ingredients isFeatured isAvailable").sort({ rating: -1 }).limit(60).lean();
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return res.json({ success: true, reply: fallbackReply(message, foods), mode: "catalogue-fallback" });
    const catalogue = foods.map((food) => ({ name: food.name, category: food.category, price: food.price, rating: food.rating, ingredients: food.ingredients, description: food.description, featured: food.isFeatured }));
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {\n        "Content-Type": "application/json",\n        Authorization: "Bearer " + apiKey,\n        "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "http://localhost:3000",\n        "X-Title": process.env.OPENROUTER_APP_NAME || "Food App",\n      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5.6-luna",
        input: [
          { role: "system", content: [{ type: "input_text", text: "You are FoodAI, the helpful food-ordering assistant for this restaurant app. Recommend only dishes present in the supplied catalogue. Never invent prices, availability, ingredients, coupons, delivery times, order statuses, or restaurant policies. If the user asks for an action such as placing an order or changing an order, explain that they should use the app controls. Keep answers concise, friendly, and useful. Use the same currency shown by the catalogue for prices. Catalogue:\\n" + JSON.stringify(catalogue) }] },
          { role: "user", content: [{ type: "input_text", text: message }] },
        ],
        max_tokens: 500,
      }),
    });
    const data = await response.json();
    if (!response.ok) { console.error("OpenRouter assistant error:", data); return res.json({ success: true, reply: fallbackReply(message, foods), mode: "catalogue-fallback" }); }
    const reply = data.choices?.[0]?.message?.content?.trim();
    return res.json({ success: true, reply: reply || fallbackReply(message, foods), mode: "ai" });
  } catch (error) {
    console.error("AI assistant error:", error);
    return res.status(500).json({ success: false, message: "FoodAI is temporarily unavailable. Please try again." });
  }
};

module.exports = { chatWithAssistant };