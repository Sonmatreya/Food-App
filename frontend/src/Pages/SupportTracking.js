import React, { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { API_URL } from "../config/api";
import "../Styles/SupportTracking.css";

const labels = { order: "Order status or delivery", payment: "Payment or refund", food: "Food or item issue", feedback: "Feedback", general: "General question" };
const statusLabels = { new: "Received", "in-progress": "In progress", resolved: "Resolved" };

export default function SupportTracking() {
  const location = useLocation();
  const [requestId, setRequestId] = useState("");
  const [trackingToken, setTrackingToken] = useState("");
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchRequest = useCallback(async (id, key, options = {}) => {
    if (!id || !key) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/api/support/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ requestId: id.trim(), trackingToken: key.trim() }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) throw new Error(data.message || "Unable to find this support request.");
      setRequest(data.request);
    } catch (err) {
      // Keep the last verified request visible during background refresh failures.
      // A manual lookup with invalid details still clears stale request data.
      if (!options.preserveOnError) setRequest(null);
      setError(err.message || "Unable to check this request. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const checkRequest = async (event) => {
    event.preventDefault();
    if (loading) return;
    await fetchRequest(requestId, trackingToken);
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const idFromLink = params.get("requestId") || "";
    const keyFromLink = new URLSearchParams(location.hash.replace(/^#/, "")).get("key") || "";
    if (idFromLink && keyFromLink) {
      setRequestId(idFromLink);
      setTrackingToken(keyFromLink);
      fetchRequest(idFromLink, keyFromLink);
    }
  }, [location.search, location.hash, fetchRequest]);

  // Refresh the customer's view periodically so newly saved admin replies appear
  // without requiring the customer to manually reload the tracking page.
  useEffect(() => {
    if (!request || !requestId || !trackingToken) return undefined;
    const timer = window.setInterval(() => {
      fetchRequest(requestId, trackingToken);
    }, 15000);
    return () => window.clearInterval(timer);
  }, [Boolean(request), requestId, trackingToken, fetchRequest]);

  return (
    <main className="support-tracking-page">
      <header className="support-tracking-hero">
        <span className="support-tracking-eyebrow">FOODAPP CUSTOMER CARE</span>
        <h1>Track your support request</h1>
        <p>View your request status and replies from our support team. Open the secure link shown after submitting your request, or enter your saved details below.</p>
      </header>
      <div className="support-tracking-grid">
        <form className="support-tracking-form" onSubmit={checkRequest}>
          <h2>Find your request</h2>
          <label htmlFor="support-reference">Reference number</label>
          <input id="support-reference" value={requestId} onChange={(e) => setRequestId(e.target.value)} placeholder="Paste your request reference" autoComplete="off" required />
          <label htmlFor="support-tracking-key">Private tracking key</label>
          <input id="support-tracking-key" type="password" value={trackingToken} onChange={(e) => setTrackingToken(e.target.value)} placeholder="Paste your 64-character tracking key" autoComplete="off" minLength={64} maxLength={64} required />
          <p className="support-tracking-hint">Your tracking key is private. Keep your secure tracking link to return here after refreshing or closing the page.</p>
          {error && <p className="support-tracking-error" role="alert">{error}</p>}
          <button type="submit" disabled={loading}>{loading ? "Checking request…" : "Check status"}</button>
          <Link to="/contact">Need to send a new request?</Link>
        </form>
        <section className="support-tracking-result" aria-live="polite">
          {!request ? <div className="support-tracking-empty"><span>✓</span><h2>Your support updates</h2><p>Your complaint status, submission details and the latest reply will appear here once we verify your secure tracking details.</p></div> : <>
            <div className="support-tracking-result-head"><div><span className="support-tracking-eyebrow">REQUEST STATUS</span><h2>Hello, {request.firstName}</h2></div><span className={`support-tracking-status ${request.status}`}>{statusLabels[request.status] || request.status}</span></div>
            <p className="support-tracking-reference">Reference: {request.requestId}</p>
            <div className="support-tracking-meta"><span>Topic</span><strong>{labels[request.subject] || request.subject}</strong><span>Submitted</span><strong>{new Date(request.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</strong></div>
            <article className="support-tracking-message"><h3>Your message</h3><p>{request.message}</p></article>
            <article className={`support-tracking-reply ${request.adminReply ? "has-reply" : ""}`}><h3>Reply from FoodApp support</h3>{request.adminReply ? <p>{request.adminReply}</p> : <p>We haven't posted a reply yet. Please check again later using the same reference number and tracking key.</p>}</article>
            {request.resolvedAt && <p className="support-tracking-resolved">Resolved on {new Date(request.resolvedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</p>}
          </>}
        </section>
      </div>
    </main>
  );
}
