import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ReorderIcon from "@mui/icons-material/Reorder";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import Brightness4OutlinedIcon from "@mui/icons-material/Brightness4Outlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import CloseIcon from "@mui/icons-material/Close";
import Logo from "../assets/pizza-logo-png.png";
import { useAuth } from "../context/AuthContext";
import "../Styles/Navbar.css";

function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  const submitSearch = (event) => {
    event.preventDefault();
    closeMenu();
    navigate("/menu");
  };

  const toggleTheme = () => {
    setDarkMode((previous) => {
      const next = !previous;
      document.body.classList.toggle("light-mode", !next);
      return next;
    });
  };

  const handleLogout = async () => {
    closeMenu();
    await logout();
    navigate("/login");
  };

  return (
    <header className={`navbar ${scrolled ? "scrolled" : ""}`}>
      <div className="navbar-inner">
        <Link to="/" className="brand" onClick={closeMenu} aria-label="Food App home">
          <img src={Logo} alt="Food App" className="App-logo" />
          <span><b>Food</b> App</span>
        </Link>

        <nav className={`menu-links ${menuOpen ? "active" : ""}`}>
          <div className="mobile-menu-head"><strong>Food App</strong><button type="button" onClick={closeMenu} aria-label="Close menu"><CloseIcon /></button></div>
          <Link to="/" onClick={closeMenu}>Home</Link>
          <Link to="/menu" onClick={closeMenu}>Menu</Link>
          <Link to="/about" onClick={closeMenu}>About</Link>
          <Link to="/services" onClick={closeMenu}>Services</Link>
          <Link to="/contact" onClick={closeMenu}>Contact</Link>
          <div className="mobile-menu-actions">
            {user ? <button type="button" onClick={() => { closeMenu(); navigate("/profile"); }}><PersonOutlineIcon /> My account</button> : <button type="button" onClick={() => { closeMenu(); navigate("/login"); }}>Sign in</button>}
            {user && <button type="button" onClick={handleLogout}>Sign out</button>}
          </div>
        </nav>

        <form className="navbar-search" onSubmit={submitSearch}>
          <SearchOutlinedIcon />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search food..." aria-label="Search food" />
          {search && <button type="button" onClick={() => setSearch("")} aria-label="Clear search"><CloseIcon /></button>}
        </form>

        <div className="navbar-actions">
          <Link to="/cart" className="nav-action" aria-label="Shopping cart"><ShoppingCartOutlinedIcon /></Link>
          {user ? (
            <button type="button" className="account-button" onClick={() => navigate("/profile")}>
              <span className="user-avatar-placeholder">{user.name ? user.name.charAt(0).toUpperCase() : "U"}</span>
              <span className="account-name">{user.name || "Account"}</span>
            </button>
          ) : <button type="button" className="login-btn" onClick={() => navigate("/login")}>Sign in</button>}
          <button type="button" className="nav-action" onClick={toggleTheme} aria-label="Toggle dark mode"><Brightness4OutlinedIcon /></button>
        </div>

        <button type="button" className="toggle-button" onClick={() => setMenuOpen((previous) => !previous)} aria-label="Toggle navigation" aria-expanded={menuOpen}>{menuOpen ? <CloseIcon /> : <ReorderIcon />}</button>
      </div>
    </header>
  );
}

export default Navbar;
