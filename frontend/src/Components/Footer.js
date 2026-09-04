import React from 'react';
import InstagramIcon from '@mui/icons-material/Instagram';
import TwitterIcon from '@mui/icons-material/Twitter';
import FacebookIcon from '@mui/icons-material/Facebook';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import { Link } from 'react-router-dom';
import '../Styles/Footer.css';

function Footer() {
  return (
    <div className="footer">

      {/* Social Media */}
      <div className="footer-section socialmedia">
        <a href="#"><InstagramIcon /></a>
        <a href="#"><TwitterIcon /></a>
        <a href="#"><FacebookIcon /></a>
        <a href="#"><LinkedInIcon /></a>
      </div>

      {/* About */}
      <div className="footer-section">
        <h3>About Us</h3>
        <p>Pedro's Pizzeria serves fresh pizzas with top-quality ingredients. We deliver happiness in every bite. Visit us or order online to enjoy your favorite flavors!</p>
      </div>

      {/* Quick Links */}
      <div className="footer-section">
        <h3>Quick Links</h3>
        <Link to="/">Home</Link>
        <Link to="/menu">Menu</Link>
        <Link to="/about">About</Link>
        <Link to="/services">Services</Link>
        <Link to="/contact">Contact</Link>

      </div>

      {/* Contact */}
      <div className="footer-section">
        <h3>Contact</h3>
        <p>📞 +91 98765 43210</p>
        <p>✉️ info@pedrospizzeria.com</p>
        <p>🏠 123 Pizza Street, Kolkata, India</p>
      </div>

      {/* Newsletter */}
      <div className="footer-section newsletter">
        <h3>Subscribe to Our Newsletter</h3>
        <p>Get the latest updates, offers, and pizza news directly to your inbox.</p>
        <form className="newsletter-form">
          <input type="email" placeholder="Enter your email" />
          <button type="submit">Subscribe</button>
        </form>
      </div>

      {/* Copyright */}
      <div className="footer-bottom">
        <p>© 2025 pedrotechpizza.com | All Rights Reserved.</p>
      </div>

    </div>
  );
}

export default Footer;
