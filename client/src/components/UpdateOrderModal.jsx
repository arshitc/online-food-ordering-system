import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchRestaurantOrders, updateOwnerOrderStatus } from "../redux/orderSlice";
import authService from "../services/authService";

const UpdateOrderModal = ({ onClose }) => {
  const dispatch = useDispatch();
  const { list } = useSelector((state) => state.orders);
  
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [status, setStatus] = useState("");
  const [deliveryStaffList, setDeliveryStaffList] = useState([]);
  const [deliveryStaffId, setDeliveryStaffId] = useState("");

  useEffect(() => {
    dispatch(fetchRestaurantOrders());
    authService.getDeliveryStaff()
      .then(setDeliveryStaffList)
      .catch(() => setDeliveryStaffList([]));
  }, [dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedOrderId || !status) return;
    if (status === "Out for Delivery" && !deliveryStaffId) return;
    
    dispatch(updateOwnerOrderStatus({ 
      id: selectedOrderId, 
      payload: { status, deliveryStaffId } 
    }));
    onClose();
  };

  const activeOrders = list.filter(order => order.status !== "Delivered" && order.status !== "Cancelled");

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: 'rgba(31, 41, 51, 0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
    }}>
      <div className="form-card" style={{ background: '#fff', position: 'relative', width: 'min(420px, 90%)' }}>
        <button 
          onClick={onClose} 
          style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#66717f' }}
        >
          ✖
        </button>

        <h3 style={{ marginBottom: "0.2rem" }}>Update Order Status</h3>
        <p style={{ marginBottom: "1rem", fontSize: "0.9rem" }}>Quickly change the status of any active order.</p>
        
        <form style={{ display: 'grid', gap: '0.8rem' }} onSubmit={handleSubmit}>
          <select 
            value={selectedOrderId} 
            onChange={(e) => setSelectedOrderId(e.target.value)}
          >
            <option value="">Select an active order</option>
            {activeOrders.length === 0 && <option value="" disabled>No active orders found.</option>}
            {activeOrders.map((order) => (
              <option key={order._id} value={order._id}>
                Order #{order._id.slice(-6)} ({order.status})
              </option>
            ))}
          </select>
          
          <select 
            value={status} 
            onChange={(e) => setStatus(e.target.value)}
            disabled={!selectedOrderId}
          >
            <option value="">Select next status</option>
            <option value="Out for Delivery">Out for Delivery</option>
          </select>

          <select 
            value={deliveryStaffId} 
            onChange={(e) => setDeliveryStaffId(e.target.value)}
            required={status === "Out for Delivery"}
          >
            <option value="">Assign delivery staff {status === "Out for Delivery" ? "(Required)" : "(Optional)"}</option>
            {deliveryStaffList.map((staff) => (
              <option key={staff._id} value={staff._id}>
                {staff.name}
              </option>
            ))}
          </select>

          <button 
            className="button" 
            type="submit" 
            disabled={!selectedOrderId || !status || (status === "Out for Delivery" && !deliveryStaffId)}
          >
            Apply Update
          </button>
        </form>
      </div>
    </div>
  );
};

export default UpdateOrderModal;
