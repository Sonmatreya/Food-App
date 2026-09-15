import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config/api";
import "../Styles/Register.css";
import "../Styles/PasswordToggle.css";

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleRegister = async (e) => {
    e.preventDefault(); setError(""); setSuccess("");
    if (formData.password.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (formData.password !== formData.confirmPassword) { setError("Passwords do not match"); return; }
    if (formData.phone && !/^[0-9]{10}$/.test(formData.phone)) { setError("Enter a valid 10-digit phone number"); return; }
    if (!formData.email && !formData.phone) { setError("Enter an email or phone number"); return; }
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ name: formData.name, email: formData.email || undefined, phone: formData.phone || undefined, password: formData.password }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.message || "Registration failed");
      setSuccess("Account created successfully. Redirecting...");
      setTimeout(() => { navigate("/"); window.location.reload(); }, 800);
    } catch (error) { setError(error.message); } finally { setLoading(false); }
  };
  const handleGoogleRegister = () => { window.location.href = `${API_URL}/api/auth/google`; };

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-header"><div className="register-logo">🍴</div><h1>Create Account</h1><p className="register-subtitle">Create your account and start ordering your favorite food</p></div>
        {error && <div className="register-error">{error}</div>}
        {success && <div className="register-success">{success}</div>}
        <form onSubmit={handleRegister}>
          <div className="form-group"><label>Full Name</label><input type="text" name="name" placeholder="Enter your full name" value={formData.name} onChange={handleChange} required minLength={2} maxLength={50} /></div>
          <div className="form-group"><label>Email</label><input type="email" name="email" placeholder="Enter your email" value={formData.email} onChange={handleChange} /></div>
          <div className="form-group"><label>Phone Number <span className="optional"> (optional)</span></label><input type="tel" name="phone" placeholder="Enter 10-digit phone number" value={formData.phone} onChange={handleChange} maxLength={10} /></div>
          <div className="form-group"><label>Password</label><div className="password-input-wrapper"><input type={showPassword ? "text" : "password"} name="password" placeholder="Minimum 6 characters" value={formData.password} onChange={handleChange} required minLength={6} autoComplete="new-password" /><button type="button" className="password-toggle" onClick={() => setShowPassword((previous) => !previous)} aria-label={showPassword ? "Hide password" : "Show password"} title={showPassword ? "Hide password" : "Show password"}>{showPassword ? "🙈" : "👁️"}</button></div></div>
          <div className="form-group"><label>Confirm Password</label><div className="password-input-wrapper"><input type={showConfirmPassword ? "text" : "password"} name="confirmPassword" placeholder="Re-enter your password" value={formData.confirmPassword} onChange={handleChange} required autoComplete="new-password" /><button type="button" className="password-toggle" onClick={() => setShowConfirmPassword((previous) => !previous)} aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"} title={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}>{showConfirmPassword ? "🙈" : "👁️"}</button></div></div>
          <button type="submit" className="register-button" disabled={loading}>{loading ? "Creating Account..." : "Create Account"}</button>
        </form>
        <div className="divider"><span>OR</span></div>
        <button type="button" className="google-register-button" onClick={handleGoogleRegister}><span className="google-icon">G</span>Continue with Google</button>
        <p className="login-text">Already have an account?{" "}<button type="button" onClick={() => navigate("/login")}>Login</button></p>
      </div>
    </div>
  );
}
export default Register;
