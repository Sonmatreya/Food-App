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
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { API_URL } from "../config/api";
import { resolveFoodImage } from "../utils/foodImage";

// Styles
import "../Styles/Home.css";
import RecentlyViewed from "../Components/RecentlyViewed";
import FoodRecommendations from "../Components/FoodRecommendations";
import PromoBanners from "../Components/PromoBanners";


/* =========================================================
   HOME PAGE
   ========================================================= */

function Home() {
  /* =======================================================
     1. STATE AND CART
     ======================================================= */

  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const [addedFoodIds, setAddedFoodIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [availableFoods, setAvailableFoods] = useState([]);
  const [foodsLoading, setFoodsLoading] = useState(true);
  const [foodsError, setFoodsError] = useState("");
  const [reloadFoods, setReloadFoods] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadFoods = async () => {
      try {
        const response = await fetch(`${API_URL}/api/foods?available=true`, {
          credentials: "include",
        });
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "The live menu is temporarily unavailable.");
        }
        if (!cancelled) {
          setAvailableFoods(Array.isArray(data.foods) ? data.foods : []);
          setFoodsError("");
        }
      } catch (error) {
        if (!cancelled) {
          setAvailableFoods([]);
          setFoodsError(error.message || "The live menu could not be loaded. Please try again.");
        }
      } finally {
        if (!cancelled) setFoodsLoading(false);
      }
    };

    loadFoods();
    return () => {
      cancelled = true;
    };
  }, [reloadFoods]);


  /* =======================================================
     2. HOME PAGE DATA
     ======================================================= */

  const popularFoods = [...availableFoods]
    .sort((a, b) => {
      const featuredDifference = Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured));
      if (featuredDifference) return featuredDifference;
      const ratingA = Number(a.rating || 0);
      const ratingB = Number(b.rating || 0);
      if (ratingA !== ratingB) return ratingB - ratingA;
      return Number(b.ratingCount || 0) - Number(a.ratingCount || 0);
    })
    .slice(0, 4);
  const featuredFood = availableFoods.find((food) => food.isFeatured) || popularFoods[0];
  const isCartableFood = (food) => /^[a-f\d]{24}$/i.test(String(food?._id || food?.id || ""));

  const categoryIcons = {
    pizza: "🍕",
    burger: "🍔",
    burgers: "🍔",
    pasta: "🍝",
    noodles: "🍜",
    healthy: "🥗",
    drinks: "🥤",
    beverage: "🥤",
    momo: "🥤",
  };

  const categories = useMemo(() => {
    const source = availableFoods;
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
    if (!isCartableFood(food)) {
      showToast("This is a sample dish. Open the live menu to order available items.", "info");
      navigate("/menu");
      return;
    }

    addToCart(food, 1);
    showToast(`${food.name} added to your cart`, "success");
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
      <section className="heroSection heroEditorialLayout">
        <div className="heroEditorialCopy">
          <div className="heroEditorialEyebrow">
            <span className="heroLiveDot" />
            GOOD FOOD. GOOD MOOD.
          </div>
          <h1>
            Make room
            <br />
            for <em>something</em>
            <br />
            delicious.
          </h1>
          <p>
            Your next favourite meal is waiting. Explore the menu, find what
            you love, and order in a few simple steps.
          </p>

          <form className="heroSearch heroEditorialSearch" onSubmit={handleSearch}>
            <SearchRoundedIcon className="searchIcon" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="What are you craving today?"
              aria-label="Search food"
            />
            <button type="submit">Search</button>
          </form>

          <div className="heroEditorialActions">
            <Link to="/menu" className="heroEditorialPrimary">
              Explore menu <ArrowForwardIcon />
            </Link>
            <span><VerifiedOutlinedIcon /> Browse live menu items</span>
          </div>
          <div className="heroEditorialStats">
            <div><strong>{availableFoods.length}</strong><span>{availableFoods.length === 1 ? "dish available" : "dishes available"}</span></div>
            <div><strong>{categories.length}</strong><span>{categories.length === 1 ? "category" : "categories"}</span></div>
            <div><strong>₹</strong><span>clear menu pricing</span></div>
          </div>
        </div>

        <div className="heroEditorialVisual">
          <div className="heroEditorialBackdrop" />
          <div className="heroEditorialImage">
            <img
              src={resolveFoodImage(featuredFood?.image) || BannerImage}
              alt={featuredFood?.name || "Discover food from the menu"}
              onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = BannerImage; }}
            />
          </div>
          <div className="heroEditorialStamp"><span>MADE FOR</span><strong>FOOD<br />LOVERS</strong><i>✳</i></div>
          <article className="heroEditorialFeature">
            <span className="heroEditorialFeatureLabel">
              {featuredFood?.isFeatured ? "FEATURED FROM THE MENU" : "DISCOVER THE MENU"}
            </span>
            <div className="heroEditorialFeatureRow">
              <div>
                <h2>{featuredFood?.name || "Something delicious"}</h2>
                <p>{featuredFood?.category || "Explore available dishes"}</p>
              </div>
              <strong>₹{Number(featuredFood?.price || 0).toFixed(2)}</strong>
            </div>
            <Link to={featuredFood ? "/food/" + (featuredFood._id || featuredFood.id) : "/menu"}>
              Discover dish <ArrowForwardIcon />
            </Link>
          </article>
          <div className="heroEditorialFloating"><span>↗</span><div><strong>Find your favourite</strong><small>Start with the live menu</small></div></div>
        </div>
      </section>


      {/* ===================================================
          4.2 QUICK INFORMATION
          =================================================== */}
      <section className="quickInfoBar">
        <div>
          <LocalShippingOutlinedIcon />
          <div>
            <strong>Delivery options</strong>
            <span>See available options at checkout</span>
          </div>
        </div>

        <div>
          <VerifiedOutlinedIcon />
          <div>
            <strong>Simple ordering</strong>
            <span>Choose items from the live menu</span>
          </div>
        </div>

        <div>
          <AccessTimeOutlinedIcon />
          <div>
            <strong>Menu availability</strong>
            <span>Check currently listed dishes</span>
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

        {foodsError && (
          <p className="homeMenuNotice" role="status">
            {foodsError} <Link to="/menu">Open the full menu</Link>{" "}
            <button type="button" onClick={() => { setFoodsLoading(true); setFoodsError(""); setReloadFoods((value) => value + 1); }}>Try again</button>
          </p>
        )}
        {foodsLoading && (
          <div className="foodGrid homeFoodSkeletonGrid" role="status" aria-label="Loading menu items" aria-live="polite">
            {Array.from({ length: 4 }, (_, index) => (
              <article className="foodCard homeFoodSkeleton" key={`food-skeleton-${index}`} aria-hidden="true">
                <div className="foodCardImage homeFoodSkeletonImage" />
                <div className="foodCardContent">
                  <span className="homeFoodSkeletonLine homeFoodSkeletonShort" />
                  <span className="homeFoodSkeletonLine homeFoodSkeletonTitle" />
                  <span className="homeFoodSkeletonLine" />
                  <div className="foodCardBottom"><span className="homeFoodSkeletonLine homeFoodSkeletonPrice" /><span className="homeFoodSkeletonButton" /></div>
                </div>
              </article>
            ))}
          </div>
        )}
        {!foodsLoading && !foodsError && !popularFoods.length && (
          <p className="homeMenuNotice" role="status">
            No dishes are available right now. Please check the full menu again soon.
          </p>
        )}
        <div className="foodGrid">
          {popularFoods.map((food) => {
            const foodId = food._id || food.id;
            const isAdded = addedFoodIds.includes(foodId);

            return (
              <article className="foodCard" key={food._id || food.id}>
                {/* Food image */}
                <Link
                  to={`/food/${foodId}`}
                  className="foodCardImage"
                >
                  <img src={resolveFoodImage(food.image) || BannerImage} alt={food.name} loading="lazy" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = BannerImage; }} />
                  {Number.isFinite(Number(food.rating)) && Number(food.rating) > 0 && Number(food.ratingCount) > 0 && <span className="foodRating"><StarRoundedIcon />{Number(food.rating).toFixed(1)}</span>}
                </Link>

                {/* Food information */}
                <div className="foodCardContent">
                  <div className="foodCardTopline">
                    <span className="foodCategory">
                      {food.category}
                    </span>
                    <span>{food.isFeatured ? "Featured" : food.isVegetarian ? "Vegetarian" : "Menu item"}</span>
                  </div>

                  <Link to={`/food/${foodId}`}>
                    <h3>{food.name}</h3>
                  </Link>

                  <p>{food.description}</p>

                  {/* Price and add-to-cart button */}
                  <div className="foodCardBottom">
                    <strong>₹{Number(food.price || 0).toFixed(2)}</strong>
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
                      {!isCartableFood(food) ? "View menu" : isAdded ? "Added" : "Add"}
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
      <section className="offerSection" aria-label="Explore the menu">
        <div className="offerContent">
          <span>GOOD FOOD, MADE EASY</span>
          <h2>
            Find your next
            <br />
            <em>favourite meal.</em>
          </h2>
          <p>
            Explore the live menu, discover available dishes, and order your way.
          </p>
          <Link to="/menu" className="offerButton">
            Explore the menu
            <ArrowForwardIcon />
          </Link>
        </div>

        <div className="offerCircle" aria-label="Discover good food">
          <span>YUM</span>
          <small>YOUR WAY</small>
          <b>EXPLORE • ORDER • ENJOY</b>
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
      <RecentlyViewed />
      <PromoBanners />
    </main>
  );
}

export default Home;
