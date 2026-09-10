import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../Styles/Profile.css";

function Profile() {
  const navigate = useNavigate();

  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // If authentication is still loading
  if (!user) {
    return (
      <div className="profile-loading">
        Loading profile...
      </div>
    );
  }

  const getInitial = () => {
    if (!user.name) {
      return "U";
    }

    return user.name.charAt(0).toUpperCase();
  };

  return (
    <div className="profile-page">

      <div className="profile-container">

        {/* =========================
            PROFILE HEADER
        ========================= */}

        <div className="profile-header">

          <div className="profile-avatar">

            {user.profileImage ? (
              <img
                src={user.profileImage}
                alt="Profile"
              />
            ) : (
              <span>
                {getInitial()}
              </span>
            )}

          </div>

          <div className="profile-header-info">

            <h1>
              {user.name}
            </h1>

            <p>
              {user.email ||
                user.phone ||
                "Customer"}
            </p>

            <span className="profile-role">
              {user.role === "admin"
                ? "Administrator"
                : "Customer"}
            </span>

          </div>

        </div>


        {/* =========================
            ACCOUNT INFORMATION
        ========================= */}

        <div className="profile-section">

          <div className="section-title">
            <h2>Account Information</h2>
            <p>
              Your registered account details
            </p>
          </div>


          <div className="profile-details">

            {/* Name */}

            <div className="profile-detail">

              <span className="detail-label">
                Full Name
              </span>

              <span className="detail-value">
                {user.name || "Not provided"}
              </span>

            </div>


            {/* Email */}

            <div className="profile-detail">

              <span className="detail-label">
                Email
              </span>

              <span className="detail-value">
                {user.email || "Not provided"}
              </span>

            </div>


            {/* Phone */}

            <div className="profile-detail">

              <span className="detail-label">
                Phone
              </span>

              <span className="detail-value">
                {user.phone || "Not provided"}
              </span>

            </div>


            {/* Account Type */}

            <div className="profile-detail">

              <span className="detail-label">
                Account Type
              </span>

              <span className="detail-value">
                {user.role === "admin"
                  ? "Administrator"
                  : "Customer"}
              </span>

            </div>

          </div>

        </div>


        {/* =========================
            QUICK ACTIONS
        ========================= */}

        <div className="profile-section">

          <div className="section-title">

            <h2>
              Quick Actions
            </h2>

            <p>
              Manage your food orders and account
            </p>

          </div>


          <div className="profile-actions">

            <button
              className="profile-action"
              onClick={() =>
                navigate("/my-orders")
              }
            >
              <span className="action-icon">
                📦
              </span>

              <span>
                <strong>
                  My Orders
                </strong>

                <small>
                  View your previous orders
                </small>
              </span>

            </button>


            <button
              className="profile-action"
              onClick={() =>
                navigate("/cart")
              }
            >
              <span className="action-icon">
                🛒
              </span>

              <span>
                <strong>
                  My Cart
                </strong>

                <small>
                  View items in your cart
                </small>
              </span>

            </button>


            <button
              className="profile-action"
              onClick={() =>
                navigate("/menu")
              }
            >
              <span className="action-icon">
                🍕
              </span>

              <span>
                <strong>
                  Order Food
                </strong>

                <small>
                  Browse our menu
                </small>
              </span>

            </button>

          </div>

        </div>


        {/* =========================
            LOGOUT
        ========================= */}

        <div className="profile-logout-section">

          <button
            className="profile-logout-button"
            onClick={handleLogout}
          >
            Logout
          </button>

        </div>

      </div>

    </div>
  );
}

export default Profile;