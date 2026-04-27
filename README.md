# Online Food Ordering System

## 1. Project Overview

This project is a complete MERN stack university project named **Online Food Ordering System**. It solves the common problem of manual restaurant order handling by providing a digital platform where customers can browse restaurants, search food items, manage cart items, place orders, make payments, track status, and leave reviews. The same system also supports restaurant owners, delivery staff, and admins through separate role-based dashboards.

### Problem Statement

Phone-based and manual ordering often creates confusion, delays, missed items, payment problems, and poor customer experience. This project replaces that process with a secure and organized online workflow.

### Main Goal

Build a production-style but beginner-friendly food ordering web application using:

- MongoDB
- Express.js
- React.js
- Node.js
- JWT Authentication
- Redux Toolkit
- Optional Socket.IO real-time updates
- Optional Stripe payment support

### Scenario-Based Demo Flow

This project supports the exact case study required in the question:

1. Ananya returns home from college and opens the system.
2. She registers or logs in.
3. She searches for nearby restaurants in Hyderabad.
4. She opens a restaurant menu.
5. She adds a burger, fries, and juice to the cart.
6. She enters her delivery address.
7. She pays online.
8. The restaurant receives the order and begins preparing it.
9. The restaurant changes status from `Preparing` to `Out for Delivery`.
10. Delivery staff updates the delivery process.
11. The order becomes `Delivered`.
12. Ananya submits a rating and review after receiving the food.

This entire flow is supported across the frontend pages, Redux state, backend APIs, database schemas, and real-time order update logic.

---

## 2. Features List

### Core Features

- User registration and login
- Secure password hashing using `bcryptjs`
- JWT-based authentication
- Role-based access control for customer, owner, delivery staff, and admin
- Restaurant listing and search
- City and cuisine filtering
- Restaurant details and menu view
- Category-based food filtering
- Add to cart
- Update cart quantity
- Remove cart item
- Checkout with delivery address
- Place order
- Online payment integration flow
- Cash on delivery support
- Order tracking with timeline
- Restaurant owner dashboard
- Delivery staff dashboard
- Admin dashboard
- Ratings and reviews
- Complaint or issue reporting support
- Email notification placeholder utility
- Socket.IO-based near real-time order updates

### Optional / Advanced Features Included as Guidance

- Mock + Stripe-ready payment flow
- Socket.IO real-time updates
- Cloudinary-ready configuration for image upload
- Complaint handling for admin
- Structure ready for coupons, AI recommendations, GPS tracking, multilingual support, and analytics

---

## 3. Modules Explanation

### Frontend Module

The frontend is built using React.js and Redux Toolkit. It handles user interaction, route protection, role-based pages, cart actions, checkout, and dashboards.

### Backend Module

The backend is built using Node.js and Express.js. It provides REST APIs for authentication, restaurants, menus, cart, orders, reviews, payments, and admin operations.

### Authentication Module

- Registration with hashed passwords
- Login with JWT token
- Protected routes
- Role-based middleware

### Restaurant Module

- Add restaurants
- View restaurants
- Search restaurants
- Manage menu items
- Manage food availability

### Cart Module

- Add item to cart
- Update quantity
- Remove item
- Restrict cart to one restaurant at a time

### Order Module

- Create order from cart
- Store delivery address
- Track status updates
- Assign delivery staff
- Raise issues

### Payment Module

- Create payment intent
- Confirm payment
- Store payment details
- Mock mode if Stripe is not configured

### Review Module

- Add review after delivery
- Link review with order, customer, and restaurant
- Recalculate restaurant rating automatically

### Notification Module

- Socket.IO event-based order status update
- Email utility for confirmation and updates

### Admin Module

- Dashboard statistics
- Manage users
- View restaurants
- View orders
- View payments
- Resolve complaints

---

## 4. Database Design and Relationships

### Collections Used

#### Users

Stores all actors in the system:

- customer
- owner
- delivery
- admin

Important fields:

- `name`
- `email`
- `password`
- `role`
- `phone`
- `addresses`
- `isActive`

#### Restaurants

Stores restaurant business information.

Important fields:

- `owner`
- `name`
- `description`
- `cuisine`
- `location`
- `city`
- `contactNumber`
- `rating`
- `totalReviews`

#### Menu Items

Stores items belonging to a restaurant.

Important fields:

- `restaurantId`
- `itemName`
- `price`
- `category`
- `availability`
- `isVeg`

