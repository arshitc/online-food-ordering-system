import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import OrderStatus from "../components/OrderStatus";
import { fetchOrderById } from "../redux/orderSlice";
import { addReview } from "../redux/reviewSlice";
import formatCurrency from "../utils/formatCurrency";

const formatArrivalTime = (value) => {
  if (!value) {
    return "Waiting for restaurant update";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Waiting for restaurant update";
  }

  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit"
  });
};

const getDeliveryAgent = (order) => {
  const agent = order?.deliveryStaffId;
  return agent && typeof agent === "object" ? agent : null;
};

const getInitials = (name = "Delivery Partner") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

const getNumber = (value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const formatDistance = (value) => {
  const distance = getNumber(value);

  if (distance === null) {
    return "Waiting for customer GPS";
  }

  return distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1)} km`;
};

const formatSpeed = (value) => {
  const speed = getNumber(value);

  if (speed === null) {
    return "Speed updating";
  }

  return `${Math.round(speed)} km/h`;
};

const formatTrackingAge = (value, now) => {
  if (!value) {
    return "Waiting for GPS update";
  }

  const updatedAt = new Date(value).getTime();

  if (Number.isNaN(updatedAt)) {
    return "Waiting for GPS update";
  }

  const secondsAgo = Math.max(0, Math.floor((now - updatedAt) / 1000));

  if (secondsAgo < 10) {
    return "Updated just now";
  }

  if (secondsAgo < 60) {
    return `Updated ${secondsAgo}s ago`;
  }

  return `Updated ${Math.floor(secondsAgo / 60)}m ago`;
};

const getEtaDetails = (order, now) => {
  const tracking = order?.deliveryTracking || {};
  const distanceToCustomerKm = getNumber(tracking.distanceToCustomerKm);
  const hasDriverGps = Boolean(tracking.updatedAt);

  if (!order?.estimatedDeliveryAt) {
    return {
      label: "ETA updating",
      note: "The restaurant will share an estimated arrival time soon.",
      isLate: false,
      source: "pending"
    };
  }

  if (order.status === "Delivered") {
    return {
      label: "Delivered",
      note: "Your order has reached you.",
      isLate: false,
      source: "completed"
    };
  }

  if (order.status === "Cancelled") {
    return {
      label: "Cancelled",
      note: "This order was cancelled.",
      isLate: false,
      source: "completed"
    };
  }

  const targetTime = new Date(order.estimatedDeliveryAt).getTime();

  if (Number.isNaN(targetTime)) {
    return {
      label: "ETA updating",
      note: "The restaurant will share an estimated arrival time soon.",
      isLate: false,
      source: "pending"
    };
  }

  const remainingMs = targetTime - now;

  if (remainingMs <= 0) {
    return {
      label: "Arriving soon",
      note: hasDriverGps
        ? `${formatTrackingAge(tracking.updatedAt, now)} from delivery partner GPS.`
        : "The estimated time has passed, so please keep your phone reachable.",
      isLate: true,
      source: hasDriverGps ? "live" : "estimated"
    };
  }

  const hours = Math.floor(remainingMs / 3600000);
  const minutes = Math.floor((remainingMs % 3600000) / 60000);
  const seconds = Math.floor((remainingMs % 60000) / 1000);
  const label = hours > 0
    ? `${hours}h ${minutes}m`
    : `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
  const liveNote =
    distanceToCustomerKm !== null && order.status === "Out for Delivery"
      ? `${formatDistance(distanceToCustomerKm)} away at ${formatSpeed(tracking.speedKmph)}. ${formatTrackingAge(tracking.updatedAt, now)}.`
      : null;
  const gpsWaitingNote =
    hasDriverGps && distanceToCustomerKm === null
      ? "Driver GPS is live, but this order does not have exact customer map coordinates."
      : null;
  const prePickupNote =
    hasDriverGps && order.status !== "Out for Delivery"
      ? "Driver GPS is ready. Distance-based ETA starts after pickup."
      : null;

  return {
    label,
    note: liveNote || prePickupNote || gpsWaitingNote || `Estimated arrival around ${formatArrivalTime(order.estimatedDeliveryAt)}.`,
    isLate: false,
    source: liveNote ? "live" : "estimated"
  };
};

