import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import IssueChatModal from "../components/IssueChatModal";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAssignedOrders,
  fetchMyOrders,
  fetchRestaurantOrders,
  deleteCustomerOrder
} from "../redux/orderSlice";
import formatCurrency from "../utils/formatCurrency";
import getFoodImage from "../utils/getFoodImage";

const formatDateTime = (value) =>
  new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit"
  });

const isSameDay = (value, today) => {
  const date = new Date(value);

  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
};

const getOwnerAnalytics = (orders) => {
  const deliveredOrders = orders.filter((order) => order.status === "Delivered");
  const today = new Date();

  const itemStats = deliveredOrders.reduce((summary, order) => {
    order.items.forEach((item) => {
      const existing = summary[item.name] || {
        name: item.name,
        quantitySold: 0,
        orderCount: 0,
        revenue: 0,
        lastOrderedAt: order.updatedAt || order.createdAt
      };

      existing.quantitySold += item.quantity;
      existing.orderCount += 1;
      existing.revenue += item.price * item.quantity;

      if (new Date(order.updatedAt || order.createdAt) > new Date(existing.lastOrderedAt)) {
        existing.lastOrderedAt = order.updatedAt || order.createdAt;
      }

      summary[item.name] = existing;
    });

    return summary;
  }, {});

  const bestSellingItems = Object.values(itemStats).sort(
    (left, right) => right.quantitySold - left.quantitySold
  );

  return {
    totalOrders: orders.length,
    completedOrders: deliveredOrders.length,
    totalItemsSold: deliveredOrders.reduce(
      (sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
      0
    ),
    totalRevenue: deliveredOrders.reduce(
      (sum, order) => sum + (order.pricing?.totalAmount || 0),
      0
    ),
    todayRevenue: deliveredOrders
      .filter((order) => isSameDay(order.updatedAt || order.createdAt, today))
      .reduce((sum, order) => sum + (order.pricing?.totalAmount || 0), 0),
    bestSellingItems
  };
};

const getSalesHistoryByDate = (orders) => {
  const deliveredOrders = orders.filter((order) => order.status === "Delivered");

  const historyMap = deliveredOrders.reduce((summary, order) => {
    const originalDate = new Date(order.updatedAt || order.createdAt);
    const dateStr = originalDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });

    if (!summary[dateStr]) {
      summary[dateStr] = {
        date: dateStr,
        originalDate,
        revenue: 0,
        orderCount: 0,
        items: {}
      };
    }

    summary[dateStr].revenue += (order.pricing?.totalAmount || 0);
    summary[dateStr].orderCount += 1;

    order.items.forEach(item => {
      summary[dateStr].items[item.name] = (summary[dateStr].items[item.name] || 0) + item.quantity;
    });

    return summary;
  }, {});

  // Convert to array and sort by most recent date first
  return Object.values(historyMap).sort((a, b) => b.originalDate - a.originalDate);
};

