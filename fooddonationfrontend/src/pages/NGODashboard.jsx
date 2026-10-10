
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API = "http://localhost:8080/api";

function normalizeStatus(status) {
  return (status || "").toUpperCase();
}

function formatDate(value) {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleDateString();
}

function NGODashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [activePage, setActivePage] = useState("dashboard");
  const [donations, setDonations] = useState([]);
  const [requests, setRequests] = useState([]);
  const [deliveries, setDeliveries] = useState({});
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const savedUser = localStorage.getItem("foodbridgeUser");

    if (!savedUser) {
      navigate("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(savedUser);

      if (!parsedUser?.id || normalizeStatus(parsedUser.role) !== "NGO") {
        navigate("/login");
        return;
      }

      setUser(parsedUser);
    } catch {
      navigate("/login");
    }
  }, [navigate]);

  const getHeaders = useCallback(() => {
    const token = localStorage.getItem("foodbridgeToken");

    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }, []);

  const fetchDonations = useCallback(async () => {
    const response = await fetch(`${API}/donations`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error("Unable to load food donations.");
    }

    const data = await response.json();
    const allDonations = Array.isArray(data) ? data : [];

    // Keep all donations for matching historical requests.
    // Only AVAILABLE donations are shown in the food browsing page.
    setDonations(allDonations);

    return allDonations;
  }, [getHeaders]);

  const fetchRequests = useCallback(async () => {
    if (!user?.id) return [];

    const response = await fetch(`${API}/requests/ngo/${user.id}`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error("Unable to load your requests.");
    }

    const data = await response.json();
    const requestList = Array.isArray(data) ? data : [];

    setRequests(requestList);
    return requestList;
  }, [getHeaders, user?.id]);

  const fetchDeliveries = useCallback(
    async (requestList) => {
      const result = {};

      await Promise.all(
        requestList.map(async (request) => {
          try {
            const response = await fetch(
              `${API}/deliveries/request/${request.id}`,
              { headers: getHeaders() }
            );

            if (!response.ok) {
              result[request.id] = [];
              return;
            }

            const data = await response.json();
            result[request.id] = Array.isArray(data) ? data : [];
          } catch (err) {
            console.error(
              `Delivery tracking error for request ${request.id}:`,
              err
            );
            result[request.id] = [];
          }
        })
      );

      setDeliveries(result);
    },
    [getHeaders]
  );

  const refreshAll = useCallback(async () => {
    if (!user?.id) return;

    setRefreshing(true);
    setError("");

    try {
      const results = await Promise.allSettled([
        fetchDonations(),
        fetchRequests(),
      ]);

      const requestResult = results[1];

      if (requestResult.status === "fulfilled") {
        await fetchDeliveries(requestResult.value);
      }

      const failed = results.find(
        (result) => result.status === "rejected"
      );

      if (failed) {
        throw failed.reason;
      }
    } catch (err) {
      setError(err.message || "Unable to refresh dashboard.");
    } finally {
      setRefreshing(false);
    }
  }, [user?.id, fetchDonations, fetchRequests, fetchDeliveries]);

  useEffect(() => {
    if (!user?.id) return;

    let cancelled = false;

    const loadDashboard = async () => {
      setLoading(true);
      setError("");

      try {
        const results = await Promise.allSettled([
          fetchDonations(),
          fetchRequests(),
        ]);

        if (cancelled) return;

        const requestResult = results[1];

        if (requestResult.status === "fulfilled") {
          await fetchDeliveries(requestResult.value);
        }

        if (cancelled) return;

        const failed = results.find(
          (result) => result.status === "rejected"
        );

        if (failed) {
          setError(
            failed.reason?.message ||
              "Some dashboard information could not be loaded."
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load dashboard.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [user?.id, fetchDonations, fetchRequests, fetchDeliveries]);

  const requestFood = async (donationId) => {
    setMessage("");
    setError("");

    try {
      const response = await fetch(`${API}/requests`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          donationId,
          ngoId: user.id,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Unable to request food.");
      }

      setMessage("Food request submitted successfully!");
      await refreshAll();
    } catch (err) {
      setError(err.message || "Unable to submit your request.");
    }
  };

  const logout = () => {
    localStorage.removeItem("foodbridgeUser");
    localStorage.removeItem("foodbridgeToken");
    navigate("/login");
  };

  const openPage = (page) => {
    setActivePage(page);
    setMessage("");
    setError("");
  };

  const pendingCount = requests.filter(
    (request) => normalizeStatus(request.status) === "PENDING"
  ).length;

  const approvedCount = requests.filter(
    (request) => normalizeStatus(request.status) === "APPROVED"
  ).length;

  const deliveredCount = requests.filter((request) => {
    const requestStatus = normalizeStatus(request.status);
    const requestDeliveries = deliveries[request.id] || [];

    return (
      requestStatus === "DELIVERED" ||
      requestDeliveries.some(
        (delivery) =>
          normalizeStatus(delivery.status) === "DELIVERED"
      )
    );
  }).length;

  const now = new Date();

  const currentMonthRequests = requests.filter((request) => {
    const value =
      request.createdAt ||
      request.created_at ||
      request.requestDate ||
      request.createdDate;

    if (!value) return false;

    const date = new Date(value);

    return (
      !Number.isNaN(date.getTime()) &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  });

  const trackableRequests = requests.filter((request) => {
    const status = normalizeStatus(request.status);

    return (
      [
        "APPROVED",
        "ASSIGNED",
        "PICKED_UP",
        "IN_TRANSIT",
        "DELIVERED",
      ].includes(status) ||
      (deliveries[request.id] || []).length > 0
    );
  });

  // Find the food name using the request's linked donation ID.
  const getFoodName = (request) => {
    const linkedDonation =
      request.donation ||
      request.foodDonation ||
      request.donationDetails;

    if (linkedDonation?.foodName || linkedDonation?.name) {
      return linkedDonation.foodName || linkedDonation.name;
    }

    if (request.foodName || request.donationName) {
      return request.foodName || request.donationName;
    }

    const donationId =
      request.donationId ??
      request.donation_id ??
      linkedDonation?.id;

    const matchingDonation = donations.find(
      (donation) =>
        String(donation.id) === String(donationId)
    );

    return (
      matchingDonation?.foodName ||
      matchingDonation?.name ||
      "Food name unavailable"
    );
  };

  const pageTitles = {
    dashboard: "Dashboard",
    food: "Available Food",
    requests: "My Requests",
    tracking: "Delivery Tracking",
    monthly: "Monthly History",
  };

  if (!user) {
    return <div className="ngo-loading">Loading dashboard...</div>;
  }

  return (
    <div className="ngo-layout">
      <aside className="ngo-sidebar">
        <Link to="/" className="ngo-brand">
          <span className="ngo-brand-icon">🍲</span>
          <span>FoodBridge</span>
        </Link>

        <p className="ngo-menu-heading">MAIN MENU</p>

        <button
          className={`ngo-menu-item ${activePage === "dashboard" ? "active" : ""}`}
          onClick={() => openPage("dashboard")}
        >
          <span>⌂</span> Dashboard
        </button>

        <button
          className={`ngo-menu-item ${activePage === "food" ? "active" : ""}`}
          onClick={() => openPage("food")}
        >
          <span>🍱</span> Available Food
        </button>

        <button
          className={`ngo-menu-item ${activePage === "requests" ? "active" : ""}`}
          onClick={() => openPage("requests")}
        >
          <span>📋</span> My Requests
          {pendingCount > 0 && (
            <span className="ngo-menu-count">{pendingCount}</span>
          )}
        </button>

        <button
          className={`ngo-menu-item ${activePage === "tracking" ? "active" : ""}`}
          onClick={() => openPage("tracking")}
        >
          <span>🚚</span> Delivery Tracking
        </button>

        <button
          className={`ngo-menu-item ${activePage === "monthly" ? "active" : ""}`}
          onClick={() => openPage("monthly")}
        >
          <span>📊</span> Monthly History
        </button>

        <p className="ngo-menu-heading">ACCOUNT</p>

        <Link to="/profile" className="ngo-menu-item">
          <span>👤</span> Profile
        </Link>
      </aside>

      <main className="ngo-main">
        <header className="ngo-topbar">
          <div className="ngo-topbar-heading">
            <h2>{pageTitles[activePage]}</h2>
            <p>FoodBridge / NGO Portal</p>
          </div>

          <div className="ngo-topbar-actions">
            <Link
              to="/notifications"
              className="ngo-notification-link"
              aria-label="Notifications"
              title="Notifications"
            >
              🔔
            </Link>

            <button
              type="button"
              className="ngo-navbar-logout"
              onClick={logout}
              title="Logout"
            >
              ↪ Logout
            </button>

            <Link
              to="/profile"
              className="ngo-topbar-user"
              title="My Account"
            >
              <div className="ngo-avatar">
                {(user.name || "N").charAt(0).toUpperCase()}
              </div>
              <span>{user.name || "NGO User"}</span>
            </Link>
          </div>
        </header>

        <div className="ngo-content">
          {message && (
            <div className="ngo-alert ngo-success">{message}</div>
          )}

          {error && (
            <div className="ngo-alert ngo-error">{error}</div>
          )}

          {[
            "dashboard",
            "tracking",
            "monthly",
            "requests",
          ].includes(activePage) && (
            <div style={{ textAlign: "right", marginBottom: "12px" }}>
              <button
                className="ngo-secondary-button"
                onClick={refreshAll}
                disabled={refreshing}
              >
                ↻ {refreshing ? "Refreshing..." : "Refresh Data"}
              </button>
            </div>
          )}

          {activePage === "dashboard" && (
            <>
              <section className="ngo-welcome">
                <div>
                  <p className="ngo-eyebrow">NGO PORTAL</p>
                  <h1>Welcome, {user.name || "NGO Partner"}!</h1>
                  <p>
                    Together, we can reduce food waste and help more
                    people in need.
                  </p>
                  <button
                    className="ngo-primary-button"
                    onClick={() => openPage("food")}
                  >
                    Explore Available Food →
                  </button>
                </div>
                <div className="ngo-welcome-emoji">🤝</div>
              </section>

              <section className="ngo-stats-grid">
                <div className="ngo-stat-card">
                  <div className="ngo-stat-icon">🍱</div>
                  <p>Available Donations</p>
                  <h2>
                    {
                      donations.filter(
                        (donation) =>
                          normalizeStatus(donation.status) === "AVAILABLE"
                      ).length
                    }
                  </h2>
                </div>

                <div className="ngo-stat-card">
                  <div className="ngo-stat-icon">📋</div>
                  <p>Total Requests</p>
                  <h2>{requests.length}</h2>
                </div>

                <div className="ngo-stat-card">
                  <div className="ngo-stat-icon">⏳</div>
                  <p>Pending Requests</p>
                  <h2>{pendingCount}</h2>
                </div>

                <div className="ngo-stat-card">
                  <div className="ngo-stat-icon">✅</div>
                  <p>Delivered Requests</p>
                  <h2>{deliveredCount}</h2>
                </div>
              </section>
            </>
          )}

          {activePage === "food" && (
            <section className="ngo-section">
              <div className="ngo-section-heading">
                <div>
                  <p className="ngo-eyebrow">DONATIONS</p>
                  <h1>Food Donations</h1>
                  <p>Find available food donations for your NGO.</p>
                </div>

                <button
                  className="ngo-secondary-button"
                  disabled={loading || refreshing}
                  onClick={async () => {
                    setLoading(true);
                    setError("");
                    try {
                      await fetchDonations();
                    } catch (err) {
                      setError(err.message);
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  ↻ {loading ? "Refreshing..." : "Refresh"}
                </button>
              </div>

              {loading && donations.length === 0 ? (
                <div className="ngo-empty-state">Loading donations...</div>
              ) : donations.filter(
                  (donation) =>
                    normalizeStatus(donation.status) === "AVAILABLE"
                ).length === 0 ? (
                <div className="ngo-empty-state">
                  <span>🍱</span>
                  <h3>No food donations available</h3>
                  <p>Please check again later for new donations.</p>
                </div>
              ) : (
                <div className="ngo-food-grid">
                  {donations
                    .filter(
                      (donation) =>
                        normalizeStatus(donation.status) === "AVAILABLE"
                    )
                    .map((donation) => (
                      <article className="ngo-food-card" key={donation.id}>
                        <div className="ngo-food-card-top">
                          <span className="ngo-food-emoji">🍱</span>
                          <span className="ngo-status-badge">AVAILABLE</span>
                        </div>

                        <h3>
                          {donation.foodName ||
                            donation.name ||
                            "Food Donation"}
                        </h3>

                        <div className="ngo-food-details">
                          <p>
                            <strong>Quantity:</strong>{" "}
                            {donation.quantity} {donation.unit || ""}
                          </p>
                          <p>
                            <strong>Type:</strong>{" "}
                            {donation.foodType ||
                              donation.type ||
                              "Not specified"}
                          </p>
                          <p>
                            <strong>Safe until:</strong>{" "}
                            {formatDate(
                              donation.expiryDate || donation.safeUntil
                            )}
                          </p>
                          <p>
                            <strong>Pickup:</strong>{" "}
                            {donation.pickupLocation ||
                              donation.pickupAddress ||
                              donation.address ||
                              "Location not specified"}
                          </p>
                        </div>

                        <button
                          className="ngo-primary-button ngo-request-button"
                          onClick={() => requestFood(donation.id)}
                        >
                          REQUEST FOOD
                        </button>
                      </article>
                    ))}
                </div>
              )}
            </section>
          )}

          {activePage === "requests" && (
            <section className="ngo-section">
              <div className="ngo-section-heading">
                <div>
                  <p className="ngo-eyebrow">YOUR ACTIVITY</p>
                  <h1>My Food Requests</h1>
                  <p>Check the status of your requested donations.</p>
                </div>
              </div>

              <div className="ngo-request-summary">
                <div><span>Total</span><strong>{requests.length}</strong></div>
                <div><span>Pending</span><strong>{pendingCount}</strong></div>
                <div><span>Approved</span><strong>{approvedCount}</strong></div>
                <div><span>Delivered</span><strong>{deliveredCount}</strong></div>
              </div>

              {requests.length === 0 ? (
                <div className="ngo-empty-state">
                  <span>📋</span>
                  <h3>No requests yet</h3>
                  <p>Browse available food and request a donation.</p>
                  <button
                    className="ngo-primary-button"
                    onClick={() => openPage("food")}
                  >
                    Browse Food
                  </button>
                </div>
              ) : (
                <div className="ngo-record-list">
                  {requests.map((request) => (
                    <article className="ngo-record-card" key={request.id}>
                      <div>
                        <h3>{getFoodName(request)}</h3>
                        <p>Request ID: {request.id}</p>
                        <p>
                          Requested:{" "}
                          {formatDate(
                            request.createdAt ||
                              request.created_at ||
                              request.requestDate ||
                              request.createdDate
                          )}
                        </p>
                      </div>

                      <span
                        className={`ngo-request-status ${normalizeStatus(
                          request.status || "PENDING"
                        ).toLowerCase()}`}
                      >
                        {request.status || "PENDING"}
                      </span>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}

          {activePage === "tracking" && (
            <section className="ngo-section">
              <div className="ngo-section-heading">
                <div>
                  <p className="ngo-eyebrow">DELIVERY PROGRESS</p>
                  <h1>Track Your Food</h1>
                  <p>Track the latest status reported by the volunteer.</p>
                </div>
              </div>

              {trackableRequests.length === 0 ? (
                <div className="ngo-empty-state">
                  <span>🚚</span>
                  <h3>No deliveries to track yet</h3>
                  <p>
                    Approved requests will appear here when a delivery
                    has been assigned.
                  </p>
                </div>
              ) : (
                <div className="ngo-record-list">
                  {trackableRequests.map((request) => {
                    const requestDeliveries = deliveries[request.id] || [];

                    return (
                      <article className="ngo-record-card" key={request.id}>
                        <div>
                          <h3>{getFoodName(request)}</h3>
                          <p>Request ID: {request.id}</p>

                          {requestDeliveries.length === 0 ? (
                            <p>Delivery record not available yet.</p>
                          ) : (
                            requestDeliveries.map((delivery) => (
                              <div key={delivery.id}>
                                <p>Delivery ID: {delivery.id}</p>
                                <p>
                                  Pickup:{" "}
                                  {delivery.pickupAddress || "Not specified"}
                                </p>
                                <p>
                                  Destination:{" "}
                                  {delivery.deliveryAddress ||
                                    "Not specified"}
                                </p>
                                <p>
                                  Volunteer ID:{" "}
                                  {delivery.volunteerId ?? "Not assigned yet"}
                                </p>
                              </div>
                            ))
                          )}
                        </div>

                        <div>
                          {requestDeliveries.length === 0 ? (
                            <span
                              className={`ngo-request-status ${normalizeStatus(
                                request.status
                              ).toLowerCase()}`}
                            >
                              {request.status || "PENDING"}
                            </span>
                          ) : (
                            requestDeliveries.map((delivery) => (
                              <span
                                key={delivery.id}
                                className={`ngo-request-status ${normalizeStatus(
                                  delivery.status
                                ).toLowerCase()}`}
                                style={{
                                  display: "inline-block",
                                  margin: "4px",
                                }}
                              >
                                {delivery.status || "ASSIGNED"}
                              </span>
                            ))
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {activePage === "monthly" && (
            <section className="ngo-section">
              <div className="ngo-section-heading">
                <div>
                  <p className="ngo-eyebrow">MONTHLY HISTORY</p>
                  <h1>Your Food Records</h1>
                  <p>Review your requests for the current month.</p>
                </div>
              </div>

              <div className="ngo-request-summary">
                <div>
                  <span>Requests this month</span>
                  <strong>{currentMonthRequests.length}</strong>
                </div>

                <div>
                  <span>Approved this month</span>
                  <strong>
                    {
                      currentMonthRequests.filter(
                        (request) =>
                          normalizeStatus(request.status) === "APPROVED"
                      ).length
                    }
                  </strong>
                </div>

                <div>
                  <span>Delivered this month</span>
                  <strong>
                    {
                      currentMonthRequests.filter((request) => {
                        const requestDeliveries =
                          deliveries[request.id] || [];

                        return (
                          normalizeStatus(request.status) === "DELIVERED" ||
                          requestDeliveries.some(
                            (delivery) =>
                              normalizeStatus(delivery.status) === "DELIVERED"
                          )
                        );
                      }).length
                    }
                  </strong>
                </div>
              </div>

              {currentMonthRequests.length === 0 ? (
                <div className="ngo-empty-state">
                  <span>📊</span>
                  <h3>No request records for this month</h3>
                  <p>
                    New requests with a saved creation date will appear here.
                  </p>
                </div>
              ) : (
                <div className="ngo-record-list">
                  {currentMonthRequests.map((request) => (
                    <article className="ngo-record-card" key={request.id}>
                      <div>
                        <h3>{getFoodName(request)}</h3>
                        <p>Request ID: {request.id}</p>
                        <p>
                          Date:{" "}
                          {formatDate(
                            request.createdAt ||
                              request.created_at ||
                              request.requestDate ||
                              request.createdDate
                          )}
                        </p>
                      </div>

                      <span
                        className={`ngo-request-status ${normalizeStatus(
                          request.status || "PENDING"
                        ).toLowerCase()}`}
                      >
                        {request.status || "PENDING"}
                      </span>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}

          <footer className="ngo-footer">
            <strong>FoodBridge</strong>
            <span>Reducing food waste, one donation at a time.</span>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default NGODashboard;
