import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { API_URL } from "../config/api";
import "../Styles/Login.css";

// Demo password reset is shown only in a local Vite development build when
// VITE_ENABLE_DEMO_PASSWORD_RESET=true. Production keeps email-link recovery.
const demoMode = process.env.NODE_ENV === "development" && process.env.REACT_APP_ENABLE_DEMO_PASSWORD_RESET === "true";

export default function ForgotPassword() {
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    if (demoMode && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (demoMode && password.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/${demoMode ? "demo-reset-password" : "forgot-password"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(demoMode
          ? { email: email.trim().toLowerCase(), newPassword: password }
          : { email: email.trim().toLowerCase() })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not process the password request.");
      setMessage(data.message || (demoMode ? "Password updated successfully." : "If your account exists, a reset link will be emailed to you."));
      if (demoMode) {
        setPassword("");
        setConfirmPassword("");
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return <div className="login-page"><div className="login-container">
    <div className="login-header"><div className="login-logo">🔐</div><h1>Forgot Password?</h1><p>{demoMode ? "Local project demo: enter your account email and choose a new password." : "Enter your account email and we'll send you a secure reset link."}</p></div>
    {demoMode && <div className="auth-status error" role="note">Local demo mode only. This direct-reset option is disabled on production servers.</div>}
    {error && <div className="auth-status error" role="alert">{error}</div>}
    {message && <div className="auth-status success" role="status">{message}</div>}
    <form className="login-form" onSubmit={submit}>
      <div className="login-field"><label htmlFor="reset-email">Email ID</label><input id="reset-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your account email" autoComplete="email" required /></div>
      {demoMode && <>
        <div className="login-field"><label htmlFor="new-password">New Password</label><input id="new-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} autoComplete="new-password" placeholder="At least 8 characters" required /></div>
        <div className="login-field"><label htmlFor="confirm-password">Re-enter New Password</label><input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} minLength={8} autoComplete="new-password" placeholder="Enter the same password again" required /></div>
      </>}
      <button className="login-button" type="submit" disabled={loading}>{loading ? (demoMode ? "Updating password..." : "Sending link...") : (demoMode ? "Set New Password" : "Send Reset Link")}</button>
    </form>
    <Link className="auth-back-link" to="/login">← Back to Login</Link>
  </div></div>;
}
