import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Logo from "../assets/pizza-logo-png.png";
import ReorderIcon from "@mui/icons-material/Reorder";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import "../Styles/Navbar.css";

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  const toggleNavbar = () => setIsOpen(!isOpen);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.body.classList.toggle("light-mode", !isDarkMode);
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>      
      <div className="logo-container">
        <img src={Logo} alt="Logo" className="App-logo" />
      </div>

      <div className="search-container">
        <input type="text" placeholder="Search pizza..." />
      </div>

      <div className={`menu-links ${isOpen ? "active" : ""}`}>
        
        <Link to="/">Home</Link>
        <div className="dropdown">
          <Link to="/menu">Menu</Link>
          <div className="dropdown-content">
            <Link to="/menu/pizza">Pizza</Link>
            <Link to="/menu/pasta">Pasta</Link>
            <Link to="/menu/beverages">Beverages</Link>
            <Link to="/menu/desserts">Desserts</Link>
          </div>
        </div>

        <div className="dropdown">
          <Link to="/about">About</Link>
          <div className="dropdown-content">
            <Link to="/about/team">Our Team</Link>
            <Link to="/about/careers">Careers</Link>
            <Link to="/about/history">History</Link>
          </div>
        </div>

        <div className="dropdown">
          <Link to="/services">Services</Link>
          <div className="dropdown-content">
            <Link to="/services/custompizza">Custom Pizzas</Link>
            <Link to="/services/fastdelivery">Fast Delivery</Link>
            <Link to="/services/partycatering">Party Catering</Link>
            <Link to="/services/onlineorders">Online Orders</Link>

          </div>
        </div>
        <Link to="/contact">Contact</Link>

        <Link to="/cart">
          <ShoppingCartIcon className="icon" />
        </Link>

        <button className="login-btn">Login</button>
        <button className="mode-toggle" onClick={toggleDarkMode}>
          <Brightness4Icon className="icon" />
        </button>
      </div>

      <button className="toggle-button" onClick={toggleNavbar}>
        <ReorderIcon />
      </button>
    </nav>
  );
}

export default Navbar;