#### Cart

Stores temporary customer cart data.

Important fields:

- `customerId`
- `items[]`

#### Orders

Stores complete order information.

Important fields:

- `customerId`
- `restaurantId`
- `deliveryStaffId`
- `items[]`
- `deliveryAddress`
- `pricing`
- `paymentMethod`
- `paymentStatus`
- `status`
- `timeline`
- `issueReport`

#### Payments

Stores payment data linked to an order.

Important fields:

- `orderId`
- `customerId`
- `paymentMethod`
- `gateway`
- `transactionId`
- `amount`
- `paymentStatus`

#### Reviews

Stores customer feedback.

Important fields:

- `customerId`
- `restaurantId`
- `orderId`
- `rating`
- `comment`

### ER Diagram Description in Text Form

- One customer can place many orders.
- One restaurant owner can manage many restaurants.
- One restaurant can have many menu items.
- One restaurant can receive many orders.
- One order contains many food items.
- One delivery staff member can handle many orders.
- One customer can create many reviews.
- One restaurant can receive many reviews.
- One order has one payment record.

### Relationship Summary

- `User (customer) -> Order` = One-to-Many
- `User (owner) -> Restaurant` = One-to-Many
- `Restaurant -> MenuItem` = One-to-Many
- `Restaurant -> Order` = One-to-Many
- `User (delivery) -> Order` = One-to-Many
- `Order -> Payment` = One-to-One
- `User (customer) -> Review` = One-to-Many
- `Restaurant -> Review` = One-to-Many

---

## 5. Folder Structure

```text
online-food-ordering-system/
├── client/
│   ├── public/
│   │   ├── index.html
│   │   └── images/
│   ├── src/
│   │   ├── assets/
│   │   │   ├── logos/
│   │   │   ├── icons/
│   │   │   └── food-images/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── redux/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── App.js
│   │   ├── index.js
│   │   ├── index.css
│   │   └── routes.js
│   ├── package.json
│   └── .env.example
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── uploads/
│   │   ├── food-images/
│   │   └── restaurant-images/
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── .gitignore
├── package.json
└── README.md
```

### Important Folders

- `client/`: React frontend
- `client/public/`: static files
- `client/src/components/`: reusable UI components
- `client/src/pages/`: major screens
- `client/src/redux/`: Redux slices and store
- `client/src/services/`: API communication
- `server/`: backend server
- `server/controllers/`: request handling logic
- `server/middleware/`: auth, role, error, upload logic
- `server/models/`: MongoDB schema models
- `server/routes/`: API route definitions
- `server/utils/`: helper functions
- `server/uploads/`: uploaded files

---

## 6. Backend Implementation

### Backend Flow

1. `server.js` starts Express and Socket.IO.
2. MongoDB connection is created through `config/db.js`.
3. Requests enter routes.
4. Routes call controllers.
5. Controllers use models to read/write MongoDB.
6. Middleware protects routes and validates roles.
7. Errors are handled centrally.

### Backend Files and Purpose

- `config/db.js`: MongoDB connection
- `config/cloudinary.js`: Cloudinary configuration
- `controllers/authController.js`: register, login, profile
- `controllers/restaurantController.js`: restaurant CRUD and fetch logic
- `controllers/menuController.js`: menu item CRUD
- `controllers/cartController.js`: cart operations
- `controllers/orderController.js`: order creation, owner updates, delivery updates, tracking
- `controllers/paymentController.js`: payment intent and confirmation
- `controllers/reviewController.js`: create and fetch reviews
- `controllers/adminController.js`: analytics and management APIs
- `middleware/authMiddleware.js`: JWT verification
- `middleware/roleMiddleware.js`: role authorization
- `middleware/errorMiddleware.js`: 404 and error responses
- `middleware/uploadMiddleware.js`: multer upload setup
- `models/*.js`: Mongoose schemas
- `utils/generateToken.js`: JWT token generator
- `utils/sendEmail.js`: SMTP email helper
- `utils/calculateOrderTotal.js`: subtotal, tax, and final total calculation
- `utils/orderStatusUpdater.js`: reusable order timeline status update logic

### Authentication and Authorization Flow

1. User registers.
2. Password is hashed with `bcryptjs`.
3. User logs in.
4. Backend returns JWT token.
5. Frontend stores token in localStorage.
6. Token is sent in the `Authorization` header.
7. `protect` middleware validates token.
8. `allowRoles()` checks whether the current user role is allowed.

