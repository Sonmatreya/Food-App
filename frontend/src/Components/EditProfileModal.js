import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import "../Styles/EditProfileModal.css";

function EditProfileModal({ onClose }) {
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Escape key closes the modal
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  // Client-side validation mirrors the backend rules
  const validate = () => {
    const trimmedName = name.trim();

    if (trimmedName.length < 2 || trimmedName.length > 50) {
      return "Name must be between 2 and 50 characters";
    }

    if (phone.trim() !== "") {
      const normalizedPhone = phone
        .trim()
        .replace(/[\s\-()]/g, "");

      if (!/^\+?[0-9]{7,15}$/.test(normalizedPhone)) {
        return "Please enter a valid phone number (7-15 digits, optional +)";
      }
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saving) {
      return;
    }

    setError("");
    setSuccess(false);

    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);

    try {
      // Empty phone clears it server-side (only allowed when the
      // account has an email) — backend enforces this safely.
      await updateProfile({
        name: name.trim(),
        phone: phone.trim(),
      });

      setSuccess(true);

      // Brief success feedback, then close
      setTimeout(onClose, 900);
    } catch (submitError) {
      setError(
        submitError.message || "Profile update failed"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="edit-profile-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="edit-profile-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-profile-title"
      >
        <div className="edit-profile-header">
          <h2 id="edit-profile-title">
            Edit Profile
          </h2>

          <button
            type="button"
            className="edit-profile-close"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <p className="edit-profile-subtitle">
          Update your personal information
        </p>

        {error && (
          <div className="edit-profile-alert error" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div className="edit-profile-alert success" role="status">
            Profile updated successfully
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="edit-profile-field">
            <label htmlFor="edit-profile-name">
              Full Name
            </label>

            <input
              id="edit-profile-name"
              type="text"
              value={name}
              maxLength={50}
              onChange={(event) => setName(event.target.value)}
              disabled={saving}
              autoComplete="name"
            />
          </div>

          <div className="edit-profile-field">
            <label htmlFor="edit-profile-phone">
              Phone Number
            </label>

            <input
              id="edit-profile-phone"
              type="tel"
              value={phone}
              placeholder="+91 98765 43210"
              onChange={(event) => setPhone(event.target.value)}
              disabled={saving}
              autoComplete="tel"
            />

            <small>
              Spaces, hyphens and parentheses are removed
              automatically.
            </small>
          </div>

          <div className="edit-profile-actions">
            <button
              type="button"
              className="edit-profile-cancel"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="edit-profile-save"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditProfileModal;