import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useCart } from '../context/CartContext.jsx';

export default function Restaurant() {
  const { id } = useParams();
  const { cart, add, remove, count, vegMode, setVegMode } = useCart();
  const [r, setR] = useState(null);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');

  useEffect(() => {
    setR(null);
    api(`/restaurants/${id}${vegMode ? '?veg=true' : ''}`)
      .then((d) => setR(d.restaurant))
      .catch((e) => setError(e.message));
  }, [id, vegMode]);

  const grouped = useMemo(() => {
    if (!r) return {};
    const term = q.trim().toLowerCase();
    return r.menu
      .filter((m) => !term || m.name.toLowerCase().includes(term))
      .reduce((acc, m) => ((acc[m.category] ||= []).push(m), acc), {});
  }, [r, q]);

  if (error) return <main className="container"><p className="error">{error}</p></main>;
  if (!r) return <main className="container"><p className="muted">Loading…</p></main>;

  return (
    <main className="container">
      <Link to="/" className="muted">← Back</Link>
      <div className="rest-head">
        <div>
          <h1>{r.name}</h1>
          <p className="muted">{r.cuisines.join(', ')} • {r.area}</p>
          <p className="muted">⚡ {r.deliveryMinutes} mins • {r.distanceKm} km</p>
          {r.offer && <p className="offer">🏷️ {r.offer}</p>}
        </div>
        <span className="rating big">★ {r.rating.toFixed(1)}</span>
      </div>

      <div className="search-row">
        <input className="search" placeholder="Search in menu" value={q} onChange={(e) => setQ(e.target.value)} />
        <label className="veg-toggle">
          <span>VEG</span>
          <input type="checkbox" checked={vegMode} onChange={(e) => setVegMode(e.target.checked)} />
        </label>
      </div>

      {Object.keys(grouped).length === 0 && <p className="muted">No dishes found.</p>}
      {Object.entries(grouped).map(([cat, items]) => (
        <section key={cat}>
          <h2 className="section">{cat}</h2>
          {items.map((m) => {
            const qty = cart.restaurantId === r._id ? cart.items[m._id]?.qty || 0 : 0;
            return (
              <div key={m._id} className="dish">
                <div>
                  <span className={`dot ${m.isVeg ? 'veg' : 'nonveg'}`} />
                  <h4>{m.name}</h4>
                  <p>₹{m.price}</p>
                </div>
                <div className="dish-right">
                  <div className="dish-img">{m.emoji}</div>
                  {qty === 0 ? (
                    <button className="add" onClick={() => add(r, { _id: m._id, name: m.name, price: m.price, isVeg: m.isVeg })}>
                      ADD
                    </button>
                  ) : (
                    <div className="stepper">
                      <button onClick={() => remove(m._id)}>−</button>
                      <span>{qty}</span>
                      <button onClick={() => add(r, { _id: m._id, name: m.name, price: m.price, isVeg: m.isVeg })}>+</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      ))}

      {count > 0 && cart.restaurantId === r._id && (
        <Link to="/checkout" className="cart-bar">
          <span>{count} item{count > 1 ? 's' : ''} added</span>
          <strong>Continue →</strong>
        </Link>
      )}
    </main>
  );
}
