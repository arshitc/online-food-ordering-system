import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { registerUser } from "../redux/authSlice";

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, error } = useSelector((state) => state.auth);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "customer"
  });
  const redirectTo = location.state?.redirectTo || "/";
  const prompt = location.state?.prompt;

  const submitHandler = async (e) => {
    e.preventDefault();
    const result = await dispatch(registerUser(form));
    if (!result.error) {
      navigate(redirectTo, { replace: true });
    }
  };

  return (
    <section className="form-page">
      <form className="form-card" onSubmit={submitHandler}>
        <h2>Create Account</h2>
        {prompt ? (
          <div className="auth-form-message">
            <strong>Almost there</strong>
            <p>{prompt}</p>
          </div>
        ) : null}
        <input
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          placeholder="Phone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
        <input
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
          <option value="customer">Customer</option>
          <option value="owner">Restaurant Owner</option>
          <option value="delivery">Delivery Staff</option>
          <option value="admin">Admin</option>
        </select>
        {error && <p className="error-text">{error}</p>}
        <button className="button" disabled={loading}>
          {loading ? "Creating account..." : "Register"}
        </button>
        <p>
          Already have an account? <Link to="/login" state={{ redirectTo, prompt }}>Login here</Link>
        </p>
      </form>
    </section>
  );
};

export default Register;
