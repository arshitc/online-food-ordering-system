const statusSteps = [
  "Pending",
  "Accepted",
  "Preparing",
  "Ready for Pickup",
  "Out for Delivery",
  "Delivered"
];

const OrderStatus = ({ order }) => (
  <section className="status-box">
    <h3>Current Status: {order.status}</h3>
    <div className="status-steps">
      {statusSteps.map((step) => (
        <div
          key={step}
          className={`status-step ${statusSteps.indexOf(step) <= statusSteps.indexOf(order.status) ? "active" : ""}`}
        >
          {step}
        </div>
      ))}
    </div>
    <ul className="timeline">
      {order.timeline?.map((entry, index) => (
        <li key={`${entry.status}-${index}`}>
          <strong>{entry.status}</strong> - {entry.note || "Status updated"}
        </li>
      ))}
    </ul>
  </section>
);

export default OrderStatus;

