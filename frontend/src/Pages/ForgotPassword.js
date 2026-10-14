import React, { useState } from "react";
import { Link } from "react-router-dom";
import { API_URL } from "../config/api";
import "../Styles/Login.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/demo-reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), newPassword: password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not reset the password.");
      setMessage(data.message || "Password updated successfully.");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return <div className="login-page"><div className="login-container">
    <div className="login-header"><div className="login-logo">🔐</div><h1>Forgot Password?</h1><p>For local project demonstration only, enter your account email and choose a new password.</p></div>
    <div className="auth-status error" role="note">Demo recovery only. This direct-reset option is disabled on production servers.</div>
    {error && <div className="auth-status error" role="alert">{error}</div>}
    {message && <div className="auth-status success" role="status">{message}</div>}
    <form className="login-form" onSubmit={submit}>
      <div className="login-field"><label htmlFor="reset-email">Email ID</label><input id="reset-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your account email" autoComplete="email" required /></div>
      <div className="login-field"><label htmlFor="new-password">New Password</label><input id="new-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} autoComplete="new-password" placeholder="At least 8 characters" required /></div>
      <div className="login-field"><label htmlFor="confirm-password">Re-enter New Password</label><input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} minLength={8} autoComplete="new-password" placeholder="Enter the same password again" required /></div>
      <button className="login-button" type="submit" disabled={loading}>{loading ? "Updating password..." : "Set New Password"}</button>
    </form>
    <Link className="auth-back-link" to="/login">← Back to Login</Link>
  </div></div>;
}
