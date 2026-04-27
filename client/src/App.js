import { Route, Routes } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useEffect } from "react";
import { io } from "socket.io-client";
import { pushRealtimeOrderUpdate } from "./redux/orderSlice";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import routes from "./routes";
import { ENABLE_REALTIME, SOCKET_URL } from "./utils/runtimeConfig";

const routeMap = Object.fromEntries(routes.map((route) => [route.path, route.element]));

const publicRoutePaths = [
  "/",
  "/login",
  "/register",
  "/restaurants",
  "/restaurants/:id",
  "*"
];

const customerRoutePaths = [
  "/cart",
  "/checkout",
  "/orders/:id/tracking",
  "/dashboard/customer"
];

const sharedProtectedRoutePaths = ["/profile", "/orders"];
const ownerRoutePaths = ["/dashboard/restaurant"];
const deliveryRoutePaths = ["/dashboard/delivery"];
const adminRoutePaths = ["/dashboard/admin"];

const renderRouteList = (paths) =>
  paths.map((path) => <Route key={path} path={path} element={routeMap[path]} />);

const socket = io(SOCKET_URL, {
  autoConnect: false
});

const App = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!user || !ENABLE_REALTIME) return;
    
    socket.connect();
    socket.emit("join-room", { userId: user._id, role: user.role });
    
    socket.on("order:update", (payload) => {
      dispatch(pushRealtimeOrderUpdate(payload));
    });

    return () => {
      socket.off("order:update");
      socket.disconnect();
    };
  }, [dispatch, user]);

  return (
    <div className="app-shell">
      <Navbar />
      <div className="page-container">
        <Routes>
          {renderRouteList(publicRoutePaths.filter((path) => path !== "*"))}

          <Route element={<ProtectedRoute roles={["customer"]} />}>
            {renderRouteList(customerRoutePaths)}
          </Route>

          <Route element={<ProtectedRoute roles={["customer", "owner", "delivery", "admin"]} />}>
            {renderRouteList(sharedProtectedRoutePaths)}
          </Route>

          <Route element={<ProtectedRoute roles={["owner"]} />}>
            {renderRouteList(ownerRoutePaths)}
          </Route>

          <Route element={<ProtectedRoute roles={["delivery"]} />}>
            {renderRouteList(deliveryRoutePaths)}
          </Route>

          <Route element={<ProtectedRoute roles={["admin"]} />}>
            {renderRouteList(adminRoutePaths)}
          </Route>

          <Route path="*" element={routeMap["*"]} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
};

export default App;