const OwnerOrdersView = ({ orders }) => {
  const analytics = useMemo(() => getOwnerAnalytics(orders), [orders]);
  const salesHistory = useMemo(() => getSalesHistoryByDate(orders), [orders]);
  const [expandedDates, setExpandedDates] = useState({});

  const toggleDate = (date) => {
    setExpandedDates(prev => ({ ...prev, [date]: !prev[date] }));
  };

  return (
    <section className="list-stack">
      <div className="section-head">
        <h2>Order Sales Summary</h2>
        <p>Track completed orders, item demand, and today&apos;s sales from one place.</p>
      </div>

      <div className="info-grid">
        <article className="card">
          <div className="card-body">
            <h3>Total Orders</h3>
            <p>{analytics.totalOrders}</p>
          </div>
        </article>
        <article className="card">
          <div className="card-body">
            <h3>Completed Orders</h3>
            <p>{analytics.completedOrders}</p>
          </div>
        </article>
        <article className="card">
          <div className="card-body">
            <h3>Total Items Sold</h3>
            <p>{analytics.totalItemsSold}</p>
          </div>
        </article>
        <article className="card">
          <div className="card-body">
            <h3>Today&apos;s Sales</h3>
            <p>{formatCurrency(analytics.todayRevenue)}</p>
          </div>
        </article>
      </div>

      <div className="info-grid">
        <article className="card">
          <div className="card-body">
            <h3>Total Revenue</h3>
            <p>{formatCurrency(analytics.totalRevenue)}</p>
          </div>
        </article>
        <article className="card">
          <div className="card-body">
            <h3>Most Ordered Item</h3>
            <p>{analytics.bestSellingItems[0]?.name || "No completed sales yet"}</p>
          </div>
        </article>
      </div>

      <article className="card">
        <div className="card-body">
          <h3>Best Selling Items</h3>
          {analytics.bestSellingItems.length ? (
            <div className="list-stack">
              {analytics.bestSellingItems.map((item) => (
                <div key={item.name} className="cart-item">
                  <div>
                    <strong>{item.name}</strong>
                    <p>
                      Sold {item.quantitySold} item(s) in {item.orderCount} completed order(s)
                    </p>
                    <p>Last sold: {formatDateTime(item.lastOrderedAt)}</p>
                  </div>
                  <strong>{formatCurrency(item.revenue)}</strong>
                </div>
              ))}
            </div>
          ) : (
            <p>No completed orders yet. Delivered orders will appear here automatically.</p>
          )}
        </div>
      </article>

      <article className="card">
        <div className="card-body">
          <h3>Sales History by Date</h3>
          {salesHistory.length ? (
            <div className="list-stack">
              {salesHistory.map((day) => (
                <div key={day.date} className="cart-item" style={{ display: 'block' }}>
                  <div 
                    onClick={() => toggleDate(day.date)}
                    style={{ display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }}
                  >
                    <strong>{day.date}</strong>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <strong>{formatCurrency(day.revenue)}</strong>
                      <span>{expandedDates[day.date] ? '▼' : '▶'}</span>
                    </div>
                  </div>
                  
                  {expandedDates[day.date] && (
                    <div style={{ marginTop: '0.8rem', paddingTop: '0.8rem', borderTop: '1px solid #e2e8f0', fontSize: '0.95rem' }}>
                      <p><strong>Total Orders Delivered:</strong> {day.orderCount}</p>
                      <div style={{ marginTop: '0.5rem' }}>
                        <strong>Items Sold Breakdown:</strong>
                        <ul style={{ paddingLeft: '1.2rem', marginTop: '0.4rem', color: '#4b5563' }}>
                          {Object.entries(day.items).map(([name, qty]) => (
                            <li key={name}>{name} (x{qty})</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p>No sales history available yet.</p>
          )}
        </div>
      </article>

      <article className="card">
        <div className="card-body">
          <h3>Recent Restaurant Orders</h3>
          {orders.length ? (
            <div className="list-stack">
              {orders.map((order) => (
                <div key={order._id} className="cart-item">
                  <div>
                    <strong>Order #{order._id.slice(-6)}</strong>
                    <p>Customer: {order.customerId?.name || "Customer"}</p>
                    <p>
                      Items:{" "}
                      {order.items
                        .map((item) => `${item.name} x${item.quantity}`)
                        .join(", ")}
                    </p>
                    <p>Placed: {formatDateTime(order.createdAt)}</p>
                  </div>
                  <div>
                    <p>Status: {order.status}</p>
                    <strong>{formatCurrency(order.pricing?.totalAmount || 0)}</strong>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No restaurant orders available yet.</p>
          )}
        </div>
      </article>
    </section>
  );
};

const CustomerOrdersView = ({ orders }) => {
  const dispatch = useDispatch();
  const [chatOrderId, setChatOrderId] = useState(null);

  return (
    <section>
      {chatOrderId && <IssueChatModal orderId={chatOrderId} onClose={() => setChatOrderId(null)} />}
      <h2>My Orders</h2>
      <div className="list-stack">
        {orders.map((order) => (
          <article key={order._id} className="card order-history-card">
            <img 
              src={getFoodImage(order.items[0])} 
              alt={order.items[0]?.name || "Order Item"} 
              className="order-history-image"
            />
            <div className="card-body order-history-body">
              <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {order.restaurantId?.name}
                {order.status === "Delivered" && (
                  <span title="Delivered" style={{ color: "#22c55e", fontSize: "1.2rem" }}>✅</span>
                )}
              </h3>
              <p>
                Status: <strong>{order.status}</strong>
              </p>
              <p style={{ fontSize: "0.9rem", color: "#66717f" }}>
                {order.status === "Delivered" ? "Delivered on: " : "Placed on: "}
                {formatDateTime(order.status === "Delivered" ? (order.updatedAt || order.createdAt) : order.createdAt)}
              </p>
              <p>Total: {formatCurrency(order.pricing.totalAmount)}</p>
              {order.issueReport?.isRaised && !order.issueReport?.resolved && (
                <div style={{ backgroundColor: "#fee2e2", padding: "10px", borderRadius: "4px", marginBottom: "10px", marginTop: "10px" }}>
                  <p style={{ color: "#991b1b", margin: 0 }}><strong>Your Issue:</strong> {order.issueReport.message}</p>
                  <button className="button secondary" style={{ marginTop: "10px", borderColor: "#e36935", color: "#e36935" }} onClick={() => setChatOrderId(order._id)}>
                    View Support Chat
                  </button>
                </div>
              )}
              <div className="space-between order-history-actions" style={{ marginTop: "1rem", gap: "10px", alignItems: "center" }}>
                <Link className="button" to={`/orders/${order._id}/tracking`} style={{ margin: 0 }}>
                  Track Order
                </Link>
                <button 
                  className="button secondary" 
                  style={{ margin: 0, borderColor: "#ef4444", color: "#ef4444" }}
                  onClick={() => {
                    if(window.confirm("Are you sure you want to permanently delete this order from your history?")) {
                      dispatch(deleteCustomerOrder(order._id));
                    }
                  }}
                >
                  Delete History
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

const DeliveryOrdersView = ({ orders }) => (
  <section className="list-stack">
    <div className="section-head">
      <h2>Assigned Deliveries</h2>
      <p>See your delivery workload and latest assigned orders.</p>
    </div>
    <div className="info-grid">
      <article className="card">
        <div className="card-body">
          <h3>Total Assigned Orders</h3>
          <p>{orders.length}</p>
        </div>
      </article>
      <article className="card">
        <div className="card-body">
          <h3>Delivered Orders</h3>
          <p>{orders.filter((order) => order.status === "Delivered").length}</p>
        </div>
      </article>
    </div>
    <article className="card">
      <div className="card-body">
        <h3>Delivery Order List</h3>
        {orders.length ? (
          <div className="list-stack">
            {orders.map((order) => (
              <div key={order._id} className="cart-item">
                <div>
                  <strong>{order.restaurantId?.name}</strong>
                  <p>Customer: {order.customerId?.name || "Customer"}</p>
                  <p>Status: {order.status}</p>
                </div>
                <strong>{formatCurrency(order.pricing?.totalAmount || 0)}</strong>
              </div>
            ))}
          </div>
        ) : (
          <p>No assigned orders yet.</p>
        )}
      </div>
    </article>
  </section>
);

const Orders = () => {
  const dispatch = useDispatch();
  const { list } = useSelector((state) => state.orders);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (user?.role === "owner" || user?.role === "admin") {
      dispatch(fetchRestaurantOrders());
      return;
    }

    if (user?.role === "delivery") {
      dispatch(fetchAssignedOrders());
      return;
    }

    dispatch(fetchMyOrders());
  }, [dispatch, user?.role]);

  if (user?.role === "owner" || user?.role === "admin") {
    return <OwnerOrdersView orders={list} />;
  }

  if (user?.role === "delivery") {
    return <DeliveryOrdersView orders={list} />;
  }

  return <CustomerOrdersView orders={list} />;
};

export default Orders;
