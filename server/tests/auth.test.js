const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../server");
const User = require("../models/User");

describe("Auth API", () => {
  beforeAll(async () => {
    // Connect to a test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/online_food_ordering_test");
    }
  });

  afterAll(async () => {
    // Cleanup and disconnect
    await User.deleteMany({ email: /test@example.com/ });
    await mongoose.connection.close();
  });

  describe("POST /api/auth/register", () => {
    it("should register a new customer", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Test User",
          email: "customer_test@example.com",
          password: "password123",
          phone: "1234567890",
          role: "customer"
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty("token");
      expect(res.body.email).toBe("customer_test@example.com");
    });

    it("should return 400 if user exists", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Test User",
          email: "customer_test@example.com",
          password: "password123"
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("User already exists with this email");
    });
  });

  describe("POST /api/auth/login", () => {
    it("should login the registered customer", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "customer_test@example.com",
          password: "password123"
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("token");
    });

    it("should return 401 for invalid credentials", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "customer_test@example.com",
          password: "wrongpassword"
        });

      expect(res.statusCode).toBe(401);
    });
  });
});
