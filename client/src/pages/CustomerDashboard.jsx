import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchMyOrders } from "../redux/orderSlice";
import orderService from "../services/orderService";
import { getApiErrorMessage } from "../services/api";

const CustomerDashboard = () => {
  const dispatch = useDispatch();
  const { list } = useSelector((state) => state.orders);
  const deliveredOrders = list.filter((order) => order.status === "Delivered").length;
  const activeOrders = list.filter((order) => order.status !== "Delivered" && order.status !== "Cancelled").length;
  const [form, setForm] = useState({
    orderId: "",
    issueType: "Delivery Delay",
    message: ""
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    dispatch(fetchMyOrders());
  }, [dispatch]);

  const submitIssue = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.orderId) {
      setError("Please select an order before submitting an issue.");
      return;
    }

    if (!form.message.trim()) {
      setError("Please explain the issue clearly.");
      return;
    }

    try {
      await orderService.raiseIssue(form.orderId, {
        message: `${form.issueType}: ${form.message.trim()}`
      });

      setSuccess("Your issue has been sent to customer care.");
      setForm({
        orderId: "",
        issueType: "Delivery Delay",
        message: ""
      });
    } catch (submitError) {
      setError(getApiErrorMessage(submitError));
    }
  };

  return (
    <section className="list-stack">
      <h2>Customer Dashboard</h2>

      <div className="info-grid">
        <article className="card">
          <div className="card-body">
            <h3>Total Orders</h3>
            <p>{list.length}</p>
          </div>
        </article>
        <article className="card">
          <div className="card-body">
            <h3>Delivered Orders</h3>
            <p>{deliveredOrders}</p>
          </div>
        </article>
        <article className="card">
          <div className="card-body">
            <h3>Active Orders</h3>
            <p>{activeOrders}</p>
          </div>
        </article>
      </div>

      <div className="info-grid">
        <article className="card">
          <div className="card-body">
            <h3>Customer Care</h3>
            <p>Phone: +91 98765 43210</p>
            <p>Email: support@foodflow.com</p>
            <p>Available every day from 8:00 AM to 11:00 PM</p>
            <Link className="button secondary" to="/orders">
              View My Orders
            </Link>
          </div>
        </article>

        <form className="form-card" onSubmit={submitIssue}>
          <h3>Raise an Issue</h3>
          <select
            value={form.orderId}
            onChange={(e) => setForm({ ...form, orderId: e.target.value })}
          >
            <option value="">Select your order</option>
            {list.map((order) => (
              <option key={order._id} value={order._id}>
                {order.restaurantId?.name || "Restaurant"} - Order #{order._id.slice(-6)}
              </option>
            ))}
          </select>

          <select
            value={form.issueType}
            onChange={(e) => setForm({ ...form, issueType: e.target.value })}
          >
            <option value="Delivery Delay">Delivery Delay</option>
            <option value="Wrong Item">Wrong Item</option>
            <option value="Missing Item">Missing Item</option>
            <option value="Payment Problem">Payment Problem</option>
            <option value="Food Quality">Food Quality</option>
          </select>

          <textarea
            rows="5"
            placeholder="Describe the issue here..."
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
          />

          {error ? <p className="error-text">{error}</p> : null}
          {success ? <p>{success}</p> : null}

          <button className="button">Submit Issue</button>
        </form>
      </div>
    </section>
  );
};

export default CustomerDashboard;
