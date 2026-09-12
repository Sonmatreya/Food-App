import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import EditProfileModal from "../Components/EditProfileModal";
import MyOrders from "../Components/MyOrders";
import "../Styles/Profile.css";

function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [showEditModal, setShowEditModal] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  if (!user) {
    return (
      <div className="profile-loading">
        <div className="profile-spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  const displayName = user.name || "Food Lover";

  const getInitial = () => {
    return displayName.charAt(0).toUpperCase();
  };

  return (
    <main className="profile-page">

      {/* =========================================
          PROFILE HEADER
      ========================================= */}
      <section className="profile-header-card">

        <div className="profile-user">

          <div className="profile-avatar">
            {user.profileImage ? (
              <img
                src={user.profileImage}
                alt="Profile"
              />
            ) : (
              <span>{getInitial()}</span>
            )}
          </div>

          <div className="profile-user-info">
            <span className="profile-greeting">
              Hey,
            </span>

            <h1>{displayName}</h1>

            <p>
              {user.email ||
                user.phone ||
                "Welcome to Food App"}
            </p>

            <span className="profile-account-type">
              {user.role === "admin"
                ? "Administrator"
                : "Customer"}
            </span>
          </div>

        </div>

        <div className="profile-header-actions">

          <button
            type="button"
            onClick={() => navigate("/menu")}
            className="profile-order-button"
          >
            🍕 Order Food
          </button>

          <button
            type="button"
            onClick={() => navigate("/cart")}
            className="profile-cart-button"
          >
            🛒 Cart
          </button>

        </div>

      </section>


      {/* =========================================
          REWARD / ACCOUNT SUMMARY
      ========================================= */}
      <section className="profile-summary-grid">

        <div className="profile-reward-card">

          <div className="summary-icon">
            ⭐
          </div>

          <div className="summary-content">
            <h3>Foodie Rewards</h3>
            <p>
              Earn points when you order your
              favorite food.
            </p>
          </div>

          <div className="summary-value">
            <strong>0</strong>
            <span>Points</span>
          </div>

        </div>


        <div className="profile-quick-card">

          <button
            type="button"
            onClick={() => navigate("/menu")}
          >
            <span>🏷️</span>
            <strong>Coupons</strong>
            <small>View available offers</small>
          </button>

          <button
            type="button"
            onClick={() => navigate("/menu")}
          >
            <span>❤️</span>
            <strong>Wishlist</strong>
            <small>Your favorite food</small>
          </button>

        </div>

      </section>


      {/* =========================================
          MY ORDERS
      ========================================= */}
      <MyOrders />


      {/* =========================================
          MAIN PROFILE GRID
      ========================================= */}
      <div className="profile-content-grid">


        {/* =====================================
            ORDERS
        ===================================== */}
        <section className="profile-card">

          <div className="profile-card-heading">
            <div>
              <h2>Orders</h2>
              <p>
                Manage your food orders
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/menu")}
            >
              Order Food
            </button>
          </div>

          <div className="profile-list">

            <button
              type="button"
              className="profile-list-item"
              onClick={() => navigate("/cart")}
            >
              <span className="list-icon">
                🛒
              </span>

              <span className="list-content">
                <strong>My Cart</strong>
                <small>
                  View items waiting for checkout
                </small>
              </span>

              <span className="list-arrow">
                ›
              </span>
            </button>

            <button
              type="button"
              className="profile-list-item"
              onClick={() => navigate("/menu")}
            >
              <span className="list-icon">
                🍕
              </span>

              <span className="list-content">
                <strong>Order Food</strong>
                <small>
                  Browse our menu and restaurants
                </small>
              </span>

              <span className="list-arrow">
                ›
              </span>
            </button>

          </div>

        </section>


        {/* =====================================
            FOOD OPTIONS
        ===================================== */}
        <section className="profile-card">

          <div className="profile-card-heading">
            <div>
              <h2>Food Options</h2>
              <p>
                Explore and manage your food choices
              </p>
            </div>
          </div>

          <div className="profile-list">

            <button
              type="button"
              className="profile-list-item"
              onClick={() => navigate("/menu")}
            >
              <span className="list-icon">
                ❤️
              </span>

              <span className="list-content">
                <strong>Favorite Food</strong>
                <small>
                  Your favorite dishes
                </small>
              </span>

              <span className="list-arrow">
                ›
              </span>
            </button>

            <button
              type="button"
              className="profile-list-item"
              onClick={() => navigate("/menu")}
            >
              <span className="list-icon">
                🍽️
              </span>

              <span className="list-content">
                <strong>Menu</strong>
                <small>
                  Explore available food
                </small>
              </span>

              <span className="list-arrow">
                ›
              </span>
            </button>

            <button
              type="button"
              className="profile-list-item"
              onClick={() => navigate("/menu")}
            >
              <span className="list-icon">
                🔥
              </span>

              <span className="list-content">
                <strong>Today's Offers</strong>
                <small>
                  Discover special deals
                </small>
              </span>

              <span className="list-arrow">
                ›
              </span>
            </button>

          </div>

        </section>


        {/* =====================================
            PROFILE SETTINGS
        ===================================== */}
        <section className="profile-card">

          <div className="profile-card-heading">
            <div>
              <h2>Profile Settings</h2>
              <p>
                Manage your account information
              </p>
            </div>
          </div>

          <div className="profile-list">

            <button
              type="button"
              className="profile-list-item"
              onClick={() => setShowEditModal(true)}
            >
              <span className="list-icon">
                👤
              </span>

              <span className="list-content">
                <strong>Edit Profile</strong>
                <small>
                  Your profile information
                </small>
              </span>

              <span className="list-status">
                {user.name ? "Updated" : ""}
              </span>
            </button>

            <button
              type="button"
              className="profile-list-item"
              onClick={() =>
                navigate("/delivery-address")
              }
            >
              <span className="list-icon">
                📍
              </span>

              <span className="list-content">
                <strong>Saved Addresses</strong>
                <small>
                  Manage delivery addresses
                </small>
              </span>

              <span className="list-arrow">
                ›
              </span>
            </button>

            <button
              type="button"
              className="profile-list-item"
            >
              <span className="list-icon">
                🔔
              </span>

              <span className="list-content">
                <strong>Notifications</strong>
                <small>
                  Manage your notifications
                </small>
              </span>

              <span className="list-arrow">
                ›
              </span>
            </button>

          </div>

        </section>


        {/* =====================================
            PAYMENTS
        ===================================== */}
        <section className="profile-card">

          <div className="profile-card-heading">
            <div>
              <h2>Payments & Wallet</h2>
              <p>
                Manage your payment preferences
              </p>
            </div>
          </div>

          <div className="profile-list">

            <button
              type="button"
              className="profile-list-item"
              onClick={() => navigate("/payment")}
            >
              <span className="list-icon">
                💳
              </span>

              <span className="list-content">
                <strong>Payment Methods</strong>
                <small>
                  Choose your payment option
                </small>
              </span>

              <span className="list-arrow">
                ›
              </span>
            </button>

            <button
              type="button"
              className="profile-list-item"
              onClick={() => navigate("/payment")}
            >
              <span className="list-icon">
                💰
              </span>

              <span className="list-content">
                <strong>Payment History</strong>
                <small>
                  View your payment activity
                </small>
              </span>

              <span className="list-arrow">
                ›
              </span>
            </button>

          </div>

        </section>


        {/* =====================================
            REVIEWS
        ===================================== */}
        <section className="profile-card">

          <div className="profile-card-heading">
            <div>
              <h2>Ratings & Reviews</h2>
              <p>
                Share your experience with us
              </p>
            </div>

            <span className="coming-soon">
              Coming Soon
            </span>
          </div>

          <div className="review-placeholder">

            <div className="review-placeholder-icon">
              ⭐
            </div>

            <div>
              <strong>Your reviews will appear here</strong>
              <p>
                After ordering, you will be able
                to rate your food and delivery.
              </p>
            </div>

          </div>

        </section>


        {/* =====================================
            PRIVACY & SECURITY
        ===================================== */}
        <section className="profile-card">

          <div className="profile-card-heading">
            <div>
              <h2>Privacy & Security</h2>
              <p>
                Keep your account safe
              </p>
            </div>
          </div>

          <div className="profile-list">

            <button
              type="button"
              className="profile-list-item"
            >
              <span className="list-icon">
                🛡️
              </span>

              <span className="list-content">
                <strong>Privacy Center</strong>
                <small>
                  Manage privacy preferences
                </small>
              </span>

              <span className="list-arrow">
                ›
              </span>
            </button>

            <button
              type="button"
              className="profile-list-item"
            >
              <span className="list-icon">
                🔐
              </span>

              <span className="list-content">
                <strong>Account Security</strong>
                <small>
                  Protect your account
                </small>
              </span>

              <span className="list-arrow">
                ›
              </span>
            </button>

          </div>

        </section>


        {/* =====================================
            HELP
        ===================================== */}
        <section className="profile-card">

          <div className="profile-card-heading">
            <div>
              <h2>Help & Support</h2>
              <p>
                We're here to help
              </p>
            </div>
          </div>

          <div className="profile-list">

            <button
              type="button"
              className="profile-list-item"
              onClick={() => navigate("/contact")}
            >
              <span className="list-icon">
                ❓
              </span>

              <span className="list-content">
                <strong>FAQs</strong>
                <small>
                  Frequently asked questions
                </small>
              </span>

              <span className="list-arrow">
                ›
              </span>
            </button>

            <button
              type="button"
              className="profile-list-item"
              onClick={() => navigate("/contact")}
            >
              <span className="list-icon">
                💬
              </span>

              <span className="list-content">
                <strong>Contact Support</strong>
                <small>
                  Get help with your order
                </small>
              </span>

              <span className="list-arrow">
                ›
              </span>
            </button>

            <button
              type="button"
              className="profile-list-item"
              onClick={() => navigate("/about")}
            >
              <span className="list-icon">
                📄
              </span>

              <span className="list-content">
                <strong>Terms & Conditions</strong>
                <small>
                  Read our terms and policies
                </small>
              </span>

              <span className="list-arrow">
                ›
              </span>
            </button>

          </div>

        </section>


        {/* =====================================
            ADMIN
        ===================================== */}
        {user.role === "admin" && (
          <section className="profile-card admin-card">

            <div className="profile-card-heading">
              <div>
                <h2>Administration</h2>
                <p>
                  Manage the Food App system
                </p>
              </div>
            </div>

            <div className="profile-list">

              <button
                type="button"
                className="profile-list-item"
              >
                <span className="list-icon">
                  ⚙️
                </span>

                <span className="list-content">
                  <strong>Admin Dashboard</strong>
                  <small>
                    Manage users, food and orders
                  </small>
                </span>

                <span className="list-arrow">
                  ›
                </span>
              </button>

            </div>

          </section>
        )}

      </div>


      {/* =========================================
          FOLLOW US
      ========================================= */}
      <section className="profile-follow-card">

        <h2>Follow Us</h2>

        <div className="profile-social-buttons">

          <button type="button">
            📷 Instagram
          </button>

          <button type="button">
            ▶️ YouTube
          </button>

          <button type="button">
            💼 LinkedIn
          </button>

        </div>

      </section>


      {/* =========================================
          LOGOUT
      ========================================= */}
      <section className="profile-logout-section">

        <button
          type="button"
          className="profile-logout-button"
          onClick={handleLogout}
        >
          Log out
        </button>

        <p>
          Food App · v1.0.0
        </p>

      </section>

      {/* =========================================
          EDIT PROFILE MODAL
      ========================================= */}
      {showEditModal && (
        <EditProfileModal
          onClose={() => setShowEditModal(false)}
        />
      )}

    </main>
  );
}

export default Profile;
