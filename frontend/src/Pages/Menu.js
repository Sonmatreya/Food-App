import React, { useState } from "react";
import { MenuList } from "../helpers/MenuList";
import MenuItem from "../Components/MenuItem";
import "../Styles/Menu.css";

function Menu() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortOption, setSortOption] = useState("default");

  // Get unique categories from menu data
  const categories = [
    "All",
    ...new Set(MenuList.map((item) => item.category)),
  ];

  // Filter food
  let filteredFoods = MenuList.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === "All" ||
      item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Sort food
  if (sortOption === "lowToHigh") {
    filteredFoods.sort((a, b) => a.price - b.price);
  }

  if (sortOption === "highToLow") {
    filteredFoods.sort((a, b) => b.price - a.price);
  }

  if (sortOption === "rating") {
    filteredFoods.sort((a, b) => b.rating - a.rating);
  }

  return (
    <div className="menuPage">

      {/* ================= HEADER ================= */}
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

      {/* ================= MENU CONTENT ================= */}
      <section className="menuSection">

        {/* Search */}
        <div className="menuSearchBox">
          <span>🔍</span>

          <input
            type="text"
            placeholder="Search for food..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {searchTerm && (
            <button
              className="clearSearch"
              onClick={() => setSearchTerm("")}
            >
              ✕
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="menuToolbar">

          <div className="categoryFilters">
            {categories.map((category) => (
              <button
                key={category}
                className={
                  selectedCategory === category
                    ? "categoryFilter active"
                    : "categoryFilter"
                }
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="sortBox">
            <label htmlFor="sort">Sort:</label>

            <select
              id="sort"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
            >
              <option value="default">Recommended</option>
              <option value="rating">Top Rated</option>
              <option value="lowToHigh">Price: Low to High</option>
              <option value="highToLow">Price: High to Low</option>
            </select>
          </div>

        </div>

        {/* Results information */}
        <div className="menuResultHeader">
          <div>
            <h2>
              {selectedCategory === "All"
                ? "Popular Food"
                : selectedCategory}
            </h2>

            <p>
              {filteredFoods.length} food item
              {filteredFoods.length !== 1 ? "s" : ""} available
            </p>
          </div>
        </div>

        {/* Food Grid */}
        {filteredFoods.length > 0 ? (
          <div className="menuGrid">
            {filteredFoods.map((menuItem) => (
              <MenuItem
                key={menuItem.id}
                id={menuItem.id}
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

            <p>
              We couldn't find any food matching your search.
            </p>

            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("All");
              }}
            >
              View All Food
            </button>
          </div>
        )}

      </section>
    </div>
  );
}

export default Menu;