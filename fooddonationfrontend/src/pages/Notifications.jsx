
import { useCallback, useEffect, useState } from "react";

const API = "http://localhost:8080";

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);

  let user = null;

  try {
    user = JSON.parse(localStorage.getItem("foodbridgeUser"));
  } catch {
    localStorage.removeItem("foodbridgeUser");
  }

  const userId = user?.id;

  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API}/api/notifications/user/${userId}`
      );

      if (!response.ok) {
        throw new Error("Unable to load notifications.");
      }

      const data = await response.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Error loading notifications.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const unreadCount = notifications.filter(
    (notification) => !notification.readStatus
  ).length;

  const markAsRead = async (notificationId) => {
    try {
      setUpdatingId(notificationId);
      setError("");

      const response = await fetch(
        `${API}/api/notifications/${notificationId}/read`,
        { method: "PUT" }
      );

      if (!response.ok) {
        throw new Error("Unable to mark notification as read.");
      }

      setNotifications((previous) =>
        previous.map((notification) =>
          notification.id === notificationId
            ? { ...notification, readStatus: true }
            : notification
        )
      );
    } catch (err) {
      setError(err.message || "Unable to update notification.");
    } finally {
      setUpdatingId(null);
    }
  };

  const markAllAsRead = async () => {
    if (!userId || unreadCount === 0) return;

    try {
      setMarkingAll(true);
      setError("");

      const response = await fetch(
        `${API}/api/notifications/user/${userId}/read-all`,
        { method: "PUT" }
      );

      if (!response.ok) {
        throw new Error("Unable to mark all notifications as read.");
      }

      setNotifications((previous) =>
        previous.map((notification) => ({
          ...notification,
          readStatus: true,
        }))
      );
    } catch (err) {
      setError(err.message || "Unable to update notifications.");
    } finally {
      setMarkingAll(false);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type?.toUpperCase()) {
      case "REQUEST":
        return "📩";
      case "APPROVED":
        return "✅";
      case "REJECTED":
        return "❌";
      case "DELIVERY":
        return "🚚";
      default:
        return "🔔";
    }
  };

  if (!userId) {
    return (
      <div className="notifications-page">
        <div className="notifications-container">
          <h2>Please login to view notifications.</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="notifications-page">
      <div className="notifications-container">
        <div className="notifications-header">
          <div>
            <p className="notifications-label">FOODBRIDGE</p>

            <h1>Notifications</h1>

            <p>
              Stay updated about your food donations, requests and deliveries.
            </p>

            <p>
              {unreadCount > 0
                ? `${unreadCount} unread notification(s)`
                : "You're all caught up!"}
            </p>
          </div>

          <div>
            <button
              type="button"
              className="notifications-read-all"
              onClick={markAllAsRead}
              disabled={loading || markingAll || unreadCount === 0}
            >
              {markingAll ? "Updating..." : "Mark All as Read"}
            </button>

            <button
              type="button"
              className="notifications-read-all"
              onClick={fetchNotifications}
              disabled={loading}
            >
              {loading ? "Refreshing..." : "🔄 Refresh"}
            </button>
          </div>
        </div>

        {error && (
          <div className="restaurant-alert restaurant-alert-error">
            ⚠️ {error}
          </div>
        )}

        {loading ? (
          <div className="notifications-empty">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="notifications-empty">
            <div className="notification-empty-icon">🔔</div>

            <h3>No notifications yet</h3>

            <p>Your FoodBridge updates will appear here.</p>
          </div>
        ) : (
          <div className="notifications-list">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={
                  notification.readStatus
                    ? "notification-card read"
                    : "notification-card unread"
                }
              >
                <div className="notification-icon">
                  {getNotificationIcon(notification.type)}
                </div>

                <div className="notification-content">
                  <p>{notification.message}</p>

                  <span>
                    {notification.readStatus
                      ? "Read"
                      : updatingId === notification.id
                        ? "Updating..."
                        : "New notification"}
                  </span>
                </div>

                {!notification.readStatus && (
                  <button
                    type="button"
                    className="notification-dot"
                    aria-label="Mark notification as read"
                    title="Mark as read"
                    disabled={updatingId === notification.id}
                    onClick={() => markAsRead(notification.id)}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Notifications;