### Order Tracking Flow

1. Customer creates order.
2. Order is saved with timeline entries.
3. Payment confirmation updates order to `Preparing`.
4. Restaurant owner changes status to `Ready for Pickup` or `Out for Delivery`.
5. Delivery staff changes status to `Delivered`.
6. Socket.IO emits updates to relevant users and dashboards.

---

## 7. Frontend Implementation

### Frontend Flow

1. User opens React application.
2. Routes are managed using React Router.
3. Redux Toolkit stores auth, cart, restaurant, order, and review state.
4. Services send API requests through Axios.
5. Protected routes hide dashboards from unauthorized users.
6. Socket.IO client listens for order updates in the tracking page.

### Frontend Files and Purpose

- `App.js`: main application layout and protected routes
- `routes.js`: centralized route definitions
- `components/Navbar.jsx`: top navigation
- `components/Footer.jsx`: footer section
- `components/RestaurantCard.jsx`: restaurant card
- `components/FoodCard.jsx`: food card
- `components/CartItem.jsx`: cart item row
- `components/OrderStatus.jsx`: status stepper and timeline
- `components/ReviewCard.jsx`: feedback card
- `components/ProtectedRoute.jsx`: route guard
- `pages/Home.jsx`: landing page
- `pages/Login.jsx`: login page
- `pages/Register.jsx`: registration page
- `pages/Restaurants.jsx`: restaurant listing page
- `pages/RestaurantDetails.jsx`: menu page with category filter
- `pages/Cart.jsx`: cart management page
- `pages/Checkout.jsx`: delivery address and payment selection
- `pages/Orders.jsx`: user order list
- `pages/OrderTracking.jsx`: live tracking and review submission
- `pages/Profile.jsx`: profile update page
- `pages/CustomerDashboard.jsx`: customer stats
- `pages/RestaurantDashboard.jsx`: owner management dashboard
- `pages/DeliveryDashboard.jsx`: delivery assigned orders page
- `pages/AdminDashboard.jsx`: admin monitoring page
- `redux/store.js`: Redux store
- `redux/authSlice.js`: auth state
- `redux/cartSlice.js`: cart state
- `redux/restaurantSlice.js`: restaurant data
- `redux/orderSlice.js`: order data and real-time updates
- `redux/reviewSlice.js`: review data
- `services/*.js`: backend API communication
- `utils/*.js`: formatting and helper logic

### UI Design Notes

- Responsive layout
- Beginner-friendly components
- Clean cards and dashboard sections
- Warm visual theme
- Simple status indicators for order lifecycle

---

## 8. API Routes

### Authentication APIs

#### Register User

- Method: `POST`
- Endpoint: `/api/auth/register`

Sample Request:

```json
{
  "name": "Ananya",
  "email": "ananya@example.com",
  "password": "123456",
  "phone": "9876543210",
  "role": "customer"
}
```

Sample Response:

```json
{
  "_id": "USER_ID",
  "name": "Ananya",
  "email": "ananya@example.com",
  "role": "customer",
  "token": "JWT_TOKEN"
}
```

#### Login User

- Method: `POST`
- Endpoint: `/api/auth/login`

#### Get Profile

- Method: `GET`
- Endpoint: `/api/auth/profile`

#### Update Profile

- Method: `PUT`
- Endpoint: `/api/auth/profile`

### Restaurant APIs

- `GET /api/restaurants`
- `GET /api/restaurants/:id`
- `POST /api/restaurants`
- `PUT /api/restaurants/:id`
- `GET /api/restaurants/owner/me`

### Menu APIs

- `GET /api/menu`
- `POST /api/menu`
- `PUT /api/menu/:id`
- `DELETE /api/menu/:id`

### Cart APIs

- `GET /api/cart`
- `POST /api/cart`
- `PUT /api/cart/:itemId`
- `DELETE /api/cart/:itemId`
- `DELETE /api/cart`

Add to Cart Request:

```json
{
  "menuItemId": "MENU_ITEM_ID",
  "quantity": 2
}
```

### Order APIs

- `POST /api/orders`
- `GET /api/orders/my-orders`
- `GET /api/orders/:id`
- `GET /api/orders/restaurant`
- `PUT /api/orders/restaurant/:id/status`
- `GET /api/orders/delivery/assigned`
- `PUT /api/orders/delivery/:id/status`
- `PUT /api/orders/:id/issue`

