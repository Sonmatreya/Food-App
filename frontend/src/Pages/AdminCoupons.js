import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import "../Styles/AdminCoupons.css";

const emptyForm = { code: "", type: "percentage", value: "", minimum: "0", active: true };

export default function AdminCoupons() {
  const { API_URL } = useAuth();
  const [coupons, setCoupons] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const fetchCoupons = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch(`${API_URL}/api/coupons/admin`, { credentials: "include" });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Unable to load coupons.");
      setCoupons(data.coupons || []);
    } catch (requestError) { setError(requestError.message || "Unable to load coupons."); }
    finally { setLoading(false); }
  }, [API_URL]);

  useEffect(() => { fetchCoupons(); }, [fetchCoupons]);

  const filtered = useMemo(() => coupons.filter((coupon) => {
    const matchesSearch = !search || coupon.code.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = status === "All" || (status === "Active" ? coupon.active : !coupon.active);
    return matchesSearch && matchesStatus;
  }), [coupons, search, status]);

  const openCreate = () => { setEditing(null); setForm({ ...emptyForm }); setNotice(""); setModalOpen(true); };
  const openEdit = (coupon) => { setEditing(coupon); setForm({ code: coupon.code, type: coupon.type, value: coupon.value, minimum: coupon.minimum, active: coupon.active }); setNotice(""); setModalOpen(true); };
  const close = () => { if (!saving) { setModalOpen(false); setEditing(null); setForm({ ...emptyForm }); } };

  const submit = async (event) => {
    event.preventDefault(); setSaving(true); setError(""); setNotice("");
    const payload = { code: form.code, type: form.type, value: Number(form.value), minimum: Number(form.minimum), active: form.active };
    try {
      const response = await fetch(editing ? `${API_URL}/api/coupons/${editing.id}` : `${API_URL}/api/coupons`, {
        method: editing ? "PUT" : "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Unable to save coupon.");
      await fetchCoupons(); close(); setNotice(editing ? "Coupon updated successfully." : "Coupon created successfully.");
    } catch (requestError) { setError(requestError.message || "Unable to save coupon."); }
    finally { setSaving(false); }
  };

  const remove = async (coupon) => {
    if (!window.confirm(`Delete coupon ${coupon.code}?`)) return;
    try {
      const response = await fetch(`${API_URL}/api/coupons/${coupon.id}`, { method: "DELETE", credentials: "include" });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Unable to delete coupon.");
      setNotice(`Coupon ${coupon.code} deleted.`); await fetchCoupons();
    } catch (requestError) { setError(requestError.message || "Unable to delete coupon."); }
  };

  const toggle = async (coupon) => {
    try {
      const response = await fetch(`${API_URL}/api/coupons/${coupon.id}`, { method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: coupon.code, type: coupon.type, value: coupon.value, minimum: coupon.minimum, active: !coupon.active }) });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Unable to update coupon.");
      setCoupons((current) => current.map((item) => item.id === coupon.id ? data.coupon : item));
    } catch (requestError) { setError(requestError.message || "Unable to update coupon."); }
  };

  return <section className="admin-coupons-page">
    <div className="admin-coupons-header"><div><span>Promotion management</span><h2>Coupons & Discounts</h2><p>Create and manage promotional offers for customers.</p></div><button className="admin-coupons-add" onClick={openCreate}>+ Create Coupon</button></div>
    {error && <div className="admin-coupons-note"><strong>Error</strong><span>{error} <button type="button" onClick={fetchCoupons}>Retry</button></span></div>}
    {notice && <div className="admin-coupons-note"><strong>Success</strong><span>{notice}</span></div>}
    <div className="admin-coupons-summary"><div><strong>{coupons.length}</strong><small>Total coupons</small></div><div className="green"><strong>{coupons.filter(c => c.active).length}</strong><small>Active</small></div><div className="red"><strong>{coupons.filter(c => !c.active).length}</strong><small>Inactive</small></div></div>
    <div className="admin-coupons-toolbar"><input value={search} onChange={e => setSearch(e.target.value.toUpperCase())} placeholder="Search coupon code..."/><select value={status} onChange={e => setStatus(e.target.value)}><option>All</option><option>Active</option><option>Inactive</option></select></div>
    <div className="admin-coupons-card"><div className="admin-coupons-card-head"><div><span>Offer catalogue</span><h3>{loading ? "Loading..." : `${filtered.length} coupon${filtered.length !== 1 ? "s" : ""}`}</h3></div><p>Customer checkout uses the coupons stored in the database.</p></div>
      {!loading && <div className="admin-coupons-grid">{filtered.map(coupon => <article className="admin-coupon" key={coupon.id}><div className="admin-coupon-top"><div className="admin-coupon-code">{coupon.code}</div><button type="button" className={`admin-coupon-status ${coupon.active ? "active" : "inactive"}`} onClick={() => toggle(coupon)}>{coupon.active ? "Active" : "Inactive"}</button></div><div className="admin-coupon-value">{coupon.type === "percentage" ? `${coupon.value}% OFF` : `$${Number(coupon.value).toFixed(2)} OFF`}</div><p>Minimum order <strong>${Number(coupon.minimum).toFixed(2)}</strong></p><div className="admin-coupon-actions"><button type="button" onClick={() => openEdit(coupon)}>Edit</button><button type="button" className="danger" onClick={() => remove(coupon)}>Delete</button></div></article>)}</div>}
      {!loading && !filtered.length && <div className="admin-coupons-empty">No coupons match your search.</div>}
    </div>
    <div className="admin-coupons-note"><strong>How discounts work</strong><span>Percentage discounts are calculated from the item subtotal. Fixed discounts cannot reduce the subtotal below zero. Minimum order value is checked before applying an offer.</span></div>
    {modalOpen && <div className="admin-coupon-modal-backdrop" onMouseDown={e => e.target === e.currentTarget && close()}><form className="admin-coupon-modal" onSubmit={submit}><div className="admin-coupon-modal-head"><div><span>{editing ? "Update promotion" : "New promotion"}</span><h3>{editing ? "Edit Coupon" : "Create Coupon"}</h3></div><button type="button" onClick={close}>×</button></div><div className="admin-coupon-form"><label>Coupon code<input required maxLength="20" value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="SUMMER20"/></label><label>Discount type<select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option value="percentage">Percentage (%)</option><option value="fixed">Fixed amount ($)</option></select></label><label>Discount value<input required type="number" min="0.01" step="0.01" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })}/></label><label>Minimum order<input required type="number" min="0" step="0.01" value={form.minimum} onChange={e => setForm({ ...form, minimum: e.target.value })}/></label><label className="admin-coupon-check"><input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })}/> Active for customers</label></div><div className="admin-coupon-modal-actions"><button type="button" onClick={close}>Cancel</button><button className="primary" type="submit" disabled={saving}>{saving ? "Saving..." : editing ? "Save Changes" : "Create Coupon"}</button></div></form></div>}
  </section>;
}
