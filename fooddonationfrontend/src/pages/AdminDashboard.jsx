import { useEffect, useState } from "react";
import "../App.css";

const API = "https://foodbridge-backend-0l2c.onrender.com/api";

function AdminDashboard() {
  const [activePage, setActivePage] = useState("dashboard");
  const [users, setUsers] = useState([]);
  const [donations, setDonations] = useState([]);
  const [requests, setRequests] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [adminProfile, setAdminProfile] = useState({
    id: null,
    name: "",
    email: "",
    phone: "",
    address: "",
    role: "ADMIN",
  });

  const [editingProfile, setEditingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("foodbridgeUser") || "{}"
      );

      if (saved.role?.toUpperCase() === "ADMIN") {
        setAdminProfile({
          id: saved.id ?? null,
          name: saved.name || "",
          email: saved.email || "",
          phone: saved.phone || "",
          address: saved.address || "",
          role: "ADMIN",
        });
      } else {
        setProfileMessage(
          "Admin login details were not found. Please log in again as Admin."
        );
      }
    } catch {
      setProfileMessage("Unable to load administrator details.");
    }
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const endpoints = [
        `${API}/users`,
        `${API}/donations`,
        `${API}/requests`,
        `${API}/deliveries`,
      ];

      const responses = await Promise.all(
        endpoints.map((url) => fetch(url))
      );

      const failed = responses.find((response) => !response.ok);

      if (failed) {
        throw new Error(`Request failed: ${failed.status}`);
      }

      const data = await Promise.all(
        responses.map((response) => response.json())
      );

      setUsers(Array.isArray(data[0]) ? data[0] : []);
      setDonations(Array.isArray(data[1]) ? data[1] : []);
      setRequests(Array.isArray(data[2]) ? data[2] : []);
      setDeliveries(Array.isArray(data[3]) ? data[3] : []);
    } catch (err) {
      setError(err.message || "Could not load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getValue = (item, ...keys) => {
    for (const key of keys) {
      if (item?.[key] !== undefined && item?.[key] !== null) {
        return item[key];
      }
    }
    return "—";
  };

  const getId = (item) =>
    getValue(
      item,
      "id",
      "userId",
      "donationId",
      "requestId",
      "deliveryId"
    );

  const handleAdminProfileSave = async (event) => {
    event.preventDefault();
    setProfileMessage("");

    if (!adminProfile.id) {
      setProfileMessage(
        "Your user ID is missing. Please log out and log in again."
      );
      return;
    }

    if (!adminProfile.name.trim() || !adminProfile.email.trim()) {
      setProfileMessage("Name and email are required.");
      return;
    }

    setProfileSaving(true);

    try {
      const response = await fetch(
        `${API}/users/${adminProfile.id}/profile`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: adminProfile.name.trim(),
            email: adminProfile.email.trim(),
            phone: adminProfile.phone.trim(),
            address: adminProfile.address.trim(),
          }),
        }
      );

      const responseText = await response.text();
      let data = {};

      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            `Profile update failed (${response.status}).`
        );
      }

      const updatedProfile = {
        id: data.id ?? adminProfile.id,
        name: data.name ?? adminProfile.name.trim(),
        email: data.email ?? adminProfile.email.trim(),
        phone: data.phone ?? adminProfile.phone.trim(),
        address: data.address ?? adminProfile.address.trim(),
        role: data.role ?? "ADMIN",
      };

      const savedSession = JSON.parse(
        localStorage.getItem("foodbridgeUser") || "{}"
      );

      localStorage.setItem(
        "foodbridgeUser",
        JSON.stringify({ ...savedSession, ...updatedProfile })
      );

      setAdminProfile(updatedProfile);
      setEditingProfile(false);
      setProfileMessage("Profile updated successfully in the database!");
    } catch (err) {
      setProfileMessage(
        err.message || "Unable to save the profile."
      );
    } finally {
      setProfileSaving(false);
    }
  };

  const handleAdminProfileCancel = () => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("foodbridgeUser") || "{}"
      );

      setAdminProfile({
        id: saved.id ?? null,
        name: saved.name || "",
        email: saved.email || "",
        phone: saved.phone || "",
        address: saved.address || "",
        role: saved.role || "ADMIN",
      });
    } catch {
      // Keep the current values.
    }

    setEditingProfile(false);
    setProfileMessage("");
  };

  const resetPasswordForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handlePasswordChange = async (event) => {
    event.preventDefault();
    setPasswordMessage("");

    if (!adminProfile.id) {
      setPasswordMessage(
        "Your user ID is missing. Please log in again."
      );
      return;
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage("Please fill in all password fields.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordMessage(
        "Your new password must contain at least 8 characters."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage("The new passwords do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordMessage(
        "Your new password must differ from your current password."
      );
      return;
    }

    setPasswordSaving(true);

    try {
      const response = await fetch(
        `${API}/users/${adminProfile.id}/password`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            currentPassword,
            newPassword,
            confirmPassword,
          }),
        }
      );

      const responseText = await response.text();
      let data = {};

      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        data = { message: responseText };
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            `Password change failed (${response.status}).`
        );
      }

      setPasswordMessage(
        data.message || "Password changed successfully!"
      );

      resetPasswordForm();
      setShowPasswordForm(false);
    } catch (err) {
      setPasswordMessage(
        err.message ||
          "Unable to change the password. Check that the backend is running."
      );
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleLogout = () => {
    [
      "user",
      "loggedInUser",
      "loggedIn",
      "role",
      "foodbridgeUser",
    ].forEach((key) => localStorage.removeItem(key));

    window.location.href = "/login";
  };

  const pageInfo = {
    dashboard: {
      title: "Admin Dashboard",
      subtitle: "Manage your FoodBridge community in one place.",
    },
    users: {
      title: "Registered Users",
      subtitle: "View users and their account information.",
    },
    donations: {
      title: "Food Donations",
      subtitle: "View surplus food listed by restaurants.",
    },
    requests: {
      title: "Donation Requests",
      subtitle: "View NGO requests for available food.",
    },
    deliveries: {
      title: "Deliveries",
      subtitle: "Monitor food pickup and delivery progress.",
    },
    profile: {
      title: "Admin Profile",
      subtitle: "View and manage your administrator account.",
    },
  };

  const current = pageInfo[activePage] || pageInfo.dashboard;

  const Status = ({ value }) => (
    <span className="fb-status">{String(value ?? "Unknown")}</span>
  );

  const Table = ({ headers, rows, emptyMessage }) => (
    <div className="fb-table-wrap">
      {rows.length === 0 ? (
        <div className="fb-empty">
          <span>📭</span>
          <p>{emptyMessage}</p>
        </div>
      ) : (
        <table className="fb-table">
          <thead>
            <tr>
              {headers.map((header) => (
                <th key={header}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.id ?? index}>
                {row.cells.map((cell, cellIndex) => (
                  <td key={cellIndex}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  const userRows = users.map((user) => ({
    id: getId(user),
    cells: [
      getId(user),
      getValue(user, "name", "fullName"),
      getValue(user, "email"),
      getValue(user, "phone"),
      getValue(user, "role"),
    ],
  }));

  const donationRows = donations.map((donation) => ({
    id: getId(donation),
    cells: [
      getId(donation),
      getValue(
        donation,
        "foodName",
        "foodItem",
        "name",
        "foodType",
        "title"
      ),
      getValue(donation, "quantity"),
      <Status key="status" value={getValue(donation, "status")} />,
    ],
  }));

  const requestRows = requests.map((request) => ({
    id: getId(request),
    cells: [
      getId(request),
      getValue(request, "donationId", "donation_id"),
      getValue(request, "ngoId", "ngo_id", "userId", "user_id"),
      <Status key="status" value={getValue(request, "status")} />,
    ],
  }));

  const deliveryRows = deliveries.map((delivery) => ({
    id: getId(delivery),
    cells: [
      getId(delivery),
      getValue(delivery, "donationId", "donation_id"),
      getValue(delivery, "volunteerId", "volunteer_id"),
      <Status key="status" value={getValue(delivery, "status")} />,
    ],
  }));

  const menu = [
    { id: "dashboard", icon: "▦", label: "Dashboard" },
    { id: "users", icon: "♙", label: "Users" },
    { id: "donations", icon: "♧", label: "Donations" },
    { id: "requests", icon: "▤", label: "Requests" },
    { id: "deliveries", icon: "⇄", label: "Deliveries" },
  ];

  return (
    <div className="fb-admin">
      <aside className="fb-sidebar">
        <div className="fb-brand">🌿 FoodBridge</div>
        <p className="fb-menu-label">MAIN MENU</p>

        <nav className="fb-menu">
          {menu.map((item) => (
            <button
              key={item.id}
              type="button"
              className={
                activePage === item.id
                  ? "fb-menu-item active"
                  : "fb-menu-item"
              }
              onClick={() => setActivePage(item.id)}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="fb-sidebar-footer">
          Reducing food waste,
          <br />
          one meal at a time 💚
        </div>
      </aside>

      <main className="fb-main">
        <header className="fb-topbar">
          <nav className="fb-topbar-actions">
            <button
              type="button"
              className={
                activePage === "dashboard"
                  ? "fb-topbar-btn active"
                  : "fb-topbar-btn"
              }
              onClick={() => setActivePage("dashboard")}
            >
              ▦ Dashboard
            </button>

            <button
              type="button"
              className={
                activePage === "profile"
                  ? "fb-topbar-btn active"
                  : "fb-topbar-btn"
              }
              onClick={() => {
                setActivePage("profile");
                setProfileMessage("");
                setPasswordMessage("");
              }}
            >
              👤 Profile
            </button>

            <button
              type="button"
              className="fb-topbar-btn"
              onClick={handleLogout}
            >
              ↪ Logout
            </button>
          </nav>
        </header>

        <div className="fb-admin-toolbar">
          <div className="fb-admin-identity">
            <span className="fb-avatar">
              {(adminProfile.name || "A").charAt(0).toUpperCase()}
            </span>
            <span>
              <strong>{adminProfile.name || "Administrator"}</strong>
              <small>System Manager</small>
            </span>
          </div>

          <button
            type="button"
            className="fb-refresh"
            onClick={loadData}
            disabled={loading}
          >
            {loading ? "Loading..." : "↻ Refresh Data"}
          </button>
        </div>

        <section className="fb-page-heading">
          <p className="fb-breadcrumb">FoodBridge / {current.title}</p>
          <h1>{current.title}</h1>
          <p>{current.subtitle}</p>
        </section>

        {error && (
          <div className="fb-error">
            <strong>Could not load dashboard data.</strong>
            <p>{error}</p>
            <button type="button" onClick={loadData}>
              Try again
            </button>
          </div>
        )}

        {loading && (
          <div className="fb-loading">Loading FoodBridge data...</div>
        )}

        {!loading && !error && activePage === "dashboard" && (
          <>
            <section className="fb-welcome">
              <div>
                <span className="fb-eyebrow">ADMINISTRATION</span>
                <h2>Making every meal count. 💚</h2>
                <p>
                  Here's an overview of the FoodBridge donation network
                  and its activity.
                </p>
              </div>
              <span className="fb-welcome-icon">🥗</span>
            </section>

            <section className="fb-stats">
              <div className="fb-stat-card">
                <span className="fb-stat-icon">👥</span>
                <p>Total Users</p>
                <h2>{users.length}</h2>
                <small>Registered accounts</small>
              </div>
              <div className="fb-stat-card">
                <span className="fb-stat-icon">🍱</span>
                <p>Food Donations</p>
                <h2>{donations.length}</h2>
                <small>Food listings</small>
              </div>
              <div className="fb-stat-card">
                <span className="fb-stat-icon">📩</span>
                <p>Donation Requests</p>
                <h2>{requests.length}</h2>
                <small>Requests received</small>
              </div>
              <div className="fb-stat-card">
                <span className="fb-stat-icon">🚚</span>
                <p>Deliveries</p>
                <h2>{deliveries.length}</h2>
                <small>Delivery records</small>
              </div>
            </section>
          </>
        )}

        {!loading && !error && activePage === "users" && (
          <section className="fb-data-card">
            <div className="fb-card-heading">
              <div>
                <h2>Registered Users</h2>
                <p>People and organizations in FoodBridge</p>
              </div>
              <span>{users.length} users</span>
            </div>
            <Table
              headers={["ID", "Name", "Email Address", "Phone", "Role"]}
              rows={userRows}
              emptyMessage="No users found yet."
            />
          </section>
        )}

        {!loading && !error && activePage === "donations" && (
          <section className="fb-data-card">
            <div className="fb-card-heading">
              <div>
                <h2>Food Donations</h2>
                <p>Surplus food listed by restaurants</p>
              </div>
              <span>{donations.length} donations</span>
            </div>
            <Table
              headers={["Donation ID", "Food Item", "Quantity", "Status"]}
              rows={donationRows}
              emptyMessage="No food donations found yet."
            />
          </section>
        )}

        {!loading && !error && activePage === "requests" && (
          <section className="fb-data-card">
            <div className="fb-card-heading">
              <div>
                <h2>Donation Requests</h2>
                <p>NGO requests for available food</p>
              </div>
              <span>{requests.length} requests</span>
            </div>
            <Table
              headers={["Request ID", "Donation ID", "NGO ID", "Status"]}
              rows={requestRows}
              emptyMessage="No donation requests found yet."
            />
          </section>
        )}

        {!loading && !error && activePage === "deliveries" && (
          <section className="fb-data-card">
            <div className="fb-card-heading">
              <div>
                <h2>Deliveries</h2>
                <p>Monitor pickup and delivery progress</p>
              </div>
              <span>{deliveries.length} deliveries</span>
            </div>
            <Table
              headers={[
                "Delivery ID",
                "Donation ID",
                "Volunteer ID",
                "Status",
              ]}
              rows={deliveryRows}
              emptyMessage="No deliveries found yet."
            />
          </section>
        )}

        {activePage === "profile" && (
          <section className="fb-data-card fb-profile-card">
            <div className="fb-card-heading">
              <div>
                <h2>Administrator Profile</h2>
                <p>Manage your FoodBridge administrator details.</p>
              </div>
              <span>ADMIN</span>
            </div>

            <div className="fb-profile-content">
              <div className="fb-profile-avatar">
                {(adminProfile.name || "A").charAt(0).toUpperCase()}
              </div>

              {profileMessage && (
                <p role="status" aria-live="polite">
                  {profileMessage}
                </p>
              )}

              {editingProfile ? (
                <form
                  className="profile-form fb-admin-profile-form"
                  onSubmit={handleAdminProfileSave}
                >
                  <label>
                    Full Name
                    <input
                      type="text"
                      value={adminProfile.name}
                      onChange={(event) =>
                        setAdminProfile({
                          ...adminProfile,
                          name: event.target.value,
                        })
                      }
                      required
                    />
                  </label>

                  <label>
                    Email Address
                    <input
                      type="email"
                      value={adminProfile.email}
                      onChange={(event) =>
                        setAdminProfile({
                          ...adminProfile,
                          email: event.target.value,
                        })
                      }
                      required
                    />
                  </label>

                  <label>
                    Phone Number
                    <input
                      type="tel"
                      value={adminProfile.phone}
                      onChange={(event) =>
                        setAdminProfile({
                          ...adminProfile,
                          phone: event.target.value,
                        })
                      }
                    />
                  </label>

                  <label>
                    Address
                    <textarea
                      value={adminProfile.address}
                      onChange={(event) =>
                        setAdminProfile({
                          ...adminProfile,
                          address: event.target.value,
                        })
                      }
                      rows={3}
                    />
                  </label>

                  <div className="profile-actions">
                    <button
                      type="submit"
                      className="fb-refresh"
                      disabled={profileSaving}
                    >
                      {profileSaving ? "Saving..." : "✓ Save Changes"}
                    </button>

                    <button
                      type="button"
                      className="fb-refresh"
                      onClick={handleAdminProfileCancel}
                      disabled={profileSaving}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <h2>{adminProfile.name || "Administrator"}</h2>
                  <p className="fb-profile-role">
                    FoodBridge Administrator
                  </p>

                  <div className="profile-details fb-admin-profile-details">
                    <div>
                      <span>Email Address</span>
                      <strong>{adminProfile.email || "Not added"}</strong>
                    </div>
                    <div>
                      <span>Phone Number</span>
                      <strong>{adminProfile.phone || "Not added"}</strong>
                    </div>
                    <div>
                      <span>Address</span>
                      <strong>{adminProfile.address || "Not added"}</strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="fb-refresh"
                    onClick={() => {
                      setEditingProfile(true);
                      setProfileMessage("");
                      setPasswordMessage("");
                    }}
                  >
                    ✎ Edit Profile
                  </button>

                  <button
                    type="button"
                    className="fb-refresh"
                    onClick={() => {
                      setShowPasswordForm(!showPasswordForm);
                      setPasswordMessage("");
                      resetPasswordForm();
                    }}
                  >
                    🔒 Change Password
                  </button>

                  {showPasswordForm && (
                    <form
                      className="profile-form fb-admin-profile-form"
                      onSubmit={handlePasswordChange}
                    >
                      <h3>Change Your Password</h3>

                      {passwordMessage && (
                        <p role="status" aria-live="polite">
                          {passwordMessage}
                        </p>
                      )}

                      <label>
                        Current Password
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={(event) =>
                            setCurrentPassword(event.target.value)
                          }
                          autoComplete="current-password"
                          required
                        />
                      </label>

                      <label>
                        New Password
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(event) =>
                            setNewPassword(event.target.value)
                          }
                          autoComplete="new-password"
                          minLength={8}
                          required
                        />
                      </label>

                      <label>
                        Confirm New Password
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(event) =>
                            setConfirmPassword(event.target.value)
                          }
                          autoComplete="new-password"
                          minLength={8}
                          required
                        />
                      </label>

                      <div className="profile-actions">
                        <button
                          type="submit"
                          className="fb-refresh"
                          disabled={passwordSaving}
                        >
                          {passwordSaving
                            ? "Updating..."
                            : "✓ Update Password"}
                        </button>

                        <button
                          type="button"
                          className="fb-refresh"
                          disabled={passwordSaving}
                          onClick={() => {
                            setShowPasswordForm(false);
                            resetPasswordForm();
                            setPasswordMessage("");
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}
            </div>
          </section>
        )}

        <footer className="fb-footer">
          © FoodBridge · Reducing food waste, one meal at a time.
        </footer>
      </main>
    </div>
  );
}

export default AdminDashboard;
