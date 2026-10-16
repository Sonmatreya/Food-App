import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config/api";
import "../Styles/CustomerTools.css";

export default function Coupons() {
  const navigate = useNavigate();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedCode, setCopiedCode] = useState("");

  const loadCoupons = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/api/coupons`, { credentials: "include" });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load offers. Please try again.");
      }

      const now = Date.now();
      const activeCoupons = (Array.isArray(data.coupons) ? data.coupons : []).filter((coupon) =>
        coupon.active === true &&
        coupon.status === "active" &&
        (!coupon.expiresAt || new Date(coupon.expiresAt).getTime() > now) &&
        typeof coupon.code === "string" &&
        Number(coupon.value) > 0
      );
      setCoupons(activeCoupons);
    } catch (requestError) {
      setError(requestError.message || "Unable to load offers. Please try again.");
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCoupons();
  }, [loadCoupons]);

  const chooseCoupon = async (code) => {
    localStorage.setItem("foodPendingCouponCode", code);
    setCopiedCode("");
    try {
      await navigator.clipboard?.writeText(code);
      setCopiedCode(code);
    } catch {
      // Clipboard permission is optional; the coupon is still saved for checkout.
    }
    navigate("/menu");
  };

  return (
    <main className="customer-tool-page">
      <section className="customer-tool-hero">
        <span>OFFERS & SAVINGS</span>
        <h1>Coupons</h1>
        <p>Browse currently active offers and apply an eligible code to your order.</p>
      </section>
      <section className="customer-tool-content">
        {loading ? (
          <div className="tool-state" role="status">Loading available coupons…</div>
        ) : error ? (
          <div className="tool-state error" role="alert">
            <h2>Offers couldn’t be loaded</h2>
            <p>{error}</p>
            <button type="button" onClick={loadCoupons}>Try again</button>
          </div>
        ) : coupons.length === 0 ? (
          <div className="tool-state">
            <h2>No active coupons right now</h2>
            <p>Check back later for new offers, or explore the current menu.</p>
            <button type="button" onClick={() => navigate("/menu")}>Browse Menu</button>
          </div>
        ) : (
          <div className="coupon-grid">
            {coupons.map((coupon) => (
              <article className="coupon-card" key={coupon._id || coupon.code}>
                <div>
                  <span className="coupon-code">{coupon.code}</span>
                  <h2>{coupon.type === "percentage" ? `${coupon.value}% OFF` : `₹${Number(coupon.value).toFixed(2)} OFF`}</h2>
                  <p>Minimum order: ₹{Number(coupon.minimum || 0).toFixed(2)}</p>
                  {coupon.type === "percentage" && Number(coupon.maxDiscount) > 0 && (
                    <small>Maximum discount ₹{Number(coupon.maxDiscount).toFixed(2)}</small>
                  )}
                  {coupon.expiresAt && (
                    <small>Valid until {new Date(coupon.expiresAt).toLocaleDateString("en-IN")}</small>
                  )}
                </div>
                <button type="button" onClick={() => chooseCoupon(coupon.code)}>
                  {copiedCode === coupon.code ? "Code copied — choose food" : "Choose food to use"}
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