Place Order Request:

```json
{
  "deliveryAddress": {
    "line1": "Flat 12, Lake View Residency",
    "line2": "Near Metro Station",
    "city": "Hyderabad",
    "state": "Telangana",
    "postalCode": "500081",
    "landmark": "Near college"
  },
  "paymentMethod": "ONLINE",
  "specialInstructions": "Less spicy please"
}
```

Place Order Response:

```json
{
  "_id": "ORDER_ID",
  "status": "Pending",
  "paymentStatus": "pending",
  "pricing": {
    "subtotal": 220,
    "deliveryFee": 40,
    "tax": 11,
    "discount": 0,
    "totalAmount": 271
  }
}
```

### Payment APIs

- `POST /api/payments/create-intent`
- `POST /api/payments/confirm`
- `GET /api/payments/my-payments`

### Review APIs

- `POST /api/reviews`
- `GET /api/reviews/:restaurantId`

Review Request:

```json
{
  "orderId": "ORDER_ID",
  "restaurantId": "RESTAURANT_ID",
  "rating": 5,
  "comment": "Food was delicious and delivery was fast."
}
```

### Admin APIs

- `GET /api/admin/stats`
- `GET /api/admin/users`
- `PUT /api/admin/users/:id`
- `GET /api/admin/restaurants`
- `GET /api/admin/orders`
- `GET /api/admin/payments`
- `GET /api/admin/complaints`
- `PUT /api/admin/complaints/:id/resolve`

---

## 9. Role-Based Dashboards

### Customer Dashboard

- View order count
- See delivered and active orders
- Track orders
- Submit reviews

### Restaurant Owner Dashboard

- Create restaurant
- Add menu items
- View incoming orders
- Change order status
- Assign delivery staff

### Delivery Dashboard

- View assigned orders
- Start delivery
- Mark delivered

### Admin Dashboard

- View total users
- View restaurants
- View revenue
- Monitor orders and payments
- Manage user activation
- Resolve complaints

---

## 10. Payment and Notification Integration

### Payment Integration Flow

1. Customer places order from checkout page.
2. Backend creates order.
3. Frontend calls payment intent API.
4. If Stripe keys are configured, Stripe can be used.
5. If Stripe keys are not configured, the system works in mock payment mode.
6. Payment confirmation updates order payment status and order status.

### Notification Logic

- Email utility sends confirmation when SMTP is configured.
- Socket.IO emits order updates to:
  - customer room
  - restaurant room
  - delivery room

This gives near real-time order tracking.

---

## 11. Optional Advanced Features

The codebase is ready to be extended with:

- GPS-based real-time map tracking
- AI food recommendations
- Coupon and discount engine
- Loyalty points system
- Dark mode
- Subscription meal plans
- Chat between customer and restaurant
- Voice search
- Multilingual interface
- Restaurant analytics dashboard

---

## 12. Setup and Run Instructions

### Software Required

- Node.js
- MongoDB
- Git
- Postman

### Installation Steps

1. Clone the repository.
2. Open terminal in project root.
3. Run:

```bash
npm run install-all
```

4. Create environment files:

- Copy `server/.env.example` to `server/.env`
- Copy `client/.env.example` to `client/.env`

5. Start MongoDB locally.
6. Run the application:

```bash
npm run dev
```

### Ports

- Frontend: `http://localhost:4321`
- Backend: `http://localhost:5050`

### Suggested Demo Accounts

Create these from the register page:

- Customer: `ananya@example.com`
- Owner: `owner@example.com`
- Delivery: `delivery@example.com`
- Admin: `admin@example.com`

---

## 13. README Content for Submission

For submission, your explanation should include:

- problem statement
- objective
- technologies used
- modules
- architecture
- database design
- API list
- screenshots after running the project
- demo flow using Ananya scenario
- conclusion

This repository already includes most of that content and can be extended with screenshots before final submission.

---

## 14. Postman Testing Guide

### Recommended Testing Order

1. Register users for all roles.
2. Login and save JWT token.
3. Create restaurant using owner token.
4. Create menu items using owner token.
5. Login as customer and add items to cart.
6. Place order.
7. Confirm payment.
8. Login as owner and update order status.
9. Login as delivery staff and mark order delivered.
10. Login as customer and submit review.
11. Login as admin and view stats, payments, users, and complaints.

### Important Header

