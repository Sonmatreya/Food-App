import React, { useEffect, useState } from "react";
import "../Styles/CustomerTools.css";

export default function Notifications() {
  const [enabled, setEnabled] = useState(() => localStorage.getItem("orderNotifications") !== "off");

  useEffect(() => {
    localStorage.setItem("orderNotifications", enabled ? "on" : "off");
  }, [enabled]);

  return (
    <main className="customer-tool-page">
      <section className="customer-tool-hero">
        <span>ACCOUNT PREFERENCES</span>
        <h1>Notifications</h1>
        <p>Manage the local preference for optional order-update notices.</p>
      </section>
      <section className="customer-tool-content">
        <div className="settings-card">
          <div>
            <span className="settings-icon">🔔</span>
            <div>
              <h2>Order update preference</h2>
              <p>This switch currently saves a preference in this browser only. Push, SMS and email notifications are not connected yet, so changing it will not send or block real notifications.</p>
            </div>
          </div>
          <button type="button" className={enabled ? "toggle active" : "toggle"} onClick={() => setEnabled((value) => !value)} aria-pressed={enabled} aria-label={enabled ? "Turn local preference off" : "Turn local preference on"}>
            <span />
          </button>
        </div>
        <div className="settings-note">You can still check the latest order status in your order history. Real notification delivery needs a notification service and is not enabled yet.</div>
      </section>
    </main>
  );
}
