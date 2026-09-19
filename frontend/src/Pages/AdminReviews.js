import React, { useCallback, useEffect, useState } from "react";
import { FiMessageSquare, FiRefreshCw, FiSearch, FiStar } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import "../Styles/AdminReviews.css";

const PAGE_SIZE = 9;

const Stars = ({ value }) => (
  <span className="admin-review-stars" aria-label={`${value} out of 5 stars`}>
    {[1,2,3,4,5].map((star) => <FiStar key={star} className={star <= value ? "filled" : ""} />)}
  </span>
);

export default function AdminReviews() {
  const { API_URL } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [rating, setRating] = useState("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [summary, setSummary] = useState({ total: 0, average: 0, five: 0, low: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReviews = useCallback(async (requestedPage = page) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(requestedPage), limit: String(PAGE_SIZE) });
      if (appliedSearch) params.set("search", appliedSearch);
      if (rating !== "all") params.set("rating", rating);
      const response = await fetch(`${API_URL}/api/reviews/admin?${params.toString()}`, { credentials: "include" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) throw new Error(data.message || "Unable to load customer feedback.");
      setReviews(Array.isArray(data.reviews) ? data.reviews : []);
      setPagination(data.pagination || { page: requestedPage, total: 0, totalPages: 1 });
      setSummary(data.summary || { total: 0, average: 0, five: 0, low: 0 });
    } catch (err) {
      setError(err.message || "Unable to load customer feedback.");
    } finally {
      setLoading(false);
    }
  }, [API_URL, appliedSearch, rating, page]);

  useEffect(() => { loadReviews(page); }, [loadReviews, page]);

  const submitSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setAppliedSearch(search.trim());
  };

  const reset = () => {
    setSearch("");
    setAppliedSearch("");
    setRating("all");
    setPage(1);
  };

  return (
    <section className="admin-reviews-page">
      <header className="admin-reviews-header">
        <div>
          <span>Customer voice</span>
          <h2>Customer Feedback</h2>
          <p>Read what customers say about their food and ordering experience.</p>
        </div>
        <button className="admin-reviews-refresh" type="button" onClick={() => loadReviews(page)} disabled={loading}>
          <FiRefreshCw /> Refresh
        </button>
      </header>

      {error && <div className="admin-reviews-error"><strong>Unable to load</strong><span>{error}</span><button type="button" onClick={() => loadReviews(page)}>Retry</button></div>}

      <div className="admin-reviews-summary">
        <article><span>Total reviews</span><strong>{summary.total}</strong><small>Customer responses</small></article>
        <article className="rating"><span>Average rating</span><strong>{summary.average.toFixed(1)} <FiStar /></strong><small>Out of 5</small></article>
        <article className="positive"><span>5-star reviews</span><strong>{summary.five}</strong><small>Highest rating</small></article>
        <article className="attention"><span>1–2 star reviews</span><strong>{summary.low}</strong><small>Needs attention</small></article>
      </div>

      <form className="admin-reviews-toolbar" onSubmit={submitSearch}>
        <div className="admin-reviews-search"><FiSearch /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customer, food or feedback..." /></div>
        <select value={rating} onChange={(e) => { setRating(e.target.value); setPage(1); }}>
          <option value="all">All ratings</option><option value="5">5 stars</option><option value="4">4 stars</option><option value="3">3 stars</option><option value="2">2 stars</option><option value="1">1 star</option>
        </select>
        <button className="search-btn" type="submit">Search</button>
        <button className="reset-btn" type="button" onClick={reset}>Reset</button>
      </form>

      <div className="admin-reviews-panel">
        <div className="admin-reviews-panel-head">
          <div><span>Latest feedback</span><h3>{loading ? "Loading..." : `${pagination.total} review${pagination.total !== 1 ? "s" : ""}`}</h3></div>
          <FiMessageSquare />
        </div>

        {loading ? <div className="admin-reviews-empty">Loading customer feedback...</div> :
          reviews.length ? <div className="admin-reviews-list">{reviews.map((review) => (
            <article className="admin-review-card" key={String(review._id)}>
              <div className="admin-review-avatar">{(review.customer || "C").trim().charAt(0).toUpperCase()}</div>
              <div className="admin-review-main">
                <div className="admin-review-top">
                  <div><strong>{review.customer}</strong><span>{review.food}</span></div>
                  <time>{new Date(review.createdAt).toLocaleDateString()}</time>
                </div>
                <div className="admin-review-rating"><Stars value={review.rating} /><b>{review.rating}.0</b></div>
                <p>{review.comment || "Customer left a rating without written feedback."}</p>
              </div>
            </article>
          ))}</div> :
          <div className="admin-reviews-empty">No customer feedback matches your filters.</div>
        }

        {!loading && pagination.totalPages > 1 && <div className="admin-reviews-pagination">
          <span>Page {pagination.page} of {pagination.totalPages}</span>
          <div><button type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>← Previous</button><button type="button" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}>Next →</button></div>
        </div>}
      </div>
    </section>
  );
}
