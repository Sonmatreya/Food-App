import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_URL } from "../config/api";
import "../Styles/PromoBanners.css";

export default function PromoBanners() {
  const [coupons, setCoupons] = useState([]);
  useEffect(() => {
    fetch(`${API_URL}/api/coupons`).then((r) => r.json()).then((d) => {
      if (d.success) setCoupons((d.coupons || []).slice(0, 3));
    }).catch(() => {});
  }, []);
  const fallback = [
    { code: "WELCOME20", type: "percentage", value: 20, minimum: 0 },
    { code: "FREEDELIVERY", type: "fixed", value: 0, minimum: 40 },
  ];
  const offers = coupons.length ? coupons : fallback;
  return (
    <section className="promoBanners">
      {offers.map((offer, index) => (
        <article className={`promoBanner promoBanner-${index % 3}`} key={offer._id || offer.code}>
          <div><span>{index === 0 ? "LIMITED OFFER" : "FOOD APP OFFER"}</span><h3>{offer.type === "percentage" ? `${offer.value}% OFF` : offer.value > 0 ? `₹${offer.value} OFF` : "FREE DELIVERY"}</h3><p>Use code <strong>{offer.code}</strong>{Number(offer.minimum) > 0 ? ` · Min ₹${Number(offer.minimum).toFixed(0)}` : ""}</p></div>
          <Link to="/menu">Order now →</Link>
        </article>
      ))}
    </section>
  );
}