```text
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 15. Deployment Guidance

### Backend Deployment

- The project now supports a single-service deployment from the repository root
- In production, the Express server serves the React build from `client/build`
- Set the build command to `npm run build`
- Set the start command to `npm start`
- Add `MONGO_URI`, `JWT_SECRET`, `NODE_ENV=production`, and `PORT` on the hosting platform
- Vercel MongoDB Atlas integration typically injects `MONGODB_URI`, which this backend now accepts automatically
- `CLIENT_URL` is optional for a same-service deployment and only needed when frontend and backend are hosted on different domains

### Frontend Deployment

- If you still want separate frontend hosting, deploy `client` to Vercel or Netlify
- Set `REACT_APP_API_URL` to `https://your-backend-domain/api`
- Set `REACT_APP_SOCKET_URL` to `https://your-backend-domain`
- Set `REACT_APP_ENABLE_REALTIME=false` when deploying to Vercel, because Vercel Functions do not keep Socket.IO connections alive
- Set `CLIENT_URL` on the backend to the deployed frontend URL

### Database Deployment

- Use MongoDB Atlas for cloud database hosting

### Recommended Single-Service Flow

1. Run `npm install` in the project root.
2. Copy `server/.env.example` to `server/.env` and fill in the real values.
3. Run `npm run build` from the project root.
4. Run `npm start` from the project root.
5. Open the deployed app and verify login, restaurant search, and order creation.

---

## 16. Learning Outcomes

This project helps students understand:

- Full Stack Development
- REST API Design
- Authentication and Authorization
- MongoDB Database Design
- CRUD Operations
- Payment Gateway Integration
- Order Management Logic
- Real-Time Notification System
- Role-Based Access Control
- React State Management
- Real-world Project Structure
- Deployment Basics

---

## 17. Viva Questions and Answers

### 1. What is the MERN stack?
The MERN stack is a JavaScript full stack made of MongoDB, Express.js, React.js, and Node.js.

### 2. Why is MongoDB used in this project?
MongoDB is flexible, document-based, and works very well with JavaScript objects used in MERN applications.

### 3. Why do we hash passwords?
Passwords are hashed for security so raw passwords are never stored in the database.

### 4. What is JWT?
JWT is a token format used to identify authenticated users without storing session state on the server.

### 5. What is role-based access control?
It is a method where users get access based on their role, such as customer, owner, delivery staff, or admin.

### 6. Why is Redux used?
Redux helps manage shared state such as auth data, cart data, restaurant data, and order data across multiple pages.

### 7. How does order tracking work?
Order tracking works by saving status updates in the order timeline and pushing changes through APIs and Socket.IO.

### 8. How is payment handled?
The project supports a Stripe-ready flow and also includes a mock mode for easy demo execution.

### 9. What is the purpose of middleware in Express?
Middleware is used for authentication, authorization, error handling, and request preprocessing.

### 10. How are reviews linked to orders?
Each review stores `orderId`, `customerId`, and `restaurantId`, so only delivered orders can be reviewed.

### 11. Why is there a separate admin dashboard?
The admin dashboard is used to monitor the complete system, manage users, resolve complaints, and check revenue.

### 12. What makes this project production-style?
Modular folder structure, role-based security, reusable utilities, clear separation of concerns, and scalable APIs.

---

## 18. Future Improvements

- Add Google Maps for live delivery tracking
- Add real Razorpay integration
- Add restaurant analytics graphs
- Add coupon codes and offers
- Add wishlist and favorite restaurants
- Add push notifications and SMS integration
- Add image uploads through Cloudinary UI flow
- Add automated testing with Jest and Supertest
- Add pagination and search optimization
- Add Docker support

---

## Sample Data for Quick Demo

### Restaurant

```json
{
  "name": "Spicy Bites",
  "description": "Popular student-friendly fast food restaurant",
  "location": "Madhapur, Hyderabad",
  "city": "Hyderabad",
  "contactNumber": "9876543210",
  "cuisine": ["Fast Food", "Beverages"]
}
```

### Menu Items

```json
[
  {
    "itemName": "Veg Burger",
    "price": 120,
    "category": "Fast Food",
    "availability": true
  },
  {
    "itemName": "French Fries",
    "price": 80,
    "category": "Snacks",
    "availability": true
  },
  {
    "itemName": "Orange Juice",
    "price": 60,
    "category": "Beverages",
    "availability": true
  }
]
```
