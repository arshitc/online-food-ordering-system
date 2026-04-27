import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

const Footer = () => {
  const { user } = useSelector((state) => state.auth);

  return (
    <footer className="footer">
      <div className="footer-brand">
        <div className="footer-logo-block">
          <h3 className="footer-logo">FoodFlow</h3>
          <p className="footer-tagline">Fast ordering for real cravings.</p>
        </div>
        <p className="footer-lead">
          Fresh food, quick delivery, and a smoother ordering experience from nearby
          restaurants you actually want to order from.
        </p>
        <div className="footer-badges">
          <span className="footer-badge">Fast Delivery</span>
          <span className="footer-badge">Live Tracking</span>
          <span className="footer-badge">Simple Checkout</span>
        </div>
      </div>

      <div className="footer-links">
        <p className="footer-title">Explore</p>
        <div className="footer-nav">
          <Link to="/">Home</Link>
          <Link to="/restaurants">Restaurants</Link>
          <Link to={user ? "/orders" : "/login"}>{user ? "My Orders" : "Login"}</Link>
          <Link to={user ? "/profile" : "/register"}>{user ? "Profile" : "Register"}</Link>
        </div>
      </div>

      <div className="footer-note">
        <p className="footer-title">Why FoodFlow</p>
        <p>
          Browse menus confidently, place orders in minutes, and keep track of every
          step from kitchen to doorstep.
        </p>
        <p className="footer-meta">Available daily. Built for quick ordering on desktop and mobile.</p>
      </div>
    </footer>
  );
};

export default Footer;
