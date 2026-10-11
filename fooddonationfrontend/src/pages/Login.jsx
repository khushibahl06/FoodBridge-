import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

function Login() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (event) => {
        event.preventDefault();
        setError("");

        if (!email.trim() || !password) {
            setError("Please enter your email and password.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(
                "https://foodbridge-backend-0l2c.onrender.com/api/users/login",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        email: email.trim(),
                        password: password,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setError(
                    data.message ||
                        "Login failed. Please check your email and password."
                );
                return;
            }

            if (!data.role) {
                setError(
                    "Your account role was not returned by the server."
                );
                return;
            }

            const dashboardRoutes = {
                RESTAURANT: "/restaurant/dashboard",
                NGO: "/ngo/dashboard",
                VOLUNTEER: "/volunteer/dashboard",
                ADMIN: "/admin/dashboard",
            };

            const dashboard = dashboardRoutes[data.role];

            if (!dashboard) {
                setError("This account has an unrecognized role.");
                return;
            }

            localStorage.setItem(
                "foodbridgeUser",
                JSON.stringify(data)
            );

            navigate(dashboard, { replace: true });
        } catch (err) {
            console.error("Login error:", err);

            setError(
                "Unable to connect. Please make sure the backend server is running."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-card-header">
                    <div className="login-logo">FoodBridge</div>
                    <h2>Welcome Back</h2>
                    <p>Log-in to continue</p>
                </div>

                {error && (
                    <div className="login-error">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin}>
                    <div className="login-field">
                        <label htmlFor="email">
                            Email Address
                        </label>

                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(event) =>
                                setEmail(event.target.value)
                            }
                            placeholder="Enter your email"
                            autoComplete="email"
                            required
                        />
                    </div>

                    <div className="login-field">
                        <label htmlFor="password">
                            Password
                        </label>

                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(event) =>
                                setPassword(event.target.value)
                            }
                            placeholder="Enter your password"
                            autoComplete="current-password"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="login-button"
                        disabled={loading}
                    >
                        {loading ? "Signing In..." : "Login"}
                    </button>
                </form>

                <div className="login-register">
                    <p>Don't have an account?</p>

                    <div className="register-links">
                        <Link to="/register/restaurant">
                            Register as Restaurant
                        </Link>

                        <Link to="/register/ngo">
                            Register as NGO
                        </Link>

                        <Link to="/register/volunteer">
                            Register as Volunteer
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;
