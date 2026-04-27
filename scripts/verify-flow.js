const base = process.env.VERIFY_API_URL || "http://127.0.0.1:5050/api";

async function req(path, options = {}) {
  const res = await fetch(base + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  const text = await res.text();
  let data;

  try {
    data = JSON.parse(text);
  } catch (error) {
    data = text;
  }

  if (!res.ok) {
    throw new Error(`${options.method || "GET"} ${path} failed: ${res.status} ${JSON.stringify(data)}`);
  }

  return data;
}

async function main() {
  const stamp = Date.now();

  const customer = await req("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: "Ananya",
      email: `ananya.${stamp}@example.com`,
      password: "123456",
      phone: "9876543210",
      role: "customer"
    })
  });

  const owner = await req("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: "Owner Demo",
      email: `owner.${stamp}@example.com`,
      password: "123456",
      phone: "9876500001",
      role: "owner"
    })
  });

  const delivery = await req("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: "Delivery Demo",
      email: `delivery.${stamp}@example.com`,
      password: "123456",
      phone: "9876500002",
      role: "delivery"
    })
  });

  const admin = await req("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: "Admin Demo",
      email: `admin.${stamp}@example.com`,
      password: "123456",
      phone: "9876500003",
      role: "admin"
    })
  });

  const ownerAuth = { Authorization: `Bearer ${owner.token}` };
  const customerAuth = { Authorization: `Bearer ${customer.token}` };
  const deliveryAuth = { Authorization: `Bearer ${delivery.token}` };
  const adminAuth = { Authorization: `Bearer ${admin.token}` };

  const restaurant = await req("/restaurants", {
    method: "POST",
    headers: ownerAuth,
    body: JSON.stringify({
      name: "Spicy Bites",
      description: "Popular student-friendly fast food restaurant",
      location: "Madhapur, Hyderabad",
      city: "Hyderabad",
      contactNumber: "9876543210",
      cuisine: ["Fast Food", "Beverages"]
    })
  });

  const burger = await req("/menu", {
    method: "POST",
    headers: ownerAuth,
    body: JSON.stringify({
      restaurantId: restaurant._id,
      itemName: "Veg Burger",
      description: "Loaded burger",
      price: 120,
      category: "Fast Food",
      availability: true,
      isVeg: true
    })
  });

  const fries = await req("/menu", {
    method: "POST",
    headers: ownerAuth,
    body: JSON.stringify({
      restaurantId: restaurant._id,
      itemName: "French Fries",
      description: "Crispy fries",
      price: 80,
      category: "Snacks",
      availability: true,
      isVeg: true
    })
  });

  const juice = await req("/menu", {
    method: "POST",
    headers: ownerAuth,
    body: JSON.stringify({
      restaurantId: restaurant._id,
      itemName: "Orange Juice",
      description: "Fresh juice",
      price: 60,
      category: "Beverages",
      availability: true,
      isVeg: true
    })
  });

  await req("/cart", {
    method: "POST",
    headers: customerAuth,
    body: JSON.stringify({ menuItemId: burger._id, quantity: 1 })
  });

  await req("/cart", {
    method: "POST",
    headers: customerAuth,
    body: JSON.stringify({ menuItemId: fries._id, quantity: 1 })
  });

  await req("/cart", {
    method: "POST",
    headers: customerAuth,
    body: JSON.stringify({ menuItemId: juice._id, quantity: 1 })
  });

  const order = await req("/orders", {
    method: "POST",
    headers: customerAuth,
    body: JSON.stringify({
      deliveryAddress: {
        line1: "Flat 12, Lake View Residency",
        line2: "Near Metro Station",
        city: "Hyderabad",
        state: "Telangana",
        postalCode: "500081",
        landmark: "Near college"
      },
      paymentMethod: "ONLINE",
      specialInstructions: "Demo Ananya order"
    })
  });

  const payment = await req("/payments/confirm", {
    method: "POST",
    headers: customerAuth,
    body: JSON.stringify({
      orderId: order._id,
      transactionId: `TEST-${stamp}`
    })
  });

  const ownerPreparing = await req(`/orders/restaurant/${order._id}/status`, {
    method: "PUT",
    headers: ownerAuth,
    body: JSON.stringify({
      status: "Preparing",
      note: "Kitchen started cooking"
    })
  });

  const ownerOut = await req(`/orders/restaurant/${order._id}/status`, {
    method: "PUT",
    headers: ownerAuth,
    body: JSON.stringify({
      status: "Out for Delivery",
      deliveryStaffId: delivery._id,
      note: "Handed to rider"
    })
  });

  const delivered = await req(`/orders/delivery/${order._id}/status`, {
    method: "PUT",
    headers: deliveryAuth,
    body: JSON.stringify({
      status: "Delivered",
      note: "Delivered to Ananya"
    })
  });

  const review = await req("/reviews", {
    method: "POST",
    headers: customerAuth,
    body: JSON.stringify({
      orderId: order._id,
      restaurantId: restaurant._id,
      rating: 5,
      comment: "Food was delicious and delivery was fast."
    })
  });

  const adminStats = await req("/admin/stats", {
    headers: adminAuth
  });

  const customerOrders = await req("/orders/my-orders", {
    headers: customerAuth
  });

  console.log(
    JSON.stringify(
      {
        usersCreated: [customer.email, owner.email, delivery.email, admin.email],
        restaurant: restaurant.name,
        menuItems: [burger.itemName, fries.itemName, juice.itemName],
        orderStatusAfterPayment: payment.order.status,
        ownerPreparingStatus: ownerPreparing.status,
        ownerOutForDeliveryStatus: ownerOut.status,
        finalOrderStatus: delivered.status,
        reviewRating: review.rating,
        customerOrderCount: customerOrders.length,
        adminStats
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
