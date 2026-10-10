import { Link } from "react-router-dom";

function Home() {

    const storedUser = localStorage.getItem("foodbridgeUser");

    let user = null;

    if (storedUser) {
        try {
            user = JSON.parse(storedUser);
        } catch {
            user = null;
        }
    }

    const getDashboardLink = () => {
        if (!user) {
            return "/login";
        }

        if (user.role === "RESTAURANT") {
            return "/restaurant/dashboard";
        }

        if (user.role === "NGO") {
            return "/ngo/dashboard";
        }

        if (user.role === "VOLUNTEER") {
            return "/volunteer/dashboard";
        }

        return "/login";
    };

    const getDashboardName = () => {
        if (!user) {
            return "Dashboard";
        }

        if (user.role === "RESTAURANT") {
            return "Restaurant Dashboard";
        }

        if (user.role === "NGO") {
            return "NGO Dashboard";
        }

        if (user.role === "VOLUNTEER") {
            return "Volunteer Dashboard";
        }

        return "Dashboard";
    };

    return (
        <div className="home-page">

            {/* =================================================
                HERO SECTION
            ================================================= */}

            <section className="home-hero">

                <div className="home-hero-content">

                    <div className="home-hero-text">

                        <p className="home-eyebrow">
                            FOOD • COMMUNITY • IMPACT
                        </p>

                        <h1>
                            Turning Surplus Food Into Hope
                        </h1>

                        <p>
                            FoodBridge connects restaurants, NGOs and
                            volunteers to make sure surplus food reaches
                            people who need it instead of going to waste.
                        </p>

                        {!user ? (
                            <div className="home-hero-buttons">

                                <Link
                                    to="/register/restaurant"
                                    className="home-primary-btn"
                                >
                                    Donate Food
                                </Link>

                                <Link
                                    to="/register/ngo"
                                    className="home-secondary-btn"
                                >
                                    Request Food
                                </Link>

                            </div>
                        ) : (
                            <div className="home-hero-buttons">

                                <Link
                                    to={getDashboardLink()}
                                    className="home-primary-btn"
                                >
                                    {getDashboardName()}
                                </Link>

                            </div>
                        )}

                    </div>


                    {/* HERO VISUAL */}

                    <div className="home-hero-visual">

                        <div className="hero-main-card">

                            <div className="hero-food-icon">
                                🍱
                            </div>

                            <p className="hero-card-label">
                                FOOD • COMMUNITY • IMPACT
                            </p>

                            <h3>
                                FOODBRIDGE
                            </h3>

                            <p>
                                Share Food.
                                <br />
                                Share Hope.
                            </p>

                        </div>


                        <div className="hero-small-card hero-small-one">

                            <strong>
                                ♻
                            </strong>

                            <span>
                                Less Food Waste
                            </span>

                        </div>


                        <div className="hero-small-card hero-small-two">

                            <strong>
                                ♥
                            </strong>

                            <span>
                                More Community Impact
                            </span>

                        </div>

                    </div>

                </div>

            </section>


            {/* =================================================
                ABOUT FOODBRIDGE
            ================================================= */}

            <section className="home-intro">

                <div className="home-section-container">

                    <div className="home-intro-heading">

                        <p className="home-section-label">
                            ABOUT FOODBRIDGE
                        </p>

                        <h2>
                            Bridging the gap between surplus and need
                        </h2>

                    </div>


                    <div className="home-intro-text">

                        <p>
                            FoodBridge is a smart food donation and
                            redistribution platform designed to connect
                            food donors with verified organizations.
                            Restaurants and other food providers can
                            donate safe surplus food, while NGOs can
                            request and receive it efficiently.
                        </p>

                    </div>

                </div>

            </section>


            {/* =================================================
                WHO CAN JOIN
                ONLY VISIBLE WHEN LOGGED OUT
            ================================================= */}

            {!user && (

                <section className="home-roles">

                    <div className="home-centered-heading">

                        <p className="home-section-label">
                            WHO CAN JOIN
                        </p>

                        <h2>
                            Everyone has a role to play
                        </h2>

                    </div>


                    <div className="role-grid">

                        {/* RESTAURANTS */}

                        <div className="home-role-card">

                            <span className="role-number">
                                01
                            </span>

                            <div className="role-icon">
                                🍽️
                            </div>

                            <h3>
                                Restaurants
                            </h3>

                            <p>
                                Donate safe surplus food and help
                                prevent perfectly usable meals from
                                being wasted.
                            </p>

                            <Link to="/register/restaurant">
                                Register as Restaurant
                                <span>→</span>
                            </Link>

                        </div>


                        {/* NGOs */}

                        <div className="home-role-card">

                            <span className="role-number">
                                02
                            </span>

                            <div className="role-icon">
                                🤝
                            </div>

                            <h3>
                                NGOs
                            </h3>

                            <p>
                                Request available food donations and
                                distribute them to people in need.
                            </p>

                            <Link to="/register/ngo">
                                Register as NGO
                                <span>→</span>
                            </Link>

                        </div>


                        {/* VOLUNTEERS */}

                        <div className="home-role-card">

                            <span className="role-number">
                                03
                            </span>

                            <div className="role-icon">
                                🚚
                            </div>

                            <h3>
                                Volunteers
                            </h3>

                            <p>
                                Help collect and deliver donated food
                                to its destination safely and
                                efficiently.
                            </p>

                            <Link to="/register/volunteer">
                                Register as Volunteer
                                <span>→</span>
                            </Link>

                        </div>

                    </div>

                </section>

            )}


            {/* =================================================
                HOW IT WORKS
            ================================================= */}

            <section className="home-process">

                <div className="process-heading">

                    <div>

                        <p className="home-section-label">
                            HOW IT WORKS
                        </p>

                        <h2>
                            From surplus food to someone in need
                        </h2>

                    </div>

                    <p>
                        FoodBridge brings donors, NGOs and volunteers
                        together through a simple and transparent
                        food redistribution process.
                    </p>

                </div>


                <div className="process-grid">

                    {/* STEP 1 */}

                    <div className="process-card">

                        <div className="process-top">

                            <span>
                                01
                            </span>

                            <div>
                                🍱
                            </div>

                        </div>

                        <h3>
                            Donate
                        </h3>

                        <p>
                            Restaurants list their safe surplus food
                            through the FoodBridge platform.
                        </p>

                    </div>


                    {/* STEP 2 */}

                    <div className="process-card">

                        <div className="process-top">

                            <span>
                                02
                            </span>

                            <div>
                                🔗
                            </div>

                        </div>

                        <h3>
                            Connect
                        </h3>

                        <p>
                            NGOs can view available donations and
                            request the food they need.
                        </p>

                    </div>


                    {/* STEP 3 */}

                    <div className="process-card">

                        <div className="process-top">

                            <span>
                                03
                            </span>

                            <div>
                                📦
                            </div>

                        </div>

                        <h3>
                            Collect
                        </h3>

                        <p>
                            Volunteers coordinate the collection
                            of accepted food donations.
                        </p>

                    </div>


                    {/* STEP 4 */}

                    <div className="process-card">

                        <div className="process-top">

                            <span>
                                04
                            </span>

                            <div>
                                🚚
                            </div>

                        </div>

                        <h3>
                            Deliver
                        </h3>

                        <p>
                            Food is delivered to the intended
                            organization or beneficiaries.
                        </p>

                    </div>

                </div>

            </section>


            {/* =================================================
                PURPOSE
            ================================================= */}

            <section className="home-purpose">

                <div className="purpose-container">

                    <div className="purpose-text">

                        <p className="home-section-label">
                            OUR PURPOSE
                        </p>

                        <h2>
                            Small actions can create a bigger impact.
                        </h2>

                        <p>
                            FoodBridge makes it easier for communities
                            to work together, reduce food waste and
                            support people who need food.
                        </p>

                    </div>


                    <div className="purpose-list">

                        <div>

                            <strong>
                                01
                            </strong>

                            <span>
                                Reduce avoidable food waste
                            </span>

                        </div>


                        <div>

                            <strong>
                                02
                            </strong>

                            <span>
                                Connect food donors with NGOs
                            </span>

                        </div>


                        <div>

                            <strong>
                                03
                            </strong>

                            <span>
                                Coordinate safe food delivery
                            </span>

                        </div>


                        <div>

                            <strong>
                                04
                            </strong>

                            <span>
                                Create measurable community impact
                            </span>

                        </div>

                    </div>

                </div>

            </section>


            {/* =================================================
                FINAL CTA
                ONLY VISIBLE WHEN LOGGED OUT
            ================================================= */}

            {!user && (

                <section className="home-final-cta">

                    <div>

                        <p className="home-section-label">
                            MAKE A DIFFERENCE
                        </p>

                        <h2>
                            Have surplus food?
                        </h2>

                        <p>
                            Turn extra food into meaningful support
                            for someone in need.
                        </p>

                    </div>


                    <Link
                        to="/register/restaurant"
                        className="home-cta-button"
                    >
                        Start Donating
                        <span>
                            →
                        </span>
                    </Link>

                </section>

            )}

        </div>
    );
}

export default Home;