import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import "../Styles/MyOrders.css";

const ORDERS_PER_PAGE = 5;

const STATUS_LABELS = {
  placed: "Placed",
  confirmed: "Confirmed",
  preparing: "Preparing",
  ready: "Ready",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  picked_up: "Picked Up",
};

const PAYMENT_METHOD_LABELS = {
  upi: "UPI",
  card: "Card",
  netbanking: "Net Banking",
  cod: "Cash on Delivery",
};

function MyOrders() {
  const { API_URL } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [reorderState, setReorderState] = useState({
    loading: false,
    message: "",
    type: "",
  });

  // Fetch one page of orders. Appends when loading more,
  // replaces when refreshing / retrying.
  const fetchOrders = useCallback(
    async (page, append) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/orders?page=${page}&limit=${ORDERS_PER_PAGE}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      let data = {};

      try {
        data = await response.json();
      } catch {
        // Non-JSON response
      }

      if (!response.ok || !data.success) {
        setError(
          data.message || "Unable to load your orders."
        );

        if (!append) {
          setOrders([]);
          setPagination(null);
        }

        return;
      }

      // Load More appends — existing orders are kept
      setOrders((currentOrders) =>
        append
          ? [...currentOrders, ...(data.orders || [])]
          : data.orders || []
      );

      setPagination(data.pagination || null);
    } catch (fetchError) {
      console.error("Fetch orders error:", fetchError);

      setError(
        "Unable to reach the server. Please check your connection."
      );
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
    },
    [API_URL]
  );

  // Initial load
  useEffect(() => {
    fetchOrders(1, false);
  }, [fetchOrders]);

  const handleLoadMore = () => {
    if (!pagination || loadingMore) {
      return;
    }

    fetchOrders(pagination.page + 1, true);
  };

  const handleRetry = () => {
    fetchOrders(1, false);
  };

  const toggleExpanded = (id) => {
    setExpandedOrderId((current) =>
      current === id ? null : id
    );
  };

  const handleReorder = async (order) => {
    if (reorderState.loading) {
      return;
    }

    const orderItems = Array.isArray(order.items) ? order.items : [];

    if (!orderItems.length) {
      setReorderState({
        loading: false,
        message: "This order has no items available to reorder.",
        type: "warning",
      });
      return;
    }

    setReorderState({
      loading: true,
      message: "Checking item availability...",
      type: "loading",
    });

    try {
      const results = await Promise.all(
        orderItems.map(async (item) => {
          const foodId = item.foodId || item._id || item.id;

          if (!/^[a-f\\d]{24}$/i.test(String(foodId || ""))) {
            return { available: false, reason: "invalid" };
          }

          try {
            const response = await fetch(
              API_URL + "/api/foods/" + foodId,
              { method: "GET" }
            );

            if (!response.ok) {
              return { available: false, reason: "deleted" };
            }

            const data = await response.json();

            if (!data.success || !data.food || data.food.isAvailable === false) {
              return { available: false, reason: "unavailable" };
            }

            return {
              available: true,
              food: data.food,
              item,
            };
          } catch (error) {
            console.error("Reorder availability check error:", error);
            return { available: false, reason: "error" };
          }
        })
      );

      const availableItems = results.filter((result) => result.available);
      const skippedCount = results.length - availableItems.length;

      availableItems.forEach(({ food, item }) => {
        addToCart(
          {
            _id: food._id,
            id: food._id,
            name: food.name,
            price: Number(food.price || 0),
            image: food.image || "",
            category: food.category || "",
          },
          Number(item.quantity || 1),
          item.cookingRequest || ""
        );
      });

      if (availableItems.length > 0) {
        setReorderState({
          loading: false,
          message:
            skippedCount > 0
              ? availableItems.length + " " +
                (availableItems.length === 1 ? "item" : "items") +
                " added to cart. " +
                skippedCount + " unavailable " +
                (skippedCount === 1 ? "item was" : "items were") +
                " skipped."
              : availableItems.length + " " +
                (availableItems.length === 1 ? "item" : "items") +
                " added to cart.",
          type: skippedCount > 0 ? "warning" : "success",
        });
      } else {
        setReorderState({
          loading: false,
          message:
            skippedCount > 0
              ? "None of the items in this order are currently available."
              : "No items could be added to cart.",
          type: "warning",
        });
      }
    } catch (error) {
      console.error("Reorder error:", error);
      setReorderState({
        loading: false,
        message: "Unable to check item availability. Nothing was added to cart.",
        type: "error",
      });
    }
  };

  const formatDate = (isoDate) => {
    if (!isoDate) {
      return "";
    }

    return new Date(isoDate).toLocaleDateString(
      undefined,
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    );
  };

  const hasMore =
    pagination &&
    pagination.page < pagination.totalPages;

  useEffect(() => {
    if (!reorderState.message || reorderState.loading) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setReorderState({
        loading: false,
        message: "",
        type: "",
      });
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [reorderState.message, reorderState.loading]);

  return (
    <section className="my-orders-section">
      <div className="my-orders-card">

        {/* HEADER */}

        <div className="my-orders-header">
          <div>
            <h2>My Orders</h2>

            <p>
              {pagination
                ? `${pagination.totalOrders} ${
                    pagination.totalOrders === 1
                      ? "order"
                      : "orders"
                  } placed`
                : "Your food order history"}
            </p>
          </div>

          <Link
            to="/menu"
            className="my-orders-order-link"
          >
            Order Food
          </Link>
        </div>

        {/* LOADING */}

        {loading && (
          <div className="my-orders-state">
            <div className="my-orders-spinner"></div>
            <p>Loading your orders...</p>
          </div>
        )}

        {/* ERROR */}

        {!loading && error && (
          <div className="my-orders-state">
            <div className="my-orders-state-icon">
              ⚠️
            </div>

            <p>{error}</p>

            <button
              type="button"
              className="my-orders-retry"
              onClick={handleRetry}
            >
              Retry
            </button>
          </div>
        )}

        {/* EMPTY */}

        {!loading && !error && orders.length === 0 && (
          <div className="my-orders-state">
            <div className="my-orders-state-icon">
              🛍️
            </div>

            <p>
              No orders yet. Browse the menu and place
              your first order!
            </p>

            <Link
              to="/menu"
              className="my-orders-retry"
            >
              Order Food
            </Link>
          </div>
        )}

        {/* LIST */}

        {!loading && !error && orders.length > 0 && (
          <>
            <div className="my-orders-list">
              {orders.map((order) => {
                const isExpanded =
                  expandedOrderId === order.id;

                const itemCount = order.items.reduce(
                  (total, item) =>
                    total + item.quantity,
                  0
                );

                return (
                  <div
                    className="my-orders-item"
                    key={order.id}
                  >
                    {/* ROW */}

                    <button
                      type="button"
                      className="my-orders-row"
                      onClick={() =>
                        toggleExpanded(order.id)
                      }
                      aria-expanded={isExpanded}
                    >
                      <span className="my-orders-row-icon">
                        🧾
                      </span>

                      <span className="my-orders-row-info">
                        <strong>
                          {order.orderNumber}
                        </strong>

                        <small>
                          {formatDate(order.createdAt)}
                          {" · "}
                          {itemCount}{" "}
                          {itemCount === 1
                            ? "item"
                            : "items"}
                        </small>
                      </span>

                      <span
                        className={`my-orders-badge my-orders-badge-${order.status}`}
                      >
                        {STATUS_LABELS[order.status] ||
                          order.status}
                      </span>

                      <span className="my-orders-row-total">
                        ₹
                        {(
                          order.pricing?.grandTotal ?? 0
                        ).toFixed(2)}
                      </span>

                      <span
                        className={`my-orders-chevron ${
                          isExpanded ? "open" : ""
                        }`}
                      >
                        ›
                      </span>
                    </button>

                    {/* EXPANDED DETAILS */}

                    {isExpanded && (
                      <div className="my-orders-details">
                        {/* ITEMS */}

                        <div className="my-orders-items">
                          {order.items.map(
                            (item, index) => (
                              <div
                                className="my-orders-item-line"
                                key={`${order.id}-${
                                  item.foodId || index
                                }`}
                              >
                                <span className="item-line-name">
                                  <strong>
                                    {item.quantity} ×{" "}
                                    {item.name}
                                  </strong>

                                  {item.cookingRequest && (
                                    <small>
                                      Cooking request:{" "}
                                      {item.cookingRequest}
                                    </small>
                                  )}
                                </span>

                                <strong className="item-line-total">
                                  ₹
                                  {(
                                    item.price *
                                    item.quantity
                                  ).toFixed(2)}
                                </strong>
                              </div>
                            )
                          )}
                        </div>

                        {/* PRICING */}

                        <div className="my-orders-pricing">
                          <div>
                            <span>Subtotal</span>
                            <strong>
                              ₹
                              {(
                                order.pricing?.subtotal ??
                                0
                              ).toFixed(2)}
                            </strong>
                          </div>

                          {(order.pricing?.discount ??
                            0) > 0 && (
                            <div className="discount">
                              <span>
                                Discount
                                {order.pricing
                                  .couponCode
                                  ? ` (${order.pricing.couponCode})`
                                  : ""}
                              </span>
                              <strong>
                                -$
                                {order.pricing.discount.toFixed(
                                  2
                                )}
                              </strong>
                            </div>
                          )}

                          <div>
                            <span>Delivery</span>
                            <strong>
                              {order.pricing
                                ?.deliveryFee === 0
                                ? "FREE"
                                : `$${(
                                    order.pricing
                                      ?.deliveryFee ?? 0
                                  ).toFixed(2)}`}
                            </strong>
                          </div>

                          <div>
                            <span>Service Fee</span>
                            <strong>
                              ₹
                              {(
                                order.pricing
                                  ?.serviceFee ?? 0
                              ).toFixed(2)}
                            </strong>
                          </div>

                          <div>
                            <span>Tax</span>
                            <strong>
                              ₹
                              {(
                                order.pricing?.tax ?? 0
                              ).toFixed(2)}
                            </strong>
                          </div>

                          <div className="grand">
                            <span>Total</span>
                            <strong>
                              ₹
                              {(
                                order.pricing
                                  ?.grandTotal ?? 0
                              ).toFixed(2)}
                            </strong>
                          </div>
                        </div>

                        {/* META */}

                        <div className="my-orders-meta">
                          <span>
                            💳{" "}
                            {PAYMENT_METHOD_LABELS[
                              order.paymentMethod
                            ] || order.paymentMethod}
                          </span>

                          <span>
                            {order.deliveryType ===
                            "pickup"
                              ? "🏪 Pickup order"
                              : "🛵 Delivery order"}
                          </span>

                          <div className="my-orders-actions">
                            <Link
                              to={`/order-success/${order.id}`}
                              className="my-orders-view-link"
                            >
                              View Details →
                            </Link>

                            <button
                              type="button"
                              className="my-orders-reorder"
                              onClick={() => handleReorder(order)}
                            >
                              {reorderState.loading ? "Checking..." : "Reorder"}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* LOAD MORE */}

            {hasMore && (
              <div className="my-orders-footer">
                <button
                  type="button"
                  className="my-orders-load-more"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                >
                  {loadingMore
                    ? "Loading..."
                    : "Load More Orders"}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {reorderState.message && (
        <div className={"my-orders-reorder-toast my-orders-reorder-toast-" + reorderState.type} role="status">
          <span className="my-orders-reorder-toast-icon">
            {reorderState.type === "success" ? "✓" : reorderState.type === "loading" ? "…" : "!"}
          </span>
          <span className="my-orders-reorder-toast-message">
            {reorderState.message}
          </span>
          {reorderState.type !== "loading" && (
            <button
              type="button"
              className="my-orders-reorder-toast-action"
              onClick={() => navigate("/cart")}
            >
              View Cart
            </button>
          )}
          <button
            type="button"
            className="my-orders-reorder-toast-close"
            aria-label="Close"
            onClick={() =>
              setReorderState({
                loading: false,
                message: "",
                type: "",
              })
            }
          >
            ×
          </button>
        </div>
      )}
    </section>
  );
}

export default MyOrders;