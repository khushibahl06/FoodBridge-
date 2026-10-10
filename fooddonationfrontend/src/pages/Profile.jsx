
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API = "http://localhost:8080/api";

function Profile() {
  const [user, setUser] = useState({});
  const [editing, setEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    try {
      const savedUser = JSON.parse(
        localStorage.getItem("foodbridgeUser") || "{}"
      );

      if (!savedUser.id) {
        setError("Please log in to view your profile.");
        return;
      }

      setUser(savedUser);

      setFormData({
        name: savedUser.name || "",
        email: savedUser.email || "",
        phone: savedUser.phone || "",
        address: savedUser.address || "",
      });
    } catch {
      setError("Unable to load your profile details.");
    }
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!user.id) {
      setError("Please log in again before updating your profile.");
      return;
    }

    if (!formData.name.trim() || !formData.email.trim()) {
      setError("Name and email are required.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        `${API}/users/${user.id}/profile`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: formData.name.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim(),
            address: formData.address.trim(),
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to update your profile."
        );
      }

      const updatedUser = {
        ...user,
        ...data,
        phone: data.phone ?? "",
        address: data.address ?? "",
      };

      localStorage.setItem(
        "foodbridgeUser",
        JSON.stringify(updatedUser)
      );

      setUser(updatedUser);
      setFormData({
        name: updatedUser.name || "",
        email: updatedUser.email || "",
        phone: updatedUser.phone || "",
        address: updatedUser.address || "",
      });

      setEditing(false);
      setMessage(
        data.message || "Profile updated successfully."
      );
    } catch (err) {
      setError(
        err.message ||
          "Could not connect to the backend. Check whether Spring Boot is running."
      );
    } finally {
      setSaving(false);
    }
  };

  const cancelEditing = () => {
    setFormData({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      address: user.address || "",
    });

    setEditing(false);
    setError("");
    setMessage("");
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;

    setPasswordData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!user.id) {
      setError("Please log in again before changing your password.");
      return;
    }

    const {
      currentPassword,
      newPassword,
      confirmPassword,
    } = passwordData;

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Please fill in all password fields.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Your new password must contain at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("The new passwords do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setError("Your new password must differ from your current password.");
      return;
    }

    setChangingPassword(true);

    try {
      const response = await fetch(
        `${API}/users/${user.id}/password`,
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

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to change your password."
        );
      }

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setShowPasswordForm(false);
      setMessage(
        data.message || "Password changed successfully."
      );
    } catch (err) {
      setError(
        err.message ||
          "Could not connect to the backend. Check whether Spring Boot is running."
      );
    } finally {
      setChangingPassword(false);
    }
  };

  const role = (user.role || "USER")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

  return (
    <div className="dashboard-page profile-page">
      <section className="dashboard-section">
        <div className="dashboard-container">
          <div className="dashboard-welcome">
            <div>
              <p className="dashboard-label">ACCOUNT SETTINGS</p>
              <h2>My Profile</h2>
              <p>
                View and manage your personal FoodBridge account details.
              </p>
            </div>

            <div className="ngo-avatar">
              {(user.name || "U").charAt(0).toUpperCase()}
            </div>
          </div>

          {message && (
            <div className="donation-success" role="status">
              {message}
            </div>
          )}

          {error && (
            <div className="donation-error" role="alert">
              {error}
            </div>
          )}

          <div className="dashboard-main-card">
            <div className="profile-card-heading">
              <div>
                <p className="profile-section-label">YOUR ACCOUNT</p>
                <h3>Personal Information</h3>
                <p>Manage your basic account information.</p>
              </div>

              {!editing && (
                <button
                  type="button"
                  className="dashboard-primary-btn"
                  onClick={() => {
                    setEditing(true);
                    setMessage("");
                    setError("");
                  }}
                >
                  ✎ Edit Profile
                </button>
              )}
            </div>

            {editing ? (
              <form className="profile-form" onSubmit={handleSave}>
                <div className="profile-form-grid">
                  <label>
                    Full Name
                    <input
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      autoComplete="name"
                      required
                    />
                  </label>

                  <label>
                    Email Address
                    <input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter your email"
                      autoComplete="email"
                      required
                    />
                  </label>

                  <label>
                    Phone Number
                    <input
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Enter your phone number"
                      autoComplete="tel"
                    />
                  </label>

                  <label>
                    Account Role
                    <input type="text" value={role} disabled readOnly />
                  </label>

                  <label className="profile-address-field">
                    Address
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Enter your address"
                      autoComplete="street-address"
                      rows={3}
                    />
                  </label>
                </div>

                <div className="profile-actions">
                  <button
                    type="submit"
                    className="dashboard-primary-btn"
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "✓ Save Changes"}
                  </button>

                  <button
                    type="button"
                    className="dashboard-secondary-btn"
                    onClick={cancelEditing}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="profile-details">
                <div>
                  <span>♙ Full Name</span>
                  <strong>{user.name || "Not added"}</strong>
                </div>

                <div>
                  <span>✉ Email Address</span>
                  <strong>{user.email || "Not added"}</strong>
                </div>

                <div>
                  <span>☎ Phone Number</span>
                  <strong>{user.phone || "Not added"}</strong>
                </div>

                <div>
                  <span>⌖ Address</span>
                  <strong>{user.address || "Not added"}</strong>
                </div>

                <div>
                  <span>▣ Account Role</span>
                  <strong>
                    <span className="profile-role-badge">{role}</span>
                  </strong>
                </div>
              </div>
            )}
          </div>

          <div className="dashboard-main-card">
            <div className="profile-card-heading">
              <div>
                <p className="profile-section-label">ACCOUNT PROTECTION</p>
                <h3>Security</h3>
                <p>Manage your password and account security.</p>
              </div>

              <div className="profile-security-icon">🔒</div>
            </div>

            <button
              type="button"
              className="dashboard-secondary-btn"
              onClick={() => {
                setShowPasswordForm((previous) => !previous);
                setError("");
                setMessage("");
              }}
            >
              {showPasswordForm ? "Cancel" : "🔑 Change Password"}
            </button>

            {showPasswordForm && (
              <form
                className="profile-form"
                onSubmit={handlePasswordSubmit}
              >
                <label>
                  Current Password
                  <input
                    type="password"
                    name="currentPassword"
                    autoComplete="current-password"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter current password"
                    required
                  />
                </label>

                <label>
                  New Password
                  <input
                    type="password"
                    name="newPassword"
                    autoComplete="new-password"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="At least 8 characters"
                    minLength={8}
                    required
                  />
                </label>

                <label>
                  Confirm New Password
                  <input
                    type="password"
                    name="confirmPassword"
                    autoComplete="new-password"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter new password again"
                    minLength={8}
                    required
                  />
                </label>

                <button
                  type="submit"
                  className="dashboard-primary-btn"
                  disabled={changingPassword}
                >
                  {changingPassword
                    ? "Updating..."
                    : "Update Password"}
                </button>
              </form>
            )}

            <p className="profile-security-note">
              Password changes are verified and saved by the FoodBridge backend.
            </p>
          </div>

          <div className="dashboard-main-card">
            <div className="profile-card-heading">
              <div>
                <p className="profile-section-label">QUICK ACCESS</p>
                <h3>Quick Links</h3>
                <p>Navigate to other FoodBridge pages.</p>
              </div>
            </div>

            <div className="profile-links">
              <Link to="/">⌂ Home</Link>
              <Link to="/notifications">♧ Notifications</Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="foodbridge-footer">
        <div className="footer-container">
          <strong>FoodBridge</strong>
          <p>Connecting surplus food with communities in need.</p>
        </div>

        <div className="footer-bottom">
          © 2026 FoodBridge. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

export default Profile;
