import { useEffect, useState } from "react";

const API = "https://foodbridge-backend-0l2c.onrender.com";

function TrackDonation() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDonation, setSelectedDonation] = useState(null);

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("foodbridgeUser"));
    } catch {
      return null;
    }
  })();

  useEffect(() => {
    async function fetchDonations() {
      if (!user?.id) {
        setError("Please log in to track your donations.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${API}/api/donations/restaurant/${user.id}`
        );

        if (!response.ok) {
          throw new Error("Unable to load donations.");
        }

        const data = await response.json();
        const list = Array.isArray(data) ? data : [];

        setDonations(list);
        setSelectedDonation(list[0] || null);
      } catch (err) {
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    }

    fetchDonations();
  }, [user?.id]);

  const statusSteps = [
    { label: "Food Donated", statuses: ["AVAILABLE", "REQUESTED", "PENDING", "APPROVED", "ASSIGNED", "PICKED_UP", "IN_TRANSIT", "DELIVERED", "COMPLETED"] },
    { label: "NGO Requested", statuses: ["REQUESTED", "PENDING", "APPROVED", "ASSIGNED", "PICKED_UP", "IN_TRANSIT", "DELIVERED", "COMPLETED"] },
    { label: "Volunteer Assigned", statuses: ["ASSIGNED", "PICKED_UP", "IN_TRANSIT", "DELIVERED", "COMPLETED"] },
    { label: "Food Picked Up", statuses: ["PICKED_UP", "IN_TRANSIT", "DELIVERED", "COMPLETED"] },
    { label: "Food Delivered", statuses: ["DELIVERED", "COMPLETED"] },
  ];

  const getProgress = (status) => {
    const currentStatus = (status || "").toUpperCase();

    if (["DELIVERED", "COMPLETED"].includes(currentStatus)) return 5;
    if (["PICKED_UP", "IN_TRANSIT"].includes(currentStatus)) return 4;
    if (currentStatus === "ASSIGNED") return 3;
    if (["APPROVED", "REQUESTED", "PENDING"].includes(currentStatus)) return 2;
    if (currentStatus === "AVAILABLE") return 1;

    return 0;
  };

  if (loading) {
    return (
      <div className="tracking-page">
        <h1>🚚 Track Donation</h1>
        <p>Loading your donation tracking details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tracking-page">
        <h1>🚚 Track Donation</h1>
        <p className="tracking-error">{error}</p>
      </div>
    );
  }

  return (
    <div className="tracking-page">
      <h1>🚚 Track Donation</h1>
      <p>Follow the progress of your restaurant's food donations.</p>

      {donations.length === 0 ? (
        <div className="tracking-empty">
          <h2>No donations available</h2>
          <p>Add a donation first to view its tracking information.</p>
        </div>
      ) : (
        <>
          <label htmlFor="donation-select">Choose a donation:</label>

          <select
            id="donation-select"
            value={selectedDonation?.id ?? ""}
            onChange={(event) => {
              const donation = donations.find(
                (item) => String(item.id) === event.target.value
              );
              setSelectedDonation(donation || null);
            }}
          >
            {donations.map((donation) => (
              <option key={donation.id} value={donation.id}>
                {donation.foodName || "Food donation"} — #{donation.id}
              </option>
            ))}
          </select>

          {selectedDonation && (
            <section className="tracking-card">
              <h2>{selectedDonation.foodName || "Food Donation"}</h2>

              <p>
                <strong>Donation ID:</strong> #{selectedDonation.id}
              </p>
              <p>
                <strong>Quantity:</strong> {selectedDonation.quantity}{" "}
                {selectedDonation.unit}
              </p>
              <p>
                <strong>Current status:</strong>{" "}
                {selectedDonation.status || "Unknown"}
              </p>

              <h3>Donation Status</h3>

              <div className="tracking-timeline">
                {statusSteps.map((step, index) => {
                  const progress = getProgress(selectedDonation.status);
                  const completed = index < progress;

                  return (
                    <div
                      className={`tracking-step ${
                        completed ? "completed" : ""
                      } ${index === progress - 1 ? "current" : ""}`}
                      key={step.label}
                    >
                      <span className="tracking-step-icon">
                        {completed ? "✓" : index + 1}
                      </span>

                      <div>
                        <strong>{step.label}</strong>
                        <p>
                          {completed
                            ? "Completed"
                            : index === progress - 1
                              ? "Current stage"
                              : "Waiting for update"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="tracking-note">
                Tracking stages are estimated from the donation's current
                status. Actual pickup and delivery details appear only when
                supported by backend updates.
              </p>
            </section>
          )}
        </>
      )}
    </div>
  );
}

export default TrackDonation;