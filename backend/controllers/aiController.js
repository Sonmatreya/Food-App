const Food = require("../models/Food");

const fallbackReply = (message, foods) => {
  const text = String(message || "").toLowerCase();
  const available = foods.filter((food) => food.isAvailable !== false);
  if (!available.length) return "I could not find any available dishes right now. Please check the menu again shortly.";
  const budgetMatch = text.match(/(?:under|below|less than|within)\s*(?:$|rs\.?|inr)?\s*(\d+(?:\.\d+)?)/i);
  const budget = budgetMatch ? Number(budgetMatch[1]) : null;
  let matches = available;
  if (budget !== null && Number.isFinite(budget)) matches = matches.filter((food) => Number(food.price) <= budget);
  const categoryWords = ["pizza", "burger", "pasta", "noodle", "drink", "beverage", "healthy"];
  const category = categoryWords.find((word) => text.includes(word));
  if (category) matches = matches.filter((food) => (String(food.name) + " " + String(food.category) + " " + String(food.description)).toLowerCase().includes(category));
  matches = [...matches].sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0)).slice(0, 3);
  if (!matches.length) return "I could not find a matching dish in the current catalogue. Try another category or a higher budget.";
  const recommendations = matches.map((food) => food.name + " — $" + Number(food.price).toFixed(2) + " (" + Number(food.rating || 0).toFixed(1) + "★)").join("\n");
  return "Here are a few options from our current menu:\n\n" + recommendations + "\n\nOpen the Menu to explore them and choose what you like.";
};

const chatWithAssistant = async (req, res) => {
  try {
    const message = String(req.body?.message || "").trim();
    if (!message || message.length > 500) return res.status(400).json({ success: false, message: "Please enter a message between 1 and 500 characters." });

    const foods = await Food.find({ isAvailable: true })
      .select("name description category price rating ingredients isFeatured isAvailable")
      .sort({ rating: -1 })
      .limit(60)
      .lean();

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return res.json({ success: true, reply: fallbackReply(message, foods), mode: "catalogue-fallback" });
    }

    const catalogue = foods.map((food) => ({
      name: food.name,
      category: food.category,
      price: food.price,
      rating: food.rating,
      ingredients: food.ingredients,
      description: food.description,
      featured: food.isFeatured,
    }));

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + apiKey,
        "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "http://localhost:3000",
        "X-Title": process.env.OPENROUTER_APP_NAME || "Food App",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "openrouter/free",
        messages: [
          {
            role: "system",
            content:
              "You are FoodAI, the helpful food-ordering assistant for this restaurant app. " +
              "Recommend only dishes present in the supplied catalogue. Never invent prices, availability, " +
              "ingredients, coupons, delivery times, order statuses, or restaurant policies. " +
              "If the user asks for an action such as placing an order or changing an order, explain that they should use the app controls. " +
              "Keep answers concise, friendly, and useful. Use the same currency shown by the catalogue for prices. " +
              "Catalogue:\n" + JSON.stringify(catalogue),
          },
          { role: "user", content: message },
        ],
        max_tokens: 500,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenRouter assistant error:", data);
      return res.json({
        success: true,
        reply: fallbackReply(message, foods),
        mode: "catalogue-fallback",
      });
    }

    const reply = data.choices?.[0]?.message?.content?.trim();

    return res.json({
      success: true,
      reply: reply || fallbackReply(message, foods),
      mode: "ai",
    });
  } catch (error) {
    console.error("AI assistant error:", error);
    return res.status(500).json({
      success: false,
      message: "FoodAI is temporarily unavailable. Please try again.",
    });
  }
};

module.exports = { chatWithAssistant };


const generateFood = async (req, res) => {
  try {
    const prompt = String(req.body?.prompt || "").trim();

    if (!prompt || prompt.length > 300) {
      return res.status(400).json({
        success: false,
        message: "Please describe the food item in 1 to 300 characters.",
      });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        success: false,
        message: "OpenRouter AI is not configured on the backend.",
      });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + apiKey,
        "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "http://localhost:3000",
        "X-Title": process.env.OPENROUTER_APP_NAME || "Food App",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "openrouter/free",
        messages: [
          {
            role: "system",
            content:
              "You generate a draft food catalogue item for a restaurant admin. " +
              "Return ONLY valid JSON, with no markdown and no explanation. " +
              "Use exactly these keys: name, category, description, ingredients, suggestedPrice, isFeatured. " +
              "name must be 2-100 characters. category must be concise. description must be customer-friendly and under 500 characters. " +
              "ingredients must be an array of 3-12 short strings. suggestedPrice must be a positive INR number suitable as a starting suggestion, not a guaranteed market price. " +
              "isFeatured must be true or false. Do NOT create a customer rating because a new food has no real customer reviews; the application will set its initial rating to 0. " +
              "Do not include image URLs. The restaurant admin will review the draft before saving it.",
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 500,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenRouter food generator error:", data);
      return res.status(502).json({
        success: false,
        message: "AI food generation failed. Please try again.",
      });
    }

    const raw = data.choices?.[0]?.message?.content?.trim() || "";
    const cleaned = raw.replace(/^\`\`\`(?:json)?\s*/i, "").replace(/\s*\`\`\`$/i, "").trim();

    let generated;
    try {
      generated = JSON.parse(cleaned);
    } catch {
      console.error("Invalid AI food JSON:", raw);
      return res.status(502).json({
        success: false,
        message: "AI returned an invalid food draft. Please try again.",
      });
    }

    const name = typeof generated.name === "string" ? generated.name.trim().slice(0, 100) : "";
    const category = typeof generated.category === "string" ? generated.category.trim().slice(0, 50) : "";
    const description = typeof generated.description === "string" ? generated.description.trim().slice(0, 1000) : "";
    const ingredients = Array.isArray(generated.ingredients)
      ? generated.ingredients.map((item) => String(item).trim()).filter(Boolean).slice(0, 20)
      : [];
    const suggestedPrice = Number(generated.suggestedPrice);
    const isFeatured = generated.isFeatured === true;

    if (
      name.length < 2 ||
      !category ||
      !Number.isFinite(suggestedPrice) ||
      suggestedPrice <= 0 ||
      !ingredients.length
    ) {
      return res.status(502).json({
        success: false,
        message: "AI returned incomplete food details. Please try again.",
      });
    }

    return res.json({
      success: true,
      mode: "ai",
      food: {
        name,
        category,
        description,
        ingredients,
        suggestedPrice: Number(suggestedPrice.toFixed(2)),
        rating: 0,
        ratingCount: 0,
        isFeatured,
      },
    });
  } catch (error) {
    console.error("AI food generation error:", error);
    return res.status(500).json({
      success: false,
      message: "Food AI is temporarily unavailable. Please try again.",
    });
  }
};

module.exports = { chatWithAssistant, generateFood };
