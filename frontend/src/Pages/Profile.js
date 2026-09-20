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
        <div className="profile-spinner" />
        <p>Loading profile...</p>
      </div>
    );
  }

  const displayName = user.name || "Food Lover";
  const initial = displayName.trim().charAt(0).toUpperCase() || "F";
  const phone = user.phone || "Not added";
  const email = user.email || "Not added";
  const isAdmin = user.role === "admin";

  return (
    <main className="profile-page">
      <section className="profile-header-card">
        <div className="profile-user">
          <div className="profile-avatar">
            {user.profileImage ? (
              <img src={user.profileImage} alt="" />
            ) : (
              <span>{initial}</span>
            )}
          </div>

          <div className="profile-user-info">
            <span className="profile-greeting">Welcome back</span>
            <h1>{displayName}</h1>
            <p>{email}</p>
            <span className="profile-account-type">
              {isAdmin ? "Administrator" : "Customer"}
            </span>
          </div>
        </div>

        <div className="profile-header-actions">
          <button
            type="button"
            className="profile-order-button"
            onClick={() => navigate("/menu")}
          >
            Order Food
          </button>
          <button
            type="button"
            className="profile-cart-button"
            onClick={() => navigate("/cart")}
          >
            View Cart
          </button>
        </div>
      </section>

      <section className="profile-summary-grid">
        <div className="profile-reward-card">
          <div className="summary-icon">⭐</div>
          <div className="summary-content">
            <h3>Foodie Rewards</h3>
            <p>Earn points when you order your favorite food.</p>
          </div>
          <div className="summary-value"><strong>0</strong><span>Points</span></div>
        </div>
        <div className="profile-quick-card">
          <button type="button" onClick={() => navigate("/coupons")}>
            <span>🏷️</span><strong>Coupons</strong><small>View available offers</small>
          </button>
          <button type="button" onClick={() => navigate("/wishlist")}>
            <span>❤️</span><strong>Wishlist</strong><small>Browse favorite food</small>
          </button>
        </div>
      </section>

      <section className="profile-overview-grid">
        <div className="profile-overview-card">
          <span className="overview-icon">✉️</span>
          <div>
            <small>Email</small>
            <strong>{email}</strong>
          </div>
        </div>

        <div className="profile-overview-card">
          <span className="overview-icon">📱</span>
          <div>
            <small>Phone</small>
            <strong>{phone}</strong>
          </div>
        </div>

        <div className="profile-overview-card">
          <span className="overview-icon">🛡️</span>
          <div>
            <small>Account</small>
            <strong>{isAdmin ? "Administrator" : "Customer account"}</strong>
          </div>
        </div>
      </section>

      <MyOrders />

      <div className="profile-content-grid">
        <section className="profile-card">
          <div className="profile-card-heading">
            <div>
              <h2>Account & Profile</h2>
              <p>Manage your personal account information</p>
            </div>
          </div>

          <div className="profile-list">
            <button
              type="button"
              className="profile-list-item"
              onClick={() => setShowEditModal(true)}
            >
              <span className="list-icon">👤</span>
              <span className="list-content">
                <strong>Edit Profile</strong>
                <small>Update your name and phone number</small>
              </span>
              <span className="list-arrow">›</span>
            </button>

            <button
              type="button"
              className="profile-list-item"
              onClick={() => navigate("/saved-addresses")}
            >
              <span className="list-icon">📍</span>
              <span className="list-content">
                <strong>Saved Addresses</strong>
                <small>Manage your delivery addresses</small>
              </span>
              <span className="list-arrow">›</span>
            </button>

            <button type="button" className="profile-list-item" onClick={() => navigate("/security")}>
              <span className="list-icon">🔐</span>
              <span className="list-content">
                <strong>Login & Security</strong>
                <small>Your password and login are protected</small>
              </span>
              <span className="list-arrow">›</span>
            </button>
          </div>
        </section>

        <section className="profile-card">
          <div className="profile-card-heading">
            <div>
              <h2>Food Options</h2>
              <p>Explore and manage your food choices</p>
            </div>
          </div>
          <div className="profile-list">
            <button type="button" className="profile-list-item" onClick={() => navigate("/wishlist")}>
              <span className="list-icon">❤️</span><span className="list-content"><strong>Favorite Food</strong><small>Your favorite dishes</small></span><span className="list-arrow">›</span>
            </button>
            <button type="button" className="profile-list-item" onClick={() => navigate("/menu")}>
              <span className="list-icon">🍽️</span><span className="list-content"><strong>Menu</strong><small>Explore available food</small></span><span className="list-arrow">›</span>
            </button>
            <button type="button" className="profile-list-item" onClick={() => navigate("/menu")}>
              <span className="list-icon">🔥</span><span className="list-content"><strong>Today's Offers</strong><small>Discover special deals</small></span><span className="list-arrow">›</span>
            </button>
          </div>
        </section>

        <section className="profile-card">
          <div className="profile-card-heading">
            <div>
              <h2>Orders & Payments</h2>
              <p>Quick access to your shopping activity</p>
            </div>
          </div>

          <div className="profile-list">
            <button
              type="button"
              className="profile-list-item"
              onClick={() => navigate("/cart")}
            >
              <span className="list-icon">🛒</span>
              <span className="list-content">
                <strong>My Cart</strong>
                <small>Review items before checkout</small>
              </span>
              <span className="list-arrow">›</span>
            </button>

            <button
              type="button"
              className="profile-list-item"
              onClick={() => navigate("/menu")}
            >
              <span className="list-icon">🍕</span>
              <span className="list-content">
                <strong>Browse Menu</strong>
                <small>Find food and start a new order</small>
              </span>
              <span className="list-arrow">›</span>
            </button>

            <button
              type="button"
              className="profile-list-item"
              onClick={() => navigate("/payment")}
            >
              <span className="list-icon">💳</span>
              <span className="list-content">
                <strong>Payment</strong>
                <small>Continue to the payment section</small>
              </span>
              <span className="list-arrow">›</span>
            </button>
          </div>
        </section>

        <section className="profile-card">
          <div className="profile-card-heading">
            <div>
              <h2>Payments & Wallet</h2>
              <p>Manage your payment preferences</p>
            </div>
          </div>
          <div className="profile-list">
            <button type="button" className="profile-list-item" onClick={() => navigate("/payment")}>
              <span className="list-icon">💳</span><span className="list-content"><strong>Payment Methods</strong><small>Choose your payment option</small></span><span className="list-arrow">›</span>
            </button>
            <button type="button" className="profile-list-item" onClick={() => navigate("/payment")}>
              <span className="list-icon">💰</span><span className="list-content"><strong>Payment History</strong><small>View your payment activity through orders</small></span><span className="list-arrow">›</span>
            </button>
          </div>
        </section>

        <section className="profile-card">
          <div className="profile-card-heading">
            <div>
              <h2>Ratings & Reviews</h2>
              <p>Share feedback after your completed orders</p>
            </div>
            <span className="coming-soon">Order based</span>
          </div>

          <div className="profile-info-panel">
            <div className="profile-info-icon">⭐</div>
            <div>
              <strong>Review your food after an eligible order</strong>
              <p>
                Completed and picked-up orders can be reviewed from the
                order experience when review support is available.
              </p>
            </div>
          </div>
        </section>

        <section className="profile-card">
          <div className="profile-card-heading">
            <div>
              <h2>Privacy & Security</h2>
              <p>Keep your account safe</p>
            </div>
          </div>
          <div className="profile-list">
            <div className="profile-list-item profile-list-item-static">
              <span className="list-icon">🛡️</span><span className="list-content"><strong>Privacy Center</strong><small>Your account details are private</small></span><span className="list-status">Protected</span>
            </div>
            <div className="profile-list-item profile-list-item-static">
              <span className="list-icon">🔐</span><span className="list-content"><strong>Account Security</strong><small>Authentication is handled securely</small></span><span className="list-status">Protected</span>
            </div>
            <button type="button" className="profile-list-item" onClick={() => navigate("/notifications")}>
              <span className="list-icon">🔔</span><span className="list-content"><strong>Notifications</strong><small>Order updates appear in your order tracking</small></span><span className="list-arrow">›</span>
            </button>
          </div>
        </section>

        <section className="profile-card">
          <div className="profile-card-heading">
            <div>
              <h2>Help & Support</h2>
              <p>Get assistance with your Food App account</p>
            </div>
          </div>

          <div className="profile-list">
            <button
              type="button"
              className="profile-list-item"
              onClick={() => navigate("/contact")}
            >
              <span className="list-icon">💬</span>
              <span className="list-content">
                <strong>Contact Support</strong>
                <small>Get help with an order or account issue</small>
              </span>
              <span className="list-arrow">›</span>
            </button>

            <button
              type="button"
              className="profile-list-item"
              onClick={() => navigate("/about")}
            >
              <span className="list-icon">📄</span>
              <span className="list-content">
                <strong>About Food App</strong>
                <small>Learn more about the platform</small>
              </span>
              <span className="list-arrow">›</span>
            </button>
          </div>
        </section>

        {isAdmin && (
          <section className="profile-card admin-card">
            <div className="profile-card-heading">
              <div>
                <h2>Administration</h2>
                <p>Manage the Food App system</p>
              </div>
            </div>

            <div className="profile-list">
              <button
                type="button"
                className="profile-list-item"
                onClick={() => navigate("/admin")}
              >
                <span className="list-icon">⚙️</span>
                <span className="list-content">
                  <strong>Admin Dashboard</strong>
                  <small>Manage orders, customers, menu and staff</small>
                </span>
                <span className="list-arrow">›</span>
              </button>
            </div>
          </section>
        )}
      </div>

      <section className="profile-notice">
        <div className="profile-notice-icon">🔒</div>
        <div>
          <strong>Your account information is private</strong>
          <p>
            We only display the account details associated with your signed-in
            Food App account.
          </p>
        </div>
      </section>

      <section className="profile-logout-section">
        <button
          type="button"
          className="profile-logout-button"
          onClick={handleLogout}
        >
          Log out
        </button>
        <p>Food App · v1.0.0</p>
      </section>

      {showEditModal && (
        <EditProfileModal onClose={() => setShowEditModal(false)} />
      )}
    </main>
  );
}

export default Profile;
