const calculateOrderTotal = ({
  items,
  deliveryFee = 40,
  discount = 0,
  deliveryDistanceKm,
  deliveryRatePerKm,
  deliveryFeeSource = "fallback"
}) => {
  const subtotal = items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0);
  const tax = Number((subtotal * 0.05).toFixed(2));
  
  let totalAmount = subtotal + deliveryFee + tax - discount;
  if (totalAmount < 0) totalAmount = 0;
  totalAmount = Number(totalAmount.toFixed(2));

  return {
    subtotal,
    deliveryFee,
    deliveryDistanceKm,
    deliveryRatePerKm,
    deliveryFeeSource,
    tax,
    discount,
    totalAmount
  };
};

module.exports = calculateOrderTotal;
