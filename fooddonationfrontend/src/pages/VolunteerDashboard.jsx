import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API = "https://foodbridge-backend-0l2c.onrender.com/api";

function VolunteerDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [activePage, setActivePage] = useState("dashboard");
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const savedUser = localStorage.getItem("foodbridgeUser");

    if (!savedUser) {
      navigate("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(savedUser);

      if (parsedUser.role !== "VOLUNTEER") {
        navigate("/login");
        return;
      }

      setUser(parsedUser);
    } catch {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    if (user?.id) {
      fetchDeliveries();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const getHeaders = () => {
    const token = localStorage.getItem("foodbridgeToken");

    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  // LOAD DELIVERIES
  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API}/deliveries`, {
        headers: getHeaders(),
      });

      const responseText = await response.text();
      let data = [];

      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch {
          throw new Error(
            "The server returned an invalid deliveries response."
          );
        }
      }

      if (!response.ok) {
        throw new Error("Unable to load delivery assignments.");
      }

      if (!Array.isArray(data)) {
        data = [];
      }

      // Preserve the existing assignment filtering logic.
      const volunteerDeliveries = data.filter(
        (delivery) =>
          delivery.status?.toUpperCase() === "ASSIGNED" ||
          String(delivery.volunteerId) === String(user.id)
      );

      setDeliveries(volunteerDeliveries);
    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to load delivery assignments.");
    } finally {
      setLoading(false);
    }
  };

  // ACCEPT DELIVERY
  const acceptDelivery = async (deliveryId) => {
    try {
      setUpdatingId(deliveryId);
      setError("");
      setSuccessMessage("");

      const response = await fetch(
        `${API}/deliveries/${deliveryId}/status?status=ACCEPTED&volunteerId=${user.id}`,
        {
          method: "PUT",
          headers: getHeaders(),
        }
      );

      const responseText = await response.text();
      let data = {};

      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch {
          data = {};
        }
      }

      if (!response.ok) {
        throw new Error(data.message || "Unable to accept delivery.");
      }

      setSuccessMessage("Pickup accepted successfully!");

      setDeliveries((current) =>
        current.map((delivery) =>
          delivery.id === deliveryId
            ? {
                ...delivery,
                volunteerId: user.id,
                status: "ACCEPTED",
              }
            : delivery
        )
      );
    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to accept delivery.");
    } finally {
      setUpdatingId(null);
    }
  };

  // UPDATE DELIVERY STATUS
  const updateDeliveryStatus = async (
    deliveryId,
    status,
    successText
  ) => {
    try {
      setUpdatingId(deliveryId);
      setError("");
      setSuccessMessage("");

      const response = await fetch(
        `${API}/deliveries/${deliveryId}/status?status=${status}`,
        {
          method: "PUT",
          headers: getHeaders(),
        }
      );

      const responseText = await response.text();
      let data = {};

      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch {
          data = {};
        }
      }

      if (!response.ok) {
        throw new Error(data.message || "Unable to update delivery.");
      }

      setSuccessMessage(successText);

      setDeliveries((current) =>
        current.map((delivery) =>
          delivery.id === deliveryId
            ? { ...delivery, status }
            : delivery
        )
      );
    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to update delivery.");
    } finally {
      setUpdatingId(null);
    }
  };

  const markPickedUp = (deliveryId) =>
    updateDeliveryStatus(
      deliveryId,
      "PICKED_UP",
      "Food marked as picked up successfully!"
    );

  const markDelivered = (deliveryId) =>
    updateDeliveryStatus(
      deliveryId,
      "DELIVERED",
      "Food marked as delivered successfully!"
    );

  // LOGOUT
  const logout = () => {
    localStorage.removeItem("foodbridgeUser");
    localStorage.removeItem("foodbridgeToken");
    navigate("/login");
  };

  const openPage = (page) => {
    setActivePage(page);
    setError("");
    setSuccessMessage("");
  };

  if (!user) {
    return <div className="ngo-loading">Loading dashboard...</div>;
  }

  const getStatus = (delivery) =>
    (delivery.status || "").toUpperCase();

  const activeDeliveries = deliveries.filter((delivery) =>
    ["ASSIGNED", "ACCEPTED", "PICKED_UP", "IN_TRANSIT"].includes(
      getStatus(delivery)
    )
  );

  const assignedCount = deliveries.filter(
    (delivery) => getStatus(delivery) === "ASSIGNED"
  ).length;

  const acceptedCount = deliveries.filter(
    (delivery) => getStatus(delivery) === "ACCEPTED"
  ).length;

  const pickedUpCount = deliveries.filter((delivery) =>
    ["PICKED_UP", "IN_TRANSIT"].includes(getStatus(delivery))
  ).length;

  const deliveredCount = deliveries.filter((delivery) =>
    ["DELIVERED", "COMPLETED"].includes(getStatus(delivery))
  ).length;

  const completedDeliveries = deliveries.filter((delivery) =>
    ["DELIVERED", "COMPLETED"].includes(getStatus(delivery))
  );

  const pageTitles = {
    dashboard: "Dashboard",
    tasks: "My Tasks",
    completed: "Completed Deliveries",
  };

  const renderDeliveryCard = (delivery) => {
    const status = getStatus(delivery);
    const isUpdating = updatingId === delivery.id;

    return (
      <article className="dashboard-action-link" key={delivery.id}>
        <span className="ngo-food-emoji">
          {["DELIVERED", "COMPLETED"].includes(status)
            ? "✅"
            : ["PICKED_UP", "IN_TRANSIT"].includes(status)
              ? "🚚"
              : status === "ACCEPTED"
                ? "📍"
                : "📦"}
        </span>

        <div className="volunteer-delivery-details">
          <strong>Delivery #{delivery.id}</strong>
          <small>Request ID: {delivery.requestId ?? "Not provided"}</small>
          <small>Donation ID: {delivery.donationId ?? "Not provided"}</small>
          <small>
            Pickup: {delivery.pickupAddress || "Not provided"}
          </small>
          <small>
            Deliver to: {delivery.deliveryAddress || "Not provided"}
          </small>
          <span className="ngo-request-status">
            {status || "UNKNOWN"}
          </span>
        </div>

        <div className="volunteer-delivery-actions">
          {status === "ASSIGNED" && (
            <button
              type="button"
              className="dashboard-primary-btn"
              disabled={isUpdating}
              onClick={() => acceptDelivery(delivery.id)}
            >
              {isUpdating ? "Updating..." : "Accept"}
            </button>
          )}

          {status === "ACCEPTED" && (
            <button
              type="button"
              className="dashboard-primary-btn"
              disabled={isUpdating}
              onClick={() => markPickedUp(delivery.id)}
            >
              {isUpdating ? "Updating..." : "Mark Picked Up"}
            </button>
          )}

          {["PICKED_UP", "IN_TRANSIT"].includes(status) && (
            <button
              type="button"
              className="dashboard-primary-btn"
              disabled={isUpdating}
              onClick={() => markDelivered(delivery.id)}
            >
              {isUpdating ? "Updating..." : "Mark Delivered"}
            </button>
          )}

          {["DELIVERED", "COMPLETED"].includes(status) && (
            <strong>Completed</strong>
          )}
        </div>
      </article>
    );
  };

  return (
    <div className="ngo-layout volunteer-layout">
      {/* SIDEBAR */}
      <aside className="ngo-sidebar">
        <Link to="/" className="ngo-brand">
          <span className="ngo-brand-icon">🍲</span>
          <span>FoodBridge</span>
        </Link>

        <p className="ngo-menu-heading">MAIN MENU</p>

        <button
          className={`ngo-menu-item ${
            activePage === "dashboard" ? "active" : ""
          }`}
          onClick={() => openPage("dashboard")}
        >
          <span>⌂</span> Dashboard
        </button>

        <button
          className={`ngo-menu-item ${
            activePage === "tasks" ? "active" : ""
          }`}
          onClick={() => openPage("tasks")}
        >
          <span>📦</span> My Tasks
          {activeDeliveries.length > 0 && (
            <span className="ngo-menu-count">
              {activeDeliveries.length}
            </span>
          )}
        </button>

        <button
          className={`ngo-menu-item ${
            activePage === "completed" ? "active" : ""
          }`}
          onClick={() => openPage("completed")}
        >
          <span>✅</span> Completed Deliveries
        </button>

        <p className="ngo-menu-heading">ACCOUNT</p>

        <Link to="/profile" className="ngo-menu-item">
          <span>👤</span> Profile
        </Link>
      </aside>

      {/* MAIN CONTENT */}
      <main className="ngo-main">
        {/* NAVBAR: NOTIFICATION → LOGOUT → ACCOUNT */}
        <header className="ngo-topbar">
          <div className="ngo-topbar-heading">
            <h2>{pageTitles[activePage]}</h2>
            <p>FoodBridge / Volunteer Portal</p>
          </div>

          <div className="ngo-topbar-actions">
            {/* 1. NOTIFICATIONS */}
            <Link
              to="/notifications"
              className="ngo-notification-link"
              title="Notifications"
              aria-label="Notifications"
            >
              🔔
            </Link>

            {/* 2. LOGOUT */}
            <button
              type="button"
              className="ngo-navbar-logout"
              onClick={logout}
              title="Logout"
            >
              ↪ Logout
            </button>

            {/* 3. ACCOUNT */}
            <Link
              to="/profile"
              className="ngo-topbar-user"
              title="My Account"
            >
              <div className="ngo-avatar">
                {(user.name || "V").charAt(0).toUpperCase()}
              </div>
              <span>{user.name || "Volunteer"}</span>
            </Link>
          </div>
        </header>

        <div className="ngo-content">
          {successMessage && (
            <div className="donation-success">{successMessage}</div>
          )}

          {error && (
            <div className="donation-error">{error}</div>
          )}

          {/* DASHBOARD */}
          {activePage === "dashboard" && (
            <>
              <section className="ngo-welcome">
                <div>
                  <p className="ngo-eyebrow">VOLUNTEER PORTAL</p>
                  <h1>Hello, {user.name || "Volunteer"}!</h1>
                  <p>
                    Help collect surplus food from restaurants and
                    deliver it to communities in need.
                  </p>

                  <button
                    className="ngo-primary-button"
                    onClick={() => openPage("tasks")}
                  >
                    View My Tasks →
                  </button>
                </div>

                <div className="ngo-welcome-emoji">🤝</div>
              </section>

              <section className="ngo-stats-grid">
                <div className="ngo-stat-card">
                  <div className="ngo-stat-icon">📦</div>
                  <p>Available Pickups</p>
                  <h2>{assignedCount}</h2>
                </div>

                <div className="ngo-stat-card">
                  <div className="ngo-stat-icon">🚚</div>
                  <p>Accepted</p>
                  <h2>{acceptedCount}</h2>
                </div>

                <div className="ngo-stat-card">
                  <div className="ngo-stat-icon">📍</div>
                  <p>Picked Up</p>
                  <h2>{pickedUpCount}</h2>
                </div>

                <div className="ngo-stat-card">
                  <div className="ngo-stat-icon">✅</div>
                  <p>Delivered</p>
                  <h2>{deliveredCount}</h2>
                </div>
              </section>

              <section className="ngo-section">
                <div className="ngo-section-heading">
                  <div>
                    <p className="ngo-eyebrow">DELIVERY ASSIGNMENTS</p>
                    <h1>Recent Tasks</h1>
                  </div>

                  <button
                    className="ngo-secondary-button"
                    onClick={fetchDeliveries}
                    disabled={loading}
                  >
                    ↻ {loading ? "Refreshing..." : "Refresh"}
                  </button>
                </div>

                {loading ? (
                  <div className="ngo-empty-state">
                    Loading delivery assignments...
                  </div>
                ) : activeDeliveries.length === 0 ? (
                  <div className="ngo-empty-state">
                    <span>🚚</span>
                    <h3>No active delivery tasks</h3>
                    <p>New delivery assignments will appear here.</p>
                  </div>
                ) : (
                  <div className="dashboard-action-list">
                    {activeDeliveries
                      .slice()
                      .reverse()
                      .slice(0, 3)
                      .map(renderDeliveryCard)}
                  </div>
                )}
              </section>

              <section className="ngo-section">
                <div className="ngo-section-heading">
                  <div>
                    <p className="ngo-eyebrow">YOUR IMPACT</p>
                    <h1>Every Delivery Matters</h1>
                    <p>
                      Your time helps surplus food reach people who
                      need it instead of going to waste.
                    </p>
                  </div>
                  <span className="ngo-welcome-emoji">💚</span>
                </div>
              </section>
            </>
          )}

          {/* MY TASKS */}
          {activePage === "tasks" && (
            <section className="ngo-section">
              <div className="ngo-section-heading">
                <div>
                  <p className="ngo-eyebrow">DELIVERY ASSIGNMENTS</p>
                  <h1>My Tasks</h1>
                  <p>
                    Accept pickups and update delivery progress.
                  </p>
                </div>

                <button
                  className="ngo-secondary-button"
                  onClick={fetchDeliveries}
                  disabled={loading}
                >
                  ↻ {loading ? "Refreshing..." : "Refresh"}
                </button>
              </div>

              {loading ? (
                <div className="ngo-empty-state">
                  Loading assignments...
                </div>
              ) : activeDeliveries.length === 0 ? (
                <div className="ngo-empty-state">
                  <span>📦</span>
                  <h3>No active tasks</h3>
                  <p>Check again later for delivery assignments.</p>
                </div>
              ) : (
                <div className="dashboard-action-list">
                  {activeDeliveries
                    .slice()
                    .reverse()
                    .map(renderDeliveryCard)}
                </div>
              )}
            </section>
          )}

          {/* COMPLETED DELIVERIES */}
          {activePage === "completed" && (
            <section className="ngo-section">
              <div className="ngo-section-heading">
                <div>
                  <p className="ngo-eyebrow">YOUR CONTRIBUTION</p>
                  <h1>Completed Deliveries</h1>
                  <p>
                    Review the deliveries you have completed.
                  </p>
                </div>

                <button
                  className="ngo-secondary-button"
                  onClick={fetchDeliveries}
                  disabled={loading}
                >
                  ↻ Refresh
                </button>
              </div>

              <div className="ngo-stats-grid">
                <div className="ngo-stat-card">
                  <div className="ngo-stat-icon">✅</div>
                  <p>Total Completed</p>
                  <h2>{completedDeliveries.length}</h2>
                </div>
              </div>

              {loading ? (
                <div className="ngo-empty-state">
                  Loading completed deliveries...
                </div>
              ) : completedDeliveries.length === 0 ? (
                <div className="ngo-empty-state">
                  <span>💚</span>
                  <h3>No completed deliveries yet</h3>
                  <p>
                    Your completed deliveries will appear here.
                  </p>
                </div>
              ) : (
                <div className="dashboard-action-list">
                  {completedDeliveries
                    .slice()
                    .reverse()
                    .map(renderDeliveryCard)}
                </div>
              )}
            </section>
          )}

          <footer className="ngo-footer">
            <strong>FoodBridge</strong>
            <span>
              Connecting surplus food with communities in need.
            </span>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default VolunteerDashboard;
