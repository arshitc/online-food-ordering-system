const mongoose = require("mongoose");
require("dotenv").config({ path: "server/.env" });

const Restaurant = require("../server/models/Restaurant");

const sampleRestaurants = [
  {
    name: "Spice Route Kitchen",
    description: "Popular Indian kitchen serving biryani, curries, and late-night meals.",
    location: "Madhapur, Hyderabad",
    city: "Hyderabad",
    cuisine: ["Indian", "Biryani"],
    image:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200"
  },
  {
    name: "Urban Burger House",
    description: "Fresh burgers, fries, wraps, and quick comfort food for everyday cravings.",
    location: "Gachibowli, Hyderabad",
    city: "Hyderabad",
    cuisine: ["Burgers", "Fast Food"],
    image:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200"
  },
  {
    name: "Green Bowl Cafe",
    description: "Healthy bowls, sandwiches, juices, and light meals prepared fresh.",
    location: "Jubilee Hills, Hyderabad",
    city: "Hyderabad",
    cuisine: ["Healthy", "Beverages"],
    image:
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200"
  }
];

async function refreshRestaurants() {
  await mongoose.connect(process.env.MONGO_URI);

  const restaurants = await Restaurant.find().sort({ createdAt: 1 });

  for (let index = 0; index < sampleRestaurants.length; index += 1) {
    const sample = sampleRestaurants[index];
    const existing = restaurants[index];

    if (existing) {
      existing.name = sample.name;
      existing.description = sample.description;
      existing.location = sample.location;
      existing.city = sample.city;
      existing.cuisine = sample.cuisine;
      existing.image = sample.image;
      existing.contactNumber = existing.contactNumber || `900000000${index}`;
      await existing.save();
    }
  }

  console.log("Restaurant names and images refreshed successfully.");
  await mongoose.disconnect();
}

refreshRestaurants().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
