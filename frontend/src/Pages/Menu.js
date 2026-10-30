import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import MenuItem from "../Components/MenuItem";
import { API_URL } from "../config/api";
import "../Styles/Menu.css";

function Menu() {
  const [foods, setFoods] = useState([]);
  const [availableCategories, setAvailableCategories] = useState(["All"]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortOption, setSortOption] = useState("default");
  const [priceRange, setPriceRange] = useState("all");
  const [minimumRating, setMinimumRating] = useState("0");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [reloadFoods, setReloadFoods] = useState(0);

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

        const query = new URLSearchParams({
          available: "true",
          page: String(currentPage),
          limit: "12",
          sort: sortOption === "lowToHigh" ? "price_asc"
            : sortOption === "highToLow" ? "price_desc"
            : sortOption === "rating" ? "rating" : sortOption === "newest" ? "newest" : "featured",
        });
        if (searchTerm.trim()) query.set("search", searchTerm.trim());
        if (selectedCategory !== "All") query.set("category", selectedCategory);
        if (priceRange !== "all") {
          const [minimum, maximum] = priceRange.split("-");
          if (minimum) query.set("minPrice", minimum);
          if (maximum) query.set("maxPrice", maximum);
        }
        if (minimumRating !== "0") query.set("minRating", minimumRating);
        if (featuredOnly) query.set("featured", "true");

        const response = await fetch(`${API_URL}/api/foods?${query.toString()}`, {
          credentials: "include",
        });
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Unable to load menu.");
        }

        if (!cancelled) {
          setFoods(Array.isArray(data.foods) ? data.foods : []);
          setAvailableCategories(["All", ...(Array.isArray(data.categories) ? data.categories : [])]);
          setTotalPages(Math.max(1, Number(data.pagination?.totalPages || 1)));
          setTotalResults(Math.max(0, Number(data.pagination?.total ?? data.count ?? 0)));
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.message || "Unable to load menu.");
          setFoods([]);
          setTotalPages(1);
          setTotalResults(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const timer = window.setTimeout(loadFoods, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [searchTerm, selectedCategory, sortOption, priceRange, minimumRating, featuredOnly, currentPage, reloadFoods]);


  const searchSuggestions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return [];
    return foods
      .filter((food) => `${food.name || ""} ${food.category || ""}`.toLowerCase().includes(query))
      .slice(0, 6);
  }, [foods, searchTerm]);

  const categories = availableCategories;
  const filteredFoods = foods;

  const updateMenuUrl = (nextSearch, nextCategory) => {
    const params = new URLSearchParams();
    if (nextSearch.trim()) params.set("search", nextSearch.trim());
    if (nextCategory && nextCategory !== "All") params.set("category", nextCategory);
    setSearchParams(params);
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
    setShowSuggestions(true);
    updateMenuUrl(value, selectedCategory);
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setCurrentPage(1);
    updateMenuUrl(searchTerm, category);
  };

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedCategory("All");
    setSortOption("default");
    setPriceRange("all");
    setMinimumRating("0");
    setFeaturedOnly(false);
    setCurrentPage(1);
    setSearchParams({});
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
            Browse the current menu, compare dishes and prices, then choose what you want to order.
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
            onChange={(event) => handleSearchChange(event.target.value)}
            onKeyDown={(event) => { if (event.key === "Escape") setShowSuggestions(false); }}
            aria-label="Search food"
            autoComplete="off"
          />
          {showSuggestions && searchSuggestions.length > 0 && (
            <div className="menuSearchSuggestions">
              {searchSuggestions.map((food) => (
                <button type="button" key={food._id} onMouseDown={(event) => event.preventDefault()} onClick={() => { handleSearchChange(food.name); setShowSuggestions(false); }}>
                  <span>🍽️</span><div><strong>{food.name}</strong><small>{food.category} · ₹{Number(food.price || 0).toFixed(2)}</small></div>
                </button>
              ))}
            </div>
          )}
          {searchTerm && (
            <button
              type="button"
              className="clearSearch"
              onClick={() => handleSearchChange("")}
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
                onClick={() => handleCategoryChange(category)}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="sortBox">
            <label htmlFor="sort">Sort:</label>
            <select id="sort" value={sortOption} onChange={(event) => { setSortOption(event.target.value); setCurrentPage(1); }}>
              <option value="default">Recommended</option>
              <option value="rating">Top Rated</option>
              <option value="newest">Recently Added</option>
              <option value="lowToHigh">Price: Low to High</option>
              <option value="highToLow">Price: High to Low</option>
            </select>
          </div>
        </div>

        <section className="menuAdvancedFilters" aria-label="More menu filters">
          <div className="menuFilterHeading">
            <div><span>REFINE YOUR CHOICE</span><strong>Find the right dish</strong></div>
            <small>Filters update the menu automatically</small>
          </div>
          <div className="menuFilterControls">
            <label className="menuFilterControl" htmlFor="menuPriceRange">
              <span>Price range</span>
              <select id="menuPriceRange" value={priceRange} onChange={(event) => { setPriceRange(event.target.value); setCurrentPage(1); }}>
                <option value="all">Any price</option>
                <option value="0-150">Under ₹150</option>
                <option value="150-300">₹150 – ₹300</option>
                <option value="300-500">₹300 – ₹500</option>
                <option value="500">₹500 and above</option>
              </select>
            </label>
            <label className="menuFilterControl" htmlFor="menuMinimumRating">
              <span>Customer rating</span>
              <select id="menuMinimumRating" value={minimumRating} onChange={(event) => { setMinimumRating(event.target.value); setCurrentPage(1); }}>
                <option value="0">Any rating</option>
                <option value="3">3★ and above</option>
                <option value="3.5">3.5★ and above</option>
                <option value="4">4★ and above</option>
                <option value="4.5">4.5★ and above</option>
              </select>
            </label>
            <label className={featuredOnly ? "menuFeaturedToggle active" : "menuFeaturedToggle"}>
              <input type="checkbox" checked={featuredOnly} onChange={(event) => { setFeaturedOnly(event.target.checked); setCurrentPage(1); }} />
              <span className="menuFeaturedCheck" aria-hidden="true">{featuredOnly ? "✓" : "☆"}</span>
              <span><strong>Featured dishes</strong><small>Restaurant picks</small></span>
            </label>
          </div>
        </section>

        <div className="menuResultHeader">
          <div>
            <h2>{selectedCategory === "All" ? "Explore the menu" : selectedCategory}</h2>
            <p role="status" aria-live="polite">
              {loading ? "Loading menu..." : `${totalResults} dish${totalResults !== 1 ? "es" : ""} ${searchTerm.trim() ? "match your search" : "available"}`}
            </p>
          </div>
          {(searchTerm.trim() || selectedCategory !== "All" || sortOption !== "default" || priceRange !== "all" || minimumRating !== "0" || featuredOnly) && (
            <button type="button" className="menuResetFilters" onClick={resetFilters}>
              Clear filters <span aria-hidden="true">×</span>
            </button>
          )}
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
            <button type="button" onClick={() => setReloadFoods((value) => value + 1)} disabled={loading}>
              {loading ? "Retrying..." : "Try Again"}
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
                ratingCount={menuItem.ratingCount}
                description={menuItem.description}
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

        {!loading && !error && totalPages > 1 && (
          <nav className="menuPagination" aria-label="Menu pages">
            <button type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage <= 1}>
              Previous
            </button>
            <span>Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong></span>
            <button type="button" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage >= totalPages}>
              Next
            </button>
          </nav>
        )}
      </section>
    </div>
  );
}

export default Menu;
