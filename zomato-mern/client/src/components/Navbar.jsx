import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const nav = useNavigate();

  return (
    <header className="navbar">
      <Link to="/" className="brand">FoodDash</Link>
      <nav>
        <Link to="/ai" className="ai-link">✦ Ask AI</Link>
        <Link to="/checkout">🛒 Cart{count > 0 && <span className="badge">{count}</span>}</Link>
        {user ? (
          <>
            <Link to="/orders">Orders</Link>
            <button
              className="link"
              onClick={() => {
                logout();
                nav('/');
              }}
            >
              Logout ({user.name.split(' ')[0]})
            </button>
          </>
        ) : (
          <Link to="/login">Login</Link>
        )}
      </nav>
    </header>
  );
}
