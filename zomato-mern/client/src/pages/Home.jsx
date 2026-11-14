import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useCart } from '../context/CartContext.jsx';
import RestaurantCard from '../components/RestaurantCard.jsx';

const EMOJI = {
  Chicken: '🍗', Momo: '🥟', Biryani: '🍚', Chinese: '🍜', Pizza: '🍕', Burger: '🍔',
  'North Indian': '🍛', Desserts: '🍰', Bakery: '🥐', 'Fast Food': '🍟',
};

export default function Home() {
  const { vegMode, setVegMode } = useCart();
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [cuisine, setCuisine] = useState('All');
  const [cuisines, setCuisines] = useState([]);
  const [filters, setFilters] = useState({ fast: false, under150: false, rating: false });
  const [sort, setSort] = useState('relevance');
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/restaurants/meta/cuisines').then((d) => setCuisines(d.cuisines)).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedQ) params.set('q', debouncedQ);
    if (cuisine !== 'All') params.set('cuisine', cuisine);
    if (vegMode) params.set('veg', 'true');
    if (filters.fast) params.set('fast', 'true');
    if (filters.under150) params.set('under150', 'true');
    if (filters.rating) params.set('rating', '4');
    params.set('sort', sort);

    setLoading(true);
    setError('');
    api(`/restaurants?${params}`)
      .then((d) => setRestaurants(d.restaurants))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [debouncedQ, cuisine, vegMode, filters, sort]);

  const toggle = (k) => setFilters((f) => ({ ...f, [k]: !f[k] }));

  return (
    <main className="container">
      <div className="search-row">
        <input
          className="search"
          placeholder="🔍 Restaurant name or a dish..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <label className="veg-toggle">
          <span>VEG MODE</span>
          <input type="checkbox" checked={vegMode} onChange={(e) => setVegMode(e.target.checked)} />
        </label>
      </div>

      <div className="chips scroll">
        {['All', ...cuisines].map((c) => (
          <button key={c} className={`cat ${cuisine === c ? 'active' : ''}`} onClick={() => setCuisine(c)}>
            <span className="cat-emoji">{c === 'All' ? '🍽️' : EMOJI[c] || '🍴'}</span>
            {c}
          </button>
        ))}
      </div>

      <div className="chips scroll">
        <button className={`chip ${filters.fast ? 'active' : ''}`} onClick={() => toggle('fast')}>⚡ Near & Fast</button>
        <button className={`chip ${filters.under150 ? 'active' : ''}`} onClick={() => toggle('under150')}>Under ₹150</button>
        <button className={`chip ${filters.rating ? 'active' : ''}`} onClick={() => toggle('rating')}>Rating 4.0+</button>
        <select className="chip" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="relevance">Sort: Relevance</option>
          <option value="rating">Sort: Rating</option>
          <option value="time">Sort: Delivery time</option>
        </select>
      </div>

      <h2 className="section">Recommended with deals</h2>
      {loading && <p className="muted">Loading…</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && restaurants.length === 0 && <p className="muted">No restaurants match your filters.</p>}
      <div className="grid">
        {restaurants.map((r) => (
          <RestaurantCard key={r._id} r={r} />
        ))}
      </div>
    </main>
  );
}
