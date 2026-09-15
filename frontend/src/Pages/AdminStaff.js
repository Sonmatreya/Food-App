import React, { useEffect, useMemo, useState } from "react";
import { API_URL } from "../config/api";
import { useAuth } from "../context/AuthContext";
import "../Styles/AdminStaff.css";

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

const AdminStaff = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [summary, setSummary] = useState({ total: 0, admins: 0, customers: 0 });
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadStaff = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/api/admin/staff`, {
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load staff accounts");
      }
      setUsers(Array.isArray(data.staff) ? data.staff : []);
      setSummary(data.summary || { total: 0, admins: 0, customers: 0 });
    } catch (loadError) {
      setError(loadError.message || "Unable to load staff accounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter((user) => {
      const matchesSearch = !query || `${user.name} ${user.email} ${user.phone}`.toLowerCase().includes(query);
      const matchesRole = roleFilter === "All" || user.role === roleFilter.toLowerCase();
      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  const changeRole = async (user) => {
    if (!user?.id || user.id === currentUser?.id) return;

    const isAdmin = user.role === "admin";
    const actionText = isAdmin ? "make this admin account a customer" : "make this customer an admin";
    const confirmed = window.confirm(`Are you sure you want to ${actionText}?\n\n${user.name || user.email}`);
    if (!confirmed) return;

    setWorkingId(user.id);
    setError("");
    setSuccess("");

    try {
      const endpoint = isAdmin ? "demote" : "promote";
      const response = await fetch(`${API_URL}/api/admin/staff/${user.id}/${endpoint}`, {
        method: "PATCH",
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to change user role");
      }
      setSuccess(data.message || "User role updated successfully");
      await loadStaff();
    } catch (roleError) {
      setError(roleError.message || "Unable to change user role");
    } finally {
      setWorkingId("");
    }
  };

  if (loading) {
    return (
      <section className="admin-staff-page">
        <div className="admin-staff-header"><div><span>Access management</span><h2>Staff & Admins</h2><p>Manage who has access to restaurant administration.</p></div></div>
        <div className="admin-staff-state"><div className="admin-staff-spinner" /><h3>Loading accounts...</h3><p>Please wait while staff information is loaded.</p></div>
      </section>
    );
  }

  return (
    <section className="admin-staff-page">
      <div className="admin-staff-header">
        <div><span>Access management</span><h2>Staff & Admins</h2><p>Manage who has access to restaurant administration.</p></div>
        <button type="button" className="admin-staff-refresh" onClick={loadStaff}>↻ Refresh</button>
      </div>

      {error && <div className="admin-staff-alert error">{error}<button type="button" onClick={() => setError("")}>×</button></div>}
      {success && <div className="admin-staff-alert success">{success}<button type="button" onClick={() => setSuccess("")}>×</button></div>}

      <div className="admin-staff-summary">
        <article><strong>{summary.total}</strong><span>Total accounts</span></article>
        <article className="green"><strong>{summary.admins}</strong><span>Admins</span></article>
        <article className="red"><strong>{summary.customers}</strong><span>Customers</span></article>
      </div>

      <div className="admin-staff-security-note">
        <span>✓</span><div><strong>Secure role management</strong><p>New registrations remain customers. Admins can promote trusted accounts or return another admin account to customer access. You cannot change your own role.</p></div>
      </div>

      <div className="admin-staff-toolbar">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name, email or phone..." />
        <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}><option>All</option><option>Admin</option><option>Customer</option></select>
      </div>

      <div className="admin-staff-card">
        <div className="admin-staff-card-head"><div><span>Account directory</span><h3>{filteredUsers.length} account{filteredUsers.length !== 1 ? "s" : ""}</h3></div><small>Manage trusted account access.</small></div>
        <div className="admin-staff-table-wrap">
          <table className="admin-staff-table">
            <thead><tr><th>Account</th><th>Contact</th><th>Role</th><th>Registered</th><th>Action</th></tr></thead>
            <tbody>
              {filteredUsers.map((account) => {
                const isCurrentUser = account.id === currentUser?.id;
                const isAdmin = account.role === "admin";
                return (
                  <tr key={account.id}>
                    <td><div className="admin-staff-user"><div className="admin-staff-avatar">{(account.name || account.email || "U").charAt(0).toUpperCase()}</div><div><strong>{account.name || "Unnamed User"}</strong><small>{account.email || "No email"}</small></div></div></td>
                    <td>{account.phone || "—"}</td>
                    <td><span className={`admin-staff-role ${isAdmin ? "admin" : "customer"}`}>{isAdmin ? "Admin" : "Customer"}</span></td>
                    <td>{formatDate(account.createdAt)}</td>
                    <td>
                      {isCurrentUser ? (
                        <span className="admin-staff-current">Your Account</span>
                      ) : (
                        <button type="button" className={isAdmin ? "admin-staff-demote" : "admin-staff-promote"} onClick={() => changeRole(account)} disabled={workingId === account.id}>
                          {workingId === account.id ? "Updating..." : isAdmin ? "Make Customer" : "Make Admin"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!filteredUsers.length && <div className="admin-staff-empty"><strong>No matching accounts</strong><p>Try a different search or role filter.</p></div>}
        </div>
      </div>
    </section>
  );
};

export default AdminStaff;
