import { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("campusfixUser")) || null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState("overview");
  const [issues, setIssues] = useState([]);
  const [items, setItems] = useState([]);

  const [issueForm, setIssueForm] = useState({
    title: "",
    category: "Electricity",
    location: "",
    description: "",
    priority: "Medium",
  });

  const [itemForm, setItemForm] = useState({
    title: "",
    type: "Lost",
    category: "Electronics",
    location: "",
    description: "",
  });
  // Load campus issues from MongoDB
  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const response = await fetch("http://localhost:5001/api/issues");

        if (!response.ok) {
          throw new Error("Failed to load campus issues.");
        }

        const data = await response.json();

        const formattedIssues = data.map((issue) => ({
          id: issue._id,
          title: issue.title,
          category: issue.category,
          location: issue.location,
          description: issue.description,
          priority: issue.priority,
          status: issue.status,
          author: issue.reportedBy?.name || "Student",
          date: issue.createdAt
            ? new Date(issue.createdAt).toLocaleDateString()
            : "",
        }));

        setIssues(formattedIssues);
      } catch (error) {
        console.error("Error loading campus issues:", error);
      }
    };

    fetchIssues();
  }, []);

    // Load Lost & Found posts from MongoDB
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await fetch("http://localhost:5001/api/items");

        if (!response.ok) {
          throw new Error("Failed to load Lost & Found posts.");
        }

        const data = await response.json();

        const formattedItems = data.map((item) => ({
          id: item._id,
          title: item.title,
          type: item.type,
          category: item.category,
          location: item.location,
          description: item.description,
          author: item.reportedBy?.name || "Student",
          date: item.createdAt
            ? new Date(item.createdAt).toLocaleDateString()
            : "",
        }));

        setItems(formattedItems);
      } catch (error) {
        console.error("Error loading Lost & Found posts:", error);
      }
    };

    fetchItems();
  }, []);
  // REGISTER AND LOGIN
  const handleAuth = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    const endpoint = showLogin ? "login" : "register";

    try {
      const response = await fetch(
        `http://localhost:5001/api/auth/${endpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            showLogin
              ? { email, password }
              : { name, email, password }
          ),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong.");
      }

      // Save the logged-in student.
      localStorage.setItem(
        "campusfixUser",
        JSON.stringify(data.user)
      );

      // Save the JWT if the backend provides one.
      if (data.token) {
        localStorage.setItem("campusfixToken", data.token);
      }

      setCurrentUser(data.user);
      setActiveTab("overview");

      setName("");
      setEmail("");
      setPassword("");
      setMessage("");

      setShowLogin(false);
      setShowSignup(false);

      alert(
        showLogin
          ? "Welcome back, " + data.user.name + "!"
          : "Account created successfully! Welcome, " +
              data.user.name +
              "!"
      );
    } catch (error) {
      setMessage(
        error.message || "Could not connect to the server."
      );
    } finally {
      setLoading(false);
    }
  };

  // LOGOUT
  const handleLogout = () => {
    localStorage.removeItem("campusfixUser");
    localStorage.removeItem("campusfixToken");

    setCurrentUser(null);
    setActiveTab("overview");
    setMessage("");

    setShowLogin(false);
    setShowSignup(false);

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

   // CREATE A CAMPUS ISSUE
  const handleIssueSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("campusfixToken");

    if (!token) {
      alert("Please log in again to report an issue.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5001/api/issues", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(issueForm),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to report the issue.");
      }

      const savedIssue = data.issue;

      const formattedIssue = {
        id: savedIssue._id,
        title: savedIssue.title,
        category: savedIssue.category,
        location: savedIssue.location,
        description: savedIssue.description,
        priority: savedIssue.priority,
        status: savedIssue.status,
        author: currentUser?.name || "Student",
        date: savedIssue.createdAt
          ? new Date(savedIssue.createdAt).toLocaleDateString()
          : new Date().toLocaleDateString(),
      };

      setIssues((previous) => [formattedIssue, ...previous]);

      setIssueForm({
        title: "",
        category: "Electricity",
        location: "",
        description: "",
        priority: "Medium",
      });

      alert("Your issue has been saved successfully!");
      setActiveTab("issues");
    } catch (error) {
      console.error("Error submitting issue:", error);
      alert(error.message || "Could not save the issue. Please try again.");
    }
  };

  // CREATE A LOST & FOUND POST
    // CREATE A LOST & FOUND POST
  const handleItemSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("campusfixToken");

    if (!token) {
      alert("Please log in again to create a Lost & Found post.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5001/api/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(itemForm),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to create Lost & Found post."
        );
      }

      const savedItem = data.item;

      const newItem = {
        id: savedItem._id,
        title: savedItem.title,
        type: savedItem.type,
        category: savedItem.category,
        location: savedItem.location,
        description: savedItem.description,
        author: currentUser?.name || "Student",
        date: savedItem.createdAt
          ? new Date(savedItem.createdAt).toLocaleDateString()
          : new Date().toLocaleDateString(),
      };

      setItems((previous) => [newItem, ...previous]);

      setItemForm({
        title: "",
        type: "Lost",
        category: "Electronics",
        location: "",
        description: "",
      });

      alert("Your Lost & Found post has been saved successfully!");
      setActiveTab("lostfound");
    } catch (error) {
      console.error("Error creating Lost & Found post:", error);
      alert(error.message || "Could not save your post. Please try again.");
    }
  };

  // REUSABLE AUTH POPUP
  const openSignup = () => {
    setMessage("");
    setShowLogin(false);
    setShowSignup(true);
  };

  const openLogin = () => {
    setMessage("");
    setShowSignup(false);
    setShowLogin(true);
  };

  // ============================
  // STUDENT DASHBOARD
  // ============================
  if (currentUser) {
    return (
      <div className="app">
        <nav className="navbar">
          <a
            className="logo"
            href="#dashboard"
            onClick={() => setActiveTab("overview")}
          >
            <span className="logo-icon">✦</span> CampusFix
          </a>

          <div className="nav-links">
            <button
              className="login-btn"
              onClick={() => setActiveTab("overview")}
            >
              Dashboard
            </button>

            <button
              className="login-btn"
              onClick={() => setActiveTab("issues")}
            >
              Campus Issues
            </button>

            <button
              className="login-btn"
              onClick={() => setActiveTab("lostfound")}
            >
              Lost & Found
            </button>
          </div>

          <div className="nav-buttons">
            <span
              style={{
                fontWeight: 700,
                color: "#5145cd",
                marginRight: "12px",
              }}
            >
              Hi, {currentUser.name.split(" ")[0]}! 👋
            </span>

            <button
              className="signup-btn"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </nav>

        <main
          id="dashboard"
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "45px 24px",
            minHeight: "75vh",
          }}
        >
          {activeTab === "overview" && (
            <>
              <div
                style={{
                  background:
                    "linear-gradient(120deg, #5145cd, #8175f5)",
                  color: "white",
                  padding: "42px",
                  borderRadius: "24px",
                  marginBottom: "32px",
                }}
              >
                <p
                  style={{
                    textTransform: "uppercase",
                    letterSpacing: "2px",
                    fontSize: "12px",
                  }}
                >
                  YOUR STUDENT DASHBOARD
                </p>

                <h1
                  style={{
                    fontSize: "clamp(30px, 5vw, 46px)",
                    marginBottom: "12px",
                  }}
                >
                  Hi, {currentUser.name}! 👋
                </h1>

                <p style={{ marginBottom: "24px" }}>
                  Welcome to CampusFix. Let's make your campus
                  better, together.
                </p>

                <button
                  className="primary-btn"
                  style={{
                    background: "white",
                    color: "#5145cd",
                  }}
                  onClick={() => setActiveTab("newissue")}
                >
                  + Report an Issue
                </button>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(210px, 1fr))",
                  gap: "20px",
                  marginBottom: "36px",
                }}
              >
                {[
                  {
                    title: "Campus Issues",
                    value: issues.length,
                    icon: "⚡",
                    color: "#eeefff",
                    tab: "issues",
                  },
                  {
                    title: "Pending Issues",
                    value: issues.filter(
                      (issue) => issue.status === "Pending"
                    ).length,
                    icon: "⏳",
                    color: "#fff4df",
                    tab: "issues",
                  },
                  {
                    title: "Lost & Found Posts",
                    value: items.length,
                    icon: "🔎",
                    color: "#e6f8ef",
                    tab: "lostfound",
                  },
                ].map((card) => (
                  <button
                    key={card.title}
                    onClick={() => setActiveTab(card.tab)}
                    style={{
                      textAlign: "left",
                      background: "white",
                      border: "1px solid #e9e9f3",
                      borderRadius: "18px",
                      padding: "25px",
                      cursor: "pointer",
                      boxShadow: "0 5px 22px #20243a08",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        background: card.color,
                        padding: "12px",
                        borderRadius: "12px",
                        fontSize: "23px",
                      }}
                    >
                      {card.icon}
                    </span>

                    <h2
                      style={{
                        fontSize: "32px",
                        margin: "18px 0 5px",
                      }}
                    >
                      {card.value}
                    </h2>

                    <p style={{ marginBottom: 0 }}>
                      {card.title}
                    </p>
                  </button>
                ))}
              </div>

              <h2>Quick Actions</h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: "20px",
                  marginTop: "20px",
                }}
              >
                <button
                  onClick={() => setActiveTab("newissue")}
                  style={actionCardStyle}
                >
                  <span style={{ fontSize: "30px" }}>⚡</span>
                  <h3>Report a Campus Issue</h3>
                  <p>
                    Report electricity, Wi-Fi, water or
                    infrastructure problems.
                  </p>
                </button>

                <button
                  onClick={() => setActiveTab("newitem")}
                  style={actionCardStyle}
                >
                  <span style={{ fontSize: "30px" }}>🎒</span>
                  <h3>Lost & Found</h3>
                  <p>
                    Post an item you lost or something you found.
                  </p>
                </button>

                <button
                  onClick={() => setActiveTab("myactivity")}
                  style={actionCardStyle}
                >
                  <span style={{ fontSize: "30px" }}>📋</span>
                  <h3>My Activity</h3>
                  <p>
                    Review the issues and items you posted
                    during this session.
                  </p>
                </button>
              </div>
            </>
          )}

          {activeTab === "newissue" && (
            <section>
              <button
                className="login-btn"
                onClick={() => setActiveTab("overview")}
              >
                ← Dashboard
              </button>

              <h1 style={{ marginTop: "24px" }}>
                Report a Campus Issue
              </h1>

              <p>
                Tell us what needs attention on your campus.
              </p>

              <form
                onSubmit={handleIssueSubmit}
                style={formCardStyle}
              >
                <label style={labelStyle}>
                  Issue title
                  <input
                    style={inputStyle}
                    value={issueForm.title}
                    onChange={(e) =>
                      setIssueForm({
                        ...issueForm,
                        title: e.target.value,
                      })
                    }
                    placeholder="e.g. Wi-Fi not working"
                    required
                  />
                </label>

                <label style={labelStyle}>
                  Category
                  <select
                    style={inputStyle}
                    value={issueForm.category}
                    onChange={(e) =>
                      setIssueForm({
                        ...issueForm,
                        category: e.target.value,
                      })
                    }
                  >
                    <option>Electricity</option>
                    <option>Wi-Fi / Internet</option>
                    <option>Water</option>
                    <option>Cleanliness</option>
                    <option>Classroom</option>
                    <option>Infrastructure</option>
                    <option>Other</option>
                  </select>
                </label>

                <label style={labelStyle}>
                  Campus location
                  <input
                    style={inputStyle}
                    value={issueForm.location}
                    onChange={(e) =>
                      setIssueForm({
                        ...issueForm,
                        location: e.target.value,
                      })
                    }
                    placeholder="e.g. Library, Block A"
                    required
                  />
                </label>

                <label style={labelStyle}>
                  Priority
                  <select
                    style={inputStyle}
                    value={issueForm.priority}
                    onChange={(e) =>
                      setIssueForm({
                        ...issueForm,
                        priority: e.target.value,
                      })
                    }
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </label>

                <label style={labelStyle}>
                  Description
                  <textarea
                    style={{
                      ...inputStyle,
                      minHeight: "120px",
                    }}
                    value={issueForm.description}
                    onChange={(e) =>
                      setIssueForm({
                        ...issueForm,
                        description: e.target.value,
                      })
                    }
                    placeholder="Describe the problem..."
                    required
                  />
                </label>

                <button
                  className="signup-btn"
                  type="submit"
                >
                  Submit Issue
                </button>
              </form>
            </section>
          )}

          {activeTab === "issues" && (
            <section>
              <h1>Campus Issues</h1>
              <p>
                View the issues created in your current session.
              </p>

              <button
                className="signup-btn"
                onClick={() => setActiveTab("newissue")}
                style={{ marginBottom: "24px" }}
              >
                + Report an Issue
              </button>

              {issues.length === 0 ? (
                <EmptyState
                  icon="⚡"
                  title="No issues yet"
                  text="Report a campus problem to get started."
                />
              ) : (
                <div style={listStyle}>
                  {issues.map((issue) => (
                    <article key={issue.id} style={itemCardStyle}>
                      <span style={badgeStyle}>
                        {issue.status}
                      </span>
                      <h3>{issue.title}</h3>
                      <p>{issue.description}</p>
                      <p>
                        📍 {issue.location} · {issue.category}
                      </p>
                      <small>
                        Priority: {issue.priority} · {issue.date}
                      </small>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}

          {activeTab === "newitem" && (
            <section>
              <button
                className="login-btn"
                onClick={() => setActiveTab("overview")}
              >
                ← Dashboard
              </button>

              <h1 style={{ marginTop: "24px" }}>
                Lost & Found
              </h1>

              <p>
                Help reunite lost belongings with their owners.
              </p>

              <form
                onSubmit={handleItemSubmit}
                style={formCardStyle}
              >
                <label style={labelStyle}>
                  Post type
                  <select
                    style={inputStyle}
                    value={itemForm.type}
                    onChange={(e) =>
                      setItemForm({
                        ...itemForm,
                        type: e.target.value,
                      })
                    }
                  >
                    <option>Lost</option>
                    <option>Found</option>
                  </select>
                </label>

                <label style={labelStyle}>
                  Item name
                  <input
                    style={inputStyle}
                    value={itemForm.title}
                    onChange={(e) =>
                      setItemForm({
                        ...itemForm,
                        title: e.target.value,
                      })
                    }
                    placeholder="e.g. Blue water bottle"
                    required
                  />
                </label>

                <label style={labelStyle}>
                  Category
                  <select
                    style={inputStyle}
                    value={itemForm.category}
                    onChange={(e) =>
                      setItemForm({
                        ...itemForm,
                        category: e.target.value,
                      })
                    }
                  >
                    <option>Electronics</option>
                    <option>Books & Stationery</option>
                    <option>Bags</option>
                    <option>Clothing</option>
                    <option>Accessories</option>
                    <option>Other</option>
                  </select>
                </label>

                <label style={labelStyle}>
                  Last seen / found location
                  <input
                    style={inputStyle}
                    value={itemForm.location}
                    onChange={(e) =>
                      setItemForm({
                        ...itemForm,
                        location: e.target.value,
                      })
                    }
                    placeholder="e.g. Canteen"
                    required
                  />
                </label>

                <label style={labelStyle}>
                  Description
                  <textarea
                    style={{
                      ...inputStyle,
                      minHeight: "120px",
                    }}
                    value={itemForm.description}
                    onChange={(e) =>
                      setItemForm({
                        ...itemForm,
                        description: e.target.value,
                      })
                    }
                    placeholder="Describe the item..."
                    required
                  />
                </label>

                <button
                  className="signup-btn"
                  type="submit"
                >
                  Publish Post
                </button>
              </form>
            </section>
          )}

          {activeTab === "lostfound" && (
            <section>
              <h1>Lost & Found</h1>
              <p>
                Browse lost and found items posted during this
                session.
              </p>

              <button
                className="signup-btn"
                onClick={() => setActiveTab("newitem")}
                style={{ marginBottom: "24px" }}
              >
                + Create a Post
              </button>

              {items.length === 0 ? (
                <EmptyState
                  icon="🔎"
                  title="No items posted yet"
                  text="Create a Lost & Found post to get started."
                />
              ) : (
                <div style={listStyle}>
                  {items.map((item) => (
                    <article key={item.id} style={itemCardStyle}>
                      <span style={badgeStyle}>
                        {item.type}
                      </span>
                      <h3>{item.title}</h3>
                      <p>{item.description}</p>
                      <p>
                        📍 {item.location} · {item.category}
                      </p>
                      <small>
                        Posted by {item.author} · {item.date}
                      </small>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}

          {activeTab === "myactivity" && (
            <section>
              <h1>My Activity</h1>
              <p>
                Your activity in the current session.
              </p>

              <h2 style={{ marginTop: "30px" }}>
                My Campus Issues ({issues.length})
              </h2>

              {issues.length === 0 ? (
                <p>You haven't submitted any issues yet.</p>
              ) : (
                issues.map((issue) => (
                  <article
                    key={issue.id}
                    style={itemCardStyle}
                  >
                    <h3>{issue.title}</h3>
                    <p>
                      {issue.category} · {issue.status}
                    </p>
                  </article>
                ))
              )}

              <h2 style={{ marginTop: "30px" }}>
                My Lost & Found Posts ({items.length})
              </h2>

              {items.filter(
                (item) => item.author === currentUser.name
              ).length === 0 ? (
                <p>You haven't created any item posts yet.</p>
              ) : (
                items
                  .filter(
                    (item) => item.author === currentUser.name
                  )
                  .map((item) => (
                    <article
                      key={item.id}
                      style={itemCardStyle}
                    >
                      <h3>{item.title}</h3>
                      <p>
                        {item.type} · {item.location}
                      </p>
                    </article>
                  ))
              )}
            </section>
          )}
        </main>

        <footer>
          <a className="logo" href="#dashboard">
            ✦ CampusFix
          </a>
          <p>Making campus life better, one fix at a time.</p>
          <span>
            © 2026 CampusFix · Built for campus communities.
          </span>
        </footer>
      </div>
    );
  }

  // ============================
  // PUBLIC LANDING PAGE
  // ============================
  return (
    <div className="app">
      <nav className="navbar">
        <a className="logo" href="#">
          <span className="logo-icon">✦</span> CampusFix
        </a>

        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How It Works</a>
          <a href="#about">About</a>
        </div>

        <div className="nav-buttons">
          <button
            className="login-btn"
            onClick={openLogin}
          >
            Log In
          </button>

          <button
            className="signup-btn"
            onClick={openSignup}
          >
            Get Started ↗
          </button>
        </div>
      </nav>

      <main>
        <section className="hero" id="about">
          <div className="hero-content">
            <div className="badge">
              <span className="live-dot"></span>
              YOUR CAMPUS, BETTER
            </div>

            <h1>
              A better campus
              <br />
              starts <span>with you.</span>
            </h1>

            <p>
              One platform to report campus issues, reunite lost
              belongings, and make student life a little easier.
              Let's fix things together.
            </p>

            <div className="hero-actions">
              <button
                className="primary-btn"
                onClick={openSignup}
              >
                Join CampusFix <span>↗</span>
              </button>

              <a className="secondary-btn" href="#features">
                Explore Features ↓
              </a>
            </div>

            <div className="hero-note">
              <span className="avatar-stack">● ● ●</span>
              <span>
                Built for students. Powered by community.
              </span>
            </div>
          </div>

          <div className="hero-visual">
            <div className="orbit orbit-one"></div>
            <div className="orbit orbit-two"></div>

            <div className="visual-card">
              <div className="visual-top">
                <span>✦ CAMPUSFIX</span>
                <span className="status-pill">● LIVE</span>
              </div>

              <div className="visual-icon">🏫</div>
              <h3>Make campus better.</h3>
              <p>Small reports. Big improvements.</p>

              <div className="mini-report">
                <div className="report-icon">📶</div>
                <div>
                  <strong>Wi-Fi connectivity</strong>
                  <small>Library · Reported today</small>
                </div>
                <span className="report-status">Open</span>
              </div>

              <div className="mini-report">
                <div className="report-icon">🎒</div>
                <div>
                  <strong>Lost backpack</strong>
                  <small>Academic Block · Lost & Found</small>
                </div>
                <span className="found-status">Found?</span>
              </div>

              <div className="visual-footer">
                <span>COMMUNITY FIRST</span>
                <span>✦ 01 / 03</span>
              </div>
            </div>

            <div className="floating-star">✳</div>
            <div className="floating-check">✓</div>
          </div>
        </section>

        <section className="stats">
          <div>
            <strong>01</strong>
            <span>Report a problem</span>
          </div>
          <div>
            <strong>02</strong>
            <span>Connect with students</span>
          </div>
          <div>
            <strong>03</strong>
            <span>Make a difference</span>
          </div>
        </section>

        <section className="features-section" id="features">
          <div className="section-heading">
            <span className="eyebrow">
              ONE PLATFORM. REAL IMPACT.
            </span>
            <h2>
              Campus life, <span>simplified.</span>
            </h2>
            <p>
              Everything you need to help make your campus a
              better place.
            </p>
          </div>

          <div className="feature-grid">
            <article className="feature-card issue-card">
              <div className="feature-icon">⚡</div>
              <span className="card-number">01 / REPORT</span>
              <h3>Fix what's broken.</h3>
              <p>
                Report Wi-Fi outages, water problems, classroom
                issues, and more. Help your campus team understand
                what needs attention.
              </p>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  openSignup();
                }}
              >
                Report an issue ↗
              </a>
            </article>

            <article className="feature-card lost-card">
              <div className="feature-icon">🔎</div>
              <span className="card-number">02 / REUNITE</span>
              <h3>Lost something?</h3>
              <p>
                Post lost or found belongings, browse listings,
                and help return important items to their rightful
                owners.
              </p>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  openSignup();
                }}
              >
                Explore Lost & Found ↗
              </a>
            </article>

            <article className="feature-card community-card">
              <div className="feature-icon">🤝</div>
              <span className="card-number">03 / CONNECT</span>
              <h3>Better, together.</h3>
              <p>
                Support reported issues, follow progress, and
                become part of a community that cares about its
                shared spaces.
              </p>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  openSignup();
                }}
              >
                Join the community ↗
              </a>
            </article>
          </div>
        </section>

        <section className="how-section" id="how-it-works">
          <span className="eyebrow">SIMPLE BY DESIGN</span>
          <h2>
            Three steps. <span>Real change.</span>
          </h2>

          <div className="steps-grid">
            <div>
              <span>01</span>
              <h3>Create an account</h3>
              <p>
                Join CampusFix to access your student dashboard.
              </p>
            </div>

            <div>
              <span>02</span>
              <h3>Share what matters</h3>
              <p>
                Report a problem or post a lost or found item.
              </p>
            </div>

            <div>
              <span>03</span>
              <h3>Track the progress</h3>
              <p>
                Stay updated and help your campus community.
              </p>
            </div>
          </div>
        </section>

        <section className="cta-section">
          <div>
            <span className="eyebrow">
              YOUR CAMPUS NEEDS YOU
            </span>
            <h2>
              Let's make things <span>better.</span>
            </h2>
            <p>
              One community. One campus. A thousand ways to help.
            </p>
          </div>

          <button
            className="primary-btn"
            onClick={openSignup}
          >
            Get Started ↗
          </button>
        </section>
      </main>

      <footer>
        <a className="logo" href="#">
          ✦ CampusFix
        </a>
        <p>Making campus life better, one fix at a time.</p>
        <span>
          © 2026 CampusFix · Built for campus communities.
        </span>
      </footer>

      {(showLogin || showSignup) && (
        <div
          className="modal-backdrop"
          onClick={() => {
            setShowLogin(false);
            setShowSignup(false);
            setMessage("");
          }}
        >
          <div
            className="auth-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close-modal"
              onClick={() => {
                setShowLogin(false);
                setShowSignup(false);
                setMessage("");
              }}
            >
              ×
            </button>

            <div className="modal-logo">✦</div>

            <span className="eyebrow">
              WELCOME TO CAMPUSFIX
            </span>

            <h2>
              {showLogin
                ? "Welcome back."
                : "Join your campus."}
            </h2>

            <p>
              {showLogin
                ? "Log in to access your personalized campus space."
                : "Create your account and help make campus life better."}
            </p>

            <form onSubmit={handleAuth}>
              {!showLogin && (
                <label>
                  Full name
                  <input
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </label>
              )}

              <label>
                Email address
                <input
                  type="email"
                  placeholder="you@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>

              <label>
                Password
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </label>

              {message && (
                <p
                  role="alert"
                  style={{ color: "#c0392b" }}
                >
                  {message}
                </p>
              )}

              <button
                type="submit"
                className="primary-btn form-submit"
                disabled={loading}
              >
                {loading
                  ? "Please wait..."
                  : showLogin
                    ? "Log In →"
                    : "Create Account →"}
              </button>
            </form>

            <p className="switch-auth">
              {showLogin
                ? "New to CampusFix?"
                : "Already have an account?"}

              <button
                onClick={() => {
                  setMessage("");
                  setShowLogin(!showLogin);
                  setShowSignup(!showSignup);
                }}
              >
                {showLogin ? " Sign up" : " Log in"}
              </button>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// SHARED DASHBOARD STYLES
const actionCardStyle = {
  textAlign: "left",
  background: "white",
  border: "1px solid #e9e9f3",
  borderRadius: "18px",
  padding: "25px",
  cursor: "pointer",
  color: "#20243a",
  boxShadow: "0 5px 22px #20243a08",
};

const formCardStyle = {
  background: "white",
  border: "1px solid #e9e9f3",
  borderRadius: "18px",
  padding: "28px",
  maxWidth: "700px",
  display: "grid",
  gap: "20px",
  marginTop: "24px",
  boxShadow: "0 5px 22px #20243a08",
};

const labelStyle = {
  display: "grid",
  gap: "8px",
  fontWeight: 600,
};

const inputStyle = {
  width: "100%",
  padding: "13px",
  border: "1px solid #dfe1eb",
  borderRadius: "9px",
  background: "white",
  color: "#20243a",
};

const listStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: "20px",
};

const itemCardStyle = {
  background: "white",
  padding: "24px",
  border: "1px solid #e9e9f3",
  borderRadius: "16px",
  marginBottom: "12px",
  overflowWrap: "anywhere",
};

const badgeStyle = {
  display: "inline-block",
  padding: "6px 12px",
  borderRadius: "20px",
  background: "#eeefff",
  color: "#5145cd",
  fontSize: "12px",
  fontWeight: 700,
};

function EmptyState({ icon, title, text }) {
  return (
    <div
      style={{
        textAlign: "center",
        background: "white",
        padding: "45px 20px",
        border: "1px solid #e9e9f3",
        borderRadius: "18px",
        marginTop: "20px",
      }}
    >
      <div style={{ fontSize: "40px" }}>{icon}</div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

export default App;