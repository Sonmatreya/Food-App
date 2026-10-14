import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { API_URL } from "../config/api";
import "../Styles/Login.css";

export default function ForgotPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState(location.state?.email || "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault(); setMessage(""); setError(""); setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not request a password reset.");
      setMessage(data.message || "If your account exists, a reset link will be emailed to you.");
    } catch (err) { setError(err.message || "Something went wrong. Please try again."); }
    finally { setLoading(false); }
  };

  return <div className="login-page"><div className="login-container">
    <div className="login-header"><div className="login-logo">🔐</div><h1>Forgot Password?</h1><p>Enter the email address linked to your account and we'll send a reset link.</p></div>
    {error && <div className="auth-status error" role="alert">{error}</div>}
    {message && <div className="auth-status success" role="status">{message}</div>}
    <form className="login-form" onSubmit={submit}>
      <div className="login-field"><label htmlFor="reset-email">Registered email</label><input id="reset-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email address" autoComplete="email" required /></div>
      <button className="login-button" type="submit" disabled={loading}>{loading ? "Sending link..." : "Send Reset Link"}</button>
    </form>
    <Link className="auth-back-link" to="/login">← Back to Login</Link>
  </div></div>;
}
