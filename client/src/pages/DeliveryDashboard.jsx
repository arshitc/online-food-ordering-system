import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAssignedOrders, updateDriverStatus } from "../redux/orderSlice";

const formatDateTime = (value) =>
  new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit"
  });

const buildDeliveryLocation = (position) => ({
  latitude: position.coords.latitude,
  longitude: position.coords.longitude,
  accuracyMeters: position.coords.accuracy,
  speedMetersPerSecond: position.coords.speed
});

const getCurrentDeliveryLocation = () =>
  new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve(buildDeliveryLocation(position)),
      () => resolve(null),
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 10000
      }
    );
  });

const getPickupNavigationUrl = (restaurant) => {
  const latitude = restaurant?.locationCoordinates?.latitude;
  const longitude = restaurant?.locationCoordinates?.longitude;

  if (latitude && longitude) {
    return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
  }

  const query = [restaurant?.name, restaurant?.location, restaurant?.city]
    .filter(Boolean)
    .join(", ");

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
};

const DeliveryDashboard = () => {
  const dispatch = useDispatch();
  const { list } = useSelector((state) => state.orders);
  const [locationStatus, setLocationStatus] = useState("");
  const liveTrackedOrderKey = useMemo(
    () =>
      list
        .filter(
          (order) =>
            order.deliveryAssignmentStatus === "Accepted" &&
            !["Delivered", "Cancelled"].includes(order.status)
        )
        .map((order) => order._id)
        .join("|"),
    [list]
  );

  useEffect(() => {
    dispatch(fetchAssignedOrders());
  }, [dispatch]);

  useEffect(() => {
    if (!liveTrackedOrderKey) {
      return undefined;
    }

    if (!navigator.geolocation) {
      setLocationStatus("Live GPS is not supported on this device.");
      return undefined;
    }

    const orderIds = liveTrackedOrderKey.split("|").filter(Boolean);
    let lastSentAt = 0;
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const now = Date.now();

        if (now - lastSentAt < 15000) {
          return;
        }

        lastSentAt = now;
        const deliveryLocation = buildDeliveryLocation(position);

        orderIds.forEach((orderId) => {
          dispatch(updateDriverStatus({ id: orderId, payload: { deliveryLocation } }));
        });

        setLocationStatus("Live GPS is being shared with customers for active deliveries.");
      },
      () => {
        setLocationStatus("Allow location access so customers can see distance, speed, and live ETA.");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 12000
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [dispatch, liveTrackedOrderKey]);

  const updateStatusWithLocation = async (orderId, payload) => {
    const deliveryLocation = await getCurrentDeliveryLocation();

    if (!deliveryLocation) {
      setLocationStatus("Location was not shared. The customer will see a normal ETA until GPS is allowed.");
      dispatch(updateDriverStatus({ id: orderId, payload }));
      return;
    }

    setLocationStatus("Live GPS updated for this delivery.");
    dispatch(updateDriverStatus({ id: orderId, payload: { ...payload, deliveryLocation } }));
  };

  return (
    <section>
      <h2>Delivery Dashboard</h2>
      <div className="delivery-location-banner">
        <strong>Live delivery tracking</strong>
        <p>
          Keep location permission on while delivering. Customers will see ETA from your GPS distance and speed when their order has a saved drop-off location.
        </p>
        {locationStatus ? <span>{locationStatus}</span> : null}
      </div>
      <div className="list-stack">
        {list.filter(order => order.deliveryAssignmentStatus !== "Rejected").map((order) => (
          <article key={order._id} className="card">
            <div className="card-body">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {order.restaurantId?.name}
                {order.status === "Delivered" && (
                   <span title="Delivered" style={{ color: "#22c55e", fontSize: "1.2rem" }}>✅</span>
                )}
              </h3>
              <p>Customer: {order.customerId?.name}</p>
              <p>Current Status: <strong>{order.status}</strong></p>
              <p style={{ fontSize: "0.9rem", color: "#66717f", marginBottom: "0.5rem" }}>
                {order.status === "Delivered" ? "Delivered on: " : "Assigned at: "}
                {formatDateTime(order.status === "Delivered" ? (order.updatedAt || order.createdAt) : order.createdAt)}
              </p>
              
              {order.status !== "Delivered" && (
                order.deliveryAssignmentStatus === "Pending" ? (
                  <div className="action-row" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <a 
                      href={getPickupNavigationUrl(order.restaurantId)}
                      target="_blank"
                      rel="noreferrer"
                      className="button secondary"
                      style={{ borderColor: "#8b5cf6", color: "#8b5cf6" }}
                    >
                      📍 View Exact Pickup Location
                    </a>
                    <button 
                      className="button" 
                      style={{ backgroundColor: "#22c55e", borderColor: "#22c55e", color: "white" }} 
                      onClick={() => updateStatusWithLocation(order._id, { deliveryAssignmentStatus: "Accepted" })}
                    >
                      ✅ Accept Delivery
                    </button>
                    <button 
                      className="button secondary" 
                      style={{ borderColor: "#ef4444", color: "#ef4444" }} 
                      onClick={() => dispatch(updateDriverStatus({ id: order._id, payload: { deliveryAssignmentStatus: "Rejected" } }))}
                    >
                      ❌ Reject Order
                    </button>
                  </div>
                ) : (
                  <div className="action-row" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button className="button secondary" onClick={() => updateStatusWithLocation(order._id, { status: "Out for Delivery" })}>
                      Start Delivery
                    </button>
                    <a 
                      href={getPickupNavigationUrl(order.restaurantId)}
                      target="_blank"
                      rel="noreferrer"
                      className="button secondary"
                      style={{ borderColor: "#8b5cf6", color: "#8b5cf6" }}
                    >
                      📍 Navigate to Exact Pickup
                    </a>
                    <button 
                      className="button secondary" 
                      style={{ borderColor: "#3b82f6", color: "#3b82f6" }}
                      onClick={() => {
                          const addr = order.deliveryAddress;
                          if (addr?.latitude && addr?.longitude) {
                              window.open(`https://www.google.com/maps?q=${addr.latitude},${addr.longitude}`, '_blank');
                          } else if (addr) {
                              const query = `${addr.line1}, ${addr.city}, ${addr.state} ${addr.postalCode}`;
                              window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, '_blank');
                          }
                      }}
                    >
                      🚩 Navigate to Drop-off
                    </button>
                    <button className="button" style={{ backgroundColor: "#22c55e", borderColor: "#22c55e", color: "white" }} onClick={() => updateStatusWithLocation(order._id, { status: "Delivered" })}>
                      Mark Delivered
                    </button>
                    <button 
                      className="button secondary" 
                      style={{ borderColor: "#ef4444", color: "#ef4444" }} 
                      onClick={() => dispatch(updateDriverStatus({ id: order._id, payload: { deliveryAssignmentStatus: "Rejected" } }))}
                    >
                      ❌ Reject Order
                    </button>
                  </div>
                )
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default DeliveryDashboard;
