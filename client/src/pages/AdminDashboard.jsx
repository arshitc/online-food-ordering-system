import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { impersonateUser } from "../redux/authSlice";
import API from "../services/api";
import formatCurrency from "../utils/formatCurrency";

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [payments, setPayments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [deliverySettings, setDeliverySettings] = useState(null);
  const [deliverySettingsForm, setDeliverySettingsForm] = useState({
    deliveryRatePerKm: "",
    minimumDeliveryFee: "",
    defaultDeliveryFee: ""
  });
  const [deliverySettingsMessage, setDeliverySettingsMessage] = useState("");

  useEffect(() => {
    API.get("/admin/stats").then(({ data }) => setStats(data));
    API.get("/admin/users").then(({ data }) => setUsers(data));
    API.get("/admin/complaints").then(({ data }) => setComplaints(data));
    API.get("/admin/payments").then(({ data }) => setPayments(data));
    API.get("/admin/orders").then(({ data }) => setOrders(data));
    API.get("/admin/delivery-settings").then(({ data }) => {
      setDeliverySettings(data);
      setDeliverySettingsForm({
        deliveryRatePerKm: String(data.deliveryRatePerKm ?? ""),
        minimumDeliveryFee: String(data.minimumDeliveryFee ?? ""),
        defaultDeliveryFee: String(data.defaultDeliveryFee ?? "")
      });
    });
  }, []);

  const toggleUser = async (id, isActive) => {
    await API.put(`/admin/users/${id}`, { isActive: !isActive });
    const { data } = await API.get("/admin/users");
    setUsers(data);
  };

  const deleteUserRecord = async (id) => {
    if (window.confirm("Are you sure you want to permanently delete this user?")) {
      await API.delete(`/admin/users/${id}`);
      const { data } = await API.get("/admin/users");
      setUsers(data);
    }
  };

  const resolveComplaint = async (id) => {
    await API.put(`/admin/complaints/${id}/resolve`);
    const { data } = await API.get("/admin/complaints");
    setComplaints(data);
  };

  const handleImpersonate = async (targetUserId) => {
    if (window.confirm("Are you sure you want to log in as this user? You will lose your Admin session and will need to log back in later.")) {
      try {
        await dispatch(impersonateUser(targetUserId)).unwrap();
        window.location.href = "/";
      } catch (err) {
        alert(err || "Failed to impersonate user.");
      }
    }
  };

  const updateDeliverySettings = async (e) => {
    e.preventDefault();
    setDeliverySettingsMessage("");

    try {
      const { data } = await API.put("/admin/delivery-settings", {
        deliveryRatePerKm: Number(deliverySettingsForm.deliveryRatePerKm),
        minimumDeliveryFee: Number(deliverySettingsForm.minimumDeliveryFee),
        defaultDeliveryFee: Number(deliverySettingsForm.defaultDeliveryFee)
      });

      setDeliverySettings(data);
      setDeliverySettingsMessage("Delivery rate updated successfully.");
    } catch (error) {
      setDeliverySettingsMessage(error.response?.data?.message || "Unable to update delivery settings.");
    }
  };

  return (
    <section>
      <h2>Admin Dashboard</h2>
      {stats ? (
        <div className="info-grid">
          <article className="card">
            <div className="card-body">
              <h3>Users</h3>
              <p>{stats.users}</p>
            </div>
          </article>
          <article className="card">
            <div className="card-body">
              <h3>Restaurants</h3>
              <p>{stats.restaurants}</p>
            </div>
          </article>
          <article className="card">
            <div className="card-body">
              <h3>Orders</h3>
              <p>{stats.orders}</p>
            </div>
          </article>
          <article className="card">
            <div className="card-body">
              <h3>Revenue</h3>
              <p>{stats.totalRevenue}</p>
            </div>
          </article>
        </div>
      ) : null}

      <section className="form-page admin-delivery-settings-page">
        <form className="form-card wide-form admin-delivery-settings" onSubmit={updateDeliverySettings}>
          <div>
            <p className="eyebrow">Delivery Pricing</p>
            <h3>Set Delivery Rate Per Kilometer</h3>
            <p>
              Customers see this delivery charge during checkout, and final orders use the same rate.
            </p>
          </div>
          <div className="info-grid">
            <label>
              Rate per km
              <input
                type="number"
                min="0"
                step="0.01"
                value={deliverySettingsForm.deliveryRatePerKm}
                onChange={(e) =>
                  setDeliverySettingsForm((current) => ({
                    ...current,
                    deliveryRatePerKm: e.target.value
                  }))
                }
              />
            </label>
            <label>
              Minimum delivery fee
              <input
                type="number"
                min="0"
                step="0.01"
                value={deliverySettingsForm.minimumDeliveryFee}
                onChange={(e) =>
                  setDeliverySettingsForm((current) => ({
                    ...current,
                    minimumDeliveryFee: e.target.value
                  }))
                }
              />
            </label>
            <label>
              Fallback fee
              <input
                type="number"
                min="0"
                step="0.01"
                value={deliverySettingsForm.defaultDeliveryFee}
                onChange={(e) =>
                  setDeliverySettingsForm((current) => ({
                    ...current,
                    defaultDeliveryFee: e.target.value
                  }))
                }
              />
            </label>
          </div>
          <p>
            Current rule: {formatCurrency(deliverySettings?.deliveryRatePerKm || 0)} per km,
            minimum {formatCurrency(deliverySettings?.minimumDeliveryFee || 0)}, fallback{" "}
            {formatCurrency(deliverySettings?.defaultDeliveryFee || 0)} when GPS is missing.
          </p>
          {deliverySettingsMessage ? <p>{deliverySettingsMessage}</p> : null}
          <button className="button">Save Delivery Pricing</button>
        </form>
      </section>

      <section>
        <h3>Users Management</h3>
        <div className="list-stack">
          {users.map((user) => (
            <article key={user._id} className="card">
              <div className="card-body space-between">
                <div>
                  <h4>{user.name}</h4>
                  <p>
                    {user.email} | <span style={{ textTransform: 'capitalize', fontWeight: 'bold' }}>{user.role}</span>
                  </p>
                  
                  <details style={{ marginTop: '10px', fontSize: '0.9rem', color: '#475569' }}>
                    <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#3b82f6' }}>View Full Profile Details</summary>
                    <div style={{ marginTop: '10px', padding: '12px', backgroundColor: '#f1f5f9', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                       <p style={{ margin: '0 0 5px 0' }}><strong>Phone Number:</strong> {user.phone || 'Not provided'}</p>
                       <p style={{ margin: '0 0 5px 0' }}><strong>Account Status:</strong> {user.isActive ? '✅ Active' : '❌ Disabled'}</p>
                       <p style={{ margin: '0 0 5px 0' }}><strong>Joined Date:</strong> {new Date(user.createdAt).toLocaleString()}</p>
                       <p style={{ margin: '0 0 5px 0' }}><strong>Database ID:</strong> <code style={{ fontSize: '0.8rem' }}>{user._id}</code></p>
                       {user.addresses?.length > 0 && (
                         <div style={{ marginTop: '10px' }}>
                           <strong>Saved Addresses:</strong>
                           <ol style={{ paddingLeft: '20px', marginTop: '5px', marginBottom: 0 }}>
                             {user.addresses.map((addr, i) => (
                               <li key={i}>{addr.street || addr.line1}, {addr.city}, {addr.state} {addr.postalCode}</li>
                             ))}
                           </ol>
                         </div>
                       )}
                    </div>
                  </details>
                </div>
                <div className="action-row admin-action-row">
                  {user.role !== "admin" && (
                    <button
                      className="button"
                      style={{ backgroundColor: "#8b5cf6", borderColor: "#8b5cf6", color: "white" }}
                      onClick={() => handleImpersonate(user._id)}
                    >
                      Login As User
                    </button>
                  )}
                  <button
                    className="button secondary"
                    onClick={() => toggleUser(user._id, user.isActive)}
                  >
                    {user.isActive ? "Disable" : "Activate"}
                  </button>
                  <button
                    className="button secondary"
                    style={{ borderColor: "#ef4444", color: "#ef4444" }}
                    onClick={() => deleteUserRecord(user._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h3>Complaints and Issues</h3>
        <div className="list-stack">
          {complaints.map((order) => (
            <article key={order._id} className="card">
              <div className="card-body">
                <p>
                  Order #{order._id.slice(-6)} - {order.issueReport.message}
                </p>
                <button className="button" onClick={() => resolveComplaint(order._id)}>
                  Mark Resolved
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h3>Recent Orders</h3>
        <div className="list-stack">
          {orders.slice(0, 5).map((order) => (
            <article key={order._id} className="card">
              <div className="card-body">
                <p>
                  Order #{order._id.slice(-6)} | {order.restaurantId?.name} | {order.status}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h3>Recent Payments</h3>
        <div className="list-stack">
          {payments.slice(0, 5).map((payment) => (
            <article key={payment._id} className="card">
              <div className="card-body">
                <p>
                  {payment.customerId?.name} paid {payment.amount} via {payment.gateway} -{" "}
                  {payment.paymentStatus}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
};

export default AdminDashboard;
