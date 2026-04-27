import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Restaurants from "./pages/Restaurants";
import RestaurantDetails from "./pages/RestaurantDetails";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import OrderTracking from "./pages/OrderTracking";
import Profile from "./pages/Profile";
import CustomerDashboard from "./pages/CustomerDashboard";
import RestaurantDashboard from "./pages/RestaurantDashboard";
import DeliveryDashboard from "./pages/DeliveryDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

const routes = [
  { path: "/", element: <Home /> },
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  { path: "/restaurants", element: <Restaurants /> },
  { path: "/restaurants/:id", element: <RestaurantDetails /> },
  { path: "/cart", element: <Cart /> },
  { path: "/checkout", element: <Checkout /> },
  { path: "/orders", element: <Orders /> },
  { path: "/orders/:id/tracking", element: <OrderTracking /> },
  { path: "/profile", element: <Profile /> },
  { path: "/dashboard/customer", element: <CustomerDashboard /> },
  { path: "/dashboard/restaurant", element: <RestaurantDashboard /> },
  { path: "/dashboard/delivery", element: <DeliveryDashboard /> },
  { path: "/dashboard/admin", element: <AdminDashboard /> },
  { path: "*", element: <NotFound /> }
];

export default routes;
