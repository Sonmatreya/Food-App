import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import "../Styles/EditProfileModal.css";

function EditProfileModal({ onClose }) {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [touched, setTouched] = useState({ name: false, phone: false });
  const nameInputRef = useRef(null);
  const closeTimerRef = useRef(null);

  const normalizedPhone = phone.trim().replace(/[\s\-()]/g, "");
  const nameError =
    name.trim().length < 2 || name.trim().length > 50
      ? "Enter a name between 2 and 50 characters."
      : "";
  const phoneError =
    phone.trim() && !/^\+?[0-9]{7,15}$/.test(normalizedPhone)
      ? "Enter 7–15 digits. You may include a leading +."
      : "";

  useEffect(() => {
    nameInputRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !saving && !success) onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, [onClose, saving, success]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving || success) return;

    setTouched({ name: true, phone: true });
    setError("");
    if (nameError || phoneError) {
      setError("Please check the highlighted fields and try again.");
      if (nameError) nameInputRef.current?.focus();
      return;
    }

    const unchanged =
      name.trim() === (user?.name || "").trim() &&
      normalizedPhone === (user?.phone || "").trim().replace(/[\s\-()]/g, "");

    if (unchanged) {
      setError("There are no changes to save.");
      return;
    }

    setSaving(true);
    try {
      await updateProfile({ name: name.trim(), phone: phone.trim() });
      setSuccess(true);
      closeTimerRef.current = setTimeout(onClose, 1100);
    } catch (submitError) {
      setError(submitError.message || "Profile update failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="edit-profile-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving && !success) onClose();
      }}
    >
      <div
        className="edit-profile-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-profile-title"
        aria-describedby="edit-profile-description"
      >
        <div className="edit-profile-header">
          <div>
            <span className="edit-profile-eyebrow">YOUR ACCOUNT</span>
            <h2 id="edit-profile-title">Edit Profile</h2>
          </div>
          <button
            type="button"
            className="edit-profile-close"
            onClick={onClose}
            aria-label="Close edit profile"
            disabled={saving || success}
          >
            ✕
          </button>
        </div>

        <p className="edit-profile-subtitle" id="edit-profile-description">
          Keep your contact details up to date for a smoother ordering experience.
        </p>

        <div className="edit-profile-email">
          <span className="edit-profile-email-icon" aria-hidden="true">✉</span>
          <span>
            <small>Account email</small>
            <strong>{user?.email || "No email added"}</strong>
          </span>
          <span className="edit-profile-locked">Protected</span>
        </div>
        <p className="edit-profile-email-note">Your email and account role cannot be changed here.</p>

        {error && (
          <div className="edit-profile-alert error" role="alert">{error}</div>
        )}
        {success && (
          <div className="edit-profile-alert success" role="status">
            <span aria-hidden="true">✓</span> Profile updated successfully. Closing…
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className={`edit-profile-field ${touched.name && nameError ? "has-error" : ""}`}>
            <label htmlFor="edit-profile-name">Full name <span aria-hidden="true">*</span></label>
            <input
              ref={nameInputRef}
              id="edit-profile-name"
              name="name"
              type="text"
              value={name}
              maxLength={50}
              onChange={(event) => { setName(event.target.value); setError(""); }}
              onBlur={() => setTouched((current) => ({ ...current, name: true }))}
              disabled={saving || success}
              autoComplete="name"
              aria-invalid={Boolean(touched.name && nameError)}
              aria-describedby="edit-profile-name-help"
              required
            />
            <small id="edit-profile-name-help" className={touched.name && nameError ? "field-error" : ""}>
              {touched.name && nameError ? nameError : "Use 2–50 characters."}
            </small>
          </div>

          <div className={`edit-profile-field ${touched.phone && phoneError ? "has-error" : ""}`}>
            <label htmlFor="edit-profile-phone">Phone number <span className="optional-label">Optional</span></label>
            <input
              id="edit-profile-phone"
              name="phone"
              type="tel"
              inputMode="tel"
              value={phone}
              maxLength={22}
              placeholder="+91 98765 43210"
              onChange={(event) => { setPhone(event.target.value); setError(""); }}
              onBlur={() => setTouched((current) => ({ ...current, phone: true }))}
              disabled={saving || success}
              autoComplete="tel"
              aria-invalid={Boolean(touched.phone && phoneError)}
              aria-describedby="edit-profile-phone-help"
            />
            <small id="edit-profile-phone-help" className={touched.phone && phoneError ? "field-error" : ""}>
              {touched.phone && phoneError ? phoneError : "7–15 digits; spaces, hyphens and brackets are allowed."}
            </small>
          </div>

          <div className="edit-profile-actions">
            <button
              type="button"
              className="edit-profile-cancel"
              onClick={onClose}
              disabled={saving || success}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="edit-profile-save"
              disabled={saving || success}
            >
              {saving ? <><span className="edit-profile-button-spinner" aria-hidden="true" /> Saving…</> : success ? "Saved ✓" : "Save Changes"}
            </button>
          </div>
          <p className="edit-profile-secure-note">🔒 Your changes are saved securely to your account.</p>
        </form>
      </div>
    </div>
  );
}

export default EditProfileModal;
