import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Orders() {
  const { user, token, loading } = useAuth();
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    api('/orders/my', { token })
      .then((d) => setOrders(d.orders))
      .catch((e) => setError(e.message));
  }, [token]);

  if (loading) return <main className="container"><p className="muted">Loading…</p></main>;
  if (!user) return <Navigate to="/login" state={{ from: '/orders' }} replace />;

  return (
    <main className="container narrow">
      <h1>Order history</h1>
      {error && <p className="error">{error}</p>}
      {orders && orders.length === 0 && <p className="muted">No orders yet.</p>}
      {orders?.map((o) => (
        <div key={o._id} className="order">
          <div className="row">
            <h3>{o.restaurantName}</h3>
            <span className={`status ${o.status}`}>{o.status.replace(/_/g, ' ')}</span>
          </div>
          <p className="muted small">{new Date(o.createdAt).toLocaleString()} • {o.paymentMethod}</p>
          <p>{o.items.map((i) => `${i.qty} × ${i.name}`).join(', ')}</p>
          <p className="muted small">Deliver to: {o.address.line}</p>
          <strong>₹{o.bill.total.toFixed(2)}</strong>
        </div>
      ))}
    </main>
  );
}
