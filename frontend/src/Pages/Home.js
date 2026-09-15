import React from "react";
import { Link } from "react-router-dom";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import BannerImage from "../assets/pizza.jpeg";
import { MenuList } from "../helpers/MenuList";
import "../Styles/Home.css";

function Home() {
  const availableFoods = MenuList.filter((food) => food.isAvailable !== false);
  const popularFoods = [...availableFoods].sort((a, b) => b.rating - a.rating).slice(0, 4);
  const categories = [...new Set(availableFoods.map((food) => food.category))].slice(0, 6);
  const categoryIcons = ["🍕", "🍔", "🍝", "🍜", "🥗", "🥤"];

  return (
    <main className="homePage">
      <section className="homeHero">
        <div className="homeHeroImage" style={{ backgroundImage: `url(${BannerImage})` }} />
        <div className="homeHeroOverlay" />
        <div className="homeHeroContent">
          <div className="homeHeroCopy">
            <span className="homeEyebrow"><span /> FRESH FOOD · EASY ORDERING</span>
            <h1>Good food,<br /><em>made simple.</em></h1>
            <p>Choose your favourite meal, customize it your way, and order it for delivery or pickup.</p>
            <div className="homeHeroActions">
              <Link to="/menu" className="homePrimaryButton">Explore menu <ArrowForwardIcon /></Link>
              <Link to="/menu" className="homeSecondaryButton">View today's food</Link>
            </div>
            <div className="homeHeroFacts">
              <span><StarRoundedIcon /> Top rated choices</span>
              <span><AccessTimeOutlinedIcon /> Fast ordering</span>
              <span><VerifiedOutlinedIcon /> Secure checkout</span>
            </div>
          </div>
          <div className="homeHeroFeature">
            <div className="featureImage"><img src={BannerImage} alt="Fresh pizza" /><span><StarRoundedIcon /> Featured</span></div>
            <div className="featureInfo">
              <div><small>POPULAR CHOICE</small><h2>Freshly made pizza</h2><p>Hot, satisfying and ready for your next order.</p></div>
              <strong>$15.99</strong>
            </div>
            <Link to="/menu" className="featureLink">Order now <ArrowForwardIcon /></Link>
          </div>
        </div>
      </section>

      <section className="homeTrustBar">
        <div><LocalShippingOutlinedIcon /><span><b>Free delivery</b> on orders over $40</span></div>
        <div><AccessTimeOutlinedIcon /><span><b>Quick service</b> from order to doorstep</span></div>
        <div><VerifiedOutlinedIcon /><span><b>Secure payment</b> throughout checkout</span></div>
      </section>

      <section className="homeSection homeCategories">
        <div className="homeSectionHead"><div><small>EXPLORE</small><h2>What are you in the mood for?</h2></div><Link to="/menu">See all <ArrowForwardIcon /></Link></div>
        <div className="homeCategoryGrid">
          {categories.map((category, index) => (
            <Link to="/menu" className="homeCategoryCard" key={category}>
              <span className="homeCategoryIcon">{categoryIcons[index % categoryIcons.length]}</span>
              <div><h3>{category}</h3><p>Browse dishes</p></div>
              <ArrowForwardIcon />
            </Link>
          ))}
        </div>
      </section>

      <section className="homePopular">
        <div className="homeSection homeSectionInner">
          <div className="homeSectionHead"><div><small>FROM OUR MENU</small><h2>Popular right now</h2></div><Link to="/menu">View full menu <ArrowForwardIcon /></Link></div>
          <div className="homeFoodGrid">
            {popularFoods.map((food) => (
              <article className="homeFoodCard" key={food.id}>
                <Link to={`/food/${food.id}`} className="homeFoodImage"><img src={food.image} alt={food.name} /><span><StarRoundedIcon /> {food.rating}</span></Link>
                <div className="homeFoodBody">
                  <small>{food.category}</small>
                  <Link to={`/food/${food.id}`}><h3>{food.name}</h3></Link>
                  <p>{food.description}</p>
                  <div className="homeFoodBottom"><b>${Number(food.price).toFixed(2)}</b><Link to={`/food/${food.id}`}><AddRoundedIcon /> Add</Link></div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="homeSection homeExperience">
        <div className="homeExperienceCopy"><small>WHY FOOD APP</small><h2>Everything you need to order with confidence.</h2><p>A clean ordering flow from browsing to checkout, with clear food details, secure payments and order tracking.</p><Link to="/menu" className="homeDarkButton">Start ordering <ArrowForwardIcon /></Link></div>
        <div className="homeBenefits">
          <div><LocalShippingOutlinedIcon /><h3>Delivery or pickup</h3><p>Choose the fulfilment option that works for you.</p></div>
          <div><VerifiedOutlinedIcon /><h3>Clear checkout</h3><p>Review address, pricing and payment before placing an order.</p></div>
          <div><AccessTimeOutlinedIcon /><h3>Order tracking</h3><p>Follow your order from preparation through handover.</p></div>
          <div><StarRoundedIcon /><h3>Made for food lovers</h3><p>Simple browsing without unnecessary distractions.</p></div>
        </div>
      </section>

      <section className="homeOffer">
        <div><small>WELCOME OFFER</small><h2>20% off your first order</h2><p>Use <b>WELCOME20</b> at checkout when your order meets the offer minimum.</p><Link to="/menu">Browse food <ArrowForwardIcon /></Link></div>
        <div className="homeOfferBadge"><b>20%</b><span>OFF</span></div>
      </section>

      <section className="homeFinalCta">
        <div><small>READY WHEN YOU ARE</small><h2>Find something you'll love.</h2></div>
        <Link to="/menu">Open the menu <ArrowForwardIcon /></Link>
      </section>
    </main>
  );
}

export default Home;
