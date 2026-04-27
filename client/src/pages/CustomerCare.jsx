import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import orderService from "../services/orderService";
import { getApiErrorMessage } from "../services/api";

const CustomerCare = () => {
  const { user } = useSelector((state) => state.auth);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    orderId: "",
    issueType: "Delivery Delay",
    message: ""
  });

  useEffect(() => {
    if (user?.role !== "customer") {
      return;
    }

    let isMounted = true;

    const loadOrders = async () => {
      try {
        setLoadingOrders(true);
        const data = await orderService.getMyOrders();

        if (isMounted) {
          setOrders(data);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(getApiErrorMessage(loadError));
        }
      } finally {
        if (isMounted) {
          setLoadingOrders(false);
        }
      }
    };

    loadOrders();

    return () => {
      isMounted = false;
    };
  }, [user?.role]);

  const submitIssue = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.orderId) {
      setError("Please select an order before submitting an issue.");
      return;
    }

    if (!form.message.trim()) {
      setError("Please describe your issue so customer care can help properly.");
      return;
    }

    try {
      await orderService.raiseIssue(form.orderId, {
        message: `${form.issueType}: ${form.message.trim()}`
      });

      setSuccess("Your issue has been submitted to customer care.");
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
      <div className="hero inner-hero">
        <div className="hero-copy">
          <p className="eyebrow">Customer Care</p>
          <h1>We&apos;re here to help with orders, payments, and delivery issues.</h1>
          <p>
            Reach support quickly if your order is delayed, incorrect, missing, or if you need
            help with payment or delivery updates.
          </p>
        </div>
      </div>

      <div className="info-grid">
        <article className="card">
          <div className="card-body">
            <h3>Call Support</h3>
            <p>+91 98765 43210</p>
            <p>Available every day from 8:00 AM to 11:00 PM</p>
          </div>
        </article>
        <article className="card">
          <div className="card-body">
            <h3>Email Support</h3>
            <p>support@foodflow.com</p>
            <p>For billing, refund, and delivery help</p>
          </div>
        </article>
        <article className="card">
          <div className="card-body">
            <h3>Quick Help</h3>
            <p>Track your order, check order history, or report an issue from below.</p>
          </div>
        </article>
      </div>

      {user?.role === "customer" ? (
        <form className="form-card wide-form" onSubmit={submitIssue}>
          <h2>Raise an Order Issue</h2>
          <select
            value={form.orderId}
            onChange={(e) => setForm({ ...form, orderId: e.target.value })}
            disabled={loadingOrders}
          >
            <option value="">Select your order</option>
            {orders.map((order) => (
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
            placeholder="Explain your issue clearly..."
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
          />

          {error ? <p className="error-text">{error}</p> : null}
          {success ? <p>{success}</p> : null}

          <button className="button">Submit to Customer Care</button>
        </form>
      ) : (
        <article className="card">
          <div className="card-body">
            <h3>Need order-specific help?</h3>
            <p>Log in with a customer account to raise an issue directly for your order.</p>
            <Link className="button" to="/login">
              Login
            </Link>
          </div>
        </article>
      )}
    </section>
  );
};

export default CustomerCare;
