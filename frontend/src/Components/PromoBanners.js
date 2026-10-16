import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_URL } from "../config/api";
import "../Styles/PromoBanners.css";

export default function PromoBanners() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadCoupons = async () => {
      try {
        const response = await fetch(`${API_URL}/api/coupons`, {
          credentials: "include",
        });
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error("Offers could not be loaded.");
        }

        const now = Date.now();
        const activeCoupons = (Array.isArray(data.coupons) ? data.coupons : [])
          .filter((coupon) =>
            coupon.active === true &&
            coupon.status === "active" &&
            (!coupon.expiresAt || new Date(coupon.expiresAt).getTime() > now) &&
            typeof coupon.code === "string" &&
            Number(coupon.value) > 0
          )
          .slice(0, 3);

        if (!cancelled) {
          setCoupons(activeCoupons);
          setError(false);
        }
      } catch {
        if (!cancelled) {
          setCoupons([]);
          setError(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadCoupons();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <section className="promoBanners" aria-label="Current offers" aria-busy="true">
        <p role="status">Checking current offers…</p>
      </section>
    );
  }

  if (error || coupons.length === 0) {
    return (
      <section className="promoBanners" aria-label="Current offers">
        <article className="promoBanner promoBanner-0">
          <div>
            <span>OFFERS &amp; SAVINGS</span>
            <h3>{error ? "Offers unavailable" : "No active offers right now"}</h3>
            <p>
              {error
                ? "Please try again later. You can check eligible coupons at checkout."
                : "Check back later for offers from the restaurant."}
            </p>
          </div>
          <Link to="/menu">Browse menu →</Link>
        </article>
      </section>
    );
  }

  return (
    <section className="promoBanners" aria-label="Current offers">
      {coupons.map((offer, index) => (
        <article className={`promoBanner promoBanner-${index % 3}`} key={offer.id || offer._id || offer.code}>
          <div>
            <span>ACTIVE OFFER</span>
            <h3>
              {offer.type === "percentage"
                ? `${Number(offer.value)}% OFF`
                : `₹${Number(offer.value).toFixed(2)} OFF`}
            </h3>
            <p>
              Use code <strong>{offer.code}</strong>
              {Number(offer.minimum) > 0
                ? ` · Min ₹${Number(offer.minimum).toFixed(0)}`
                : ""}
              {offer.type === "percentage" && Number(offer.maxDiscount) > 0
                ? ` · Up to ₹${Number(offer.maxDiscount).toFixed(0)} off`
                : ""}
            </p>
          </div>
          <Link to="/menu">Order now →</Link>
        </article>
      ))}
    </section>
  );
}
