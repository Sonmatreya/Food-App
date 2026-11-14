import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';

const SUGGESTIONS = ['Biryani under ₹200', 'Something veg and spicy', 'Cheap momos', 'Coffee and a snack'];

function SwipeToOrder({ label, onComplete }) {
  const [v, setV] = useState(0);
  const release = () => {
    if (v >= 90) onComplete();
    setV(0);
  };
  return (
    <div className="swipe">
      <div className="swipe-fill" style={{ width: `${Math.max(v, 12)}%` }} />
      <span className="swipe-label">{label}</span>
      <input
        type="range" min="0" max="100" value={v} aria-label={label}
        onChange={(e) => setV(Number(e.target.value))}
        onMouseUp={release} onTouchEnd={release} onKeyUp={(e) => e.key === 'Enter' && onComplete()}
      />
    </div>
  );
}

function DishCard({ restaurant, dish }) {
  const { cart, add, remove } = useCart();
  const qty = cart.restaurantId === restaurant._id ? cart.items[dish._id]?.qty || 0 : 0;
  const item = { _id: dish._id, name: dish.name, price: dish.price, isVeg: dish.isVeg };
  return (
    <div className="ai-dish">
      <div className="ai-dish-img">{dish.emoji}</div>
      <p className="ai-dish-name"><span className={`dot ${dish.isVeg ? 'veg' : 'nonveg'}`} />{dish.name}</p>
      <div className="row">
        <span>₹{dish.price}</span>
        {qty === 0 ? (
          <button className="add small-add" onClick={() => add(restaurant, item)}>ADD</button>
        ) : (
          <div className="stepper tiny">
            <button onClick={() => remove(dish._id)}>−</button>
            <span>{qty}</span>
            <button onClick={() => add(restaurant, item)}>+</button>
          </div>
        )}
      </div>
    </div>
  );
}

function ResultCard({ res }) {
  const r = res.restaurant;
  return (
    <div className="ai-result">
      <div className="row">
        <h3>{r.emoji} {r.name}</h3>
        <Link to={`/restaurant/${r._id}`} className="link">Menu ↗</Link>
      </div>
      <p className="muted small">
        ★ {r.rating.toFixed(1)} • ⚡ {r.deliveryMinutes} mins • {r.distanceKm} km
        {res.orderedBefore && ' • Ordered before'}
      </p>
      {r.offer && <p className="offer">{r.offer}</p>}
      <div className="ai-dishes scroll">
        {res.dishes.map((d) => <DishCard key={d._id} restaurant={r} dish={d} />)}
      </div>
    </div>
  );
}

export default function AiFeed() {
  const { user, token } = useAuth();
  const { add, count } = useCart();
  const nav = useNavigate();
  const [feed, setFeed] = useState(null);
  const [feedError, setFeedError] = useState('');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [stage, setStage] = useState(null); // null | 'thinking' | 'finding'
  const [pending, setPending] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    api('/ai/feed', { token })
      .then(setFeed)
      .catch((e) => setFeedError(e.message));
  }, [token]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, stage]);

  const send = async (text) => {
    const message = (text ?? input).trim();
    if (!message || stage) return;
    setInput('');
    setPending(message);
    setStage('thinking');
    const timer = setTimeout(() => setStage((s) => (s ? 'finding' : s)), 900);
    const history = messages.slice(-6).map((m) => ({ role: m.role, text: m.text }));
    setMessages((m) => [...m, { role: 'user', text: message }]);
    try {
      const d = await api('/ai/chat', { method: 'POST', token, body: { message, history } });
      setMessages((m) => [...m, { role: 'ai', text: d.reply, results: d.results }]);
    } catch (e) {
      setMessages((m) => [...m, { role: 'ai', text: e.message || 'Something went wrong. Please try again.', results: [] }]);
    } finally {
      clearTimeout(timer);
      setStage(null);
    }
  };

  const orderSnack = () => {
    const { restaurant, item } = feed.snack;
    add(restaurant, { _id: item._id, name: item.name, price: item.price, isVeg: item.isVeg });
    nav('/checkout');
  };

  const first = user ? user.name.split(' ')[0] : 'there';

  return (
    <main className="container narrow ai-page">
      <h1 className="ai-title">Your feed</h1>
      <p className="muted">Hi {first}!</p>

      {feedError && <p className="error">{feedError}</p>}

      {feed?.snack && (
        <section className="snack">
          <p className="pink">Perfect snack pick for you</p>
          <div className="snack-card">
            <div className="snack-img">{feed.snack.item.emoji}</div>
            <p className="muted small">⏱ {feed.snack.restaurant.deliveryMinutes}–{feed.snack.restaurant.deliveryMinutes + 5} mins</p>
            <h3>{feed.snack.restaurant.name}</h3>
            <p><span className={`dot ${feed.snack.item.isVeg ? 'veg' : 'nonveg'}`} />1 x {feed.snack.item.name}</p>
            <div className="row">
              <SwipeToOrder label="SWIPE TO ORDER" onComplete={orderSnack} />
              <div className="right"><strong>₹{feed.snack.total.toFixed(2)}</strong><p className="muted small">Total bill (with offers)</p></div>
            </div>
          </div>
        </section>
      )}

      <p className="pink center">Too many options?<br />Let us help you decide</p>

      {feed?.trending?.length > 0 && messages.length === 0 && (
        <section>
          <p className="pink center">📍 Trending items near you</p>
          <div className="ai-dishes scroll">
            {feed.trending.map((t) => (
              <div key={t.item._id}>
                <p className="muted small">{t.restaurant.name}</p>
                <DishCard restaurant={t.restaurant} dish={t.item} />
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="chat">
        {messages.map((m, i) =>
          m.role === 'user' ? (
            <div key={i} className="bubble user">{m.text}</div>
          ) : (
            <div key={i} className="ai-msg">
              <p>{m.text}</p>
              {m.results?.map((r) => <ResultCard key={r.restaurant._id} res={r} />)}
            </div>
          )
        )}
        {stage && (
          <div className="thinking">
            <div className="spark">✦</div>
            <p>{stage === 'thinking' ? 'Thinking' : `Finding the best ${pending.length > 40 ? 'options' : pending} for you...`}</p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="chat-dock">
        {messages.length === 0 && (
          <div className="chips scroll">
            {SUGGESTIONS.map((s) => <button key={s} className="chip" onClick={() => send(s)}>{s}</button>)}
          </div>
        )}
        {count > 0 && <Link to="/checkout" className="cart-pill">🛒 {count} item{count > 1 ? 's' : ''} • View cart</Link>}
        <form className="chat-input" onSubmit={(e) => { e.preventDefault(); send(); }}>
          <input
            placeholder="What do you feel like eating?" value={input} maxLength={300}
            onChange={(e) => setInput(e.target.value)} disabled={!!stage}
          />
          <button type="submit" disabled={!input.trim() || !!stage} aria-label="Send">➤</button>
        </form>
        <p className="muted tiny center">AI-powered responses. Please check important details.</p>
      </div>
    </main>
  );
}
