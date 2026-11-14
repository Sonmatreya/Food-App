import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';

const blank = { label: 'Home', line: '', landmark: '', phone: '' };

export default function Checkout() {
  const { user, token, addAddress, removeAddress } = useAuth();
  const { cart, list, add, remove, clear } = useCart();
  const nav = useNavigate();

  const [coupon, setCoupon] = useState('');
  const [bill, setBill] = useState(null);
  const [addressId, setAddressId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(blank);
  const [payment, setPayment] = useState('COD');
  const [error, setError] = useState('');
  const [placing, setPlacing] = useState(false);

  const body = {
    restaurantId: cart.restaurantId,
    items: list.map((i) => ({ menuItemId: i._id, qty: i.qty })),
    coupon,
  };

  // Always get the bill from the server so prices can't be tampered with
  useEffect(() => {
    if (!list.length) return setBill(null);
    const t = setTimeout(() => {
      api('/orders/quote', { method: 'POST', body })
        .then((d) => setBill(d.bill))
        .catch((e) => setError(e.message));
    }, 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(body)]);

  useEffect(() => {
    if (user?.addresses?.length && !user.addresses.find((a) => a._id === addressId))
      setAddressId(user.addresses[0]._id);
  }, [user, addressId]);

  if (!list.length)
    return (
      <main className="container">
        <h2>Your cart is empty</h2>
        <Link to="/" className="btn">Browse restaurants</Link>
      </main>
    );

  const saveAddress = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const addrs = await addAddress(form);
      setAddressId(addrs[addrs.length - 1]._id);
      setForm(blank);
      setShowForm(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const placeOrder = async () => {
    setError('');
    setPlacing(true);
    try {
      await api('/orders', { method: 'POST', token, body: { ...body, addressId, paymentMethod: payment } });
      clear();
      nav('/orders');
    } catch (err) {
      setError(err.message);
    } finally {
      setPlacing(false);
    }
  };

  return (
    <main className="container narrow">
      <h1>{cart.restaurantName}</h1>

      {list.map((i) => (
        <div key={i._id} className="line">
          <span><span className={`dot ${i.isVeg ? 'veg' : 'nonveg'}`} />{i.name}</span>
          <div className="stepper">
            <button onClick={() => remove(i._id)}>−</button>
            <span>{i.qty}</span>
            <button onClick={() => add({ _id: cart.restaurantId, name: cart.restaurantName }, i)}>+</button>
          </div>
          <span>₹{i.price * i.qty}</span>
        </div>
      ))}

      <div className="coupon">
        <input placeholder="Coupon (SAVE75 / FLAT175)" value={coupon} onChange={(e) => setCoupon(e.target.value)} />
      </div>
      {bill?.couponMessage && <p className={bill.couponApplied ? 'ok' : 'error'}>{bill.couponMessage}</p>}

      {bill && (
        <div className="bill">
          <h3>Bill details</h3>
          <div><span>Item total</span><span>₹{bill.subtotal}</span></div>
          <div><span>Delivery fee</span><span>{bill.deliveryFee ? `₹${bill.deliveryFee}` : 'FREE'}</span></div>
          <div><span>GST (5%)</span><span>₹{bill.tax.toFixed(2)}</span></div>
          {bill.discount > 0 && <div className="ok"><span>Coupon discount</span><span>−₹{bill.discount}</span></div>}
          <div className="total"><span>To pay</span><span>₹{bill.total.toFixed(2)}</span></div>
        </div>
      )}

      {!user ? (
        <p>
          <Link to="/login" state={{ from: '/checkout' }} className="btn">Login to place order</Link>
        </p>
      ) : (
        <>
          <h3>Select an address</h3>
          {user.addresses.map((a) => (
            <label key={a._id} className={`addr ${addressId === a._id ? 'active' : ''}`}>
              <input type="radio" checked={addressId === a._id} onChange={() => setAddressId(a._id)} />
              <div>
                <strong>{a.label}</strong>
                <p>{a.line}{a.landmark ? `, ${a.landmark}` : ''}</p>
                {a.phone && <p className="muted small">📞 {a.phone}</p>}
              </div>
              <button type="button" className="link" onClick={() => removeAddress(a._id)}>Delete</button>
            </label>
          ))}
          {showForm ? (
            <form onSubmit={saveAddress} className="form">
              <select value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })}>
                <option>Home</option><option>Work</option><option>Other</option>
              </select>
              <input required placeholder="Complete address" value={form.line} onChange={(e) => setForm({ ...form, line: e.target.value })} />
              <input placeholder="Landmark" value={form.landmark} onChange={(e) => setForm({ ...form, landmark: e.target.value })} />
              <input placeholder="Phone number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <button className="btn">Save address</button>
            </form>
          ) : (
            <button className="link" onClick={() => setShowForm(true)}>+ Add address</button>
          )}

          <h3>Payment</h3>
          <div className="pay">
            {['COD', 'UPI', 'CARD'].map((p) => (
              <button key={p} className={`chip ${payment === p ? 'active' : ''}`} onClick={() => setPayment(p)}>
                {p === 'COD' ? 'Cash on delivery' : p}
              </button>
            ))}
          </div>

          {error && <p className="error">{error}</p>}
          <button className="btn full" disabled={placing || !addressId || !bill} onClick={placeOrder}>
            {placing ? 'Placing…' : `Place Order${bill ? ` • ₹${bill.total.toFixed(2)}` : ''}`}
          </button>
        </>
      )}
      {!user && error && <p className="error">{error}</p>}
    </main>
  );
}
