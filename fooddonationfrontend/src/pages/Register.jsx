import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Register({ fixedRole }) {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (!fixedRole) {
      setError("Please use the appropriate registration page.");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "https://foodbridge-backend-0l2c.onrender.com/api/users/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
            password: form.password,
            role: fixedRole,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Registration failed.");
        return;
      }

      navigate("/login", {
        state: {
          message: "Registration successful! You can now log in.",
        },
      });
    } catch {
      setError(
        "Unable to connect to the server. Make sure Spring Boot is running."
      );
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "13px 15px",
    border: "1px solid #dce7e1",
    borderRadius: "9px",
    fontSize: "14px",
    outlineColor: "#328667",
    boxSizing: "border-box",
    background: "#fff",
  };

  const labelStyle = {
    display: "block",
    marginBottom: "7px",
    color: "#24483b",
    fontSize: "13px",
    fontWeight: "600",
  };

  const fieldStyle = { marginBottom: "17px" };

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "30px 18px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
        background: "#f0f7f1",
        fontFamily: "'Segoe UI', Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1000px",
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
          overflow: "hidden",
          borderRadius: "20px",
          background: "#fff",
          boxShadow: "0 15px 50px rgba(31, 77, 53, 0.12)",
        }}
      >
        <div
          style={{
            padding: "40px 32px",
            background: "linear-gradient(145deg, #e4f2e5, #cce5d3)",
            color: "#164638",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <Link
            to="/"
            style={{
              fontSize: "29px",
              fontWeight: "800",
              color: "#176448",
              textDecoration: "none",
            }}
          >
            ❧ FoodBridge
          </Link>

          <p
            style={{
              fontSize: "11px",
              letterSpacing: "2px",
              color: "#507566",
            }}
          >
            LESS WASTE. MORE HOPE.
          </p>

          <h1
            style={{
              fontSize: "clamp(34px, 5vw, 46px)",
              lineHeight: "1.15",
              marginTop: "35px",
              marginBottom: "15px",
            }}
          >
            Good food.
            <br />
            Greater good.
          </h1>

          <p style={{ lineHeight: "1.8", color: "#527368", fontSize: "15px" }}>
            Join our community and help surplus food reach the people who need
            it most.
          </p>

          {[
            ["♧", "Reduce Food Waste", "Give surplus food a new purpose."],
            ["♡", "Build Connections", "Bring caring communities together."],
            ["✳", "Create Real Impact", "Make every meal count."],
          ].map(([icon, title, description]) => (
            <div
              key={title}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                marginTop: "19px",
              }}
            >
              <div
                style={{
                  width: "43px",
                  height: "43px",
                  flexShrink: 0,
                  borderRadius: "50%",
                  background: "#ffffffb8",
                  color: "#27815f",
                  display: "grid",
                  placeItems: "center",
                  fontSize: "23px",
                }}
              >
                {icon}
              </div>

              <div>
                <strong style={{ fontSize: "14px" }}>{title}</strong>
                <p
                  style={{
                    margin: "4px 0 0",
                    color: "#648078",
                    fontSize: "12px",
                  }}
                >
                  {description}
                </p>
              </div>
            </div>
          ))}

          <div style={{ marginTop: "30px", fontSize: "36px" }}>
            🥬 🥕 🍅 🥦
          </div>

          <p style={{ color: "#527368", fontSize: "12px" }}>
            Small acts of kindness. A world of difference.
          </p>
        </div>

        <div
          style={{
            padding: "40px clamp(22px, 5vw, 55px)",
            boxSizing: "border-box",
          }}
        >
          <p
            style={{
              textAlign: "center",
              color: "#27815f",
              fontSize: "13px",
              fontWeight: "800",
              letterSpacing: "2px",
            }}
          >
            FOODBRIDGE
          </p>

          <h2 style={{ fontSize: "31px", color: "#193c37", margin: "8px 0" }}>
            Create an Account
          </h2>

          <p
            style={{
              color: "#788780",
              fontSize: "14px",
              marginBottom: "27px",
            }}
          >
            Join us and be part of something meaningful.
          </p>

          {error && (
            <p
              style={{
                padding: "11px",
                borderRadius: "8px",
                color: "#a33b35",
                background: "#fff0ef",
                fontSize: "13px",
              }}
            >
              {error}
            </p>
          )}

          <form onSubmit={handleRegister}>
            <div style={fieldStyle}>
              <label style={labelStyle} htmlFor="name">Full Name</label>
              <input
                style={inputStyle}
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                autoComplete="name"
                required
              />
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle} htmlFor="email">Email Address</label>
              <input
                style={inputStyle}
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter your email address"
                autoComplete="email"
                required
              />
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle} htmlFor="phone">Phone Number</label>
              <input
                style={inputStyle}
                id="phone"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                placeholder="Enter your phone number"
                autoComplete="tel"
                required
              />
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle} htmlFor="password">Password</label>
              <input
                style={inputStyle}
                id="password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Create a password"
                autoComplete="new-password"
                required
              />
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle} htmlFor="confirmPassword">
                Confirm Password
              </label>
              <input
                style={inputStyle}
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "15px",
                border: "none",
                borderRadius: "9px",
                background: "#27815f",
                color: "#fff",
                fontSize: "15px",
                fontWeight: "700",
                cursor: loading ? "wait" : "pointer",
                marginTop: "3px",
              }}
            >
              {loading ? "Creating Account..." : "Create Account →"}
            </button>
          </form>

          <p
            style={{
              marginTop: "25px",
              textAlign: "center",
              color: "#788780",
              fontSize: "13px",
            }}
          >
            Already have an account?{" "}
            <Link
              to="/login"
              style={{
                color: "#27815f",
                fontWeight: "700",
                textDecoration: "none",
              }}
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
