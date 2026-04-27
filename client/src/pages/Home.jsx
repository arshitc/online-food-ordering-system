import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import restaurantService from "../services/restaurantService";
import formatCategoryLabel, { normalizeCategory } from "../utils/formatCategory";
import getFoodImage from "../utils/getFoodImage";
import { fetchRestaurantOrders, fetchAssignedOrders } from "../redux/orderSlice";

const roleActionMap = {
  customer: {
    primaryLabel: "Start Ordering",
    primaryPath: "/restaurants",
    secondaryLabel: "My Orders",
    secondaryPath: "/orders"
  },
  owner: {
    primaryLabel: "Open Owner Panel",
    primaryPath: "/dashboard/restaurant",
    secondaryLabel: "Browse Restaurants",
    secondaryPath: "/restaurants"
  },
  delivery: {
    primaryLabel: "View Deliveries",
    primaryPath: "/dashboard/delivery",
    secondaryLabel: "Browse Restaurants",
    secondaryPath: "/restaurants"
  },
  admin: {
    primaryLabel: "Open Admin Panel",
    primaryPath: "/dashboard/admin",
    secondaryLabel: "Browse Restaurants",
    secondaryPath: "/restaurants"
  },
  guest: {
    primaryLabel: "Explore Restaurants",
    primaryPath: "/restaurants",
    secondaryLabel: "Create Account",
    secondaryPath: "/register"
  }
};

