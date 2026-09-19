import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import "../Styles/AdminCoupons.css";

const PAGE_SIZE = 9;
const emptyForm = { code: "", type: "percentage", value: "", minimum: "0", active: true };

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
    setForm({ code: coupon.code, type: coupon.type, value: coupon.value, minimum: coupon.minimum, active: coupon.active });
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

    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(editing ? `${API_URL}/api/coupons/${editing.id}` : `${API_URL}/api/coupons`, {
        method: editing ? "PUT" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, type: form.type, value: Number(value.toFixed(2)), minimum: Number(minimum.toFixed(2)), active: form.active }),
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
        body: JSON.stringify({ code: coupon.code, type: coupon.type, value: coupon.value, minimum: coupon.minimum, active: !coupon.active }),
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
      <div className="green"><strong>{summary.active}</strong><small>Active</small></div>
      <div className="red"><strong>{summary.inactive}</strong><small>Inactive</small></div>
    </div>

    <form className="admin-coupons-toolbar" onSubmit={applySearch}>
      <input value={search} onChange={(e) => setSearch(e.target.value.toUpperCase())} placeholder="Search coupon code..." />
      <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
        <option value="all">All</option><option value="active">Active</option><option value="inactive">Inactive</option>
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
            <button type="button" className={`admin-coupon-status ${coupon.active ? "active" : "inactive"}`} onClick={() => toggle(coupon)}>{coupon.active ? "Active" : "Inactive"}</button>
          </div>
          <div className="admin-coupon-value">{coupon.type === "percentage" ? `${coupon.value}% OFF` : `$${Number(coupon.value).toFixed(2)} OFF`}</div>
          <p>Minimum order <strong>$${Number(coupon.minimum).toFixed(2)}</strong></p>
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
          <label className="admin-coupon-check"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Active for customers</label>
        </div>
        <div className="admin-coupon-modal-actions"><button type="button" onClick={close}>Cancel</button><button className="primary" type="submit" disabled={saving}>{saving ? "Saving..." : editing ? "Save Changes" : "Create Coupon"}</button></div>
      </form>
    </div>}
  </section>;
}
