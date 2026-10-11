import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function AddDonation() {
    const navigate = useNavigate();

    const user = JSON.parse(
        localStorage.getItem("foodbridgeUser")
    );

    const [formData, setFormData] = useState({
        foodName: "",
        description: "",
        quantity: "",
        unit: "KG",
        foodType: "",
        preparedDate: "",
        expiryDate: "",
        pickupAddress: "",
        contactNumber: ""
    });

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });

        setError("");
        setSuccess("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        if (
            !formData.foodName ||
            !formData.quantity ||
            !formData.foodType ||
            !formData.preparedDate ||
            !formData.expiryDate ||
            !formData.pickupAddress
        ) {
            setError("Please fill in all required fields.");
            return;
        }

        if (!user || !user.id) {
            setError("Restaurant login information not found. Please login again.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(
                "https://foodbridge-backend-0l2c.onrender.com/api/donations",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        foodName: formData.foodName,
                        description: formData.description,
                        quantity: Number(formData.quantity),
                        unit: formData.unit,
                        foodType: formData.foodType,
                        preparedDate: formData.preparedDate,
                        expiryDate: formData.expiryDate,
                        pickupAddress: formData.pickupAddress,
                        restaurantId: user.id
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setError(
                    data.message ||
                    "Unable to submit donation."
                );
                setLoading(false);
                return;
            }

            setSuccess(
                "Donation submitted successfully!"
            );

            setFormData({
                foodName: "",
                description: "",
                quantity: "",
                unit: "KG",
                foodType: "",
                preparedDate: "",
                expiryDate: "",
                pickupAddress: "",
                contactNumber: ""
            });

            setTimeout(() => {
                navigate("/restaurant/dashboard");
            }, 1200);

        } catch (error) {
            console.error(error);

            setError(
                "Unable to connect to the server. Please make sure Spring Boot is running."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="donation-page">

            <section className="donation-hero">
                <div className="donation-hero-content">
                    <p className="donation-eyebrow">
                        RESTAURANT PORTAL
                    </p>

                    <h1>
                        Add Food Donation
                    </h1>

                    <p>
                        Share your surplus food and help make
                        sure it reaches people who need it.
                    </p>
                </div>
            </section>

            <section className="donation-section">
                <div className="donation-container">

                    <Link
                        to="/restaurant/dashboard"
                        className="donation-back"
                    >
                        ← Back to Dashboard
                    </Link>

                    <div className="donation-layout">

                        <div className="donation-info">

                            <div className="donation-icon">
                                🍱
                            </div>

                            <h2>
                                Share Surplus Food
                            </h2>

                            <p>
                                Enter the details of the food
                                available for donation. NGOs will
                                be able to view suitable donations
                                and request them.
                            </p>

                            <div className="donation-guidelines">

                                <div className="donation-guide">
                                    <span>✓</span>
                                    <div>
                                        <strong>
                                            Fresh Food
                                        </strong>
                                        <small>
                                            Only list food that is
                                            safe for consumption.
                                        </small>
                                    </div>
                                </div>

                                <div className="donation-guide">
                                    <span>✓</span>
                                    <div>
                                        <strong>
                                            Accurate Quantity
                                        </strong>
                                        <small>
                                            Provide the correct
                                            quantity available.
                                        </small>
                                    </div>
                                </div>

                                <div className="donation-guide">
                                    <span>✓</span>
                                    <div>
                                        <strong>
                                            Pickup Details
                                        </strong>
                                        <small>
                                            Give a clear pickup
                                            address.
                                        </small>
                                    </div>
                                </div>

                            </div>
                        </div>

                        <div className="donation-card">

                            <h2 className="donation-card-heading">
                                Donation Details
                            </h2>

                            <form onSubmit={handleSubmit}>

                                <div className="donation-field">
                                    <label>
                                        Food Name *
                                    </label>

                                    <input
                                        type="text"
                                        name="foodName"
                                        value={formData.foodName}
                                        onChange={handleChange}
                                        placeholder="Example: Vegetable Biryani"
                                    />
                                </div>

                                <div className="donation-field">
                                    <label>
                                        Description
                                    </label>

                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        placeholder="Describe the food..."
                                        rows="4"
                                    />
                                </div>

                                <div className="donation-form-row">

                                    <div className="donation-field">
                                        <label>
                                            Quantity *
                                        </label>

                                        <input
                                            type="number"
                                            name="quantity"
                                            value={formData.quantity}
                                            onChange={handleChange}
                                            min="1"
                                            placeholder="Example: 10"
                                        />
                                    </div>

                                    <div className="donation-field">
                                        <label>
                                            Unit
                                        </label>

                                        <select
                                            name="unit"
                                            value={formData.unit}
                                            onChange={handleChange}
                                        >
                                            <option value="KG">
                                                KG
                                            </option>

                                            <option value="LITRES">
                                                Litres
                                            </option>

                                            <option value="PACKETS">
                                                Packets
                                            </option>

                                            <option value="PLATES">
                                                Plates
                                            </option>

                                            <option value="BOXES">
                                                Boxes
                                            </option>
                                        </select>
                                    </div>

                                </div>

                                <div className="donation-field">
                                    <label>
                                        Food Type *
                                    </label>

                                    <select
                                        name="foodType"
                                        value={formData.foodType}
                                        onChange={handleChange}
                                    >
                                        <option value="">
                                            Select food type
                                        </option>

                                        <option value="VEGETARIAN">
                                            Vegetarian
                                        </option>

                                        <option value="NON_VEGETARIAN">
                                            Non-Vegetarian
                                        </option>

                                        <option value="VEGAN">
                                            Vegan
                                        </option>

                                        <option value="BAKERY">
                                            Bakery
                                        </option>

                                        <option value="PACKAGED">
                                            Packaged Food
                                        </option>

                                        <option value="OTHER">
                                            Other
                                        </option>
                                    </select>
                                </div>

                                <div className="donation-form-row">

                                    <div className="donation-field">
                                        <label>
                                            Prepared Date *
                                        </label>

                                        <input
                                            type="date"
                                            name="preparedDate"
                                            value={formData.preparedDate}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div className="donation-field">
                                        <label>
                                            Expiry / Safe Until *
                                        </label>

                                        <input
                                            type="date"
                                            name="expiryDate"
                                            value={formData.expiryDate}
                                            onChange={handleChange}
                                        />
                                    </div>

                                </div>

                                <div className="donation-field">
                                    <label>
                                        Pickup Address *
                                    </label>

                                    <textarea
                                        name="pickupAddress"
                                        value={formData.pickupAddress}
                                        onChange={handleChange}
                                        placeholder="Enter the address where the food can be collected..."
                                        rows="3"
                                    />
                                </div>

                                <div className="donation-field">
                                    <label>
                                        Contact Number
                                    </label>

                                    <input
                                        type="tel"
                                        name="contactNumber"
                                        value={formData.contactNumber}
                                        onChange={handleChange}
                                        placeholder="Example: 9876543210"
                                    />
                                </div>

                                {error && (
                                    <div className="donation-error">
                                        {error}
                                    </div>
                                )}

                                {success && (
                                    <div className="donation-success">
                                        {success}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    className="donation-submit"
                                    disabled={loading}
                                >
                                    {loading
                                        ? "Submitting..."
                                        : "Submit Donation"}
                                </button>

                            </form>
                        </div>

                    </div>
                </div>
            </section>

            <footer className="foodbridge-footer">
                <div className="footer-container">

                    <div className="footer-brand">
                        <h3>FoodBridge</h3>
                        <p>
                            Connecting surplus food with
                            communities in need.
                        </p>
                    </div>

                    <div className="footer-column">
                        <h4>FoodBridge</h4>
                        <Link to="/">Home</Link>
                        <Link to="/login">Login</Link>
                    </div>

                    <div className="footer-column">
                        <h4>Restaurant</h4>
                        <Link to="/restaurant/dashboard">
                            Dashboard
                        </Link>
                        <Link to="/restaurant/add-donation">
                            Add Donation
                        </Link>
                    </div>

                </div>

                <div className="footer-bottom">
                    © 2026 FoodBridge. Together, we can reduce food waste.
                </div>
            </footer>

        </div>
    );
}

export default AddDonation;