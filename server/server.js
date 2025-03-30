const express = require("express")
const cors = require("cors")
const cookieParser = require("cookie-parser")
const mongoose = require("mongoose")
const errorHandler = require("./middleware/error")
const path = require("path")
const fs = require("fs") // Add this line

// Load env vars
require("dotenv").config({ path: path.join(__dirname, ".env") })

// Create Express app
const app = express()

// Middleware
app.use(express.json())

// CORS configuration
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

app.use(cookieParser())

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, 'uploads/profile-pictures');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Connect to MongoDB with debug logging
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log("MongoDB Connected");
  // List all collections to verify Review collection creation
  mongoose.connection.db.listCollections().toArray((err, collections) => {
    if (err) {
      console.error('Error listing collections:', err);
    } else {
      console.log('Available collections:', collections.map(c => c.name));
    }
  });
})
.catch((err) => console.log("MongoDB connection error:", err))

// Route files
const auth = require("./routes/auth")
const tutors = require("./routes/tutors")
const sessions = require("./routes/sessions")
const notifications = require("./routes/notifications") // Add this line
const wishlist = require("./routes/wishlist")
const reviews = require("./routes/reviews") // Add this line
const admin = require('./routes/admin'); // Add this line

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to the API",
    endpoints: {
      register: "POST /api/auth/register",
      login: "POST /api/auth/login",
      getMe: "GET /api/auth/me",
      logout: "GET /api/auth/logout",
      getTutors: "GET /api/tutors",
      getSessions: "GET /api/sessions",
      getNotifications: "GET /api/notifications",
      getWishlist: "GET /api/wishlist"
    }
  })
})

// Add error handling middleware before the routes
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Mount routers
app.use("/api/auth", auth)
app.use("/api/tutors", tutors)
app.use("/api/sessions", sessions)
app.use("/api/notifications", notifications) // Add this line
app.use("/api/wishlist", wishlist)
app.use("/api/reviews", reviews) // Add this line
app.use("/api/admin", admin) // Add this line

// Serve static assets in production
if (process.env.NODE_ENV === "production") {
  // Set static folder
  app.use(express.static(path.join(__dirname, "../client/build")))

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../client/build", "index.html"))
  })
} else {
  // In development, we'll let the React dev server handle the routes
  app.get("/", (req, res) => {
    res.send("API is running...")
  })
}

// Error handling middleware
app.use(errorHandler)

// Add error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

const PORT = process.env.PORT || 5000

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

// Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
  console.log(`Error: ${err.message}`)
  // Close server & exit process
  server.close(() => process.exit(1))
})

