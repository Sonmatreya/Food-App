import React from "react";
import { Link } from "react-router-dom";
import {
  FaArrowRight,
  FaBoxOpen,
  FaCalendarCheck,
  FaHeart,
  FaLeaf,
  FaMobileAlt,
  FaPizzaSlice,
  FaRegClock,
  FaShoppingBag,
  FaTruck,
} from "react-icons/fa";
import "../Styles/Service.css";

const services = [
  {
    icon: FaPizzaSlice,
    number: "01",
    title: "Explore the menu",
    description: "Browse the available menu, compare dishes, and open each item to see its details before ordering.",
    tag: "DISCOVER",
    href: "/menu",
    action: "Explore food",
  },
  {
    icon: FaShoppingBag,
    number: "02",
    title: "Easy online ordering",
    description: "Add dishes to your cart, adjust quantities, and review your order before moving to checkout.",
    tag: "ORDER",
    href: "/menu",
    action: "Start an order",
  },
  {
    icon: FaHeart,
    number: "03",
    title: "Save your favourites",
    description: "Use the available wishlist and recently viewed features to make returning to dishes easier.",
    tag: "PERSONALISE",
    href: "/menu",
    action: "Find favourites",
  },
  {
    icon: FaBoxOpen,
    number: "04",
    title: "Order updates",
    description: "Visit your account and order area to check the order information available for your account.",
    tag: "STAY INFORMED",
    href: "/profile",
    action: "View account",
  },
  {
    icon: FaLeaf,
    number: "05",
    title: "Choose what suits you",
    description: "Use menu descriptions and categories to find dishes that fit your preferences and budget.",
    tag: "YOUR CHOICE",
    href: "/menu",
    action: "Browse dishes",
  },
  {
    icon: FaCalendarCheck,
    number: "06",
    title: "Need help?",
    description: "Have a question or want to share feedback? Send the team a message through the contact page.",
    tag: "SUPPORT",
    href: "/contact",
    action: "Contact us",
  },
];

function Services() {
  return (
    <main className="servicesPage">
      <section className="servicesHero">
        <div className="servicesHeroGlow" aria-hidden="true" />
        <div className="servicesHeroContent">
          <span className="servicesEyebrow"><FaRegClock /> MADE SIMPLE, FROM BROWSE TO BITE</span>
          <h1>Good food.<br /><span>Less fuss.</span></h1>
          <p>Everything you need for a smoother food-ordering experience, gathered in one place.</p>
          <div className="servicesHeroActions">
            <Link to="/menu" className="servicesPrimaryAction">Explore the menu <FaArrowRight /></Link>
            <Link to="/contact" className="servicesTextAction">Talk to us</Link>
          </div>
          <div className="servicesTrustRow">
            <span><FaMobileAlt /> Simple to use</span>
            <span><FaHeart /> Made around your choices</span>
            <span><FaTruck /> Order information in one place</span>
          </div>
        </div>
        <div className="servicesHeroArt" aria-label="Food ordering illustration">
          <div className="servicesArtHalo" />
          <div className="servicesArtCard servicesArtCardBack"><FaLeaf /><span>Find your next favourite</span></div>
          <div className="servicesArtMain">
            <div className="servicesArtTop"><span>YOUR NEXT BITE</span><FaHeart /></div>
            <div className="servicesArtEmoji" aria-hidden="true">🍕</div>
            <strong>Something delicious</strong>
            <p>Choose it. Add it. Enjoy it.</p>
            <Link to="/menu">Discover dishes <FaArrowRight /></Link>
          </div>
          <div className="servicesArtCard servicesArtCardFront"><FaShoppingBag /><span>Your order, your way</span></div>
        </div>
      </section>

      <section className="servicesCatalog">
        <div className="servicesSectionIntro">
          <span>THE EXPERIENCE</span>
          <h2>Little things that make ordering easier.</h2>
          <p>Explore the tools available in the app. Availability and order details depend on your account and the current menu.</p>
        </div>
        <div className="servicesCards">
          {services.map(({ icon: Icon, number, title, description, tag, href, action }) => (
            <article className="servicesCard" key={number}>
              <div className="servicesCardTop"><span>{number}</span><span className="servicesCardIcon"><Icon /></span></div>
              <span className="servicesCardTag">{tag}</span>
              <h3>{title}</h3>
              <p>{description}</p>
              <Link to={href} className="servicesCardLink">{action} <FaArrowRight /></Link>
            </article>
          ))}
        </div>
      </section>

      <section className="servicesBottomCta">
        <div><span>READY WHEN YOU ARE</span><h2>Find something worth craving.</h2><p>Browse the current menu and choose what sounds good today.</p></div>
        <Link to="/menu">Browse the menu <FaArrowRight /></Link>
      </section>
    </main>
  );
}

export default Services;
