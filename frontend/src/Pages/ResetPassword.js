import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { API_URL } from "../config/api";
import "../Styles/Login.css";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault(); setMessage(""); setError("");
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not reset your password.");
      setMessage(data.message || "Password reset successful.");
      setPassword(""); setConfirmPassword("");
      window.setTimeout(() => navigate("/login", { replace: true }), 1800);
    } catch (err) { setError(err.message || "Something went wrong. Please try again."); }
    finally { setLoading(false); }
  };

  return <div className="login-page"><div className="login-container">
    <div className="login-header"><div className="login-logo">🔑</div><h1>Set New Password</h1><p>Choose a new password for your Food-App account.</p></div>
    {!token && <div className="auth-status error" role="alert">This reset link is missing or invalid. Request a new link.</div>}
    {error && <div className="auth-status error" role="alert">{error}</div>}
    {message && <div className="auth-status success" role="status">{message}</div>}
    <form className="login-form" onSubmit={submit}>
      <div className="login-field"><label htmlFor="new-password">New password</label><input id="new-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} autoComplete="new-password" placeholder="At least 8 characters" required /></div>
      <div className="login-field"><label htmlFor="confirm-password">Confirm new password</label><input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} minLength={8} autoComplete="new-password" placeholder="Re-enter your new password" required /></div>
      <button className="login-button" type="submit" disabled={loading || !token}>{loading ? "Updating password..." : "Reset Password"}</button>
    </form>
    <Link className="auth-back-link" to="/login">← Back to Login</Link>
  </div></div>;
}