const OrderTracking = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { selected } = useSelector((state) => state.orders);
  const { user } = useSelector((state) => state.auth);
  const [review, setReview] = useState({ rating: 5, comment: "" });
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    dispatch(fetchOrderById(id));

    const refreshOrder = setInterval(() => {
      dispatch(fetchOrderById(id));
    }, 30000);

    return () => clearInterval(refreshOrder);
  }, [dispatch, id]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const submitReview = (e) => {
    e.preventDefault();

    dispatch(
      addReview({
        orderId: selected._id,
        restaurantId: selected.restaurantId._id || selected.restaurantId,
        rating: Number(review.rating),
        comment: review.comment
      })
    );
  };

  if (!selected) {
    return <p>Loading order details...</p>;
  }

  const deliveryAgent = getDeliveryAgent(selected);
  const eta = getEtaDetails(selected, now);
  const pricing = selected.pricing || {};
  const items = selected.items || [];
  const tracking = selected.deliveryTracking || {};
  const trackingSpeedSource = tracking.speedSource === "device"
    ? "device GPS"
    : tracking.speedSource === "calculated"
      ? "movement"
      : "estimated";

  return (
    <section className="tracking-page">
      <h2>Order Tracking</h2>

      <div className="tracking-layout">
        <div className="tracking-main">
          <OrderStatus order={selected} />

          <section className="summary-box tracking-info-card">
            <div>
              <p className="eyebrow">Delivery Partner</p>
              <h3>{deliveryAgent ? "Your agent is assigned" : "Agent assignment pending"}</h3>
            </div>

            {deliveryAgent ? (
              <div className="delivery-agent-profile">
                <div className="agent-avatar" aria-hidden="true">
                  {getInitials(deliveryAgent.name)}
                </div>
                <div>
                  <strong>{deliveryAgent.name}</strong>
                  <p>{selected.deliveryAssignmentStatus === "Accepted" ? "Accepted your delivery" : "Assigned delivery agent"}</p>
                </div>
              </div>
            ) : (
              <p>
                The restaurant will assign a delivery agent after preparing your order.
                Agent name and phone number will appear here automatically.
              </p>
            )}

            <div className="delivery-contact-row">
              {deliveryAgent?.phone ? (
                <a className="button secondary" href={`tel:${deliveryAgent.phone}`}>
                  Call {deliveryAgent.phone}
                </a>
              ) : (
                <span className="soft-pill">Phone number not available yet</span>
              )}
              <span className="soft-pill">Status: {selected.deliveryAssignmentStatus || "Pending"}</span>
            </div>
          </section>

          <section className={`summary-box eta-card ${eta.isLate ? "eta-card-late" : ""} ${eta.source === "live" ? "eta-card-live" : ""}`}>
            <div>
              <p className="eyebrow">Live Arrival Timer</p>
              <h3>{eta.label}</h3>
              <p>{eta.note}</p>
            </div>
            <div className="eta-meta-grid">
              <div>
                <span>Current status</span>
                <strong>{selected.status}</strong>
              </div>
              <div>
                <span>Estimated time</span>
                <strong>{formatArrivalTime(selected.estimatedDeliveryAt)}</strong>
              </div>
              <div>
                <span>Distance to you</span>
                <strong>{formatDistance(tracking.distanceToCustomerKm)}</strong>
              </div>
              <div>
                <span>Driver speed</span>
                <strong>{formatSpeed(tracking.speedKmph)}</strong>
              </div>
              <div>
                <span>Speed source</span>
                <strong>{tracking.updatedAt ? trackingSpeedSource : "Waiting for GPS"}</strong>
              </div>
              <div>
                <span>GPS update</span>
                <strong>{formatTrackingAge(tracking.updatedAt, now)}</strong>
              </div>
            </div>
          </section>

          <section className="summary-box">
            <h3>Delivery Address</h3>
            <p>
              {selected.deliveryAddress.line1}, {selected.deliveryAddress.city},{" "}
              {selected.deliveryAddress.state} - {selected.deliveryAddress.postalCode}
            </p>
          </section>
        </div>

        <aside className="summary-box receipt-card" aria-label="Order bill">
          <div>
            <p className="eyebrow">Customer Bill</p>
            <h3>Order Receipt</h3>
            <p className="receipt-note">Clear breakdown of item cost, delivery fee, tax, discount, and final total.</p>
          </div>

          <div className="receipt-items">
            {items.map((item) => (
              <div className="receipt-item" key={item.menuItemId || item.name}>
                <div>
                  <strong>{item.name}</strong>
                  <span>
                    {formatCurrency(item.price)} x {item.quantity}
                  </span>
                </div>
                <strong>{formatCurrency((item.price || 0) * (item.quantity || 0))}</strong>
              </div>
            ))}
          </div>

          <div className="receipt-lines">
            <div>
              <span>Subtotal</span>
              <strong>{formatCurrency(pricing.subtotal || 0)}</strong>
            </div>
            <div>
              <span>Delivery fee</span>
              <strong>{formatCurrency(pricing.deliveryFee || 0)}</strong>
            </div>
            <div>
              <span>Tax</span>
              <strong>{formatCurrency(pricing.tax || 0)}</strong>
            </div>
            {pricing.discount > 0 ? (
              <div className="receipt-discount">
                <span>Discount</span>
                <strong>-{formatCurrency(pricing.discount)}</strong>
              </div>
            ) : null}
          </div>

          <div className="receipt-total">
            <span>Total to pay</span>
            <strong>{formatCurrency(pricing.totalAmount || 0)}</strong>
          </div>

          <div className="receipt-payment">
            <span className="soft-pill">Payment: {selected.paymentMethod}</span>
            <span className="soft-pill">Status: {selected.paymentStatus}</span>
          </div>
        </aside>
      </div>

      {selected.status === "Delivered" && user?.role === "customer" ? (
        <form className="form-card" onSubmit={submitReview}>
          <h3>Rate Your Order</h3>
          <select value={review.rating} onChange={(e) => setReview({ ...review, rating: e.target.value })}>
            {[5, 4, 3, 2, 1].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <textarea
            placeholder="Share your feedback"
            value={review.comment}
            onChange={(e) => setReview({ ...review, comment: e.target.value })}
          />
          <button className="button">Submit Review</button>
        </form>
      ) : null}
    </section>
  );
};

export default OrderTracking;
