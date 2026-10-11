
import { useEffect, useState } from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";

import "./App.css";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";

import RestaurantDashboard from "./pages/RestaurantDashboard";
import AddDonation from "./pages/AddDonation";
import NGODashboard from "./pages/NGODashboard";
import VolunteerDashboard from "./pages/VolunteerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import TrackDonation from "./pages/TrackDonation";

const API = "https://foodbridge-backend-0l2c.onrender.com/api";

function getDashboard(role) {
  if (role === "RESTAURANT") return "/restaurant/dashboard";
  if (role === "NGO") return "/ngo/dashboard";
  if (role === "VOLUNTEER") return "/volunteer/dashboard";
  if (role === "ADMIN") return "/admin/dashboard";

  return "/login";
}

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("foodbridgeUser"));
  } catch {
    localStorage.removeItem("foodbridgeUser");
    return null;
  }
}

function ProtectedRoute({ allowedRole, children }) {
  const user = getStoredUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== allowedRole) {
    return <Navigate to={getDashboard(user.role)} replace />;
  }

  return children;
}

function ProtectedUserRoute({ children }) {
  const user = getStoredUser();

  if (!user || !user.role) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getStoredUser();

  const [unreadCount, setUnreadCount] = useState(0);

  const publicPages = [
    "/",
    "/login",
    "/register",
    "/register/restaurant",
    "/register/ngo",
    "/register/volunteer",
  ];

  const dashboardHasOwnNavbar = [
    "/restaurant/dashboard",
    "/ngo/dashboard",
    "/volunteer/dashboard",
    "/admin/dashboard",
  ];

  useEffect(() => {
    if (!user?.id) {
      setUnreadCount(0);
      return;
    }

    let active = true;

    const fetchUnreadCount = async () => {
      try {
        // Replace this URL if your backend uses a different endpoint.
        const response = await fetch(
          `${API}/notifications/unread-count/${user.id}`
        );

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        const count =
          typeof data === "number"
            ? data
            : Number(data?.unreadCount ?? data?.count ?? 0);

        if (active) {
          setUnreadCount(
            Number.isFinite(count) ? Math.max(0, count) : 0
          );
        }
      } catch (error) {
        console.error("Unable to fetch unread notification count:", error);
      }
    };

    fetchUnreadCount();

    const intervalId = setInterval(fetchUnreadCount, 10000);

    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, [user?.id, location.pathname]);

  if (
    !user ||
    publicPages.includes(location.pathname) ||
    dashboardHasOwnNavbar.includes(location.pathname)
  ) {
    return null;
  }

  const handleLogout = () => {
    localStorage.removeItem("foodbridgeUser");
    localStorage.removeItem("foodbridgeToken");
    navigate("/login", { replace: true });
  };

  return (
    <nav className="foodbridge-navbar">
      <div className="navbar-inner">
        <span
          className="navbar-brand"
          onClick={() => navigate(getDashboard(user.role))}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              navigate(getDashboard(user.role));
            }
          }}
        >
          FoodBridge
        </span>

        <div className="navbar-links">
          <button
            type="button"
            onClick={() => navigate("/notifications")}
            className={`navbar-logout notification-button ${
              unreadCount > 0 ? "has-unread" : ""
            }`}
            aria-label={`Notifications, ${unreadCount} unread`}
          >
            <span className="notification-bell" aria-hidden="true">
              🔔
            </span>

            Notifications

            {unreadCount > 0 && (
              <span className="notification-badge">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="navbar-logout"
          >
            <span aria-hidden="true">🚪</span> Logout
          </button>

          <button
            type="button"
            onClick={() => navigate("/profile")}
            className="navbar-logout"
          >
            👤 Account
          </button>
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        {/* Public pages */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />

        <Route
          path="/register/restaurant"
          element={<Register fixedRole="RESTAURANT" />}
        />

        <Route
          path="/register/ngo"
          element={<Register fixedRole="NGO" />}
        />

        <Route
          path="/register/volunteer"
          element={<Register fixedRole="VOLUNTEER" />}
        />

        <Route
          path="/register"
          element={<Navigate to="/register/restaurant" replace />}
        />

        {/* Restaurant pages */}
        <Route
          path="/restaurant/dashboard"
          element={
            <ProtectedRoute allowedRole="RESTAURANT">
              <RestaurantDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/restaurant/add-donation"
          element={
            <ProtectedRoute allowedRole="RESTAURANT">
              <AddDonation />
            </ProtectedRoute>
          }
        />

        <Route
          path="/track-donation"
          element={
            <ProtectedRoute allowedRole="RESTAURANT">
              <TrackDonation />
            </ProtectedRoute>
          }
        />

        {/* NGO dashboard */}
        <Route
          path="/ngo/dashboard"
          element={
            <ProtectedRoute allowedRole="NGO">
              <NGODashboard />
            </ProtectedRoute>
          }
        />

        {/* Volunteer dashboard */}
        <Route
          path="/volunteer/dashboard"
          element={
            <ProtectedRoute allowedRole="VOLUNTEER">
              <VolunteerDashboard />
            </ProtectedRoute>
          }
        />

        {/* Admin dashboard */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRole="ADMIN">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Profile */}
        <Route
          path="/profile"
          element={
            <ProtectedUserRoute>
              <Profile />
            </ProtectedUserRoute>
          }
        />

        {/* Notifications */}
        <Route
          path="/notifications"
          element={
            <ProtectedUserRoute>
              <Notifications />
            </ProtectedUserRoute>
          }
        />

        {/* Unknown URLs */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
