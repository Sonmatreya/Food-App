const Food = require("../models/Food");
const Order = require("../models/Order");
const Coupon = require("../models/Coupon");

const fallbackReply = (message, foods, cartItems = []) => {
  const text = String(message || "").toLowerCase();
  const available = foods.filter((food) => food.isAvailable !== false);
  if (!available.length) return "I could not find any available dishes right now. Please check the menu again shortly.";

  const budgetMatch = text.match(/(?:under|below|less than|within|budget(?: of)?|upto|up to)\s*(?:₹|rs\.?|inr|rupees?)?\s*(\d+(?:\.\d+)?)/i);
  const budget = budgetMatch ? Number(budgetMatch[1]) : null;
  let matches = available;

  if (/don't eat onions|do not eat onions|no onions|without onions|avoid onions/i.test(text)) {
    matches = matches.filter((food) => !(food.ingredients || []).some((ingredient) => /onion/i.test(String(ingredient))));
  }
  if (/\b(vegetarian|veg food|pure veg|meatless)\b/i.test(text) && !/non.?veg/i.test(text)) {
    const nonVeg = /chicken|mutton|lamb|beef|pork|fish|prawn|shrimp|seafood|bacon|ham|meat|egg/i;
    matches = matches.filter((food) => !nonVeg.test([food.name, food.category, food.description, ...(food.ingredients || [])].join(" ")));
  }
  if (/\b(spicy|hot|fiery|chilli|chili)\b/i.test(text)) {
    matches = matches.filter((food) => /spicy|hot|fiery|chilli|chili|pepper|masala|schezwan/i.test([food.name, food.category, food.description, ...(food.ingredients || [])].join(" ")));
  }
  if (budget !== null && Number.isFinite(budget)) {
    matches = matches.filter((food) => Number(food.price) <= budget);
  }

  const categoryWords = ["pizza", "burger", "pasta", "noodle", "momo", "drink", "beverage", "salad", "dessert", "rice"];
  const category = categoryWords.find((word) => text.includes(word));
  if (category) matches = matches.filter((food) => (String(food.name) + " " + String(food.category) + " " + String(food.description)).toLowerCase().includes(category));

  const cartNames = (Array.isArray(cartItems) ? cartItems : []).map((item) => String(item.name || "").toLowerCase()).filter(Boolean);
  if (/cart|goes with|pair|add.?on|complement|something else/i.test(text) && cartNames.length) {
    const outsideCart = matches.filter((food) => !cartNames.includes(String(food.name || "").toLowerCase()));
    if (outsideCart.length) matches = outsideCart;
  }

  const highestRated = /highest.?rated|best.?rated|top.?rated|most popular|best food/i.test(text);
  matches = [...matches].sort((a, b) => {
    const ratingDiff = Number(b.rating || 0) - Number(a.rating || 0);
    if (highestRated && ratingDiff !== 0) return ratingDiff;
    return Number(b.isFeatured === true) - Number(a.isFeatured === true) || ratingDiff || Number(a.price || 0) - Number(b.price || 0);
  }).slice(0, 3);

  if (!matches.length) return "I could not find a matching dish in the current catalogue. Try another category, remove a dietary filter, or increase your budget.";
  const recommendations = matches.map((food) => food.name + " — ₹" + Number(food.price).toFixed(2) + " (" + Number(food.rating || 0).toFixed(1) + "★)").join("\n");
  const intro = /cart|goes with|pair|add.?on|complement|something else/i.test(text) && cartNames.length
    ? "Based on your cart, here are a few other menu options:"
    : budget !== null
      ? "Here are a few menu options within your budget:"
      : "Here are a few options from our current menu:";
  return intro + "\n\n" + recommendations + "\n\nOpen the Menu to explore them and choose what you like.";
};

const chatWithAssistant = async (req, res) => {
  try {
    const message = String(req.body?.message || "").trim();
    if (!message || message.length > 500) return res.status(400).json({ success: false, message: "Please enter a message between 1 and 500 characters." });

    const [foods, coupons] = await Promise.all([
      Food.find({ isAvailable: true })
        .select("name description category price rating ingredients isFeatured isAvailable")
        .sort({ rating: -1 })
        .limit(60)
        .lean(),
      Coupon.find({
        active: true,
        $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
      })
        .select("code type value minimum maxDiscount")
        .limit(30)
        .lean(),
    ]);

    let latestOrder = null;
    const currentUserId = req.user?.userId || req.user?.id || req.user?._id;
    if (currentUserId) {
      latestOrder = await Order.findOne({ userId: currentUserId }).sort({ createdAt: -1 }).select("orderNumber status deliveryType createdAt items.name").lean();
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return res.json({ success: true, reply: fallbackReply(message, foods, req.body?.cartItems), mode: "catalogue-fallback" });
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
      signal: AbortSignal.timeout(20000),
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
              "Use the supplied cart to suggest additions or complete-meal ideas. Use the supplied latest order to answer order-status questions when available. " +
              "Use the supplied active coupons to identify applicable offers, but do not claim a coupon was applied unless the customer uses the checkout controls. " +
              "If the user asks for an action such as placing an order or changing an order, explain that they should use the app controls. " +
              "Keep answers concise, friendly, and useful. Use the same currency shown by the catalogue for prices. " +
              "Catalogue:\n" + JSON.stringify(catalogue) + "\nCustomer cart:\n" + JSON.stringify(req.body?.cartItems || []) + "\nLatest customer order (if logged in):\n" + JSON.stringify(latestOrder || null) + "\nActive coupons:\n" + JSON.stringify(coupons || []),
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
        reply: fallbackReply(message, foods, req.body?.cartItems),
        mode: "catalogue-fallback",
      });
    }

    const reply = data.choices?.[0]?.message?.content?.trim();

    return res.json({
      success: true,
      reply: reply || fallbackReply(message, foods, req.body?.cartItems),
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
      signal: AbortSignal.timeout(20000),
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
              "Use exactly these keys: name, category, description, ingredients, suggestedPrice, isFeatured, dietaryType, spiceLevel. " +
              "name must be 2-100 characters. category must be concise. description must be customer-friendly and under 500 characters. " +
              "ingredients must be an array of 3-12 short strings. suggestedPrice must be a positive INR number suitable as a starting suggestion, not a guaranteed market price. " +
              "isFeatured must be true or false. dietaryType must be vegetarian, non-vegetarian, vegan, or unspecified. spiceLevel must be mild, medium, hot, or unspecified. Infer these only when supported by the dish description; otherwise use unspecified. Do NOT create a customer rating because a new food has no real customer reviews; the application will set its initial rating to 0. " +
              "Do not include image URLs. The restaurant admin will review the draft before saving it.",
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 500,
        temperature: 0.2,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenRouter food generator error:", data);
      const providerMessage =
        data?.error?.message ||
        data?.error?.metadata?.raw ||
        "AI provider rejected the request.";
      return res.status(502).json({
        success: false,
        message: providerMessage,
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
    const dietaryType = ["vegetarian", "non-vegetarian", "vegan"].includes(generated.dietaryType) ? generated.dietaryType : "unspecified";
    const spiceLevel = ["mild", "medium", "hot"].includes(generated.spiceLevel) ? generated.spiceLevel : "unspecified";

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
        dietaryType,
        spiceLevel,
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
