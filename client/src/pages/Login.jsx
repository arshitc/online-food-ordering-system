import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { loginUser } from "../redux/authSlice";

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, error } = useSelector((state) => state.auth);
  const [form, setForm] = useState({ email: "", password: "" });
  const redirectTo = location.state?.redirectTo || "/";
  const prompt = location.state?.prompt;

  const submitHandler = async (e) => {
    e.preventDefault();
    const result = await dispatch(loginUser(form));
    if (!result.error) {
      navigate(redirectTo, { replace: true });
    }
  };

  return (
    <section className="form-page">
      <form className="form-card" onSubmit={submitHandler}>
        <h2>Login</h2>
        {prompt ? (
          <div className="auth-form-message">
            <strong>Welcome back</strong>
            <p>{prompt}</p>
          </div>
        ) : null}
        <input
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        {error && <p className="error-text">{error}</p>}
        <button className="button" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
        <p>
          New user? <Link to="/register" state={{ redirectTo, prompt }}>Register here</Link>
        </p>
      </form>
    </section>
  );
};

export default Login;
