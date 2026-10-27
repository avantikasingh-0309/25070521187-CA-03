const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const User = require("./User");
const Issue = require("./Issue");
const Item = require("./Item");
// Verify the logged-in student's JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Please log in to continue.",
    });
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(
    token,
    process.env.JWT_SECRET || "campusfix-local-development-secret",
    (error, decoded) => {
      if (error) {
        return res.status(401).json({
          message: "Session expired. Please log in again.",
        });
      }

      req.userId = decoded.userId;
      next();
    }
  );
};
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to CampusFix API!",
    status: "Server is running successfully",
  });
});

// Register a new user
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Please fill in all fields.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });

    res.status(201).json({
      message: "Account created successfully!",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Registration error:", error.message);
    res.status(500).json({
      message: "Registration failed. Please try again.",
    });
  }
});

// Log in an existing user
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Please enter your email and password.",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || "campusfix-local-development-secret",
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful!",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({
      message: "Login failed. Please try again.",
    });
  }
});

// Get all campus issues
// Create a new campus issue
app.post("/api/issues", authenticateToken, async (req, res) => {
  try {
    const {
      title,
      category,
      location,
      description,
      priority,
    } = req.body;

    if (
      !title?.trim() ||
      !category?.trim() ||
      !location?.trim() ||
      !description?.trim()
    ) {
      return res.status(400).json({
        message: "Please fill in all required fields.",
      });
    }

    if (
      priority &&
      !["Low", "Medium", "High"].includes(priority)
    ) {
      return res.status(400).json({
        message: "Invalid issue priority.",
      });
    }

    const student = await User.findById(req.userId);

    if (!student) {
      return res.status(404).json({
        message: "Student account not found.",
      });
    }

    const issue = await Issue.create({
      title: title.trim(),
      category: category.trim(),
      location: location.trim(),
      description: description.trim(),
      priority: priority || "Medium",
      reportedBy: student._id,
    });

    res.status(201).json({
      message: "Campus issue saved successfully!",
      issue,
    });
  } catch (error) {
    console.error("Create issue error:", error.message);

    res.status(500).json({
      message: "Failed to save campus issue.",
    });
  }
});
// Get all campus issues
app.get("/api/issues", async (req, res) => {
  try {
    const issues = await Issue.find()
      .populate("reportedBy", "name email")
      .sort({ createdAt: -1 });

    res.json(issues);
  } catch (error) {
    console.error("Fetch issues error:", error.message);

    res.status(500).json({
      message: "Failed to fetch campus issues.",
    });
  }
});
// Get issues reported by a particular student
app.get("/api/issues/student/:studentId", async (req, res) => {
  try {
    const { studentId } = req.params;

    if (!mongoose.isValidObjectId(studentId)) {
      return res.status(400).json({
        message: "Invalid student ID.",
      });
    }

    const issues = await Issue.find({
      reportedBy: studentId,
    }).sort({ createdAt: -1 });

    res.json(issues);
  } catch (error) {
    console.error("Fetch student issues error:", error.message);

    res.status(500).json({
      message: "Failed to fetch your issues.",
    });
  }
});

// Create a Lost & Found post
app.post("/api/items", authenticateToken, async (req, res) => {
  try {
    const { title, type, category, location, description } = req.body;

    if (
      !title?.trim() ||
      !["Lost", "Found"].includes(type) ||
      !category?.trim() ||
      !location?.trim() ||
      !description?.trim()
    ) {
      return res.status(400).json({
        message: "Please fill in all required fields correctly.",
      });
    }

    const student = await User.findById(req.userId);

    if (!student) {
      return res.status(404).json({
        message: "Student account not found.",
      });
    }

    const item = await Item.create({
      title: title.trim(),
      type,
      category: category.trim(),
      location: location.trim(),
      description: description.trim(),
      reportedBy: student._id,
    });

    res.status(201).json({
      message: "Lost & Found post saved successfully!",
      item,
    });
  } catch (error) {
    console.error("Create Lost & Found post error:", error.message);
    res.status(500).json({
      message: "Failed to save Lost & Found post.",
    });
  }
});

// Get all Lost & Found posts
app.get("/api/items", async (req, res) => {
  try {
    const items = await Item.find()
      .populate("reportedBy", "name email")
      .sort({ createdAt: -1 });

    res.json(items);
  } catch (error) {
    console.error("Fetch Lost & Found posts error:", error.message);
    res.status(500).json({
      message: "Failed to fetch Lost & Found posts.",
    });
  }
});
mongoose
  .connect(
    process.env.MONGO_URI || "mongodb://127.0.0.1:27017/CampusFix"
  )
  .then(() => {
    console.log("MongoDB connected successfully!");

    const PORT = 5001;

    app.listen(PORT, () => {
      console.log(`CampusFix server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
  });