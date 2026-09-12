import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config/api";
import "../Styles/AdminCustomers.css";

const PAGE_SIZE = 10;

const formatDate = (value) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatCurrency = (value) => {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "₹0.00";
  }

  return amount.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  });
};

const getErrorMessage = (response, status) => {
  if (status === 401) {
    return "You are not authenticated. Please log in again.";
  }

  if (status === 403) {
    return "You do not have permission to access customer management.";
  }

  if (status === 404) {
    return "Customer management service was not found.";
  }

  if (status >= 500) {
    return "The server is currently unavailable. Please try again later.";
  }

  return response?.message || "Unable to load customers. Please try again.";
};

const getCustomerKey = (customer) => {
  return customer?.id || customer?._id || "";
};

const AdminCustomers = () => {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const fetchCustomers = useCallback(async (pageNumber, append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/admin/customers?page=${pageNumber}&limit=${PAGE_SIZE}`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        }
      );

      let data = null;

      try {
        data = await response.json();
      } catch (jsonError) {
        data = null;
      }

      if (!response.ok) {
        const message = getErrorMessage(data, response.status);

        if (response.status === 401) {
          setError(message);
        } else if (response.status === 403) {
          setError(message);
        } else {
          setError(message);
        }

        return;
      }

      const incomingCustomers = Array.isArray(data?.customers)
        ? data.customers
        : [];

      const incomingPagination = data?.pagination || null;

      setCustomers((previousCustomers) => {
        if (!append) {
          return incomingCustomers;
        }

        const existingKeys = new Set(
          previousCustomers.map(getCustomerKey).filter(Boolean)
        );

        const uniqueCustomers = incomingCustomers.filter((customer) => {
          const key = getCustomerKey(customer);

          if (!key || existingKeys.has(key)) {
            return false;
          }

          existingKeys.add(key);
          return true;
        });

        return [...previousCustomers, ...uniqueCustomers];
      });

      setPagination(incomingPagination);
      setPage(pageNumber);
    } catch (fetchError) {
      console.error("Admin customers fetch error:", fetchError);
      setError(
        "Unable to connect to the server. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers(1, false);
  }, [fetchCustomers]);

  const handleLoadMore = () => {
    if (loadingMore || !pagination) {
      return;
    }

    const currentPage = Number(pagination.page || page);
    const totalPages = Number(pagination.totalPages || 0);

    if (totalPages > 0 && currentPage >= totalPages) {
      return;
    }

    fetchCustomers(currentPage + 1, true);
  };

  const handleRetry = () => {
    setCustomers([]);
    setPagination(null);
    setPage(1);
    fetchCustomers(1, false);
  };

  const handleViewDetails = (customerId) => {
    if (!customerId) {
      return;
    }

    navigate(`/admin/customers/${customerId}`);
  };

  const hasMorePages = (() => {
    if (!pagination) {
      return false;
    }

    if (typeof pagination.hasNextPage === "boolean") {
      return pagination.hasNextPage;
    }

    if (pagination.hasMore !== undefined) {
      return Boolean(pagination.hasMore);
    }

    const currentPage = Number(pagination.page || page);
    const totalPages = Number(pagination.totalPages || 0);

    return totalPages > 0 && currentPage < totalPages;
  })();

  if (loading) {
    return (
      <main className="admin-customers-page">
        <div className="admin-customers-header">
          <div>
            <p className="admin-customers-eyebrow">Administration</p>
            <h1>Customers</h1>
            <p>Manage registered customer accounts and activity.</p>
          </div>
        </div>

        <section className="admin-customers-state admin-customers-loading">
          <div className="admin-customers-spinner" />
          <h2>Loading customers...</h2>
          <p>Please wait while customer information is loaded.</p>
        </section>
      </main>
    );
  }

  if (error && customers.length === 0) {
    return (
      <main className="admin-customers-page">
        <div className="admin-customers-header">
          <div>
            <p className="admin-customers-eyebrow">Administration</p>
            <h1>Customers</h1>
            <p>Manage registered customer accounts and activity.</p>
          </div>
        </div>

        <section className="admin-customers-state admin-customers-error">
          <div className="admin-customers-state-icon">!</div>
          <h2>Unable to load customers</h2>
          <p>{error}</p>
          <button
            type="button"
            className="admin-customers-retry-button"
            onClick={handleRetry}
          >
            Try Again
          </button>
        </section>
      </main>
    );
  }

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
            {pagination.totalItems !== undefined
              ? `${pagination.totalItems} customer${
                  Number(pagination.totalItems) === 1 ? "" : "s"
                }`
              : `${customers.length} customer${
                  customers.length === 1 ? "" : "s"
                }`}
          </div>
        )}
      </div>

      {error && customers.length > 0 && (
        <div className="admin-customers-inline-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={handleRetry}>
            Retry
          </button>
        </div>
      )}

      {customers.length === 0 ? (
        <section className="admin-customers-state admin-customers-empty">
          <div className="admin-customers-state-icon">👥</div>
          <h2>No customers found</h2>
          <p>
            There are currently no registered customer accounts to display.
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
                          <span
                            className={`admin-customer-verification ${
                              isVerified
                                ? "is-verified"
                                : "is-not-verified"
                            }`}
                          >
                            {isVerified ? "Verified" : "Not Verified"}
                          </span>
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

          {hasMorePages && (
            <div className="admin-customers-load-more">
              <button
                type="button"
                className="admin-customers-load-more-button"
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
};

export default AdminCustomers;