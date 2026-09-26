import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import MenuItem from "../Components/MenuItem";
import { API_URL } from "../config/api";
import "../Styles/Menu.css";

function Menu() {
  const [foods, setFoods] = useState([]);
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortOption, setSortOption] = useState("default");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "All";
    setSearchTerm(search);
    setSelectedCategory(category);
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;

    const loadFoods = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_URL}/api/foods?available=true`, {
          credentials: "include",
        });
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Unable to load menu.");
        }

        if (!cancelled) setFoods(Array.isArray(data.foods) ? data.foods : []);
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.message || "Unable to load menu.");
          setFoods([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadFoods();
    return () => {
      cancelled = true;
    };
  }, []);


  const searchSuggestions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return [];
    return foods
      .filter((food) => `${food.name || ""} ${food.category || ""}`.toLowerCase().includes(query))
      .slice(0, 6);
  }, [foods, searchTerm]);

  const categories = useMemo(
    () => ["All", ...new Set(foods.map((item) => item.category).filter(Boolean))],
    [foods]
  );

  const filteredFoods = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const result = foods.filter((item) => {
      const searchableText = `${item.name || ""} ${item.description || ""} ${item.category || ""}`.toLowerCase();
      const matchesSearch = !query || searchableText.includes(query);
      const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    if (sortOption === "lowToHigh") return [...result].sort((a, b) => a.price - b.price);
    if (sortOption === "highToLow") return [...result].sort((a, b) => b.price - a.price);
    if (sortOption === "rating") return [...result].sort((a, b) => b.rating - a.rating);
    return result;
  }, [foods, searchTerm, selectedCategory, sortOption]);

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedCategory("All");
    setSortOption("default");
  };

  return (
    <div className="menuPage">
      <section className="menuHero">
        <div className="menuHeroContent">
          <span>OUR MENU</span>
          <h1>
            Find your favourite
            <br />
            food
          </h1>
          <p>
            Explore delicious meals prepared with fresh ingredients
            and choose something perfect for your next meal.
          </p>
        </div>
      </section>

      <section className="menuSection">
        <div className="menuSearchBox">
          <span>🔍</span>
          <input
            type="text"
            placeholder="Search pizza, burgers, pasta..."
            value={searchTerm}
            onFocus={() => setShowSuggestions(true)}
            onChange={(event) => { setSearchTerm(event.target.value); setShowSuggestions(true); }}
            onKeyDown={(event) => { if (event.key === "Escape") setShowSuggestions(false); }}
            aria-label="Search food"
            autoComplete="off"
          />
          {showSuggestions && searchSuggestions.length > 0 && (
            <div className="menuSearchSuggestions">
              {searchSuggestions.map((food) => (
                <button type="button" key={food._id} onMouseDown={(event) => event.preventDefault()} onClick={() => { setSearchTerm(food.name); setShowSuggestions(false); }}>
                  <span>🍽️</span><div><strong>{food.name}</strong><small>{food.category} · ₹{Number(food.price || 0).toFixed(2)}</small></div>
                </button>
              ))}
            </div>
          )}
          {searchTerm && (
            <button
              type="button"
              className="clearSearch"
              onClick={() => setSearchTerm("")}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        <div className="menuToolbar">
          <div className="categoryFilters">
            {categories.map((category) => (
              <button
                type="button"
                key={category}
                className={selectedCategory === category ? "categoryFilter active" : "categoryFilter"}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="sortBox">
            <label htmlFor="sort">Sort:</label>
            <select id="sort" value={sortOption} onChange={(event) => setSortOption(event.target.value)}>
              <option value="default">Recommended</option>
              <option value="rating">Top Rated</option>
              <option value="lowToHigh">Price: Low to High</option>
              <option value="highToLow">Price: High to Low</option>
            </select>
          </div>
        </div>

        <div className="menuResultHeader">
          <div>
            <h2>{selectedCategory === "All" ? "Popular Food" : selectedCategory}</h2>
            <p>
              {loading ? "Loading menu..." : `${filteredFoods.length} food item${filteredFoods.length !== 1 ? "s" : ""} available`}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="menuSkeletonGrid">
            {Array.from({ length: 6 }).map((_, index) => <div className="menuSkeletonCard" key={index}><div className="skeletonImage" /><div className="skeletonLine wide" /><div className="skeletonLine" /><div className="skeletonLine short" /></div>)}
          </div>
        ) : error ? (
          <div className="noFoodFound">
            <div className="noFoodIcon">⚠️</div>
            <h2>Unable to load menu</h2>
            <p>{error}</p>
            <button type="button" onClick={() => window.location.reload()}>
              Try Again
            </button>
          </div>
        ) : filteredFoods.length > 0 ? (
          <div className="menuGrid">
            {filteredFoods.map((menuItem) => (
              <MenuItem
                key={menuItem._id}
                id={menuItem._id}
                image={menuItem.image}
                name={menuItem.name}
                price={menuItem.price}
                category={menuItem.category}
                rating={menuItem.rating}
                isAvailable={menuItem.isAvailable}
              />
            ))}
          </div>
        ) : (
          <div className="noFoodFound">
            <div className="noFoodIcon">🍽️</div>
            <h2>No food found</h2>
            <p>We couldn't find any food matching your search or filter.</p>
            <button type="button" onClick={resetFilters}>
              View All Food
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

export default Menu;
