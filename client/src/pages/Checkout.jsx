import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { clearCartItems } from "../redux/cartSlice";
import { placeOrder } from "../redux/orderSlice";
import { getApiErrorMessage } from "../services/api";
import orderService from "../services/orderService";
import paymentService from "../services/paymentService";
import formatCurrency from "../utils/formatCurrency";

const Checkout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cartItems = useSelector((state) => state.cart.items);
  const [address, setAddress] = useState({
    line1: "",
    line2: "",
    city: "Hyderabad",
    state: "Telangana",
    postalCode: "",
    landmark: ""
  });
  const [paymentMethod, setPaymentMethod] = useState("ONLINE");
  const [checkoutError, setCheckoutError] = useState("");
  const [deliveryQuote, setDeliveryQuote] = useState(null);
  const [quoteError, setQuoteError] = useState("");
  const [isQuoteLoading, setIsQuoteLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    if (!cartItems.length) {
      setDeliveryQuote(null);
      return undefined;
    }

    let isActive = true;
    const quoteTimer = setTimeout(async () => {
      try {
        setIsQuoteLoading(true);
        setQuoteError("");
        const quote = await orderService.quoteOrder({ deliveryAddress: address });

        if (isActive) {
          setDeliveryQuote(quote);
        }
      } catch (error) {
        if (isActive) {
          setQuoteError(getApiErrorMessage(error));
        }
      } finally {
        if (isActive) {
          setIsQuoteLoading(false);
        }
      }
    }, 350);

    return () => {
      isActive = false;
      clearTimeout(quoteTimer);
    };
  }, [address, cartItems.length]);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setCheckoutError("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    setCheckoutError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await response.json();
          
          if (data && data.address) {
            setAddress(prev => ({
              ...prev,
              line1: data.address.road || data.display_name.split(',')[0],
              city: data.address.city || data.address.town || data.address.village || prev.city,
              state: data.address.state || prev.state,
              postalCode: data.address.postcode || prev.postalCode,
              latitude,
              longitude
            }));
          } else {
            setAddress(prev => ({ ...prev, latitude, longitude }));
          }
        } catch (error) {
          setAddress(prev => ({ ...prev, latitude, longitude }));
        }
        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
        setCheckoutError("Failed to access location. Please check your browser permissions.");
      }
    );
  };

  const requiredAddressFields = ["line1", "city", "state", "postalCode"];

  const submitHandler = async (e) => {
    e.preventDefault();
    setCheckoutError("");

    const missingField = requiredAddressFields.find((field) => !address[field]?.trim());
    if (missingField) {
      setCheckoutError("Please complete all required delivery address fields.");
      return;
    }

    const orderResult = await dispatch(
      placeOrder({
        deliveryAddress: address,
        paymentMethod,
        specialInstructions: "Please prepare the order carefully"
      })
    );

    if (orderResult.error) {
      setCheckoutError(orderResult.payload || orderResult.error.message);
      return;
    }

    const order = orderResult.payload;
    const createdOrders = Array.isArray(order?.orders) ? order.orders : [order];
    const totalAmount =
      order?.pricing?.totalAmount
      || createdOrders.reduce((sum, currentOrder) => sum + (currentOrder?.pricing?.totalAmount || 0), 0);

    try {
      if (paymentMethod === "ONLINE") {
        await paymentService.createIntent({ amount: totalAmount });

        for (const createdOrder of createdOrders) {
          await paymentService.confirmPayment({ orderId: createdOrder._id });
        }
      }
    } catch (error) {
      setCheckoutError(getApiErrorMessage(error));
      return;
    }

    dispatch(clearCartItems());

    if (createdOrders.length === 1) {
      navigate(`/orders/${createdOrders[0]._id}/tracking`);
      return;
    }

    navigate("/orders");
  };

  if (!cartItems.length) {
    return <p>Add items to cart before checkout.</p>;
  }

  return (
    <section className="form-page">
      <form className="form-card wide-form" onSubmit={submitHandler}>
        <h2>Checkout</h2>
        <button 
          type="button" 
          className="button secondary" 
          onClick={handleGetCurrentLocation}
          disabled={isLocating}
          style={{ marginBottom: '1rem', width: '100%', borderColor: '#10b981', color: '#10b981' }}
        >
          {isLocating ? '📍 Locating...' : '📍 Use Current Location'}
        </button>
        {deliveryQuote ? (
          <section className="checkout-price-card" aria-label="Delivery charge summary">
            <div className="space-between">
              <div>
                <p className="eyebrow">Delivery Charge</p>
                <h3>{formatCurrency(deliveryQuote.totals?.deliveryFee || 0)}</h3>
              </div>
              <span className="soft-pill">
                {formatCurrency(deliveryQuote.deliveryRatePerKm || 0)} / km
              </span>
            </div>
            <div className="checkout-charge-list">
              {deliveryQuote.restaurants?.map((quote) => (
                <div key={quote.restaurantId}>
                  <span>
                    {quote.restaurantName}
                    {quote.pricing?.deliveryDistanceKm ? ` - ${quote.pricing.deliveryDistanceKm} km` : " - fallback fee"}
                  </span>
                  <strong>{formatCurrency(quote.pricing?.deliveryFee || 0)}</strong>
                </div>
              ))}
            </div>
            <div className="checkout-total-line">
              <span>Estimated final total</span>
              <strong>{formatCurrency(deliveryQuote.totals?.totalAmount || 0)}</strong>
            </div>
            <p>
              Use current location for exact per-kilometer delivery charge.
              If restaurant/customer GPS is missing, the app uses the fallback delivery fee.
            </p>
          </section>
        ) : null}
        {isQuoteLoading ? <p>Calculating delivery charge...</p> : null}
        {quoteError ? <p className="error-text">{quoteError}</p> : null}
        <input
          placeholder="Address line 1"
          value={address.line1}
          onChange={(e) => setAddress({ ...address, line1: e.target.value })}
        />
        <input
          placeholder="Address line 2"
          value={address.line2}
          onChange={(e) => setAddress({ ...address, line2: e.target.value })}
        />
        <input
          placeholder="City"
          value={address.city}
          onChange={(e) => setAddress({ ...address, city: e.target.value })}
        />
        <input
          placeholder="State"
          value={address.state}
          onChange={(e) => setAddress({ ...address, state: e.target.value })}
        />
        <input
          placeholder="Postal Code"
          value={address.postalCode}
          onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
        />
        <input
          placeholder="Landmark"
          value={address.landmark}
          onChange={(e) => setAddress({ ...address, landmark: e.target.value })}
        />
        <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
          <option value="ONLINE">Online Payment</option>
          <option value="COD">Cash on Delivery</option>
        </select>
        {checkoutError ? <p className="error-text">{checkoutError}</p> : null}
        <button className="button">Place Order</button>
      </form>
    </section>
  );
};

export default Checkout;