const Home = () => {
  const { user } = useSelector((state) => state.auth);
  const { list: orderList } = useSelector((state) => state.orders);
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const actions = roleActionMap[user?.role || "guest"];
  const [allItems, setAllItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const searchQuery = searchParams.get("q") || "";

  useEffect(() => {
    let isMounted = true;

    const loadHomeItems = async () => {
      try {
        const [restaurants, menuItems] = await Promise.all([
          restaurantService.getRestaurants(),
          restaurantService.getMenuItems()
        ]);

        const restaurantMap = Object.fromEntries(
          restaurants.map((restaurant) => [restaurant._id, restaurant])
        );

        const items = menuItems
          .map((item) => {
            const restaurantId =
              typeof item.restaurantId === "object"
                ? item.restaurantId?._id
                : item.restaurantId;

            return {
              ...item,
              restaurant: restaurantMap[restaurantId] || item.restaurantId
            };
          })
          .filter((item) => item.restaurant?._id || item.restaurant?.name);

        if (isMounted) {
          setAllItems(items);
        }
      } catch (error) {
        if (isMounted) {
          setAllItems([]);
        }
      }
    };

    if (user?.role === "owner") {
       dispatch(fetchRestaurantOrders());
    } else if (user?.role === "delivery") {
       dispatch(fetchAssignedOrders());
    } else {
       loadHomeItems();
    }

    return () => {
      isMounted = false;
    };
  }, [user?.role, dispatch]);

  const heroItems = useMemo(() => allItems.slice(0, 4), [allItems]);
  const categories = useMemo(() => {
    const uniqueCategories = new Map();

    allItems.forEach((item) => {
      const value = normalizeCategory(item.category);

      if (!value || uniqueCategories.has(value)) {
        return;
      }

      uniqueCategories.set(value, formatCategoryLabel(item.category));
    });

    return Array.from(uniqueCategories, ([value, label]) => ({ value, label }));
  }, [allItems]);
  const filteredItems = useMemo(
    () =>
      allItems.filter((item) => {
        const matchesCategory =
          !selectedCategory || normalizeCategory(item.category) === selectedCategory;
        const searchableText = [
          item.itemName,
          item.description,
          item.category,
          item.restaurant?.name,
          item.restaurant?.location,
          item.restaurant?.city
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        const matchesSearch = !searchQuery.trim()
          || searchableText.includes(searchQuery.trim().toLowerCase());

        return matchesCategory && matchesSearch;
      }),
    [allItems, searchQuery, selectedCategory]
  );

  const updateSearchQuery = (value) => {
    const nextParams = new URLSearchParams(searchParams);

    if (value.trim()) {
      nextParams.set("q", value);
    } else {
      nextParams.delete("q");
    }

    setSearchParams(nextParams, { replace: true });
  };

  if (user?.role === "owner") {
    const rejectedCount = orderList?.filter(o => o.deliveryAssignmentStatus === "Rejected")?.length || 0;
    const pendingCount = orderList?.filter(o => o.status === "Pending")?.length || 0;

    return (
      <main className="list-stack">
        <section className="hero inner-hero">
          <div className="hero-copy">
            <p className="eyebrow">Owner Overview</p>
            <h1>Run your restaurant with faster order handling and menu control.</h1>
            <p>
              Open the owner panel to manage restaurants, add menu items, update order
              status, and use the Orders page for sales details and customer complaints.
            </p>

            {(rejectedCount > 0 || pendingCount > 0) && (
              <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {rejectedCount > 0 && (
                  <div style={{ backgroundColor: "#fee2e2", padding: "16px", borderRadius: "8px", border: "1px solid #ef4444" }}>
                    <h3 style={{ color: "#991b1b", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                      ⚠️ Delivery Rejected ({rejectedCount})
                    </h3>
                    <p style={{ color: "#991b1b", marginTop: "8px", marginBottom: 0 }}>
                      You have order(s) where the driver refused the assignment. Open the Owner Panel to manage them!
                    </p>
                  </div>
                )}
                
                {pendingCount > 0 && (
                  <div style={{ backgroundColor: "#dbeafe", padding: "16px", borderRadius: "8px", border: "1px solid #3b82f6" }}>
                    <h3 style={{ color: "#1e40af", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                      🔔 New Orders Received ({pendingCount})
                    </h3>
                    <p style={{ color: "#1e40af", marginTop: "8px", marginBottom: 0 }}>
                      You have new pending order(s) waiting for acceptance. Open the Owner Panel to review them.
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="hero-actions" style={{ marginTop: '2rem' }}>
              <Link className="button" to="/dashboard/restaurant">
                Open Owner Panel
              </Link>
              <Link className="button secondary" to="/orders">
                View Order Analytics
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (user?.role === "admin") {
    return (
      <main className="list-stack">
        <section className="hero inner-hero" style={{ paddingBottom: '2rem' }}>
          <div className="hero-copy">
            <p className="eyebrow">System Administrator</p>
            <h1>Total oversight of the FoodFlow platform.</h1>
            <p>
              As an administrator, you have complete control over users, restaurants, active orders, and live platform revenue. You can also seamlessly impersonate any user to debug or resolve issues instantly.
            </p>

            <div className="hero-actions" style={{ marginTop: '2rem' }}>
              <Link className="button" to="/dashboard/admin">
                Open Admin Panel
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (user?.role === "delivery") {
    const activeDeliveriesList = orderList?.filter(o => 
      o.status !== "Delivered" && 
      o.status !== "Cancelled" && 
      o.deliveryAssignmentStatus !== "Rejected"
    ) || [];

    return (
      <main className="list-stack">
        <section className="hero inner-hero" style={{ paddingBottom: '2rem' }}>
          <div className="hero-copy">
            <p className="eyebrow">Delivery Partner Overview</p>
            <h1>Manage your assigned deliveries and navigate smoothly.</h1>
            <p>
              Open the delivery panel to locate restaurants, pick up fresh food, and use automatic GPS navigation to deliver accurately and on time to customers.
            </p>

            <div className="hero-actions" style={{ marginTop: '2rem' }}>
              <Link className="button" to="/dashboard/delivery">
                Open Full Delivery Panel
              </Link>
            </div>
          </div>
        </section>

        {activeDeliveriesList.length > 0 && (
          <section className="section-head" style={{ marginTop: '0rem' }}>
            <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              📍 Active Restaurant Pickups
            </h2>
            <p>Restaurants have appointed you for these active orders. Make sure to head towards these locations!</p>
            <div className="list-stack" style={{ marginTop: '1.5rem' }}>
              {activeDeliveriesList.map(order => (
                <div key={order._id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h3 style={{ margin: '0 0 0.2rem 0', color: '#1e293b' }}>
                      {order.restaurantId?.name}
                      {order.deliveryAssignmentStatus === "Pending" && (
                        <span style={{ backgroundColor: '#fef08a', color: '#854d0e', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', marginLeft: '10px', verticalAlign: 'middle' }}>Awaiting Your Acceptance</span>
                      )}
                    </h3>
                    <p style={{ margin: 0, color: '#64748b' }}>
                      <strong>Pickup Address:</strong> {order.restaurantId?.location}, {order.restaurantId?.city}
                    </p>
                  </div>
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([order.restaurantId?.name, order.restaurantId?.location, order.restaurantId?.city].filter(Boolean).join(', '))}`}
                    target="_blank"
                    rel="noreferrer"
                    className="button secondary"
                    style={{ margin: 0, padding: '0.6rem 1rem' }}
                  >
                    🗺️ Navigate to Restaurant
                  </a>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    );
  }

  return (
    <main>
      <section className="hero customer-home-hero">
        <div className="hero-copy">
          <p className="eyebrow">Fresh food from nearby kitchens</p>
          <h1>Pick what looks good and order it in minutes.</h1>
          <p>
            Browse real dishes from nearby restaurants, open the menu you like,
            add items to cart, and get them delivered quickly.
          </p>
          <div className="hero-actions">
            <Link className="button" to={actions.primaryPath}>
              {actions.primaryLabel}
            </Link>
            <Link className="button secondary" to={actions.secondaryPath}>
              {actions.secondaryLabel}
            </Link>
          </div>
        </div>
        <div className="highlight-card image-collage">
          {heroItems.length ? (
            heroItems.map((item) => {
              const restaurantId = item.restaurant?._id || item.restaurantId?._id || item.restaurantId;

              return (
                <Link
                  key={item._id}
                  to={restaurantId ? `/restaurants/${restaurantId}` : "/restaurants"}
                  className="image-collage-card"
                >
                  <img src={getFoodImage(item)} alt={item.itemName} className="image-collage-photo" />
                  <div className="image-collage-copy">
                    <strong>{item.itemName}</strong>
                    <span>{item.restaurant?.name || "Restaurant"}</span>
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="image-collage-empty">
              <strong>Popular dishes will appear here</strong>
              <span>Add menu items from owner accounts to fill the homepage gallery.</span>
            </div>
          )}
        </div>
      </section>

      <section className="section-head">
        <h2>All Menu Items</h2>
        <p>Browse dishes from all restaurants and filter them by category or search by item name.</p>
        <input
          className="desktop-section-search"
          type="text"
          placeholder="Search food items like cake, momo, burger..."
          value={searchQuery}
          onChange={(e) => updateSearchQuery(e.target.value)}
        />
        <div
          className="filter-bar filter-chip-row mobile-hide-filter-row"
          aria-label="Filter menu items by category"
        >
          <button
            className={`chip ${selectedCategory === "" ? "active-chip" : ""}`}
            type="button"
            onClick={() => setSelectedCategory("")}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category.value}
              className={`chip ${selectedCategory === category.value ? "active-chip" : ""}`}
              type="button"
              onClick={() => setSelectedCategory(category.value)}
            >
              {category.label}
            </button>
          ))}
        </div>
        <div className="home-food-grid">
          {filteredItems.map((item) => {
            const restaurantId = item.restaurant?._id || item.restaurantId?._id || item.restaurantId;

            return (
              <Link
                key={item._id}
                to={restaurantId ? `/restaurants/${restaurantId}` : "/restaurants"}
                className="card home-food-card"
              >
                <img src={getFoodImage(item)} alt={item.itemName} className="card-image" />
                <div className="card-body">
                  <div className="space-between">
                    <h3>{item.itemName}</h3>
                    <span className="tag">{formatCategoryLabel(item.category)}</span>
                  </div>
                  <p>{item.restaurant?.name || "Restaurant"}</p>
                  <p>{item.restaurant?.location || item.restaurant?.city || "Nearby location"}</p>
                </div>
              </Link>
            );
          })}
        </div>
        {!filteredItems.length ? (
          <p>No items found for "{searchQuery || selectedCategory}". Try another search.</p>
        ) : null}
      </section>
    </main>
  );
};

export default Home;
