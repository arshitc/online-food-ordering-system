const calculateTotal = (items = []) =>
  items.reduce((sum, item) => sum + item.price * item.quantity, 0);

export default calculateTotal;

