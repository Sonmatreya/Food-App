import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

import Logo from "../assets/pizza-logo-png.png";

import ReorderIcon from "@mui/icons-material/Reorder";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import Brightness4Icon from "@mui/icons-material/Brightness4";

import { useAuth } from "../context/AuthContext";

import "../Styles/Navbar.css";

function Navbar() {
  const navigate = useNavigate();

  const { user, logout } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  const toggleNavbar = () => {
    setIsOpen(!isOpen);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);

    document.body.classList.toggle(
      "light-mode",
      !isDarkMode
    );
  };

  const handleLogin = () => {
    setIsOpen(false);
    navigate("/login");
  };

  const handleLogout = async () => {
    setIsOpen(false);

    await logout();

    navigate("/login");
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener(
        "scroll",
        handleScroll
      );
    };
  }, []);

  return (
    <nav
      className={`navbar ${
        scrolled ? "scrolled" : ""
      }`}
    >

      {/* =========================
          LOGO
      ========================= */}

      <div
        className="logo-container"
        onClick={() => navigate("/")}
      >
        <img
          src={Logo}
          alt="Logo"
          className="App-logo"
        />
      </div>


      {/* =========================
          SEARCH
      ========================= */}

      <div className="search-container">
        <input
          type="text"
          placeholder="Search pizza..."
        />
      </div>


      {/* =========================
          MENU LINKS
      ========================= */}

      <div
        className={`menu-links ${
          isOpen ? "active" : ""
        }`}
      >

        <Link
          to="/"
          onClick={() => setIsOpen(false)}
        >
          Home
        </Link>


        {/* =========================
            MENU DROPDOWN
        ========================= */}

        <div className="dropdown">

          <Link to="/menu">
            Menu
          </Link>

          <div className="dropdown-content">

            <Link to="/menu/pizza">
              Pizza
            </Link>

            <Link to="/menu/pasta">
              Pasta
            </Link>

            <Link to="/menu/beverages">
              Beverages
            </Link>

            <Link to="/menu/desserts">
              Desserts
            </Link>

          </div>

        </div>


        {/* =========================
            ABOUT DROPDOWN
        ========================= */}

        <div className="dropdown">

          <Link to="/about">
            About
          </Link>

          <div className="dropdown-content">

            <Link to="/about/team">
              Our Team
            </Link>

            <Link to="/about/careers">
              Careers
            </Link>

            <Link to="/about/history">
              History
            </Link>

          </div>

        </div>


        {/* =========================
            SERVICES DROPDOWN
        ========================= */}

        <div className="dropdown">

          <Link to="/services">
            Services
          </Link>

          <div className="dropdown-content">

            <Link to="/services/custompizza">
              Custom Pizzas
            </Link>

            <Link to="/services/fastdelivery">
              Fast Delivery
            </Link>

            <Link to="/services/partycatering">
              Party Catering
            </Link>

            <Link to="/services/onlineorders">
              Online Orders
            </Link>

          </div>

        </div>


        {/* =========================
            CONTACT
        ========================= */}

        <Link
          to="/contact"
          onClick={() => setIsOpen(false)}
        >
          Contact
        </Link>


        {/* =========================
            CART
        ========================= */}

        <Link
          to="/cart"
          onClick={() => setIsOpen(false)}
        >
          <ShoppingCartIcon className="icon" />
        </Link>


        {/* =========================
            AUTH BUTTON
        ========================= */}

        {user ? (
          <div className="user-menu">

            <button
              className="user-btn"
              onClick={() =>
                navigate("/profile")
              }
            >
              {user.profileImage ? (
                <img
                  src={user.profileImage}
                  alt="Profile"
                  className="user-avatar"
                />
              ) : (
                <span className="user-avatar-placeholder">
                  {user.name
                    ? user.name
                        .charAt(0)
                        .toUpperCase()
                    : "U"}
                </span>
              )}

              <span className="user-name">
                {user.name}
              </span>
            </button>

            <button
              className="logout-btn"
              onClick={handleLogout}
            >
              Logout
            </button>

          </div>
        ) : (
          <button
            className="login-btn"
            onClick={handleLogin}
          >
            Login
          </button>
        )}


        {/* =========================
            DARK MODE
        ========================= */}

        <button
          className="mode-toggle"
          onClick={toggleDarkMode}
        >
          <Brightness4Icon className="icon" />
        </button>

      </div>


      {/* =========================
          MOBILE MENU BUTTON
      ========================= */}

      <button
        className="toggle-button"
        onClick={toggleNavbar}
      >
        <ReorderIcon />
      </button>

    </nav>
  );
}

export default Navbar;