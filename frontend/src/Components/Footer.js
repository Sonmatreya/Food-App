import React from "react";
import { Link } from "react-router-dom";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import InstagramIcon from "@mui/icons-material/Instagram";
import FacebookIcon from "@mui/icons-material/Facebook";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import "../Styles/Footer.css";

function Footer() {
  const handleNewsletterSubmit = (event) => {
    event.preventDefault();
  };

  return (
    <footer className="footer">
      <div className="footer-section footer-brand">
        <div className="footer-logo">🍴</div>
        <h2>Food App</h2>
        <p>
          Fresh food, simple ordering and a smooth experience from menu to
          delivery.
        </p>
        <div className="socialmedia" aria-label="Social media">
          <button type="button" aria-label="Instagram"><InstagramIcon /></button>
          <button type="button" aria-label="Facebook"><FacebookIcon /></button>
          <button type="button" aria-label="LinkedIn"><LinkedInIcon /></button>
        </div>
      </div>

      <div className="footer-section">
        <h3>Explore</h3>
        <Link to="/">Home</Link>
        <Link to="/menu">Menu</Link>
        <Link to="/about">About Us</Link>
        <Link to="/services">Services</Link>
        <Link to="/contact">Contact</Link>
      </div>

      <div className="footer-section">
        <h3>Account</h3>
        <Link to="/login">Sign In</Link>
        <Link to="/register">Create Account</Link>
        <Link to="/profile">My Profile</Link>
        <Link to="/cart">My Cart</Link>
      </div>

      <div className="footer-section newsletter">
        <h3>Stay in the loop</h3>
        <p>
          Get food updates, special offers and product news from Food App.
        </p>
        <form className="newsletter-form" onSubmit={handleNewsletterSubmit}>
          <input
            type="email"
            placeholder="Your email address"
            aria-label="Email address"
            required
          />
          <button type="submit" aria-label="Subscribe">
            Subscribe <ArrowForwardIcon />
          </button>
        </form>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} Food App. All rights reserved.</p>
        <span>Smart Food Ordering &amp; Restaurant Management System</span>
      </div>
    </footer>
  );
}

export default Footer;
