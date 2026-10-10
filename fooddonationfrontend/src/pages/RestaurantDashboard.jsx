
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API = "http://localhost:8080";

const CANCELLATION_REASONS = [
  "Food damaged or spoiled",
  "Unsafe to consume",
  "Food no longer available",
  "Incorrect donation details",
  "Other",
];

function RestaurantDashboard() {
  const navigate = useNavigate();

  const [user] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("foodbridgeUser"));
    } catch {
      return null;
    }
  });

  const [donations, setDonations] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [error, setError] = useState("");
  const [requestError, setRequestError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [updatingRequestId, setUpdatingRequestId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("Dashboard");

  // Cancellation state
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [otherReason, setOtherReason] = useState("");
  const [cancellingDonationId, setCancellingDonationId] = useState(null);
  const [cancelError, setCancelError] = useState("");

  const logout = () => {
    localStorage.removeItem("foodbridgeUser");
    localStorage.removeItem("foodbridgeToken");
    navigate("/login", { replace: true });
  };

  const fetchDonations = useCallback(async () => {
    if (!user?.id) {
      setDonations([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API}/api/donations/restaurant/${user.id}`
      );

      if (!response.ok) {
        throw new Error("Unable to fetch donations.");
      }

      const data = await response.json();
      setDonations(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Unable to load your donations.");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const fetchRequests = useCallback(async () => {
    if (!user?.id) {
      setRequests([]);
      setRequestsLoading(false);
      return;
    }

    try {
      setRequestsLoading(true);
      setRequestError("");

      const donationResponse = await fetch(
        `${API}/api/donations/restaurant/${user.id}`
      );

      if (!donationResponse.ok) {
        throw new Error("Unable to find restaurant donations.");
      }

      const restaurantDonations = await donationResponse.json();
      const allRequests = [];

      for (const donation of Array.isArray(restaurantDonations)
        ? restaurantDonations
        : []) {
        const response = await fetch(
          `${API}/api/requests/donation/${donation.id}`
        );

        if (!response.ok) continue;

        const data = await response.json();

        if (Array.isArray(data)) {
          allRequests.push(
            ...data.map((request) => ({
              ...request,
              foodName: donation.foodName,
              quantity: donation.quantity,
              unit: donation.unit,
              foodType: donation.foodType,
              pickupAddress: donation.pickupAddress,
              expiryDate: donation.expiryDate,
              donationStatus: donation.status,
            }))
          );
        }
      }

      setRequests(allRequests);
    } catch (err) {
      setRequestError(err.message || "Unable to load NGO requests.");
    } finally {
      setRequestsLoading(false);
    }
  }, [user?.id]);

  const refreshDashboard = () => {
    fetchDonations();
    fetchRequests();
  };

  useEffect(() => {
    if (!user?.id) {
      navigate("/login", { replace: true });
      return;
    }

    fetchDonations();
    fetchRequests();
  }, [user?.id, navigate, fetchDonations, fetchRequests]);

  const openSection = (section) => {
    setActiveSection(section);
    setSidebarOpen(false);
    setSuccessMessage("");
    setRequestError("");
    setError("");
    setCancelError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openCancelDialog = (donation) => {
    setSelectedDonation(donation);
    setCancelReason("");
    setOtherReason("");
    setCancelError("");
    setSuccessMessage("");
  };

  const closeCancelDialog = () => {
    if (cancellingDonationId !== null) return;

    setSelectedDonation(null);
    setCancelReason("");
    setOtherReason("");
    setCancelError("");
  };

  const cancelDonation = async () => {
    if (!selectedDonation || !user?.id) {
      setCancelError("Unable to identify the donation or restaurant.");
      return;
    }

    const reason =
      cancelReason === "Other" ? otherReason.trim() : cancelReason;

    if (!cancelReason) {
      setCancelError("Please select a cancellation reason.");
      return;
    }

    if (!reason) {
      setCancelError("Please enter the cancellation reason.");
      return;
    }

    if (reason.length > 500) {
      setCancelError("The reason must be 500 characters or fewer.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to cancel "${selectedDonation.foodName || "this donation"}"? This action cannot be undone from this screen.`
    );

    if (!confirmed) return;

    const donationId = selectedDonation.id;

    try {
      setCancellingDonationId(donationId);
      setCancelError("");
      setError("");
      setSuccessMessage("");

      const response = await fetch(
        `${API}/api/donations/${donationId}/cancel`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            restaurantId: user.id,
            reason,
          }),
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
        throw new Error(
          data.message ||
            data.error ||
            (response.status === 404
              ? "Donation not found."
              : "Unable to cancel this donation. It may no longer be available.")
        );
      }

      setSelectedDonation(null);
      setCancelReason("");
      setOtherReason("");
      setSuccessMessage(
        `Donation "${selectedDonation.foodName || `#${donationId}`}" has been cancelled. Reason: ${reason}`
      );

      await Promise.all([fetchDonations(), fetchRequests()]);
    } catch (err) {
      setCancelError(err.message || "Unable to cancel donation.");
    } finally {
      setCancellingDonationId(null);
    }
  };

  const updateRequestStatus = async (requestId, status) => {
    try {
      setUpdatingRequestId(requestId);
      setRequestError("");
      setSuccessMessage("");

      const response = await fetch(
        `${API}/api/requests/${requestId}/status?status=${status}`,
        { method: "PUT" }
      );

      const text = await response.text();
      let data = {};

      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          data = {};
        }
      }

      if (!response.ok) {
        throw new Error(
          data.message || `Unable to ${status.toLowerCase()} request.`
        );
      }

      setRequests((current) =>
        current.map((request) =>
          request.id === requestId ? { ...request, status } : request
        )
      );

      setSuccessMessage(
        status === "APPROVED"
          ? "✅ Food request approved successfully!"
          : "❌ Food request rejected."
      );

      await Promise.all([fetchDonations(), fetchRequests()]);
    } catch (err) {
      setRequestError(err.message || "Unable to update request.");
    } finally {
      setUpdatingRequestId(null);
    }
  };

  const availableDonations = donations.filter(
    (item) => item.status?.toUpperCase() === "AVAILABLE"
  ).length;

  const completedDonations = donations.filter((item) =>
    ["COMPLETED", "DELIVERED"].includes(item.status?.toUpperCase())
  ).length;

  const pendingRequests = requests.filter(
    (item) => item.status?.toUpperCase() === "PENDING"
  ).length;

  const approvedRequests = requests.filter(
    (item) => item.status?.toUpperCase() === "APPROVED"
  ).length;

  const stats = [
    {
      emoji: "🍱",
      label: "Total Donations",
      value: donations.length,
      color: "purple",
      note: "All your food listings",
    },
    {
      emoji: "🥗",
      label: "Available Food",
      value: availableDonations,
      color: "green",
      note: "Ready to be requested",
    },
    {
      emoji: "📩",
      label: "Pending Requests",
      value: pendingRequests,
      color: "orange",
      note: "Waiting for your response",
    },
    {
      emoji: "💚",
      label: "Completed",
      value: completedDonations,
      color: "pink",
      note: "Completed donations",
    },
  ];

  const menuItems = [
    { emoji: "🏠", label: "Dashboard" },
    {
      emoji: "🍱",
      label: "Add Donation",
      route: "/restaurant/add-donation",
    },
    { emoji: "📦", label: "My Donations" },
    { emoji: "📩", label: "Food Requests" },
    { emoji: "🚚", label: "Delivery Activity" },
    { emoji: "📍", label: "Track Donation", route: "/track-donation" },
    { emoji: "📊", label: "Monthly Reports" },
    { emoji: "👤", label: "My Profile", route: "/profile" },
  ];

  const formatDate = (value) => {
    if (!value) return "Not specified";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleDateString();
  };

  const getDonationDate = (donation) =>
    donation.createdAt ??
    donation.created_at ??
    donation.createdDate ??
    donation.created_date ??
    donation.donationDate ??
    donation.donation_date ??
    donation.dateCreated ??
    donation.date_created ??
    null;

  const getValidDonationDate = (donation) => {
    const rawDate = getDonationDate(donation);

    if (!rawDate) return null;

    const date = new Date(rawDate);

    return Number.isNaN(date.getTime()) ? null : date;
  };

  const getStatusClass = (status) =>
    (status || "unknown").toLowerCase().replace(/\s+/g, "-");

  const renderDonationRows = (items, showDate = false) => (
    <div className="restaurant-donation-list">
      {[...items].reverse().map((donation) => {
        const createdDate = getValidDonationDate(donation);
        const isAvailable =
          donation.status?.toUpperCase() === "AVAILABLE";

        return (
          <div className="restaurant-donation-item" key={donation.id}>
            <div className="restaurant-food-emoji">🍲</div>

            <div className="restaurant-donation-details">
              <strong>{donation.foodName || "Food donation"}</strong>

              <span>
                Quantity: {donation.quantity ?? "Not specified"}{" "}
                {donation.unit || ""}
              </span>

              <span>
                Food type: {donation.foodType || "Not specified"}
              </span>

              {showDate && (
                <small>
                  📅 Created:{" "}
                  {createdDate
                    ? formatDate(createdDate)
                    : "Creation date unavailable"}
                </small>
              )}

              <small>
                ⏰ Safe until: {formatDate(donation.expiryDate)}
              </small>

              {donation.pickupAddress && (
                <small>📍 {donation.pickupAddress}</small>
              )}

              <small>Donation ID: #{donation.id}</small>

              {donation.status?.toUpperCase() === "CANCELLED" && (
                <>
                  {donation.cancellationReason && (
                    <small>
                      ❗ Cancellation reason: {donation.cancellationReason}
                    </small>
                  )}

                  {donation.cancelledAt && (
                    <small>
                      🕒 Cancelled on:{" "}
                      {new Date(donation.cancelledAt).toLocaleString()}
                    </small>
                  )}
                </>
              )}

              {isAvailable && (
                <button
                  type="button"
                  className="restaurant-reject-button"
                  onClick={() => openCancelDialog(donation)}
                  disabled={cancellingDonationId === donation.id}
                  style={{ marginTop: "8px" }}
                >
                  ✕ Cancel Donation
                </button>
              )}
            </div>

            <span
              className={`restaurant-status status-${getStatusClass(
                donation.status
              )}`}
            >
              {donation.status || "Unknown"}
            </span>
          </div>
        );
      })}
    </div>
  );

  const renderDonations = () => (
    <section className="restaurant-panel">
      <div className="restaurant-panel-heading">
        <div>
          <h2>🍱 My Food Donations</h2>
          <p>All food listings created by your restaurant.</p>
        </div>

        <Link to="/restaurant/add-donation" className="restaurant-text-link">
          + Add New
        </Link>
      </div>

      {loading ? (
        <div className="restaurant-empty-state">
          <span>⏳</span>
          <strong>Loading donations...</strong>
        </div>
      ) : donations.length === 0 ? (
        <div className="restaurant-empty-state">
          <span>🍽️</span>
          <strong>No donations yet</strong>
          <p>Start by listing your surplus food.</p>
          <Link
            to="/restaurant/add-donation"
            className="restaurant-add-button"
          >
            🍱 Add Your First Donation
          </Link>
        </div>
      ) : (
        renderDonationRows(donations)
      )}

      <div className="restaurant-panel-footer">
        <span>{donations.length} donation(s) listed</span>
      </div>
    </section>
  );

  const renderRequests = () => (
    <section className="restaurant-panel">
      <div className="restaurant-panel-heading">
        <div>
          <h2>📩 NGO Food Requests</h2>
          <p>Review requests received for your donations.</p>
        </div>

        <span className="restaurant-request-count">
          {pendingRequests} pending
        </span>
      </div>

      {requestsLoading ? (
        <div className="restaurant-empty-state">
          <span>⏳</span>
          <strong>Loading requests...</strong>
        </div>
      ) : requests.length === 0 ? (
        <div className="restaurant-empty-state">
          <span>📭</span>
          <strong>No NGO requests yet</strong>
          <p>
            New requests will appear here when an NGO requests your food.
          </p>
        </div>
      ) : (
        <div className="restaurant-request-list">
          {[...requests].reverse().map((request) => (
            <article className="restaurant-request-item" key={request.id}>
              <div className="restaurant-request-food-icon">🥘</div>

              <div className="restaurant-request-details">
                <strong>{request.foodName || "Food request"}</strong>

                <span>
                  Quantity: {request.quantity} {request.unit}
                </span>

                <span>Food type: {request.foodType || "Not specified"}</span>

                {request.pickupAddress && (
                  <span>📍 {request.pickupAddress}</span>
                )}

                <small>Request ID: #{request.id}</small>
              </div>

              <div className="restaurant-request-actions">
                {request.status?.toUpperCase() === "PENDING" ? (
                  <>
                    <button
                      className="restaurant-approve-button"
                      disabled={updatingRequestId === request.id}
                      onClick={() =>
                        updateRequestStatus(request.id, "APPROVED")
                      }
                    >
                      {updatingRequestId === request.id
                        ? "Updating..."
                        : "✓ Approve"}
                    </button>

                    <button
                      className="restaurant-reject-button"
                      disabled={updatingRequestId === request.id}
                      onClick={() =>
                        updateRequestStatus(request.id, "REJECTED")
                      }
                    >
                      {updatingRequestId === request.id
                        ? "Updating..."
                        : "✕ Reject"}
                    </button>
                  </>
                ) : (
                  <span
                    className={`restaurant-status status-${getStatusClass(
                      request.status
                    )}`}
                  >
                    {request.status || "Unknown"}
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );

  const renderDashboard = () => (
    <>
      <section className="restaurant-welcome-banner">
        <div className="restaurant-welcome-text">
          <span className="restaurant-welcome-tag">
            🌱 MAKING A DIFFERENCE
          </span>

          <h1>Welcome back, {user?.name || "Restaurant"}!</h1>

          <p>
            Manage your surplus food, respond to NGO requests, and help
            reduce food waste in your community.
          </p>

          <Link
            to="/restaurant/add-donation"
            className="restaurant-add-button"
          >
            <span>＋</span> Add Food Donation
          </Link>
        </div>

        <div className="restaurant-welcome-emoji" aria-hidden="true">
          🥗
          <span>💚</span>
        </div>
      </section>

      <div className="restaurant-section-title">
        <div>
          <h2>Overview</h2>
          <p>Here is what's happening with your donations.</p>
        </div>

        <button
          className="restaurant-refresh-button"
          onClick={refreshDashboard}
          disabled={loading || requestsLoading}
        >
          🔄 Refresh
        </button>
      </div>

      <section className="restaurant-stats-grid">
        {stats.map((stat) => (
          <article className="restaurant-stat-card" key={stat.label}>
            <div className={`restaurant-stat-emoji ${stat.color}`}>
              {stat.emoji}
            </div>

            <div className="restaurant-stat-info">
              <span>{stat.label}</span>
              <strong>
                {loading || requestsLoading ? "…" : stat.value}
              </strong>
              <small>{stat.note}</small>
            </div>
          </article>
        ))}
      </section>

      <section className="restaurant-content-grid">
        <article className="restaurant-panel">
          <div className="restaurant-panel-heading">
            <div>
              <h2>🍱 Recent Donations</h2>
              <p>Your latest food listings</p>
            </div>

            <button
              className="restaurant-text-link"
              onClick={() => openSection("My Donations")}
            >
              View All
            </button>
          </div>

          {loading ? (
            <div className="restaurant-empty-state">
              <span>⏳</span>
              <strong>Loading donations...</strong>
            </div>
          ) : donations.length === 0 ? (
            <div className="restaurant-empty-state">
              <span>🍽️</span>
              <strong>No donations yet</strong>
              <p>Start by listing your surplus food.</p>

              <Link
                to="/restaurant/add-donation"
                className="restaurant-add-button"
              >
                🍱 Add Your First Donation
              </Link>
            </div>
          ) : (
            renderDonationRows(donations.slice(-4))
          )}

          <div className="restaurant-panel-footer">
            <span>{donations.length} donation(s) listed</span>

            <button
              className="restaurant-text-link"
              onClick={() => openSection("My Donations")}
            >
              View all →
            </button>
          </div>
        </article>
      </section>

      <section className="restaurant-bottom-banner">
        <span>🌍</span>

        <div>
          <h3>Your food can make a difference</h3>
          <p>
            By sharing surplus food safely, you're helping reduce food
            waste and support communities in need.
          </p>
        </div>

        <span className="restaurant-bottom-heart">💚</span>
      </section>
    </>
  );

  const renderDeliveries = () => {
    const deliveryStatuses = [
      "APPROVED",
      "ASSIGNED",
      "VOLUNTEER_ASSIGNED",
      "PICKED_UP",
      "PICKED UP",
      "IN_TRANSIT",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "COMPLETED",
    ];

    const deliveryDonations = donations.filter((donation) =>
      deliveryStatuses.includes(donation.status?.toUpperCase())
    );

    return (
      <section className="restaurant-panel">
        <div className="restaurant-panel-heading">
          <div>
            <h2>🚚 Delivery Activity</h2>
            <p>Track the current status of your donations.</p>
          </div>

          <button
            className="restaurant-refresh-button"
            onClick={refreshDashboard}
            disabled={loading || requestsLoading}
          >
            🔄 Refresh
          </button>
        </div>

        {loading ? (
          <div className="restaurant-empty-state">
            <span>⏳</span>
            <strong>Loading delivery activity...</strong>
          </div>
        ) : deliveryDonations.length === 0 ? (
          <div className="restaurant-empty-state">
            <span>🚚</span>
            <strong>No delivery activity yet</strong>
            <p>
              Donations will appear here when their status changes to
              approved, assigned, picked up, or delivered.
            </p>
          </div>
        ) : (
          renderDonationRows(deliveryDonations)
        )}

        <p className="restaurant-report-note">
          Delivery activity is based on donation statuses returned by your
          backend. Live volunteer location tracking requires a separate API.
        </p>

        <button
          className="restaurant-text-link"
          onClick={() => navigate("/track-donation")}
        >
          📍 Open Track Donation →
        </button>
      </section>
    );
  };

  const renderReports = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const datedDonations = donations.map((donation) => ({
      donation,
      date: getValidDonationDate(donation),
    }));

    const thisMonthDonations = datedDonations
      .filter(
        ({ date }) =>
          date !== null &&
          date.getMonth() === currentMonth &&
          date.getFullYear() === currentYear
      )
      .map(({ donation }) => donation);

    const undatedDonations = datedDonations
      .filter(({ date }) => date === null)
      .map(({ donation }) => donation);

    const monthlyCompleted = thisMonthDonations.filter((donation) =>
      ["COMPLETED", "DELIVERED"].includes(
        donation.status?.toUpperCase()
      )
    ).length;

    const reportStats = [
      {
        emoji: "🍱",
        label: "Donations This Month",
        value: thisMonthDonations.length,
        color: "purple",
        note: "Verified by creation date",
      },
      {
        emoji: "💚",
        label: "Completed This Month",
        value: monthlyCompleted,
        color: "green",
        note: "Completed donations with dates",
      },
      {
        emoji: "📩",
        label: "All Requests",
        value: requests.length,
        color: "orange",
        note: "Requests across your donations",
      },
      {
        emoji: "🤝",
        label: "Approved Requests",
        value: approvedRequests,
        color: "pink",
        note: "Requests approved by your restaurant",
      },
    ];

    return (
      <>
        <section className="restaurant-stats-grid">
          {reportStats.map((stat) => (
            <article className="restaurant-stat-card" key={stat.label}>
              <div className={`restaurant-stat-emoji ${stat.color}`}>
                {stat.emoji}
              </div>

              <div className="restaurant-stat-info">
                <span>{stat.label}</span>
                <strong>
                  {loading || requestsLoading ? "…" : stat.value}
                </strong>
                <small>{stat.note}</small>
              </div>
            </article>
          ))}
        </section>

        <section className="restaurant-panel">
          <div className="restaurant-panel-heading">
            <div>
              <h2>📊 Monthly Donation Report</h2>
              <p>
                {now.toLocaleDateString(undefined, {
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>

            <button
              className="restaurant-refresh-button"
              onClick={refreshDashboard}
              disabled={loading || requestsLoading}
            >
              🔄 Refresh
            </button>
          </div>

          <h3>Donations created this month</h3>

          {!loading && thisMonthDonations.length > 0 && (
            <>
              {renderDonationRows(thisMonthDonations, true)}

              <div className="restaurant-panel-footer">
                <span>
                  {thisMonthDonations.length} donation(s) this month
                </span>
              </div>
            </>
          )}

          {loading && <p>⏳ Loading report...</p>}

          {!loading && undatedDonations.length > 0 && (
            <div className="restaurant-undated-report">
              <h3>Existing donations</h3>
              <p>
                These donations do not have a usable creation date, so
                their creation month cannot be verified.
              </p>

              {renderDonationRows(undatedDonations, true)}
            </div>
          )}

          {!loading && donations.length === 0 && (
            <div className="restaurant-empty-state">
              <span>🍽️</span>
              <strong>No donations found</strong>
              <p>Add a donation to start generating your reports.</p>

              <Link
                to="/restaurant/add-donation"
                className="restaurant-add-button"
              >
                + Add Donation
              </Link>
            </div>
          )}
        </section>
      </>
    );
  };

  const renderContent = () => {
    switch (activeSection) {
      case "My Donations":
        return renderDonations();

      case "Food Requests":
        return renderRequests();

      case "Delivery Activity":
        return renderDeliveries();

      case "Monthly Reports":
        return renderReports();

      case "Dashboard":
      default:
        return renderDashboard();
    }
  };

  const pageDescriptions = {
    Dashboard: "Home / Dashboard",
    "My Donations": "Home / My Donations",
    "Food Requests": "Home / Food Requests",
    "Delivery Activity": "Home / Delivery Activity",
    "Monthly Reports": "Home / Monthly Reports",
  };

  return (
    <div className="restaurant-app">
      <aside
        className={`restaurant-sidebar ${
          sidebarOpen ? "sidebar-open" : ""
        }`}
      >
        <Link
          to="/restaurant/dashboard"
          className="restaurant-brand"
          onClick={() => openSection("Dashboard")}
        >
          <span className="restaurant-brand-icon">🍃</span>

          <span>
            <strong>FoodBridge</strong>
            <small>RESTAURANT PORTAL</small>
          </span>
        </Link>

        <div className="restaurant-menu-heading">WORKSPACE</div>

        <nav className="restaurant-menu">
          {menuItems.map((item) =>
            item.route ? (
              <Link
                key={item.label}
                to={item.route}
                className="restaurant-menu-link"
                onClick={() => setSidebarOpen(false)}
              >
                <span className="restaurant-menu-emoji">
                  {item.emoji}
                </span>
                <span>{item.label}</span>
              </Link>
            ) : (
              <button
                key={item.label}
                type="button"
                className={`restaurant-menu-link ${
                  activeSection === item.label ? "active" : ""
                }`}
                onClick={() => openSection(item.label)}
              >
                <span className="restaurant-menu-emoji">
                  {item.emoji}
                </span>

                <span>{item.label}</span>

                {item.label === "Food Requests" &&
                  pendingRequests > 0 && (
                    <span className="restaurant-menu-count">
                      {pendingRequests}
                    </span>
                  )}
              </button>
            )
          )}
        </nav>

        <div className="restaurant-sidebar-bottom">
          <div className="restaurant-sidebar-tip">
            <span>🌍</span>
            <strong>Small actions, big impact!</strong>
            <p>Your surplus food can help someone today.</p>
          </div>

          <button className="restaurant-logout" onClick={logout}>
            <span>🚪</span>
            <span>Logout</span>
            <span aria-hidden="true">✨</span>
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          className="restaurant-sidebar-overlay"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="restaurant-main">
        <header className="restaurant-topbar">
          <div className="restaurant-topbar-left">
            <button
              className="restaurant-menu-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle navigation"
            >
              ☰
            </button>

            <div>
              <strong>{activeSection}</strong>
              <span>
                {pageDescriptions[activeSection] || "Home / Dashboard"}
              </span>
            </div>
          </div>

          <div className="restaurant-topbar-user">
            <span className="restaurant-topbar-avatar">🏪</span>

            <div>
              <strong>{user?.name || "Restaurant"}</strong>
              <small>🌱 Restaurant Account</small>
            </div>

            <Link
              to="/notifications"
              className="restaurant-text-link"
              onClick={() => setSidebarOpen(false)}
            >
              🔔 Notifications
            </Link>

            <button
              type="button"
              className="restaurant-refresh-button"
              onClick={logout}
            >
              🚪 Logout
            </button>
          </div>
        </header>

        <div className="restaurant-dashboard-content">
          {(successMessage || error || requestError) && (
            <div className="restaurant-message-stack">
              {successMessage && (
                <div className="restaurant-alert restaurant-alert-success">
                  {successMessage}
                </div>
              )}

              {error && (
                <div className="restaurant-alert restaurant-alert-error">
                  ⚠️ {error}
                </div>
              )}

              {requestError && (
                <div className="restaurant-alert restaurant-alert-error">
                  ⚠️ {requestError}
                </div>
              )}
            </div>
          )}

          {renderContent()}

          <footer className="restaurant-page-footer">
            <span>🍃 FoodBridge</span>
            <span>
              Connecting surplus food with communities in need.
            </span>
            <span>© 2026 FoodBridge</span>
          </footer>
        </div>
      </main>

      {/* Cancel donation dialog */}
      {selectedDonation && (
        <div
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeCancelDialog();
            }
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(15, 23, 42, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-donation-title"
            className="restaurant-panel"
            style={{
              width: "100%",
              maxWidth: "480px",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
            }}
          >
            <div className="restaurant-panel-heading">
              <div>
                <h2 id="cancel-donation-title">⚠️ Cancel Donation</h2>
                <p>
                  {selectedDonation.foodName || "Food donation"} · ID #
                  {selectedDonation.id}
                </p>
              </div>

              <button
                type="button"
                className="restaurant-reject-button"
                onClick={closeCancelDialog}
                disabled={cancellingDonationId !== null}
                aria-label="Close cancellation dialog"
              >
                ✕
              </button>
            </div>

            <p>
              Please provide a reason for cancelling this food donation.
              The reason will be saved with the donation record.
            </p>

            <label
              htmlFor="cancel-reason"
              style={{
                display: "block",
                fontWeight: 600,
                margin: "16px 0 8px",
              }}
            >
              Cancellation reason
            </label>

            <select
              id="cancel-reason"
              value={cancelReason}
              onChange={(event) => {
                setCancelReason(event.target.value);
                setCancelError("");
              }}
              disabled={cancellingDonationId !== null}
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
                background: "#fff",
                color: "#1e293b",
              }}
            >
              <option value="">-- Select a reason --</option>
              {CANCELLATION_REASONS.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>

            {cancelReason === "Other" && (
              <div style={{ marginTop: "14px" }}>
                <label
                  htmlFor="other-cancel-reason"
                  style={{
                    display: "block",
                    fontWeight: 600,
                    marginBottom: "8px",
                  }}
                >
                  Enter your reason
                </label>

                <textarea
                  id="other-cancel-reason"
                  value={otherReason}
                  onChange={(event) => {
                    setOtherReason(event.target.value);
                    setCancelError("");
                  }}
                  maxLength={500}
                  rows={3}
                  placeholder="Explain why this donation must be cancelled..."
                  disabled={cancellingDonationId !== null}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "12px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    resize: "vertical",
                  }}
                />

                <small>{otherReason.length}/500 characters</small>
              </div>
            )}

            {cancelError && (
              <div
                className="restaurant-alert restaurant-alert-error"
                role="alert"
                style={{ marginTop: "14px" }}
              >
                ⚠️ {cancelError}
              </div>
            )}

            <div
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "flex-end",
                flexWrap: "wrap",
                marginTop: "22px",
              }}
            >
              <button
                type="button"
                className="restaurant-refresh-button"
                onClick={closeCancelDialog}
                disabled={cancellingDonationId !== null}
              >
                Keep Donation
              </button>

              <button
                type="button"
                className="restaurant-reject-button"
                onClick={cancelDonation}
                disabled={cancellingDonationId !== null}
              >
                {cancellingDonationId === selectedDonation.id
                  ? "Cancelling..."
                  : "Confirm Cancellation"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default RestaurantDashboard;
