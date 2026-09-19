import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config/api";
import "../Styles/AdminCustomers.css";

const PAGE_SIZE = 10;

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatCurrency = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "₹0.00";
  return amount.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  });
};

const getErrorMessage = (response, status) => {
  if (status === 401) return "You are not authenticated. Please log in again.";
  if (status === 403) return "You do not have permission to access customer management.";
  if (status === 404) return "Customer management service was not found.";
  if (status >= 500) return "The server is currently unavailable. Please try again later.";
  return response?.message || "Unable to load customers. Please try again.";
};

const getCustomerKey = (customer) => customer?.id || customer?._id || "";

const AdminCustomers = () => {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [summary, setSummary] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [verification, setVerification] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [verificationUpdating, setVerificationUpdating] = useState("");

  const fetchCustomers = useCallback(
    async (pageNumber, activeSearch = search, activeVerification = verification) => {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({
          page: String(pageNumber),
          limit: String(PAGE_SIZE),
        });

        if (activeSearch.trim()) params.set("search", activeSearch.trim());
        if (activeVerification) params.set("verification", activeVerification);

        const response = await fetch(
          `${API_URL}/api/admin/customers?${params.toString()}`,
          {
            method: "GET",
            credentials: "include",
            headers: { Accept: "application/json" },
          }
        );

        let data = null;
        try {
          data = await response.json();
        } catch {
          data = null;
        }

        if (!response.ok) {
          setError(getErrorMessage(data, response.status));
          return;
        }

        setCustomers(Array.isArray(data?.customers) ? data.customers : []);
        setPagination(data?.pagination || null);
        setSummary(data?.summary || null);
        setPage(pageNumber);
      } catch (fetchError) {
        console.error("Admin customers fetch error:", fetchError);
        setError(
          "Unable to connect to the server. Please check your connection and try again."
        );
      } finally {
        setLoading(false);
      }
    },
    [search, verification]
  );

  useEffect(() => {
    fetchCustomers(1, "", "");
  }, []);

  const handleSearch = (event) => {
    event.preventDefault();
    const nextSearch = searchInput.trim();
    setSearch(nextSearch);
    fetchCustomers(1, nextSearch, verification);
  };

  const handleVerificationChange = (event) => {
    const nextVerification = event.target.value;
    setVerification(nextVerification);
    fetchCustomers(1, search, nextVerification);
  };

  const handleReset = () => {
    setSearchInput("");
    setSearch("");
    setVerification("");
    fetchCustomers(1, "", "");
  };

  const handleRetry = () => {
    fetchCustomers(page, search, verification);
  };

  const totalPages = Number(pagination?.totalPages || 0);
  const hasPrevious = page > 1;
  const hasNext =
    typeof pagination?.hasMore === "boolean"
      ? pagination.hasMore
      : totalPages > 0 && page < totalPages;

  const handleToggleVerification = async (customer) => {
    const customerId = getCustomerKey(customer);
    if (!customerId || verificationUpdating) return;
    const nextValue = !Boolean(customer?.isVerified);
    setVerificationUpdating(customerId);
    setError("");
    try {
      const verificationUrl = API_URL + "/api/admin/customers/" + encodeURIComponent(customerId) + "/verification";
      const response = await fetch(verificationUrl, {
        method: "PATCH", credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ isVerified: nextValue }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) { setError(data?.message || "Unable to update customer verification."); return; }
      await fetchCustomers(page, search, verification);
    } catch (verificationError) {
      console.error("Customer verification update error:", verificationError);
      setError("Unable to update customer verification. Please try again.");
    } finally { setVerificationUpdating(""); }
  };
  const handleViewDetails = (customerId) => {
    if (customerId) navigate(`/admin/customers/${customerId}`);
  };

  return (
    <main className="admin-customers-page">
      <div className="admin-customers-header">
        <div>
          <p className="admin-customers-eyebrow">Administration</p>
          <h1>Customers</h1>
          <p>Manage registered customer accounts and activity.</p>
        </div>

        {pagination && (
          <div className="admin-customers-count">
            {pagination.total ?? customers.length} customer
            {Number(pagination.total) === 1 ? "" : "s"}
          </div>
        )}
      </div>

      {summary && <section className="admin-customer-summary">
        <article><span>Total Customers</span><strong>{summary.total || 0}</strong><small>Matching current filters</small></article>
        <article><span>Verified</span><strong>{summary.verified || 0}</strong><small>Verified accounts</small></article>
        <article><span>Not Verified</span><strong>{summary.unverified || 0}</strong><small>Accounts awaiting verification</small></article>
        <article><span>Customer Revenue</span><strong>{formatCurrency(summary.totalSpent)}</strong><small>Excluding cancelled orders</small></article>
      </section>

      <form className="admin-customers-toolbar" onSubmit={handleSearch}>
        <div className="admin-customers-search">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search name, email or phone..."
            aria-label="Search customers"
          />
        </div>

        <select
          value={verification}
          onChange={handleVerificationChange}
          aria-label="Filter customers by verification"
        >
          <option value="">All customers</option>
          <option value="verified">Verified</option>
          <option value="unverified">Not Verified</option>
        </select>

        <button type="submit" className="admin-customers-search-button">
          Search
        </button>

        {(search || verification) && (
          <button
            type="button"
            className="admin-customers-reset-button"
            onClick={handleReset}
          >
            Reset
          </button>
        )}
      </form>

      {error && (
        <div className="admin-customers-inline-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={handleRetry}>
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <section className="admin-customers-state admin-customers-loading">
          <div className="admin-customers-spinner" />
          <h2>Loading customers...</h2>
          <p>Please wait while customer information is loaded.</p>
        </section>
      ) : customers.length === 0 ? (
        <section className="admin-customers-state admin-customers-empty">
          <div className="admin-customers-state-icon">👥</div>
          <h2>No customers found</h2>
          <p>
            {search || verification
              ? "No customers match the current search or filter."
              : "There are currently no registered customer accounts to display."}
          </p>
        </section>
      ) : (
        <>
          <section className="admin-customers-table-wrapper">
            <div className="admin-customers-table-scroll">
              <table className="admin-customers-table">
                <thead>
                  <tr>
                    <th scope="col">Customer</th>
                    <th scope="col">Phone</th>
                    <th scope="col">Verification</th>
                    <th scope="col">Registered</th>
                    <th scope="col">Orders</th>
                    <th scope="col">Total Spent</th>
                    <th scope="col">Last Order</th>
                    <th scope="col">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {customers.map((customer) => {
                    const customerId = getCustomerKey(customer);
                    const isVerified = Boolean(customer?.isVerified);

                    return (
                      <tr key={customerId || `${customer?.email}-${customer?.createdAt}`}>
                        <td>
                          <div className="admin-customer-primary">
                            <strong>{customer?.name || "Unnamed Customer"}</strong>
                            <span>{customer?.email || "No email available"}</span>
                          </div>
                        </td>
                        <td>
                          <span className="admin-customer-phone">
                            {customer?.phone || "—"}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className={"admin-customer-verification admin-customer-verification-button " + (isVerified ? "is-verified" : "is-not-verified")}
                            onClick={() => handleToggleVerification(customer)}
                            disabled={verificationUpdating === customerId}
                            title={isVerified ? "Mark customer as not verified" : "Verify this customer"}
                          >
                            {verificationUpdating === customerId ? "Updating..." : isVerified ? "Verified" : "Not Verified"}
                          </button>
                        </td>
                        <td>{formatDate(customer?.createdAt)}</td>
                        <td>
                          <span className="admin-customer-number">
                            {Number.isFinite(Number(customer?.totalOrders))
                              ? Number(customer.totalOrders)
                              : 0}
                          </span>
                        </td>
                        <td>
                          <strong className="admin-customer-spent">
                            {formatCurrency(customer?.totalSpent)}
                          </strong>
                        </td>
                        <td>{formatDate(customer?.lastOrderDate)}</td>
                        <td>
                          <button
                            type="button"
                            className="admin-customer-details-button"
                            onClick={() => handleViewDetails(customerId)}
                            disabled={!customerId}
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {totalPages > 1 && (
            <div className="admin-customers-pagination">
              <button
                type="button"
                onClick={() => fetchCustomers(page - 1)}
                disabled={!hasPrevious || loading}
              >
                ← Previous
              </button>
              <span>
                Page <strong>{page}</strong> of <strong>{totalPages}</strong>
              </span>
              <button
                type="button"
                onClick={() => fetchCustomers(page + 1)}
                disabled={!hasNext || loading}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
};

export default AdminCustomers;