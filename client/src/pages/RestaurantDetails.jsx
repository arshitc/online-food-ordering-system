import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import FoodCard from "../components/FoodCard";
import ReviewCard from "../components/ReviewCard";
import { addCartItem } from "../redux/cartSlice";
import { fetchRestaurantDetails } from "../redux/restaurantSlice";
import formatCategoryLabel, { normalizeCategory } from "../utils/formatCategory";
import { getApiErrorMessage } from "../services/api";

const RestaurantDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [category, setCategory] = useState("");
  const [cartFeedback, setCartFeedback] = useState("");
  const [authPrompt, setAuthPrompt] = useState("");
  const { selected } = useSelector((state) => state.restaurants);
  const { user } = useSelector((state) => state.auth);
  const redirectTo = `${location.pathname}${location.search}`;
  const guestOrderPrompt =
    authPrompt || (!user ? "Login or register first to add items to your cart and place an order." : "");

  useEffect(() => {
    dispatch(fetchRestaurantDetails(id));
  }, [dispatch, id]);

  useEffect(() => {
    if (user) {
      setAuthPrompt("");
    }
  }, [user]);

  const promptGuestCheckout = (mode) => {
    setCartFeedback("");
    setAuthPrompt(
      mode === "buy"
        ? "Please login or register first to buy this item."
        : "Please login or register first to add items to your cart."
    );
  };

  const addHandler = async (menuItemId) => {
    if (!user) {
      promptGuestCheckout("cart");
      return;
    }

    try {
      await dispatch(addCartItem({ menuItemId, quantity: 1 })).unwrap();
      setAuthPrompt("");
      setCartFeedback("Item added to cart.");
    } catch (error) {
      setAuthPrompt("");
      setCartFeedback(getApiErrorMessage(error));
    }
  };

  const buyHandler = async (menuItemId) => {
    if (!user) {
      promptGuestCheckout("buy");
      return;
    }

    try {
      await dispatch(addCartItem({ menuItemId, quantity: 1 })).unwrap();
      setAuthPrompt("");
      setCartFeedback("");
      navigate("/checkout");
    } catch (error) {
      setAuthPrompt("");
      setCartFeedback(getApiErrorMessage(error));
    }
  };

  const filteredMenu =
    selected?.menu?.filter((item) => !category || normalizeCategory(item.category) === category) || [];
  const categories = (() => {
    const uniqueCategories = new Map();

    (selected?.menu || []).forEach((item) => {
      const value = normalizeCategory(item.category);

      if (!value || uniqueCategories.has(value)) {
        return;
      }

      uniqueCategories.set(value, formatCategoryLabel(item.category));
    });

    return Array.from(uniqueCategories, ([value, label]) => ({ value, label }));
  })();

  return selected ? (
    <section>
      <div className="hero inner-hero">
        <div className="hero-copy">
          <p className="eyebrow">Restaurant Details</p>
          <h1>{selected.restaurant.name}</h1>
          <p>{selected.restaurant.description}</p>
          <div className="hero-pills">
            <span className="hero-pill">{selected.restaurant.location}</span>
            <span className="hero-pill">
              Delivery in {selected.restaurant.averageDeliveryTime} mins
            </span>
            <span className="hero-pill">Rating {selected.restaurant.rating || 0} / 5</span>
          </div>
        </div>
      </div>

      <div className="filter-bar filter-chip-row" aria-label="Filter restaurant menu by category">
        <button
          className={`chip ${category === "" ? "active-chip" : ""}`}
          type="button"
          onClick={() => setCategory("")}
        >
          All
        </button>
        {categories.map((value) => (
          <button
            key={value.value}
            className={`chip ${category === value.value ? "active-chip" : ""}`}
            type="button"
            onClick={() => setCategory(value.value)}
          >
            {value.label}
          </button>
        ))}
      </div>

      {guestOrderPrompt ? (
        <div className="auth-gate-card">
          <div className="auth-gate-copy">
            <p className="eyebrow">Login Required</p>
            <h3>Sign in before placing an order</h3>
            <p>{guestOrderPrompt}</p>
          </div>
          <div className="auth-gate-actions">
            <Link className="button" to="/login" state={{ redirectTo, prompt: guestOrderPrompt }}>
              Login
            </Link>
            <Link className="button secondary" to="/register" state={{ redirectTo, prompt: guestOrderPrompt }}>
              Register
            </Link>
          </div>
        </div>
      ) : null}

      {cartFeedback ? (
        <p className={cartFeedback === "Item added to cart." ? "" : "error-text"}>
          {cartFeedback}
        </p>
      ) : null}

      <div className="grid menu-grid">
        {filteredMenu.map((item) => (
          <FoodCard key={item._id} item={item} onAdd={addHandler} onBuy={buyHandler} canOrder={Boolean(user)} />
        ))}
      </div>

      <section>
        <h2>Customer Reviews</h2>
        <div className="grid review-grid">
          {selected.reviews.map((review) => (
            <ReviewCard key={review._id} review={review} />
          ))}
        </div>
      </section>
    </section>
  ) : (
    <p>Loading restaurant details...</p>
  );
};

export default RestaurantDetails;
