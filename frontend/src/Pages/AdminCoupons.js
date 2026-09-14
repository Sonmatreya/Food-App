import React, { useMemo, useState } from "react";
import "../Styles/AdminCoupons.css";

const STORAGE_KEY = "food-app-admin-coupons";
const DEFAULT_COUPONS = [
  { id: 1, code: "WELCOME20", type: "percentage", value: 20, minimum: 20, active: true },
  { id: 2, code: "SAVE10", type: "fixed", value: 10, minimum: 30, active: true },
  { id: 3, code: "FOOD5", type: "fixed", value: 5, minimum: 15, active: true },
];
const emptyForm = { code: "", type: "percentage", value: "", minimum: "0", active: true };

const readCoupons = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) && saved.length ? saved : DEFAULT_COUPONS;
  } catch { return DEFAULT_COUPONS; }
};

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState(readCoupons);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);

  const filtered = useMemo(() => coupons.filter((coupon) => {
    const matchesSearch = !search || coupon.code.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = status === "All" || (status === "Active" ? coupon.active : !coupon.active);
    return matchesSearch && matchesStatus;
  }), [coupons, search, status]);

  const persist = (next) => { setCoupons(next); localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); };
  const openCreate = () => { setEditing(null); setForm({ ...emptyForm }); setModalOpen(true); };
  const openEdit = (coupon) => { setEditing(coupon); setForm({ code: coupon.code, type: coupon.type, value: coupon.value, minimum: coupon.minimum, active: coupon.active }); setModalOpen(true); };
  const close = () => { setModalOpen(false); setEditing(null); setForm({ ...emptyForm }); };

  const submit = (event) => {
    event.preventDefault();
    const code = form.code.trim().toUpperCase().replace(/\s+/g, "");
    const value = Number(form.value);
    const minimum = Number(form.minimum);
    if (!/^[A-Z0-9_-]{3,20}$/.test(code) || !Number.isFinite(value) || value <= 0 || (form.type === "percentage" && value > 100) || !Number.isFinite(minimum) || minimum < 0) return;
    const duplicate = coupons.some((coupon) => coupon.code === code && coupon.id !== editing?.id);
    if (duplicate) return;
    const item = { id: editing?.id || Date.now(), code, type: form.type, value: Number(value.toFixed(2)), minimum: Number(minimum.toFixed(2)), active: Boolean(form.active) };
    persist(editing ? coupons.map((coupon) => coupon.id === editing.id ? item : coupon) : [item, ...coupons]);
    close();
  };

  const remove = (coupon) => { if (window.confirm(`Delete coupon ${coupon.code}?`)) persist(coupons.filter((item) => item.id !== coupon.id)); };
  const toggle = (coupon) => persist(coupons.map((item) => item.id === coupon.id ? { ...item, active: !item.active } : item));

  return <section className="admin-coupons-page">
    <div className="admin-coupons-header"><div><span>Promotion management</span><h2>Coupons & Discounts</h2><p>Create and manage promotional offers for customers.</p></div><button className="admin-coupons-add" onClick={openCreate}>+ Create Coupon</button></div>
    <div className="admin-coupons-summary"><div><strong>{coupons.length}</strong><small>Total coupons</small></div><div className="green"><strong>{coupons.filter(c => c.active).length}</strong><small>Active</small></div><div className="red"><strong>{coupons.filter(c => !c.active).length}</strong><small>Inactive</small></div></div>
    <div className="admin-coupons-toolbar"><input value={search} onChange={e => setSearch(e.target.value.toUpperCase())} placeholder="Search coupon code..."/><select value={status} onChange={e => setStatus(e.target.value)}><option>All</option><option>Active</option><option>Inactive</option></select></div>
    <div className="admin-coupons-card"><div className="admin-coupons-card-head"><div><span>Offer catalogue</span><h3>{filtered.length} coupon{filtered.length !== 1 ? "s" : ""}</h3></div><p>Customer checkout uses the coupon codes configured here.</p></div>
      <div className="admin-coupons-grid">{filtered.map(coupon => <article className="admin-coupon" key={coupon.id}><div className="admin-coupon-top"><div className="admin-coupon-code">{coupon.code}</div><button className={`admin-coupon-status ${coupon.active ? "active" : "inactive"}`} onClick={() => toggle(coupon)}>{coupon.active ? "Active" : "Inactive"}</button></div><div className="admin-coupon-value">{coupon.type === "percentage" ? `${coupon.value}% OFF` : `$${coupon.value.toFixed(2)} OFF`}</div><p>Minimum order <strong>${coupon.minimum.toFixed(2)}</strong></p><div className="admin-coupon-actions"><button onClick={() => openEdit(coupon)}>Edit</button><button className="danger" onClick={() => remove(coupon)}>Delete</button></div></article>)}</div>
      {!filtered.length && <div className="admin-coupons-empty">No coupons match your search.</div>}
    </div>
    <div className="admin-coupons-note"><strong>How discounts work</strong><span>Percentage discounts are calculated from the item subtotal. Fixed discounts cannot reduce the subtotal below zero. Minimum order value is checked before applying an offer.</span></div>
    {modalOpen && <div className="admin-coupon-modal-backdrop" onMouseDown={e => e.target === e.currentTarget && close()}><form className="admin-coupon-modal" onSubmit={submit}><div className="admin-coupon-modal-head"><div><span>{editing ? "Update promotion" : "New promotion"}</span><h3>{editing ? "Edit Coupon" : "Create Coupon"}</h3></div><button type="button" onClick={close}>×</button></div><div className="admin-coupon-form"><label>Coupon code<input required maxLength="20" value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="SUMMER20"/></label><label>Discount type<select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option value="percentage">Percentage (%)</option><option value="fixed">Fixed amount ($)</option></select></label><label>Discount value<input required type="number" min="0.01" step="0.01" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })}/></label><label>Minimum order<input required type="number" min="0" step="0.01" value={form.minimum} onChange={e => setForm({ ...form, minimum: e.target.value })}/></label><label className="admin-coupon-check"><input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })}/> Active for customers</label></div><div className="admin-coupon-modal-actions"><button type="button" onClick={close}>Cancel</button><button className="primary" type="submit">{editing ? "Save Changes" : "Create Coupon"}</button></div></form></div>}
  </section>;
}
