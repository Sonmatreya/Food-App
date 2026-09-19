import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

// Icons
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";

// Data, context and assets
import BannerImage from "../assets/pizza.jpeg";
import { MenuList } from "../helpers/MenuList";
import { useCart } from "../context/CartContext";
import { API_URL } from "../config/api";

// Styles
import "../Styles/Home.css";


/* =========================================================
   HOME PAGE
   ========================================================= */

function Home() {
  /* =======================================================
     1. STATE AND CART
     ======================================================= */

  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [addedFoodIds, setAddedFoodIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [availableFoods, setAvailableFoods] = useState([]);

  useEffect(() => {
    let cancelled = false;

    const loadFoods = async () => {
      try {
        const response = await fetch(`${API_URL}/api/foods?available=true`, {
          credentials: "include",
        });
        const data = await response.json();

        if (!response.ok || !data.success) return;
        if (!cancelled) setAvailableFoods(Array.isArray(data.foods) ? data.foods : []);
      } catch (error) {
        if (!cancelled) setAvailableFoods([]);
      }
    };

    loadFoods();
    return () => {
      cancelled = true;
    };
  }, []);


  /* =======================================================
     2. HOME PAGE DATA
     ======================================================= */

  const fallbackFoods = MenuList.filter((food) => food.isAvailable !== false);
  const popularFoods = (availableFoods.length > 0 ? availableFoods : fallbackFoods).slice(0, 4);

  const categoryIcons = {
    pizza: "🍕",
    burger: "🍔",
    burgers: "🍔",
    pasta: "🍝",
    noodles: "🍜",
    healthy: "🥗",
    drinks: "🥤",
    beverage: "🥤",
    beverages: "🥤",
  };

  const categories = useMemo(() => {
    const source = availableFoods.length > 0 ? availableFoods : fallbackFoods;
    const counts = source.reduce((result, food) => {
      const name = food.category?.trim();
      if (name) result[name] = (result[name] || 0) + 1;
      return result;
    }, {});

    return Object.entries(counts).slice(0, 6).map(([name, count]) => ({
      icon: categoryIcons[name.toLowerCase()] || "🍽️",
      name,
      count: `${count} ${count === 1 ? "dish" : "dishes"}`,
    }));
  }, [availableFoods]);

  const benefits = [
    {
      icon: <LocalShippingOutlinedIcon />,
      title: "Fast delivery",
      text: "Fresh food delivered to your door without the long wait.",
    },
    {
      icon: <VerifiedOutlinedIcon />,
      title: "Quality first",
      text: "Carefully selected ingredients and meals prepared with care.",
    },
    {
      icon: <AccessTimeOutlinedIcon />,
      title: "Easy ordering",
      text: "Browse, customize and place your order in just a few steps.",
    },
  ];

  const reviews = [
    {
      initial: "A",
      name: "Arjun Sharma",
      text: "The food was fresh, delicious and arrived much faster than I expected. Definitely ordering again!",
    },
    {
      initial: "P",
      name: "Priya Das",
      text: "Amazing taste and a really smooth ordering experience. The pizza was absolutely delicious.",
    },
    {
      initial: "R",
      name: "Rahul Singh",
      text: "Great variety and a simple checkout. Everything from browsing to delivery felt easy.",
    },
  ];


  /* =======================================================
     3. EVENT HANDLERS
     ======================================================= */

  const handleSearch = (event) => {
    event.preventDefault();

    const trimmedSearch = searchTerm.trim();

    if (!trimmedSearch) {
      navigate("/menu");
      return;
    }

    navigate(`/menu?search=${encodeURIComponent(trimmedSearch)}`);
  };

  const handleAddToCart = (food) => {
    addToCart(food, 1);
    const foodId = food._id || food.id;

    setAddedFoodIds((currentIds) => {
      if (currentIds.includes(foodId)) return currentIds;
      return [...currentIds, foodId];
    });
  };


  /* =======================================================
     4. PAGE UI
     ======================================================= */

  return (
    <main className="homePage">

      {/* ===================================================
          4.1 HERO SECTION
          =================================================== */}
      <section className="heroSection">
        <div
          className="heroBackgroundImage"
          style={{ backgroundImage: `url(${BannerImage})` }}
        />
        <div className="heroShade" />

        <div className="heroContent">
          {/* Hero text */}
          <div className="heroText">
            <div className="heroSmallText">
              <span className="heroLiveDot" />
              Freshly prepared · Fast delivery
            </div>

            <h1>
              Your cravings,
              <br />
              <em>delivered.</em>
            </h1>

            <p>
              Discover something delicious, order in a few taps and let us
              bring your next favourite meal straight to your doorstep.
            </p>

            {/* Hero search */}
            <form className="heroSearch" onSubmit={handleSearch}>
              <SearchRoundedIcon className="searchIcon" />

              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search for pizza, burgers, pasta..."
                aria-label="Search food"
              />

              <button type="submit">Find food</button>
            </form>

            {/* Trust information */}
            <div className="heroTrustRow">
              <div>
                <StarRoundedIcon />
                <span><strong>4.8</strong> rating</span>
              </div>
              <div>
                <AccessTimeOutlinedIcon />
                <span><strong>30 min</strong> delivery</span>
              </div>
              <div>
                <VerifiedOutlinedIcon />
                <span><strong>100%</strong> fresh</span>
              </div>
            </div>
          </div>

          {/* Hero featured food */}
          <div className="heroVisual">
            <div className="heroVisualGlow" />

            <div className="heroFoodCard">
              <div className="heroFoodImageWrap">
                <img src={BannerImage} alt="Featured fresh pizza" />
                <span className="heroFoodBadge">
                  <StarRoundedIcon />
                  Top choice
                </span>
              </div>

              <div className="heroFoodInfo">
                <div>
                  <span>FEATURED TODAY</span>
                  <h3>Fresh &amp; Delicious Pizza</h3>
                  <p>Premium ingredients · Made fresh</p>
                </div>
                <strong>$15.99</strong>
              </div>

              <Link to="/menu" className="heroFoodButton">
                Explore menu
                <ArrowForwardIcon />
              </Link>
            </div>

            <div className="floatingDeliveryCard">
              <span className="deliveryCheck">✓</span>
              <div>
                <strong>On-time delivery</strong>
                <small>Your food is on the way</small>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ===================================================
          4.2 QUICK INFORMATION
          =================================================== */}
      <section className="quickInfoBar">
        <div>
          <LocalShippingOutlinedIcon />
          <div>
            <strong>Free delivery</strong>
            <span>On orders over $40</span>
          </div>
        </div>

        <div>
          <VerifiedOutlinedIcon />
          <div>
            <strong>Secure checkout</strong>
            <span>Safe &amp; protected payment</span>
          </div>
        </div>

        <div>
          <AccessTimeOutlinedIcon />
          <div>
            <strong>Open every day</strong>
            <span>Fresh food when you want it</span>
          </div>
        </div>
      </section>


      {/* ===================================================
          4.3 CATEGORY SECTION
          =================================================== */}
      <section className="categorySection">
        <div className="sectionHeading">
          <div>
            <span>EXPLORE MENU</span>
            <h2>What are you craving?</h2>
          </div>
          <Link to="/menu" className="viewAllLink">
            See full menu
            <ArrowForwardIcon />
          </Link>
        </div>

        <div className="categoryGrid">
          {categories.map((category) => (
            <Link
              to={`/menu?category=${encodeURIComponent(category.name)}`}
              className="categoryCard"
              key={category.name}
            >
              <div className="categoryIcon">{category.icon}</div>
              <div className="categoryMeta">
                <h3>{category.name}</h3>
                <p>{category.count}</p>
              </div>
              <span className="categoryArrow">
                <ArrowForwardIcon />
              </span>
            </Link>
          ))}
        </div>
      </section>


      {/* ===================================================
          4.4 POPULAR FOOD SECTION
          =================================================== */}
      <section className="popularSection">
        <div className="sectionHeading">
          <div>
            <span>POPULAR RIGHT NOW</span>
            <h2>People are loving these</h2>
          </div>
          <Link to="/menu" className="viewAllLink">
            View all dishes
            <ArrowForwardIcon />
          </Link>
        </div>

        <div className="foodGrid">
          {popularFoods.map((food) => {
            const foodId = food._id || food.id;
            const isAdded = addedFoodIds.includes(foodId);

            return (
              <article className="foodCard" key={food.id}>
                {/* Food image */}
                <Link
                  to={`/food/${foodId}`}
                  className="foodCardImage"
                >
                  <img src={food.image} alt={food.name} />
                  <span className="foodRating">
                    <StarRoundedIcon />
                    {food.rating}
                  </span>
                </Link>

                {/* Food information */}
                <div className="foodCardContent">
                  <div className="foodCardTopline">
                    <span className="foodCategory">
                      {food.category}
                    </span>
                    <span>Fresh</span>
                  </div>

                  <Link to={`/food/${foodId}`}>
                    <h3>{food.name}</h3>
                  </Link>

                  <p>{food.description}</p>

                  {/* Price and add-to-cart button */}
                  <div className="foodCardBottom">
                    <strong>${Number(food.price || 0).toFixed(2)}</strong>
                    <button
                      type="button"
                      className={`addFoodButton ${isAdded ? "added" : ""}`}
                      onClick={() => handleAddToCart(food)}
                      aria-label={
                        isAdded
                          ? `${food.name} added to cart`
                          : `Add ${food.name} to cart`
                      }
                    >
                      <AddRoundedIcon />
                      {isAdded ? "Added" : "Add"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>


      {/* ===================================================
          4.5 WHY CHOOSE US
          =================================================== */}
      <section className="whySection">
        <div className="whyContent">
          <div className="whyText">
            <span>THE FOOD APP DIFFERENCE</span>
            <h2>
              Good food should feel <em>effortless.</em>
            </h2>
            <p>
              Everything is designed around one simple idea: make ordering
              great food quick, clear and enjoyable from the first tap to
              the last bite.
            </p>
            <Link to="/menu" className="whyButton">
              Start ordering
              <ArrowForwardIcon />
            </Link>
          </div>

          <div className="benefitGrid">
            {benefits.map((benefit) => (
              <div className="benefitCard" key={benefit.title}>
                <div className="benefitIcon">{benefit.icon}</div>
                <h3>{benefit.title}</h3>
                <p>{benefit.text}</p>
              </div>
            ))}

            <div className="benefitQuote">
              <StarRoundedIcon />
              <strong>Made for people who take food seriously.</strong>
              <span>— The Food App team</span>
            </div>
          </div>
        </div>
      </section>


      {/* ===================================================
          4.6 OFFER SECTION
          =================================================== */}
      <section className="offerSection">
        <div className="offerContent">
          <span>WELCOME TO FOOD APP</span>
          <h2>
            Your first order
            <br />
            <em>just got better.</em>
          </h2>
          <p>
            Use <strong>WELCOME20</strong> at checkout and get 20% off
            your first order.
          </p>
          <Link to="/menu" className="offerButton">
            Claim the offer
            <ArrowForwardIcon />
          </Link>
        </div>

        <div className="offerCircle">
          <span>20</span>
          <small>% OFF</small>
          <b>FIRST ORDER</b>
        </div>
      </section>


      {/* ===================================================
          4.7 CUSTOMER REVIEWS
          =================================================== */}
      <section className="reviewSection">
        <div className="sectionHeading reviewHeading">
          <div>
            <span>REAL PEOPLE · REAL CRAVINGS</span>
            <h2>Loved after the first bite.</h2>
          </div>
        </div>

        <div className="reviewGrid">
          {reviews.map((review) => (
            <article className="reviewCard" key={review.name}>
              <div className="reviewStars">
                <StarRoundedIcon />
                <StarRoundedIcon />
                <StarRoundedIcon />
                <StarRoundedIcon />
                <StarRoundedIcon />
              </div>

              <p>“{review.text}”</p>

              <div className="reviewUser">
                <div className="reviewAvatar">{review.initial}</div>
                <div>
                  <h4>{review.name}</h4>
                  <span>Verified customer</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>


      {/* ===================================================
          4.8 FINAL CALL TO ACTION
          =================================================== */}
      <section className="finalCta">
        <div>
          <span>WHAT ARE YOU WAITING FOR?</span>
          <h2>
            There is always room
            <br />
            for something delicious.
          </h2>
        </div>

        <Link to="/menu" className="finalCtaButton">
          Browse the menu
          <ArrowForwardIcon />
        </Link>
      </section>
    </main>
  );
}

export default Home;
