import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchRestaurantOrders, updateOwnerOrderStatus } from "../redux/orderSlice";
import authService from "../services/authService";
import restaurantService from "../services/restaurantService";
import { getApiErrorMessage } from "../services/api";
import getFoodImage from "../utils/getFoodImage";
import getRestaurantImage from "../utils/getRestaurantImage";
import IssueChatModal from "../components/IssueChatModal";
import formatCurrency from "../utils/formatCurrency";

const emptyRestaurantForm = {
  name: "",
  description: "",
  location: "",
  city: "",
  latitude: "",
  longitude: "",
  accuracyMeters: "",
  contactNumber: "",
  cuisine: "Fast Food",
  image: ""
};

const emptyMenuForm = {
  restaurantId: "",
  itemName: "",
  description: "",
  price: "",
  category: "Fast Food",
  image: "",
  availability: true,
  isVeg: true
};

const RestaurantDashboard = () => {
  const dispatch = useDispatch();
  const { list } = useSelector((state) => state.orders);
  const [ownerRestaurants, setOwnerRestaurants] = useState([]);
  const [ownerMenuItems, setOwnerMenuItems] = useState([]);
  const [deliveryStaff, setDeliveryStaff] = useState([]);
  const [restaurantForm, setRestaurantForm] = useState(emptyRestaurantForm);
  const [menuForm, setMenuForm] = useState(emptyMenuForm);
  const [restaurantImageFile, setRestaurantImageFile] = useState(null);
  const [menuImageFile, setMenuImageFile] = useState(null);
  const [restaurantImageDrafts, setRestaurantImageDrafts] = useState({});
  const [restaurantImageFiles, setRestaurantImageFiles] = useState({});
  const [restaurantUpdates, setRestaurantUpdates] = useState({});
  const [restaurantError, setRestaurantError] = useState("");
  const [menuError, setMenuError] = useState("");
  const [restaurantSuccess, setRestaurantSuccess] = useState("");
  const [menuSuccess, setMenuSuccess] = useState("");
  const [chatOrderId, setChatOrderId] = useState(null);

  const loadOwnerMenuItems = useCallback(async (restaurants) => {
    if (!restaurants.length) {
      setOwnerMenuItems([]);
      return;
    }

    const menuResponses = await Promise.all(
      restaurants.map((restaurant) =>
        restaurantService.getMenuItems({ restaurantId: restaurant._id })
      )
    );

    setOwnerMenuItems(menuResponses.flat());
  }, []);

  const loadData = useCallback(async () => {
    dispatch(fetchRestaurantOrders());

    try {
      const restaurants = await restaurantService.getOwnerRestaurants();
      setOwnerRestaurants(restaurants);
      await loadOwnerMenuItems(restaurants);
    } catch (error) {
      setOwnerRestaurants([]);
      setOwnerMenuItems([]);
    }

    authService.getDeliveryStaff().then(setDeliveryStaff).catch(() => setDeliveryStaff([]));
  }, [dispatch, loadOwnerMenuItems]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!ownerRestaurants.length) {
      return;
    }

    setMenuForm((current) => {
      if (current.restaurantId) {
        return current;
      }

      return {
        ...current,
        restaurantId: ownerRestaurants[0]._id
      };
    });
  }, [ownerRestaurants]);

  const updateStatus = (orderId, status, deliveryStaffId = "") => {
    dispatch(updateOwnerOrderStatus({ id: orderId, payload: { status, deliveryStaffId } }));
  };

  const updateRestaurantField = (field, value) => {
    setRestaurantForm((current) => ({
      ...current,
      [field]: value
    }));
  };

  const captureRestaurantGps = (restaurantId = "") => {
    if (!navigator.geolocation) {
      setRestaurantError("GPS location is not supported on this device.");
      setRestaurantSuccess("");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const gpsFields = {
          latitude: String(position.coords.latitude),
          longitude: String(position.coords.longitude),
          accuracyMeters: String(Math.round(position.coords.accuracy || 0))
        };

        if (restaurantId) {
          setRestaurantUpdates((current) => ({
            ...current,
            [restaurantId]: {
              ...current[restaurantId],
              ...gpsFields
            }
          }));
        } else {
          setRestaurantForm((current) => ({
            ...current,
            ...gpsFields
          }));
        }

        setRestaurantError("");
        setRestaurantSuccess("Exact restaurant GPS location captured. Save changes to use it for pickup navigation and delivery charge.");
      },
      () => {
        setRestaurantError("Unable to capture GPS location. Please allow location access and try again.");
        setRestaurantSuccess("");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 12000
      }
    );
  };

  const handleRestaurantUpdateChange = (restaurantId, field, value) => {
    setRestaurantUpdates((prev) => ({
      ...prev,
      [restaurantId]: {
        ...prev[restaurantId],
        [field]: value
      }
    }));
  };

  const updateMenuField = (field, value) => {
    setMenuForm((current) => ({
      ...current,
      [field]: value
    }));
  };

  const createRestaurantWithImage = async (e) => {
    e.preventDefault();

    if (
      !restaurantForm.name.trim() ||
      !restaurantForm.location.trim() ||
      !restaurantForm.city.trim() ||
      !restaurantForm.contactNumber.trim()
    ) {
      setRestaurantError("Please fill restaurant name, location, city, and contact number.");
      setRestaurantSuccess("");
      return;
    }

    try {
      setRestaurantError("");
      setRestaurantSuccess("");

      const formData = new FormData();

      formData.append("name", restaurantForm.name.trim());
      formData.append("description", restaurantForm.description.trim());
      formData.append("location", restaurantForm.location.trim());
      formData.append("city", restaurantForm.city.trim());
      formData.append("contactNumber", restaurantForm.contactNumber.trim());

      if (restaurantForm.latitude && restaurantForm.longitude) {
        formData.append("latitude", restaurantForm.latitude);
        formData.append("longitude", restaurantForm.longitude);
        formData.append("accuracyMeters", restaurantForm.accuracyMeters);
      }

      restaurantForm.cuisine
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .forEach((item) => formData.append("cuisine[]", item));

      if (restaurantImageFile) {
        formData.append("image", restaurantImageFile);
      } else if (restaurantForm.image.trim()) {
        formData.append("image", restaurantForm.image.trim());
      }

      const restaurant = await restaurantService.createRestaurant(formData);

      setRestaurantForm(emptyRestaurantForm);
      setRestaurantImageFile(null);
      setMenuForm((current) => ({
        ...current,
        restaurantId: restaurant._id || current.restaurantId
      }));
      setRestaurantSuccess("Restaurant created successfully.");
      loadData();
    } catch (error) {
      setRestaurantError(getApiErrorMessage(error));
      setRestaurantSuccess("");
    }
  };

  const createMenuItem = async (e) => {
    e.preventDefault();

    if (!ownerRestaurants.length) {
      setMenuError("Create a restaurant first before adding menu items.");
      setMenuSuccess("");
      return;
    }

    if (!menuForm.restaurantId) {
      setMenuError("Please select a restaurant for this menu item.");
      setMenuSuccess("");
      return;
    }

    if (!menuForm.itemName.trim() || !menuForm.price || !menuForm.category.trim()) {
      setMenuError("Please fill item name, price, and category.");
      setMenuSuccess("");
      return;
    }

    try {
      setMenuError("");
      setMenuSuccess("");

      const formData = new FormData();

      formData.append("restaurantId", menuForm.restaurantId);
      formData.append("itemName", menuForm.itemName.trim());
      formData.append("description", menuForm.description.trim());
      formData.append("price", Number(menuForm.price));
      formData.append("category", menuForm.category.trim());
      formData.append("availability", String(menuForm.availability));
      formData.append("isVeg", String(menuForm.isVeg));

      if (menuImageFile) {
        formData.append("image", menuImageFile);
      } else if (menuForm.image.trim()) {
        formData.append("image", menuForm.image.trim());
      }

      await restaurantService.createMenuItem(formData);

      setMenuForm({
        ...emptyMenuForm,
        restaurantId: menuForm.restaurantId
      });
      setMenuImageFile(null);
      setMenuSuccess("Menu item added successfully.");
      loadData();
    } catch (error) {
      setMenuError(getApiErrorMessage(error));
      setMenuSuccess("");
    }
  };

  const deleteMenuItem = async (menuItemId) => {
    try {
      setMenuError("");
      setMenuSuccess("");
      await restaurantService.deleteMenuItem(menuItemId);
      setMenuSuccess("Menu item deleted successfully.");
      loadData();
    } catch (error) {
      setMenuError(getApiErrorMessage(error));
      setMenuSuccess("");
    }
  };

  const submitRestaurantUpdates = async (restaurantId) => {
    try {
      setRestaurantError("");
      setRestaurantSuccess("");

      const formData = new FormData();
      const imageFile = restaurantImageFiles[restaurantId];
      const imageUrl = restaurantImageDrafts[restaurantId]?.trim();
      const newLoc = restaurantUpdates[restaurantId]?.location;
      const newCity = restaurantUpdates[restaurantId]?.city;
      const newLatitude = restaurantUpdates[restaurantId]?.latitude;
      const newLongitude = restaurantUpdates[restaurantId]?.longitude;
      const newAccuracyMeters = restaurantUpdates[restaurantId]?.accuracyMeters;

      if (imageFile) {
        formData.append("image", imageFile);
      } else if (imageUrl) {
        formData.append("image", imageUrl);
      }

      if (newLoc && newLoc.trim() !== "") {
        formData.append("location", newLoc.trim());
      }
      
      if (newCity && newCity.trim() !== "") {
        formData.append("city", newCity.trim());
      }

      if (newLatitude && newLongitude) {
        formData.append("latitude", newLatitude);
        formData.append("longitude", newLongitude);
        formData.append("accuracyMeters", newAccuracyMeters || "");
      }

      const isUpdateBlank =
        !imageFile &&
        !imageUrl &&
        newLoc === undefined &&
        newCity === undefined &&
        newLatitude === undefined &&
        newLongitude === undefined;
      if (isUpdateBlank) {
        setRestaurantError("No changes to update.");
        return;
      }

      await restaurantService.updateRestaurant(restaurantId, formData);

      setRestaurantSuccess("Restaurant details updated successfully.");
      setRestaurantImageDrafts((current) => ({
        ...current,
        [restaurantId]: ""
      }));
      setRestaurantImageFiles((current) => ({
        ...current,
        [restaurantId]: null
      }));
      setRestaurantUpdates((current) => ({
        ...current,
        [restaurantId]: {}
      }));
      loadData();
    } catch (error) {
      setRestaurantError(getApiErrorMessage(error));
      setRestaurantSuccess("");
    }
  };

  return (
    <section>
      {chatOrderId && <IssueChatModal orderId={chatOrderId} onClose={() => setChatOrderId(null)} />}
      <h2>Restaurant Dashboard</h2>

      {list.filter(order => order.deliveryAssignmentStatus === "Rejected").length > 0 && (
        <div style={{ backgroundColor: "#fee2e2", padding: "16px", borderRadius: "8px", marginBottom: "1rem", border: "1px solid #ef4444" }}>
          <h3 style={{ color: "#991b1b", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
            ⚠️ Delivery Rejected
          </h3>
          <p style={{ color: "#991b1b", marginTop: "8px", marginBottom: 0 }}>
            You have {list.filter(order => order.deliveryAssignmentStatus === "Rejected").length} order(s) where the assigned delivery driver refused the job. Please scroll down to Active Orders and reassign them immediately.
          </p>
        </div>
      )}

      {list.filter(order => order.status === "Pending").length > 0 && (
        <div style={{ backgroundColor: "#dbeafe", padding: "16px", borderRadius: "8px", marginBottom: "1rem", border: "1px solid #3b82f6" }}>
          <h3 style={{ color: "#1e40af", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
            🔔 New Orders Received
          </h3>
          <p style={{ color: "#1e40af", marginTop: "8px", marginBottom: 0 }}>
            You have {list.filter(order => order.status === "Pending").length} new pending order(s) waiting for your acceptance.
          </p>
        </div>
      )}

      {list.filter(order => order.issueReport?.isRaised && !order.issueReport?.resolved).length > 0 && (
        <section className="section-head" style={{ marginTop: '1rem', marginBottom: '2rem' }}>
          <h2 style={{ color: '#991b1b' }}>⚠️ Active Customer Issues</h2>
          <div className="list-stack">
            {list.filter(order => order.issueReport?.isRaised && !order.issueReport?.resolved).map((order) => (
              <article key={order._id} className="card" style={{ borderColor: '#fca5a5', borderWidth: '2px' }}>
                <div className="card-body">
                  <h3>Order #{order._id.slice(-6)}</h3>
                  <p>Customer: {order.customerId?.name}</p>
                  <p>Status: {order.status}</p>
                  <div style={{ backgroundColor: "#fee2e2", padding: "10px", borderRadius: "4px", marginBottom: "10px", marginTop: "10px" }}>
                    <p style={{ color: "#991b1b", margin: 0 }}><strong>Customer Issue:</strong> {order.issueReport.message}</p>
                    <button className="button secondary" style={{ marginTop: "10px", borderColor: "#991b1b", color: "#991b1b" }} onClick={() => setChatOrderId(order._id)}>
                      Open Chat / Resolve
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <div className="info-grid">
        <article className="card">
          <div className="card-body">
            <h3>Your Restaurants</h3>
            <p>{ownerRestaurants.length}</p>
          </div>
        </article>
        <article className="card">
          <div className="card-body">
            <h3>Incoming Orders</h3>
            <p>{list.length}</p>
          </div>
        </article>
      </div>

      <section className="section-head" style={{ marginTop: '2rem' }}>
        <h2>Active Orders</h2>
        <div className="list-stack">
          {list.filter(order => order.status !== "Delivered" && order.status !== "Cancelled").length === 0 ? (
            <p>No active orders at the moment.</p>
          ) : (
            list.filter(order => order.status !== "Delivered" && order.status !== "Cancelled").map((order) => (
              <article key={order._id} className="card showcase-card">
                <div className="card-body">
                  <div className="space-between">
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      Order #{order._id.slice(-6)}
                      {order.status === "Delivered" && !order.issueReport?.isRaised && (
                         <span title="Successfully Delivered" style={{ color: "#22c55e", fontSize: "1.2rem" }}>✅</span>
                      )}
                      {order.status === "Cancelled" && (
                         <span title="Cancelled" style={{ color: "#ef4444", fontSize: "1.2rem" }}>❌</span>
                      )}
                    </h3>
                    <span className="tag" style={{ backgroundColor: '#e2e8f0', color: '#1f2933' }}>{order.status}</span>
                  </div>
                  <p style={{ margin: "0.5rem 0" }}><strong>Customer:</strong> {order.customerId?.name || "Unknown"}</p>
                  <p style={{ margin: "0.5rem 0" }}>
                    <strong>Items:</strong> {order.items?.map(i => `${i.name} (x${i.quantity})`).join(', ')}
                  </p>
                  
                  <div style={{ backgroundColor: "#f8fafc", padding: "10px", borderRadius: "6px", marginTop: "10px" }}>
                    <p style={{ margin: "0.2rem 0", fontSize: "0.95rem" }}>
                      <strong>Subtotal:</strong> {formatCurrency(order.pricing?.subtotal || 0)}
                    </p>
                    <p style={{ margin: "0.2rem 0", color: "#64748b", fontSize: "0.85rem" }}>
                      + {formatCurrency(order.pricing?.deliveryFee || 0)} Delivery Fee & {formatCurrency(order.pricing?.tax || 0)} Tax
                    </p>
                    {order.pricing?.discount > 0 && (
                      <p style={{ margin: "0.2rem 0", color: "#16a34a", fontSize: "0.85rem" }}>
                        - {formatCurrency(order.pricing?.discount)} Discount applied
                      </p>
                    )}
                    <p style={{ margin: "0.4rem 0 0 0", color: "#1e293b", fontWeight: "bold", borderTop: "1px solid #e2e8f0", paddingTop: "0.4rem" }}>
                      Customer Final Total: {formatCurrency(order.pricing?.totalAmount || 0)}
                    </p>
                  </div>

                  {order.deliveryAssignmentStatus === "Rejected" && (
                    <div style={{ backgroundColor: "#fee2e2", padding: "10px", borderRadius: "4px", marginBottom: "10px", marginTop: "10px", border: "1px solid #ef4444" }}>
                      <p style={{ color: "#991b1b", margin: 0, fontWeight: "bold" }}>
                        ⚠️ Assigned Driver Rejected this Delivery! Please select a new driver.
                      </p>
                    </div>
                  )}

                  {!(order.status === "Delivered" && !order.issueReport?.isRaised) && order.status !== "Cancelled" && (
                    <div className="action-row order-control-row" style={{ marginTop: "1rem" }}>
                      <select
                      className="button secondary"
                      style={{ margin: 0, padding: "0.5rem", borderRadius: "8px", borderColor: "#cbd5e1" }}
                      value={order.status}
                      onChange={(e) => updateStatus(order._id, e.target.value, order.deliveryStaffId?._id || order.deliveryStaffId)}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Accepted">Accepted</option>
                      <option value="Preparing">Preparing</option>
                      <option value="Out for Delivery">Out for Delivery</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>

                    {(order.status === "Preparing" || order.status === "Out for Delivery") && (
                      <select
                        className="button secondary"
                        style={{ margin: 0, padding: "0.5rem", borderRadius: "8px", borderColor: "#cbd5e1" }}
                        value={order.deliveryStaffId?._id || order.deliveryStaffId || ""}
                        onChange={(e) => updateStatus(order._id, order.status, e.target.value)}
                      >
                        <option value="">-- Assign Delivery Staff --</option>
                        {deliveryStaff.map((staff) => (
                          <option key={staff._id} value={staff._id}>
                            {staff.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      </section>
      <div className="info-grid">
        <form className="form-card" onSubmit={createRestaurantWithImage}>
          <h3>Add Restaurant</h3>
          <input placeholder="Restaurant name" value={restaurantForm.name} onChange={(e) => updateRestaurantField("name", e.target.value)} />
          <input placeholder="Description" value={restaurantForm.description} onChange={(e) => updateRestaurantField("description", e.target.value)} />
          <input placeholder="Location" value={restaurantForm.location} onChange={(e) => updateRestaurantField("location", e.target.value)} />
          <input placeholder="City" value={restaurantForm.city} onChange={(e) => updateRestaurantField("city", e.target.value)} />
          <div className="gps-field-card">
            <button className="button secondary" type="button" onClick={() => captureRestaurantGps()}>
              Use Current GPS as Restaurant Location
            </button>
            <p>
              {restaurantForm.latitude && restaurantForm.longitude
                ? `GPS saved in form: ${Number(restaurantForm.latitude).toFixed(5)}, ${Number(restaurantForm.longitude).toFixed(5)}`
                : "Capture exact GPS to help delivery agents navigate to the pickup point."}
            </p>
          </div>
          <input placeholder="Contact Number" value={restaurantForm.contactNumber} onChange={(e) => updateRestaurantField("contactNumber", e.target.value)} />
          <input placeholder="Cuisine (comma separated)" value={restaurantForm.cuisine} onChange={(e) => updateRestaurantField("cuisine", e.target.value)} />
          <input
            placeholder="Restaurant image URL (optional)"
            value={restaurantForm.image}
            onChange={(e) => updateRestaurantField("image", e.target.value)}
          />
          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            onChange={(e) => setRestaurantImageFile(e.target.files?.[0] || null)}
          />
          {restaurantImageFile ? <p>Selected image: {restaurantImageFile.name}</p> : null}
          {restaurantError ? <p className="error-text">{restaurantError}</p> : null}
          {restaurantSuccess ? <p>{restaurantSuccess}</p> : null}
          <button className="button">Create Restaurant</button>
        </form>

        <form className="form-card" onSubmit={createMenuItem}>
          <h3>Add Menu Item</h3>
          <select value={menuForm.restaurantId} onChange={(e) => updateMenuField("restaurantId", e.target.value)}>
            <option value="">Select restaurant</option>
            {ownerRestaurants.map((restaurant) => (
              <option key={restaurant._id} value={restaurant._id}>
                {restaurant.name}
              </option>
            ))}
          </select>
          <input placeholder="Item name" value={menuForm.itemName} onChange={(e) => updateMenuField("itemName", e.target.value)} />
          <input placeholder="Description" value={menuForm.description} onChange={(e) => updateMenuField("description", e.target.value)} />
          <input placeholder="Price" type="number" value={menuForm.price} onChange={(e) => updateMenuField("price", e.target.value)} />
          <input placeholder="Category" value={menuForm.category} onChange={(e) => updateMenuField("category", e.target.value)} />
          <input
            placeholder="Image URL (optional)"
            value={menuForm.image}
            onChange={(e) => updateMenuField("image", e.target.value)}
          />
          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            onChange={(e) => setMenuImageFile(e.target.files?.[0] || null)}
          />
          {menuImageFile ? <p>Selected image: {menuImageFile.name}</p> : null}
          {menuError ? <p className="error-text">{menuError}</p> : null}
          {menuSuccess ? <p>{menuSuccess}</p> : null}
          <button className="button secondary">Add Menu Item</button>
        </form>
      </div>
      <section className="section-head">
        <h2>Manage Restaurant Details</h2>
        <div className="grid">
          {ownerRestaurants.map((restaurant) => (
            <article key={restaurant._id} className="card showcase-card">
              <img
                src={getRestaurantImage(restaurant)}
                alt={restaurant.name}
                className="card-image"
                style={{ height: '200px', objectFit: 'cover' }}
              />
              <div className="card-body">
                <h3 style={{ marginBottom: "10px" }}>{restaurant.name}</h3>
                <div style={{ display: 'grid', gap: '8px', marginBottom: '10px' }}>
                  <input
                    placeholder="Update location address..."
                    value={restaurantUpdates[restaurant._id]?.location ?? restaurant.location}
                    onChange={(e) => handleRestaurantUpdateChange(restaurant._id, 'location', e.target.value)}
                    style={{ margin: 0, padding: '0.6rem' }}
                  />
                  <input
                    placeholder="Update city..."
                    value={restaurantUpdates[restaurant._id]?.city ?? restaurant.city}
                    onChange={(e) => handleRestaurantUpdateChange(restaurant._id, 'city', e.target.value)}
                    style={{ margin: 0, padding: '0.6rem' }}
                  />
                  <div className="gps-field-card">
                    <button className="button secondary" type="button" onClick={() => captureRestaurantGps(restaurant._id)}>
                      Update Exact GPS Location
                    </button>
                    <p>
                      {restaurantUpdates[restaurant._id]?.latitude && restaurantUpdates[restaurant._id]?.longitude
                        ? `New GPS: ${Number(restaurantUpdates[restaurant._id].latitude).toFixed(5)}, ${Number(restaurantUpdates[restaurant._id].longitude).toFixed(5)}`
                        : restaurant.locationCoordinates?.latitude && restaurant.locationCoordinates?.longitude
                          ? `Current GPS: ${Number(restaurant.locationCoordinates.latitude).toFixed(5)}, ${Number(restaurant.locationCoordinates.longitude).toFixed(5)}`
                          : "No exact GPS saved yet. Add it for precise pickup navigation."}
                    </p>
                  </div>
                </div>
                
                <h4 style={{ fontSize: "0.9rem", margin: "10px 0 5px 0" }}>Update Image</h4>
                <div style={{ display: 'grid', gap: '8px', marginBottom: '10px' }}>
                  <input
                    placeholder="New image URL (optional)"
                    value={restaurantImageDrafts[restaurant._id] || ""}
                    onChange={(e) =>
                      setRestaurantImageDrafts((current) => ({
                        ...current,
                        [restaurant._id]: e.target.value
                      }))
                    }
                    style={{ margin: 0, padding: '0.6rem' }}
                  />
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={(e) =>
                      setRestaurantImageFiles((current) => ({
                        ...current,
                        [restaurant._id]: e.target.files?.[0] || null
                      }))
                    }
                    style={{ margin: 0, padding: '0.5rem' }}
                  />
                  {restaurantImageFiles[restaurant._id] ? (
                    <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>Selected: {restaurantImageFiles[restaurant._id].name}</p>
                  ) : null}
                </div>
                
                <button
                  className="button secondary"
                  type="button"
                  style={{ width: "100%", marginTop: "10px" }}
                  onClick={() => submitRestaurantUpdates(restaurant._id)}
                >
                  Save All Changes
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="section-head">
        <h2>Current Menu Items</h2>
        <div className="grid">
          {ownerMenuItems.map((item) => (
            <article key={item._id} className="card showcase-card">
              <img src={getFoodImage(item)} alt={item.itemName} className="card-image" />
              <div className="card-body">
                <div className="space-between">
                  <h3>{item.itemName}</h3>
                  <span className="tag">{item.category}</span>
                </div>
                <p>{item.description || "No description added yet."}</p>
                <p>
                  Restaurant:{" "}
                  {typeof item.restaurantId === "object"
                    ? item.restaurantId?.name
                    : ownerRestaurants.find((restaurant) => restaurant._id === item.restaurantId)?.name}
                </p>
                <div className="space-between">
                  <strong>{formatCurrency(item.price)}</strong>
                  <button
                    className="button secondary"
                    type="button"
                    onClick={() => deleteMenuItem(item._id)}
                  >
                    Delete Item
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

    </section>
  );
};

export default RestaurantDashboard;
