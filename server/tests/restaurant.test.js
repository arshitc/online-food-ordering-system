const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../server");
const Restaurant = require("../models/Restaurant");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");

describe("Restaurant API", () => {
  let ownerToken;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/online_food_ordering_test");
    }

    // Create an owner for testing restaurant creation
    const owner = await User.create({
      name: "Owner Test",
      email: "owner_test@example.com",
      password: "password123",
      role: "owner"
    });
    ownerToken = generateToken(owner._id, owner.role);
  });

  afterAll(async () => {
    await Restaurant.deleteMany({ name: "Test Restaurant" });
    await User.deleteMany({ email: "owner_test@example.com" });
    await mongoose.connection.close();
  });

  describe("GET /api/restaurants", () => {
    it("should return a list of restaurants", async () => {
      const res = await request(app).get("/api/restaurants");
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe("POST /api/restaurants", () => {
    it("should allow owner to create a restaurant", async () => {
      const res = await request(app)
        .post("/api/restaurants")
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({
          name: "Test Restaurant",
          description: "A test description",
          cuisine: "Fast Food",
          location: "Test Location",
          city: "Test City",
          contactNumber: "1234567890"
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.name).toBe("Test Restaurant");
    });

    it("should not allow anonymous users to create a restaurant", async () => {
      const res = await request(app)
        .post("/api/restaurants")
        .send({
          name: "Unauthorized Restaurant"
        });

      expect(res.statusCode).toBe(401);
    });
  });
});
