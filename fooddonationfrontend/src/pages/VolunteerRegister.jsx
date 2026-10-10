import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function VolunteerRegister() {

    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        address: "",
        password: "",
        confirmPassword: ""
    });

    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);


    const handleChange = (e) => {

        const { name, value } = e.target;

        setFormData({
            ...formData,
            [name]: value
        });

        setError("");
        setMessage("");
    };


    const handleSubmit = async (e) => {

        e.preventDefault();

        setError("");
        setMessage("");


        // VALIDATION

        if (
            !formData.name ||
            !formData.email ||
            !formData.phone ||
            !formData.address ||
            !formData.password ||
            !formData.confirmPassword
        ) {

            setError("Please fill in all fields.");

            return;
        }


        if (formData.password.length < 6) {

            setError(
                "Password must contain at least 6 characters."
            );

            return;
        }


        if (formData.password !== formData.confirmPassword) {

            setError("Passwords do not match.");

            return;
        }


        setLoading(true);


        // SEND DATA TO SPRING BOOT

        try {

            const response = await fetch(
                "http://localhost:8080/api/users/register",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({

                        name: formData.name,

                        email: formData.email,

                        phone: formData.phone,

                        address: formData.address,

                        password: formData.password,

                        role: "VOLUNTEER"

                    })
                }
            );


            const data = await response.json();


            // REGISTRATION FAILED

            if (!response.ok) {

                setError(
                    data.message ||
                    "Registration failed."
                );

                return;
            }


            // REGISTRATION SUCCESSFUL

            setMessage(
                "Volunteer account created successfully! Redirecting to login..."
            );


            setTimeout(() => {

                navigate("/login");

            }, 1200);


        }
        catch (error) {

            console.error(error);

            setError(
                "Unable to connect to the server. Please make sure Spring Boot is running."
            );

        }
        finally {

            setLoading(false);

        }

    };


    return (

        <div className="registration-page">


            {/* HERO */}

            <section className="registration-hero">

                <div className="registration-hero-content">

                    <div className="registration-label">
                        COMMUNITY PARTNER • VOLUNTEER
                    </div>

                    <h1>
                        Join
                        <span> FoodBridge</span>
                    </h1>

                    <p>
                        Become a FoodBridge volunteer and help
                        move surplus food from restaurants to
                        communities that need it.
                    </p>

                </div>

            </section>


            {/* REGISTRATION SECTION */}

            <section className="registration-section">

                <div className="registration-layout">


                    {/* INFORMATION */}

                    <div className="registration-info">

                        <div className="registration-icon">
                            🚚
                        </div>

                        <div className="registration-label">
                            VOLUNTEER PARTNER
                        </div>

                        <h2>
                            Deliver food,
                            <span> create impact.</span>
                        </h2>

                        <p>
                            Register as a FoodBridge volunteer
                            and help coordinate the collection
                            and delivery of surplus food to NGOs
                            and communities.
                        </p>


                        <div className="registration-benefits">


                            <div className="benefit">

                                <strong>01</strong>

                                <div>

                                    <h3>
                                        Find Delivery Tasks
                                    </h3>

                                    <p>
                                        View available food pickup
                                        and delivery tasks from
                                        nearby partners.
                                    </p>

                                </div>

                            </div>


                            <div className="benefit">

                                <strong>02</strong>

                                <div>

                                    <h3>
                                        Collect Surplus Food
                                    </h3>

                                    <p>
                                        Coordinate with restaurants
                                        and safely collect donated food.
                                    </p>

                                </div>

                            </div>


                            <div className="benefit">

                                <strong>03</strong>

                                <div>

                                    <h3>
                                        Complete Deliveries
                                    </h3>

                                    <p>
                                        Deliver food to verified NGOs
                                        and help create meaningful
                                        community impact.
                                    </p>

                                </div>

                            </div>


                        </div>

                    </div>


                    {/* FORM */}

                    <div className="registration-card">


                        <div className="form-heading">

                            <div className="registration-label">
                                CREATE ACCOUNT
                            </div>

                            <h2>
                                Volunteer Registration
                            </h2>

                            <p>
                                Enter your details below to join
                                the FoodBridge volunteer network.
                            </p>

                        </div>


                        <form onSubmit={handleSubmit}>


                            {/* VOLUNTEER NAME */}

                            <div className="registration-field">

                                <label>
                                    Full Name *
                                </label>

                                <input
                                    type="text"
                                    name="name"
                                    placeholder="Enter your full name"
                                    value={formData.name}
                                    onChange={handleChange}
                                />

                            </div>


                            {/* EMAIL + PHONE */}

                            <div className="registration-form-row">


                                <div className="registration-field">

                                    <label>
                                        Email Address *
                                    </label>

                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="Enter your email"
                                        value={formData.email}
                                        onChange={handleChange}
                                    />

                                </div>


                                <div className="registration-field">

                                    <label>
                                        Phone Number *
                                    </label>

                                    <input
                                        type="tel"
                                        name="phone"
                                        placeholder="Enter phone number"
                                        value={formData.phone}
                                        onChange={handleChange}
                                    />

                                </div>


                            </div>


                            {/* ADDRESS */}

                            <div className="registration-field">

                                <label>
                                    Address *
                                </label>

                                <textarea
                                    name="address"
                                    rows="3"
                                    placeholder="Enter your address"
                                    value={formData.address}
                                    onChange={handleChange}
                                />

                            </div>


                            {/* PASSWORD */}

                            <div className="registration-form-row">


                                <div className="registration-field">

                                    <label>
                                        Password *
                                    </label>

                                    <input
                                        type="password"
                                        name="password"
                                        placeholder="Minimum 6 characters"
                                        value={formData.password}
                                        onChange={handleChange}
                                    />

                                </div>


                                <div className="registration-field">

                                    <label>
                                        Confirm Password *
                                    </label>

                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        placeholder="Re-enter password"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                    />

                                </div>


                            </div>


                            {/* ERROR */}

                            {error && (

                                <div
                                    style={{
                                        marginBottom: "18px",
                                        padding: "12px 14px",
                                        borderRadius: "9px",
                                        background: "#fff1f0",
                                        color: "#b42318",
                                        fontSize: "13px"
                                    }}
                                >
                                    {error}
                                </div>

                            )}


                            {/* SUCCESS */}

                            {message && (

                                <div
                                    style={{
                                        marginBottom: "18px",
                                        padding: "12px 14px",
                                        borderRadius: "9px",
                                        background: "#edf8ef",
                                        color: "#28733b",
                                        fontSize: "13px"
                                    }}
                                >
                                    {message}
                                </div>

                            )}


                            {/* SUBMIT BUTTON */}

                            <button
                                type="submit"
                                className="registration-submit"
                                disabled={loading}
                            >

                                {loading
                                    ? "Creating Account..."
                                    : "Create Volunteer Account"
                                }

                            </button>


                        </form>


                        {/* LOGIN */}

                        <div className="already-account">

                            <p>
                                Already have an account?
                            </p>

                            <Link to="/login">
                                Login to FoodBridge →
                            </Link>

                        </div>


                    </div>

                </div>

            </section>


            {/* CTA */}

            <section className="registration-cta">

                <div>

                    <h2>
                        Every delivery makes a difference.
                    </h2>

                    <p>
                        Help move surplus food from restaurants
                        to communities that need it.
                    </p>

                    <Link
                        to="/"
                        className="cta-link"
                    >
                        Back to FoodBridge →
                    </Link>

                </div>

            </section>


            {/* FOOTER */}

            <footer className="foodbridge-footer">

                <div className="footer-container">


                    <div className="footer-brand">

                        <h2>
                            FoodBridge
                        </h2>

                        <p>
                            Connecting surplus food with people
                            who need it.
                        </p>

                    </div>


                    <div className="footer-column">

                        <h3>
                            Platform
                        </h3>

                        <Link to="/">
                            Home
                        </Link>

                        <Link to="/login">
                            Login
                        </Link>

                    </div>


                    <div className="footer-column">

                        <h3>
                            Join Us
                        </h3>

                        <Link to="/register/restaurant">
                            Restaurants
                        </Link>

                        <Link to="/register/ngo">
                            NGOs
                        </Link>

                        <Link to="/register/volunteer">
                            Volunteers
                        </Link>

                    </div>


                </div>


                <div className="footer-bottom">

                    © 2026 FoodBridge. Smart Food Donation & Redistribution System.

                </div>

            </footer>


        </div>

    );

}


export default VolunteerRegister;