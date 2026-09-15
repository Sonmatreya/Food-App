import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ReorderIcon from "@mui/icons-material/Reorder";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import SearchIcon from "@mui/icons-material/Search";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import CloseIcon from "@mui/icons-material/Close";
import Logo from "../assets/pizza-logo-png.png";
import { useAuth } from "../context/AuthContext";
import "../Styles/Navbar.css";

function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    document.body.classList.add("light-mode");
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const closeMenu = () => setIsOpen(false);
  const handleSearch = (event) => { event.preventDefault(); const query = search.trim(); navigate(query ? `/menu?search=${encodeURIComponent(query)}` : "/menu"); closeMenu(); };
  const toggleDarkMode = () => { setIsDarkMode((previous) => { const next = !previous; document.body.classList.toggle("light-mode", !next); return next; }); };
  const handleLogout = async () => { closeMenu(); try { await logout(); navigate("/login"); } catch (error) { console.error("Logout error:", error); } };

  return (
    <header className={`navbar ${scrolled ? "scrolled" : ""}`}>
      <div className="navbar-inner">
        <Link to="/" className="brand" onClick={closeMenu} aria-label="Food App home"><img src={Logo} alt="Food App" className="App-logo" /></Link>
        <div className="delivery-location"><LocationOnOutlinedIcon /><div><span>DELIVER TO</span><strong>Choose your location</strong></div></div>
        <form className="navbar-search" onSubmit={handleSearch}><SearchIcon /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search dishes, meals or food..." aria-label="Search food" />{search && <button type="button" className="clear-search" onClick={() => setSearch("")} aria-label="Clear search"><CloseIcon /></button>}</form>
        <nav className={`menu-links ${isOpen ? "active" : ""}`}>
          <div className="mobile-menu-head"><span>Food App</span><button type="button" onClick={closeMenu} aria-label="Close menu"><CloseIcon /></button></div>
          <Link to="/" onClick={closeMenu}>Home</Link><Link to="/menu" onClick={closeMenu}>Menu</Link><Link to="/about" onClick={closeMenu}>About</Link><Link to="/services" onClick={closeMenu}>Services</Link><Link to="/contact" onClick={closeMenu}>Contact</Link>
          <div className="mobile-delivery-location delivery-location"><LocationOnOutlinedIcon /><div><span>DELIVER TO</span><strong>Choose your location</strong></div></div>
          {user ? <div className="mobile-account-actions"><button type="button" onClick={() => { closeMenu(); navigate("/profile"); }}><PersonOutlineIcon /> My Account</button><button type="button" onClick={handleLogout}>Sign Out</button></div> : <button type="button" className="mobile-login" onClick={() => { closeMenu(); navigate("/login"); }}>Sign In</button>}
        </nav>
        <div className="navbar-actions">
          <Link to="/cart" className="nav-icon-button cart-link" aria-label="Shopping cart" onClick={closeMenu}><ShoppingCartIcon /></Link>
          {user ? <button type="button" className="account-button" onClick={() => navigate("/profile")}>{user.profileImage ? <img src={user.profileImage} alt="Profile" className="user-avatar" /> : <span className="user-avatar-placeholder">{user.name ? user.name.charAt(0).toUpperCase() : "U"}</span>}<span>{user.name || "Account"}</span></button> : <button type="button" className="login-btn" onClick={() => navigate("/login")}>Sign In</button>}
          <button type="button" className="nav-icon-button mode-toggle" onClick={toggleDarkMode} aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}><Brightness4Icon /></button>
        </div>
        <button type="button" className="toggle-button" onClick={() => setIsOpen((previous) => !previous)} aria-label="Open navigation menu" aria-expanded={isOpen}>{isOpen ? <CloseIcon /> : <ReorderIcon />}</button>
      </div>
    </header>
  );
}
export default Navbar;
