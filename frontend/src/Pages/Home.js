import React from "react";
import { Link } from "react-router-dom";
import BannerImage from "../assets/pizza.jpeg";
import { MenuList } from "../helpers/MenuList";
import "../Styles/Home.css";

function Home() {
  const popularFoods = MenuList.slice(0, 4);

  const categories = [
    {
      icon: "🍕",
      name: "Pizza",
      count: "12+ Items",
    },
    {
      icon: "🍔",
      name: "Burgers",
      count: "10+ Items",
    },
    {
      icon: "🍝",
      name: "Pasta",
      count: "8+ Items",
    },
    {
      icon: "🍜",
      name: "Noodles",
      count: "6+ Items",
    },
    {
      icon: "🥗",
      name: "Healthy",
      count: "10+ Items",
    },
    {
      icon: "🥤",
      name: "Drinks",
      count: "15+ Items",
    },
  ];

  return (
    <div className="homePage">

      {/* ================= HERO ================= */}
      <section
        className="heroSection"
        style={{ backgroundImage: `url(${BannerImage})` }}
      >
        <div className="heroOverlay"></div>

        <div className="heroContent">
          <div className="heroText">
            <span className="heroSmallText">
              🍴 Delicious food is waiting for you
            </span>

            <h1>
              Good Food.
              <br />
              Good Mood.
            </h1>

            <p>
              Discover delicious meals, order your favourites and enjoy
              fresh food delivered right to your doorstep.
            </p>

            <div className="heroSearch">
              <span className="searchIcon">🔍</span>

              <input
                type="text"
                placeholder="Search for food, dishes or restaurants..."
              />

              <Link to="/menu">
                <button>Search</button>
              </Link>
            </div>

            <div className="heroButtons">
              <Link to="/menu">
                <button className="primaryHeroButton">
                  Order Now →
                </button>
              </Link>

              <Link to="/menu">
                <button className="secondaryHeroButton">
                  Explore Menu
                </button>
              </Link>
            </div>

            <div className="heroStats">
              <div>
                <strong>500+</strong>
                <span>Happy Customers</span>
              </div>

              <div>
                <strong>50+</strong>
                <span>Food Items</span>
              </div>

              <div>
                <strong>4.8</strong>
                <span>Customer Rating</span>
              </div>
            </div>
          </div>

          <div className="heroFoodCard">
            <div className="heroFoodBadge">
              ⭐ Top Rated
            </div>

            <img src={BannerImage} alt="Featured Pizza" />

            <div className="heroFoodInfo">
              <div>
                <h3>Fresh & Delicious Pizza</h3>
                <p>Made with premium ingredients</p>
              </div>

              <strong>$15.99</strong>
            </div>

            <Link to="/menu">
              <button className="heroFoodButton">
                View Menu
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ================= CATEGORIES ================= */}
      <section className="categorySection">
        <div className="sectionHeading">
          <div>
            <span>EXPLORE</span>
            <h2>What are you craving?</h2>
          </div>

          <Link to="/menu" className="viewAllLink">
            View All →
          </Link>
        </div>

        <div className="categoryGrid">
          {categories.map((category, index) => (
            <Link
              to="/menu"
              className="categoryCard"
              key={index}
            >
              <div className="categoryIcon">
                {category.icon}
              </div>

              <div>
                <h3>{category.name}</h3>
                <p>{category.count}</p>
              </div>

              <span className="categoryArrow">→</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ================= POPULAR FOOD ================= */}
      <section className="popularSection">
        <div className="sectionHeading">
          <div>
            <span>OUR SPECIALS</span>
            <h2>Popular dishes</h2>
          </div>

          <Link to="/menu" className="viewAllLink">
            View All →
          </Link>
        </div>

        <div className="foodGrid">
          {popularFoods.map((food) => (
            <div className="foodCard" key={food.id}>

              <div className="foodCardImage">
                <img src={food.image} alt={food.name} />

                <span className="foodRating">
                  ⭐ {food.rating}
                </span>
              </div>

              <div className="foodCardContent">
                <span className="foodCategory">
                  {food.category}
                </span>

                <h3>{food.name}</h3>

                <p>{food.description}</p>

                <div className="foodCardBottom">
                  <strong>${food.price.toFixed(2)}</strong>

                  <Link to={`/food/${food.id}`}>
                    <button>View →</button>
                  </Link>
                </div>
              </div>

            </div>
          ))}
        </div>
      </section>

      {/* ================= WHY CHOOSE US ================= */}
      <section className="whySection">
        <div className="whyContent">

          <div className="whyText">
            <span>WHY CHOOSE US</span>

            <h2>
              We make your food
              <br />
              experience better.
            </h2>

            <p>
              From carefully prepared meals to fast delivery, we focus
              on giving you a simple and enjoyable food ordering
              experience.
            </p>

            <Link to="/menu">
              <button className="whyButton">
                Start Ordering →
              </button>
            </Link>
          </div>

          <div className="benefitGrid">

            <div className="benefitCard">
              <div className="benefitIcon">🚚</div>
              <h3>Fast Delivery</h3>
              <p>
                Get your favourite food delivered quickly and safely.
              </p>
            </div>

            <div className="benefitCard">
              <div className="benefitIcon">🥗</div>
              <h3>Fresh Food</h3>
              <p>
                Fresh ingredients and delicious meals prepared daily.
              </p>
            </div>

            <div className="benefitCard">
              <div className="benefitIcon">🔒</div>
              <h3>Secure Payment</h3>
              <p>
                Safe and secure payment options for every order.
              </p>
            </div>

            <div className="benefitCard">
              <div className="benefitIcon">⭐</div>
              <h3>Best Quality</h3>
              <p>
                Quality food and service that you can trust.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ================= OFFER ================= */}
      <section className="offerSection">

        <div className="offerContent">
          <span>LIMITED TIME OFFER</span>

          <h2>
            Get 20% OFF
            <br />
            on your first order
          </h2>

          <p>
            Order your favourite food today and enjoy a special
            discount on your first purchase.
          </p>

          <Link to="/menu">
            <button>
              Order Now →
            </button>
          </Link>
        </div>

        <div className="offerCircle">
          <span>20%</span>
          <small>OFF</small>
        </div>

      </section>

      {/* ================= REVIEWS ================= */}
      <section className="reviewSection">

        <div className="sectionHeading reviewHeading">
          <div>
            <span>WHAT OUR CUSTOMERS SAY</span>
            <h2>Loved by food lovers</h2>
          </div>
        </div>

        <div className="reviewGrid">

          <div className="reviewCard">
            <div className="reviewStars">
              ★★★★★
            </div>

            <p>
              "The food was fresh, delicious and arrived much faster
              than I expected. Definitely ordering again!"
            </p>

            <div className="reviewUser">
              <div className="reviewAvatar">A</div>

              <div>
                <h4>Arjun Sharma</h4>
                <span>Verified Customer</span>
              </div>
            </div>
          </div>

          <div className="reviewCard">
            <div className="reviewStars">
              ★★★★★
            </div>

            <p>
              "Amazing taste and very easy ordering experience.
              The pizza was absolutely delicious."
            </p>

            <div className="reviewUser">
              <div className="reviewAvatar">P</div>

              <div>
                <h4>Priya Das</h4>
                <span>Verified Customer</span>
              </div>
            </div>
          </div>

          <div className="reviewCard">
            <div className="reviewStars">
              ★★★★★
            </div>

            <p>
              "Great variety of food and the checkout process is
              really simple. Highly recommended!"
            </p>

            <div className="reviewUser">
              <div className="reviewAvatar">R</div>

              <div>
                <h4>Rahul Singh</h4>
                <span>Verified Customer</span>
              </div>
            </div>
          </div>

        </div>

      </section>

      {/* ================= FINAL CTA ================= */}
      <section className="finalCta">

        <div>
          <span>READY TO ORDER?</span>

          <h2>
            Your next delicious
            <br />
            meal is just a click away.
          </h2>
        </div>

        <Link to="/menu">
          <button>
            Browse Menu →
          </button>
        </Link>

      </section>

    </div>
  );
}

export default Home;