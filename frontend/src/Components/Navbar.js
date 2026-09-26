import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ReorderIcon from "@mui/icons-material/Reorder";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import CloseIcon from "@mui/icons-material/Close";
import Logo from "../assets/pizza-logo-png.png";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import "../Styles/Navbar.css";

function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [locationText, setLocationText] = useState(() => localStorage.getItem("foodAppLocation") || "Choose your location");
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");

  useEffect(() => {

    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const closeMenu = () => setIsOpen(false);
  const handleLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Location is not supported by this browser.");
      return;
    }

    setLocationLoading(true);
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.latitude}&lon=${coords.longitude}`
          );

          if (!response.ok) throw new Error("Address lookup failed");

          const data = await response.json();
          const address = data.address || {};
          const place =
            address.suburb ||
            address.neighbourhood ||
            address.village ||
            address.town ||
            address.city ||
            "Current location";
          const city = address.city || address.town || address.village || "";

          const label = city && city !== place ? `${place}, ${city}` : place;
          setLocationText(label);
          localStorage.setItem("foodAppLocation", label);
        } catch (error) {
          const label = "Current location";
          setLocationText(label);
          localStorage.setItem("foodAppLocation", label);
          console.error("Location lookup error:", error);
        } finally {
          setLocationLoading(false);
        }
      },
      (error) => {
        setLocationLoading(false);
        setLocationError(
          error.code === 1
            ? "Please allow location access in your browser."
            : "Unable to detect your location."
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleLogout = async () => { closeMenu(); try { await logout(); navigate("/login"); } catch (error) { console.error("Logout error:", error); } };

  return (
    <header className={`navbar ${scrolled ? "scrolled" : ""}`}>
      <div className="navbar-inner">
        <Link to="/" className="brand" onClick={closeMenu} aria-label="Food App home"><img src={Logo} alt="Food App" className="App-logo" /></Link>
        <button type="button" className="delivery-location location-button" onClick={handleLocation} aria-label="Choose delivery location">
          <LocationOnOutlinedIcon />
          <div>
            <span>DELIVER TO</span>
            <strong>{locationLoading ? "Detecting location..." : locationText}</strong>
            {locationError && <small>{locationError}</small>}
          </div>
        </button>
        
        <nav className={`menu-links ${isOpen ? "active" : ""}`}>
          <div className="mobile-menu-head"><span>Food App</span><button type="button" onClick={closeMenu} aria-label="Close menu"><CloseIcon /></button></div>
          <Link to="/" onClick={closeMenu}>Home</Link><Link to="/menu" onClick={closeMenu}>Menu</Link><Link to="/about" onClick={closeMenu}>About</Link><Link to="/services" onClick={closeMenu}>Services</Link><Link to="/contact" onClick={closeMenu}>Contact</Link>
          <button type="button" className="mobile-delivery-location delivery-location location-button" onClick={handleLocation}>
            <LocationOnOutlinedIcon />
            <div>
              <span>DELIVER TO</span>
              <strong>{locationLoading ? "Detecting location..." : locationText}</strong>
              {locationError && <small>{locationError}</small>}
            </div>
          </button>
          {user ? <div className="mobile-account-actions"><button type="button" onClick={() => { closeMenu(); navigate("/profile"); }}><PersonOutlineIcon /> My Account</button><button type="button" onClick={handleLogout}>Sign Out</button></div> : <button type="button" className="mobile-login" onClick={() => { closeMenu(); navigate("/login"); }}>Sign In</button>}
        </nav>
        <button type="button" className="theme-toggle-button" onClick={toggleTheme} aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"} title={isDark ? "Light mode" : "Dark mode"}>{isDark ? "☀️" : "🌙"}</button>
        <div className="navbar-actions">
          <Link to="/cart" className="nav-icon-button cart-link" aria-label="Shopping cart" onClick={closeMenu}><ShoppingCartIcon /></Link>
          {user ? <button type="button" className="account-button" onClick={() => navigate("/profile")}>{user.profileImage ? <img src={user.profileImage} alt="Profile" className="user-avatar" /> : <span className="user-avatar-placeholder">{user.name ? user.name.charAt(0).toUpperCase() : "U"}</span>}<span>{user.name || "Account"}</span></button> : <button type="button" className="login-btn" onClick={() => navigate("/login")}>Sign In</button>}
        </div>
        <button type="button" className="toggle-button" onClick={() => setIsOpen((previous) => !previous)} aria-label="Open navigation menu" aria-expanded={isOpen}>{isOpen ? <CloseIcon /> : <ReorderIcon />}</button>
      </div>
    </header>
  );
}
export default Navbar;
