import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import "../Styles/AdminCoupons.css";

const PAGE_SIZE = 9;
const emptyForm = { code: "", type: "percentage", value: "", minimum: "0", maxDiscount: "", expiresAt: "", maxUses: "0", perCustomerLimit: "0", active: true };

const formatExpiryInput = (value) => { if (!value) return ""; const date = new Date(value); if (Number.isNaN(date.getTime())) return ""; const offset = date.getTimezoneOffset(); return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16); };
const formatExpiry = (value) => { if (!value) return "No expiry"; const date = new Date(value); return Number.isNaN(date.getTime()) ? "Invalid date" : date.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }); };

export default function AdminCoupons() {
  const { API_URL } = useAuth();
  const [coupons, setCoupons] = useState([]);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });
  const [summary, setSummary] = useState({ total: 0, active: 0, inactive: 0 });
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const fetchCoupons = useCallback(async (requestedPage = page) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(requestedPage), limit: String(PAGE_SIZE) });
      if (appliedSearch) params.set("search", appliedSearch);
      if (status !== "all") params.set("status", status);

      const response = await fetch(`${API_URL}/api/coupons/admin?${params.toString()}`, { credentials: "include" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) throw new Error(data.message || "Unable to load coupons.");

      setCoupons(Array.isArray(data.coupons) ? data.coupons : []);
      setPagination(data.pagination || { page: requestedPage, limit: PAGE_SIZE, total: 0, totalPages: 1 });
      setSummary(data.summary || { total: 0, active: 0, inactive: 0 });
    } catch (requestError) {
      setError(requestError.message || "Unable to load coupons.");
    } finally {
      setLoading(false);
    }
  }, [API_URL, appliedSearch, status, page]);

  useEffect(() => { fetchCoupons(page); }, [fetchCoupons, page]);

  const applySearch = (event) => {
    event?.preventDefault();
    setPage(1);
    setAppliedSearch(search.trim().toUpperCase());
  };

  const resetFilters = () => {
    setSearch("");
    setAppliedSearch("");
    setStatus("all");
    setPage(1);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setError("");
    setNotice("");
    setModalOpen(true);
  };

  const openEdit = (coupon) => {
    setEditing(coupon);
    setForm({ code: coupon.code, type: coupon.type, value: coupon.value, minimum: coupon.minimum, maxDiscount: coupon.maxDiscount ?? "", expiresAt: formatExpiryInput(coupon.expiresAt), maxUses: coupon.maxUses ?? "0", perCustomerLimit: coupon.perCustomerLimit ?? "0", active: coupon.active });
    setError("");
    setNotice("");
    setModalOpen(true);
  };

  const close = () => {
    if (!saving) {
      setModalOpen(false);
      setEditing(null);
      setForm({ ...emptyForm });
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    const code = form.code.trim().toUpperCase().replace(/\s+/g, "");
    const value = Number(form.value);
    const minimum = Number(form.minimum);
    const maxDiscount = form.maxDiscount === "" ? null : Number(form.maxDiscount);
    const maxUses = Number(form.maxUses);
    const perCustomerLimit = Number(form.perCustomerLimit);

    if (!/^[A-Z0-9_-]{3,20}$/.test(code)) {
      setError("Coupon code must contain 3-20 letters, numbers, _ or -.");
      return;
    }
    if (!Number.isFinite(value) || value <= 0 || (form.type === "percentage" && value > 100)) {
      setError(form.type === "percentage" ? "Percentage discount must be between 0.01 and 100." : "Fixed discount must be greater than zero.");
      return;
    }
    if (!Number.isFinite(minimum) || minimum < 0) {
      setError("Minimum order value cannot be negative.");
      return;
    }
    if (maxDiscount !== null && (!Number.isFinite(maxDiscount) || maxDiscount < 0)) {
      setError("Maximum discount must be 0 or greater.");
      return;
    }
    if (!Number.isInteger(maxUses) || maxUses < 0 || !Number.isInteger(perCustomerLimit) || perCustomerLimit < 0) {
      setError("Usage limits must be whole numbers. Use 0 for unlimited.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(editing ? `${API_URL}/api/coupons/${editing.id}` : `${API_URL}/api/coupons`, {
        method: editing ? "PUT" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, type: form.type, value: Number(value.toFixed(2)), minimum: Number(minimum.toFixed(2)), maxDiscount: maxDiscount === null ? null : Number(maxDiscount.toFixed(2)), expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null, maxUses, perCustomerLimit, active: form.active }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) throw new Error(data.message || "Unable to save coupon.");
      close();
      setNotice(editing ? "Coupon updated successfully." : "Coupon created successfully.");
      await fetchCoupons(editing ? page : 1);
      if (!editing && page !== 1) setPage(1);
    } catch (requestError) {
      setError(requestError.message || "Unable to save coupon.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (coupon) => {
    if (!window.confirm(`Delete coupon ${coupon.code}? This cannot be undone.`)) return;
    try {
      setError("");
      const response = await fetch(`${API_URL}/api/coupons/${coupon.id}`, { method: "DELETE", credentials: "include" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) throw new Error(data.message || "Unable to delete coupon.");
      setNotice(`Coupon ${coupon.code} deleted.`);
      const nextPage = coupons.length === 1 && page > 1 ? page - 1 : page;
      if (nextPage !== page) setPage(nextPage);
      else await fetchCoupons(page);
    } catch (requestError) {
      setError(requestError.message || "Unable to delete coupon.");
    }
  };

  const toggle = async (coupon) => {
    try {
      setError("");
      const response = await fetch(`${API_URL}/api/coupons/${coupon.id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: coupon.code, type: coupon.type, value: coupon.value, minimum: coupon.minimum, maxDiscount: coupon.maxDiscount ?? null, expiresAt: coupon.expiresAt || null, maxUses: coupon.maxUses || 0, perCustomerLimit: coupon.perCustomerLimit || 0, active: !coupon.active }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) throw new Error(data.message || "Unable to update coupon.");
      setNotice(`${coupon.code} is now ${coupon.active ? "inactive" : "active"}.`);
      await fetchCoupons(page);
    } catch (requestError) {
      setError(requestError.message || "Unable to update coupon.");
    }
  };

  return <section className="admin-coupons-page">
    <div className="admin-coupons-header">
      <div><span>Promotion management</span><h2>Coupons & Discounts</h2><p>Create and manage promotional offers for customers.</p></div>
      <div className="admin-coupons-header-actions">
        <button type="button" className="admin-coupons-refresh" onClick={() => fetchCoupons(page)} disabled={loading}>↻ Refresh</button>
        <button type="button" className="admin-coupons-add" onClick={openCreate}>+ Create Coupon</button>
      </div>
    </div>

    {error && <div className="admin-coupons-note error"><strong>Error</strong><span>{error}</span><button type="button" onClick={() => fetchCoupons(page)}>Retry</button></div>}
    {notice && <div className="admin-coupons-note"><strong>Success</strong><span>{notice}</span></div>}

    <div className="admin-coupons-summary">
      <div><strong>{summary.total}</strong><small>Total coupons</small></div>
      <div className="green"><strong>{summary.active}</strong><small>Available</small></div>
      <div className="red"><strong>{summary.inactive}</strong><small>Inactive</small></div>
      <div className="orange"><strong>{summary.expired || 0}</strong><small>Expired</small></div>
      <div className="purple"><strong>{summary.exhausted || 0}</strong><small>Usage limit reached</small></div>
    </div>

    <form className="admin-coupons-toolbar" onSubmit={applySearch}>
      <input value={search} onChange={(e) => setSearch(e.target.value.toUpperCase())} placeholder="Search coupon code..." />
      <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
        <option value="all">All</option><option value="active">Active</option><option value="inactive">Inactive</option><option value="expired">Expired</option><option value="exhausted">Usage limit reached</option>
      </select>
      <button type="submit" className="admin-coupons-search">Search</button>
      <button type="button" className="admin-coupons-reset" onClick={resetFilters}>Reset</button>
    </form>

    <div className="admin-coupons-card">
      <div className="admin-coupons-card-head">
        <div><span>Offer catalogue</span><h3>{loading ? "Loading..." : `${pagination.total} coupon${pagination.total !== 1 ? "s" : ""}`}</h3></div>
        <p>Customer checkout uses coupons stored in the database.</p>
      </div>

      {loading ? <div className="admin-coupons-empty">Loading coupons...</div> : <div className="admin-coupons-grid">
        {coupons.map((coupon) => <article className="admin-coupon" key={coupon.id}>
          <div className="admin-coupon-top">
            <div className="admin-coupon-code">{coupon.code}</div>
            <button type="button" className={`admin-coupon-status ${coupon.status}`} onClick={() => toggle(coupon)}>{coupon.statusLabel}</button>
          </div>
          <div className="admin-coupon-value">{coupon.type === "percentage" ? `${coupon.value}% OFF` : `₹${Number(coupon.value).toFixed(2)} OFF`}</div>
          <p>Minimum order <strong>₹{Number(coupon.minimum).toFixed(2)}</strong></p>
          <div className="admin-coupon-meta">
            <span>Uses <strong>{coupon.usageCount || 0}{coupon.maxUses > 0 ? ` / ${coupon.maxUses}` : " / ∞"}</strong></span>
            <span>Per customer <strong>{coupon.perCustomerLimit > 0 ? coupon.perCustomerLimit : "∞"}</strong></span>
            <span>Expires <strong>{formatExpiry(coupon.expiresAt)}</strong></span>
          </div>
          {coupon.type === "percentage" && coupon.maxDiscount !== null && coupon.maxDiscount !== undefined && (
            <small className="admin-coupon-cap">Maximum discount: ₹{Number(coupon.maxDiscount).toFixed(2)}</small>
          )}
          <div className="admin-coupon-actions"><button type="button" onClick={() => openEdit(coupon)}>Edit</button><button type="button" className="danger" onClick={() => remove(coupon)}>Delete</button></div>
        </article>)}
      </div>}

      {!loading && !coupons.length && <div className="admin-coupons-empty">No coupons match your filters.</div>}

      {!loading && pagination.totalPages > 1 && <div className="admin-coupons-pagination">
        <span>Page {pagination.page} of {pagination.totalPages}</span>
        <div><button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1}>← Previous</button><button type="button" onClick={() => setPage((current) => Math.min(pagination.totalPages, current + 1))} disabled={page >= pagination.totalPages}>Next →</button></div>
      </div>}
    </div>

    <div className="admin-coupons-note"><strong>How discounts work</strong><span>Percentage discounts are calculated from the item subtotal. Fixed discounts cannot reduce the subtotal below zero. Minimum order value is checked before applying an offer.</span></div>

    {modalOpen && <div className="admin-coupon-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <form className="admin-coupon-modal" onSubmit={submit}>
        <div className="admin-coupon-modal-head"><div><span>{editing ? "Update promotion" : "New promotion"}</span><h3>{editing ? "Edit Coupon" : "Create Coupon"}</h3></div><button type="button" onClick={close}>×</button></div>
        <div className="admin-coupon-form">
          <label>Coupon code<input required maxLength="20" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="SUMMER20" /></label>
          <label>Discount type<select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option value="percentage">Percentage (%)</option><option value="fixed">Fixed amount ($)</option></select></label>
          <label>Discount value<input required type="number" min="0.01" step="0.01" max={form.type === "percentage" ? "100" : undefined} value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} /></label>
          <label>Minimum order<input required type="number" min="0" step="0.01" value={form.minimum} onChange={(e) => setForm({ ...form, minimum: e.target.value })} /></label>
          <label>Maximum discount <span className="admin-coupon-field-note">0 or blank = no cap</span><input type="number" min="0" step="0.01" value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })} placeholder="e.g. 200" /></label>
          <label>Expiry date & time <span className="admin-coupon-field-note">Blank = no expiry</span><input type="datetime-local" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} /></label>
          <label>Maximum total uses <span className="admin-coupon-field-note">0 = unlimited</span><input type="number" min="0" step="1" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} /></label>
          <label>Uses per customer <span className="admin-coupon-field-note">0 = unlimited</span><input type="number" min="0" step="1" value={form.perCustomerLimit} onChange={(e) => setForm({ ...form, perCustomerLimit: e.target.value })} /></label>
          <label className="admin-coupon-check"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Active for customers</label>
        </div>
        <div className="admin-coupon-modal-actions"><button type="button" onClick={close}>Cancel</button><button className="primary" type="submit" disabled={saving}>{saving ? "Saving..." : editing ? "Save Changes" : "Create Coupon"}</button></div>
      </form>
    </div>}
  </section>;
}
