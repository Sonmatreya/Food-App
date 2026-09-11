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

  // ========================================
  // MOBILE MENU
  // ========================================

  const closeMenu = () => {
    setIsOpen(false);
  };

  const toggleNavbar = () => {
    setIsOpen((prev) => !prev);
  };

  // ========================================
  // DARK MODE
  // ========================================

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const newMode = !prev;

      document.body.classList.toggle(
        "light-mode",
        !newMode
      );

      return newMode;
    });
  };

  // ========================================
  // LOGIN
  // ========================================

  const handleLogin = () => {
    closeMenu();
    navigate("/login");
  };

  // ========================================
  // LOGOUT
  // ========================================

  const handleLogout = async () => {
    closeMenu();

    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // ========================================
  // SCROLL EFFECT
  // ========================================

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener(
      "scroll",
      handleScroll
    );

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
      {/* =====================================
          LOGO
      ====================================== */}

      <div
        className="logo-container"
        onClick={() => {
          closeMenu();
          navigate("/");
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            closeMenu();
            navigate("/");
          }
        }}
      >
        <img
          src={Logo}
          alt="Food App Logo"
          className="App-logo"
        />
      </div>

      {/* =====================================
          SEARCH
      ====================================== */}

      <div className="search-container">
        <input
          type="search"
          placeholder="Search food..."
          aria-label="Search food"
        />
      </div>

      {/* =====================================
          NAVIGATION
      ====================================== */}

      <div
        className={`menu-links ${
          isOpen ? "active" : ""
        }`}
      >
        {/* HOME */}

        <Link
          to="/"
          onClick={closeMenu}
        >
          Home
        </Link>

        {/* ===================================
            MENU
        =================================== */}

        <div className="dropdown">
          <Link
            to="/menu"
            onClick={closeMenu}
          >
            Menu
          </Link>

          <div className="dropdown-content">
            <Link
              to="/menu"
              onClick={closeMenu}
            >
              Pizza
            </Link>

            <Link
              to="/menu"
              onClick={closeMenu}
            >
              Pasta
            </Link>

            <Link
              to="/menu"
              onClick={closeMenu}
            >
              Beverages
            </Link>

            <Link
              to="/menu"
              onClick={closeMenu}
            >
              Desserts
            </Link>
          </div>
        </div>

        {/* ===================================
            ABOUT
        =================================== */}

        <div className="dropdown">
          <Link
            to="/about"
            onClick={closeMenu}
          >
            About
          </Link>

          <div className="dropdown-content">
            <Link
              to="/about"
              onClick={closeMenu}
            >
              Our Team
            </Link>

            <Link
              to="/about"
              onClick={closeMenu}
            >
              Careers
            </Link>

            <Link
              to="/about"
              onClick={closeMenu}
            >
              History
            </Link>
          </div>
        </div>

        {/* ===================================
            SERVICES
        =================================== */}

        <div className="dropdown">
          <Link
            to="/services"
            onClick={closeMenu}
          >
            Services
          </Link>

          <div className="dropdown-content">
            <Link
              to="/services"
              onClick={closeMenu}
            >
              Custom Pizzas
            </Link>

            <Link
              to="/services"
              onClick={closeMenu}
            >
              Fast Delivery
            </Link>

            <Link
              to="/services"
              onClick={closeMenu}
            >
              Party Catering
            </Link>

            <Link
              to="/services"
              onClick={closeMenu}
            >
              Online Orders
            </Link>
          </div>
        </div>

        {/* CONTACT */}

        <Link
          to="/contact"
          onClick={closeMenu}
        >
          Contact
        </Link>

        {/* ===================================
            CART
        =================================== */}

        <Link
          to="/cart"
          className="cart-link"
          onClick={closeMenu}
          aria-label="Shopping cart"
        >
          <ShoppingCartIcon className="icon" />
        </Link>

        {/* ===================================
            AUTH
        =================================== */}

        {user ? (
          <div className="user-menu">
            <button
              type="button"
              className="user-btn"
              onClick={() => {
                closeMenu();
                navigate("/profile");
              }}
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
                {user.name || "User"}
              </span>
            </button>

            <button
              type="button"
              className="logout-btn"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="login-btn"
            onClick={handleLogin}
          >
            Login
          </button>
        )}

        {/* ===================================
            DARK MODE
        =================================== */}

        <button
          type="button"
          className="mode-toggle"
          onClick={toggleDarkMode}
          aria-label={
            isDarkMode
              ? "Switch to light mode"
              : "Switch to dark mode"
          }
          title={
            isDarkMode
              ? "Light mode"
              : "Dark mode"
          }
        >
          <Brightness4Icon className="icon" />
        </button>
      </div>

      {/* =====================================
          MOBILE MENU BUTTON
      ====================================== */}

      <button
        type="button"
        className="toggle-button"
        onClick={toggleNavbar}
        aria-label="Toggle navigation menu"
        aria-expanded={isOpen}
      >
        <ReorderIcon />
      </button>
    </nav>
  );
}

export default Navbar;
