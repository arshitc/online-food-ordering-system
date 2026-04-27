import { Link, NavLink, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../redux/authSlice";
import { useEffect, useRef, useState } from "react";
import UpdateOrderModal from "./UpdateOrderModal";

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useSelector((state) => state.auth);
  const cartCount = useSelector((state) =>
    state.cart.items.reduce((sum, item) => sum + item.quantity, 0)
  );
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef(null);
  const supportsMobileSearch = location.pathname === "/" || location.pathname === "/restaurants";
  const mobileSearchQuery = searchParams.get("q") || "";
  const showSearchControl = user?.role !== "delivery" && !location.pathname.startsWith("/dashboard/delivery");
  const currentPath = `${location.pathname}${location.search}`;
  const guestPrompt = location.pathname.startsWith("/restaurants")
    ? "Login or register first to add dishes to your cart and place an order."
    : "Login or register first to start ordering your favorite meals.";
  const guestAuthState = {
    redirectTo: currentPath,
    prompt: guestPrompt
  };
  const hasPrimaryNav = Boolean(user);

  useEffect(() => {
    setIsMenuOpen(false);
    setIsSearchOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsMenuOpen(false);
        setIsSearchOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!isSearchOpen || !searchInputRef.current) {
      return;
    }

    searchInputRef.current.focus();
  }, [isSearchOpen]);

  useEffect(() => {
    if (!supportsMobileSearch || !location.state?.openMobileSearch || window.innerWidth > 768) {
      return;
    }

    setIsSearchOpen(true);
  }, [location.key, location.state, supportsMobileSearch]);

  const handleLogout = () => {
    dispatch(logout());
    setIsMenuOpen(false);
    navigate("/login");
  };

  const updateSearchQuery = (value) => {
    const nextParams = new URLSearchParams(searchParams);

    if (value.trim()) {
      nextParams.set("q", value);
    } else {
      nextParams.delete("q");
    }

    setSearchParams(nextParams, { replace: true });
  };

  const handleSearchToggle = () => {
    setIsMenuOpen(false);

    if (supportsMobileSearch) {
      setIsSearchOpen((open) => !open);
      return;
    }

    navigate("/restaurants", { state: { openMobileSearch: true } });
  };

  const handleMenuToggle = () => {
    setIsSearchOpen(false);
    setIsMenuOpen((open) => !open);
  };

  const handlePanelNavigation = () => {
    setIsMenuOpen(false);
  };

  return (
    <header className={`navbar ${isMenuOpen ? "navbar-open" : ""}`}>
      <div className="navbar-top">
        {isSearchOpen && supportsMobileSearch && showSearchControl ? (
          <div className="nav-mobile-search">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="M16 16L21 21" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              inputMode="search"
              autoComplete="off"
              value={mobileSearchQuery}
              onChange={(e) => updateSearchQuery(e.target.value)}
              placeholder={location.pathname === "/restaurants" ? "Search restaurants" : "Search food"}
              aria-label={location.pathname === "/restaurants" ? "Search restaurants" : "Search food items"}
            />
            {mobileSearchQuery ? (
              <button
                type="button"
                className="nav-search-clear"
                aria-label="Clear search"
                onClick={() => updateSearchQuery("")}
              >
                Clear
              </button>
            ) : null}
          </div>
        ) : (
          <div className="brand-wrap">
            <Link className="brand" to="/">
              FoodFlow
            </Link>
            <span className="brand-subtitle">Order fresh food with ease</span>
          </div>
        )}
        <div className="nav-controls">
          {!user && !isSearchOpen ? (
            <Link className="nav-login-shortcut" to="/login" state={guestAuthState} aria-label="Login">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M12 12.25a4.25 4.25 0 1 0-4.25-4.25A4.25 4.25 0 0 0 12 12.25Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M5.75 19.25a6.25 6.25 0 0 1 12.5 0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Login</span>
            </Link>
          ) : null}
          {showSearchControl ? (
            <button
              type="button"
              className={`nav-search-button ${isSearchOpen ? "is-active" : ""}`}
              aria-label={isSearchOpen ? "Close search" : "Open search"}
              onClick={handleSearchToggle}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M16 16L21 21" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          ) : null}
          <button
            type="button"
            className="nav-toggle"
            aria-expanded={isMenuOpen}
            aria-controls="primary-navigation"
            onClick={handleMenuToggle}
          >
            {isMenuOpen ? "Close" : "Menu"}
          </button>
        </div>
      </div>
      {isMenuOpen ? (
        <button
          type="button"
          className="nav-overlay"
          aria-label="Close menu"
          onClick={() => setIsMenuOpen(false)}
        />
      ) : null}
      <div className={`navbar-panel ${isMenuOpen ? "is-open" : ""}`}>
        {hasPrimaryNav ? (
          <nav className="nav-links" id="primary-navigation">
            <NavLink to="/" onClick={handlePanelNavigation}>Home</NavLink>
            {user?.role === "customer" && (
              <NavLink to="/restaurants" onClick={handlePanelNavigation}>
                Restaurants
              </NavLink>
            )}
            {user?.role === "customer" && (
              <NavLink to="/cart" onClick={handlePanelNavigation}>
                Cart ({cartCount})
              </NavLink>
            )}
            {(user?.role === "customer" || user?.role === "owner") && (
              <NavLink to="/orders" onClick={handlePanelNavigation}>
                Orders
              </NavLink>
            )}
            {user?.role === "customer" && (
              <NavLink to="/dashboard/customer" onClick={handlePanelNavigation}>
                Dashboard
              </NavLink>
            )}
            {user?.role === "owner" && (
              <NavLink to="/dashboard/restaurant" onClick={handlePanelNavigation}>
                Owner Panel
              </NavLink>
            )}
            {user?.role === "owner" && (
              <button
                type="button"
                className="nav-link-button"
                onClick={() => {
                  setShowUpdateModal(true);
                  setIsMenuOpen(false);
                }}
              >
                Update Order
              </button>
            )}
            {user?.role === "delivery" && (
              <NavLink to="/dashboard/delivery" onClick={handlePanelNavigation}>
                Delivery Panel
              </NavLink>
            )}
            {user?.role === "admin" && (
              <NavLink to="/dashboard/admin" onClick={handlePanelNavigation}>
                Admin Panel
              </NavLink>
            )}
          </nav>
        ) : null}
        <div className="nav-actions">
          {user ? (
            <>
              <Link className="profile-link" to="/profile" onClick={handlePanelNavigation}>
                {user.name}
              </Link>
              <button className="button secondary" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" state={guestAuthState} onClick={handlePanelNavigation}>
                Login
              </Link>
              <Link className="button" to="/register" state={guestAuthState} onClick={handlePanelNavigation}>
                Register
              </Link>
            </>
          )}
        </div>
      </div>
      {showUpdateModal && <UpdateOrderModal onClose={() => setShowUpdateModal(false)} />}
    </header>
  );
};

export default Navbar;
