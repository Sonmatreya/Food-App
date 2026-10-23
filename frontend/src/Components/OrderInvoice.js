import React from "react";
import "../Styles/OrderInvoice.css";

const money = (value) =>
  "₹" + Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const dateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      });
};

function OrderInvoice({ order, onClose }) {
  if (!order) return null;
  const pricing = order.pricing || {};
  const address = order.address || {};
  const items = Array.isArray(order.items) ? order.items : [];

  const printInvoice = () => window.print();

  return (
    <div className="order-invoice-overlay" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="order-invoice" role="dialog" aria-modal="true" aria-labelledby="order-invoice-title">
        <div className="order-invoice-toolbar no-print">
          <span>Order invoice</span>
          <div>
            <button type="button" className="order-invoice-print" onClick={printInvoice}>Print / Save PDF</button>
            <button type="button" className="order-invoice-close" onClick={onClose} aria-label="Close invoice">×</button>
          </div>
        </div>

        <div className="order-invoice-paper">
          <header className="order-invoice-brand">
            <div>
              <span className="order-invoice-mark">F</span>
              <div><h1>FoodApp</h1><p>Fresh food. Delivered with care.</p></div>
            </div>
            <div className="order-invoice-label"><strong>INVOICE</strong><span>Order receipt</span></div>
          </header>

          <div className="order-invoice-title-row">
            <div><p className="order-invoice-kicker">ORDER REFERENCE</p><h2 id="order-invoice-title">{order.orderNumber || order.id || "Order"}</h2></div>
            <div className="order-invoice-date"><span>Order date</span><strong>{dateTime(order.createdAt)}</strong><span>Order status</span><strong className="order-invoice-status">{String(order.status || "placed").replace(/_/g, " ")}</strong></div>
          </div>

          <div className="order-invoice-info-grid">
            <section><h3>{order.deliveryType === "pickup" ? "Pickup details" : "Delivery address"}</h3>
              <strong>{address.name || "Customer"}</strong>
              {order.deliveryType === "pickup" ? <p>Pickup order</p> : <>
                {address.addressLine && <p>{address.addressLine}</p>}
                {(address.city || address.pincode) && <p>{[address.city, address.pincode].filter(Boolean).join(" – ")}</p>}
                {address.landmark && <p>Landmark: {address.landmark}</p>}
              </>}
              {address.phone && <p>Phone: {address.phone}</p>}
            </section>
            <section><h3>Payment details</h3>
              <p><span>Method</span><strong>{String(order.paymentMethod || "—").replace(/_/g, " ").toUpperCase()}</strong></p>
              <p><span>Payment status</span><strong>{String(order.paymentStatus || "pending").replace(/_/g, " ").toUpperCase()}</strong></p>
              <p><span>Fulfilment</span><strong>{order.deliveryType === "pickup" ? "PICKUP" : "DELIVERY"}</strong></p>
              {pricing.couponCode && <p><span>Coupon</span><strong>{pricing.couponCode}</strong></p>}
            </section>
          </div>

          <table className="order-invoice-items">
            <thead><tr><th>Item description</th><th>Qty</th><th>Unit price</th><th className="numeric">Amount</th></tr></thead>
            <tbody>{items.map((item, index) => <tr key={(item.foodId || item.name || "item") + "-" + index}>
              <td><strong>{item.name || "Food item"}</strong>{item.cookingRequest && <small>Request: {item.cookingRequest}</small>}</td>
              <td>{Number(item.quantity || 1)}</td><td>{money(item.price)}</td><td className="numeric">{money(Number(item.price || 0) * Number(item.quantity || 1))}</td>
            </tr>)}</tbody>
          </table>

          <div className="order-invoice-bottom">
            <p className="order-invoice-thanks">Thank you for ordering with FoodApp.<br/><span>Please keep this invoice for your records.</span></p>
            <div className="order-invoice-totals">
              <div><span>Subtotal</span><strong>{money(pricing.subtotal)}</strong></div>
              {Number(pricing.discount || 0) > 0 && <div className="discount"><span>Discount{pricing.couponCode ? " (" + pricing.couponCode + ")" : ""}</span><strong>−{money(pricing.discount)}</strong></div>}
              <div><span>Delivery fee</span><strong>{Number(pricing.deliveryFee || 0) === 0 ? "FREE" : money(pricing.deliveryFee)}</strong></div>
              <div><span>Service fee</span><strong>{money(pricing.serviceFee)}</strong></div>
              <div><span>Tax</span><strong>{money(pricing.tax)}</strong></div>
              <div className="grand-total"><span>Total paid / due</span><strong>{money(pricing.grandTotal)}</strong></div>
            </div>
          </div>
          <footer className="order-invoice-footer">Generated from your FoodApp order history · {dateTime(new Date())}</footer>
        </div>
      </section>
    </div>
  );
}

export default OrderInvoice;
