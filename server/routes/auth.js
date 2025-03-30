const express = require("express")
const { protect, authorize } = require("../middleware/auth")
const { register, login, getMe, logout } = require("../controllers/auth")
const jwt = require("jsonwebtoken")
const User = require("../models/User")
const Tutor = require("../models/Tutor")
const Admin = require("../models/Admin")
const Notification = require("../models/Notification")
const asyncHandler = require("../middleware/async")
const sendTokenResponse = require("../utils/sendTokenResponse")
const mongoose = require("mongoose")

const router = express.Router()

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post("/register", async (req, res) => {
  try {
    console.log("Received registration data:", req.body);
    const { name, email, password, role, ...otherData } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered"
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role
    });

    if (role === "tutor") {
      try {
        // Clean qualifications data
        const cleanedQualifications = otherData.qualifications.map(qual => ({
          ...qual,
          document: qual.document && typeof qual.document === 'object' ? null : qual.document
        }));

        // Create tutor profile
        await Tutor.create({
          user: user._id,
          ...otherData,
          qualifications: cleanedQualifications,
          verificationStatus: "pending"
        });
      } catch (tutorError) {
        // If tutor creation fails, delete the created user and throw error
        await User.findByIdAndDelete(user._id);
        throw tutorError;
      }
    }

    const token = user.getSignedJwtToken();
    res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error("Registration error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Registration failed"
    });
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide an email and password"
      });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    // Use the utility function instead of manual token creation
    sendTokenResponse(user, 200, res);
    
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Admin login endpoint
router.post("/admin/login", asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email, role: "admin" }).select("+password");
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({
      success: false,
      message: "Invalid admin credentials"
    });
  }

  // Get admin details
  const admin = await Admin.findOne({ user: user._id });
  if (!admin) {
    return res.status(401).json({
      success: false,
      message: "Admin profile not found"
    });
  }

  // Update last login
  admin.lastLogin = new Date();
  await admin.save();

  // Create and send token
  sendTokenResponse(user, 200, res);
}));

// @desc    Register admin (protected route)
// @route   POST /api/auth/admin/register
// @access  Private/Admin
router.post("/admin/register", protect, authorize("admin"), asyncHandler(async (req, res) => {
  const { name, email, password, permissions } = req.body;

  // Create user with admin role
  const user = await User.create({
    name,
    email,
    password,
    role: "admin"
  });

  // Create admin profile
  await Admin.create({
    user: user._id,
    permissions: permissions || ["manage_users"]
  });

  res.status(201).json({
    success: true,
    message: "Admin registered successfully"
  });
}));

// @desc    Verify tutor profile
// @route   PUT /api/auth/:id/verify
// @access  Private/Admin
router.put("/:id/verify", protect, authorize("admin"), asyncHandler(async (req, res) => {
  const { status, comment } = req.body;
  const tutor = await Tutor.findById(req.params.id);

  if (tutor) {
    tutor.verificationStatus = status;
    tutor.verificationComment = comment || "";

    if (status === "verified") {
      tutor.verifiedAt = Date.now();
      await User.findByIdAndUpdate(tutor.user, { isVerified: true });

      // Create notification for tutor
      await Notification.create({
        recipient: tutor.user,
        type: "verification",
        message: "Your tutor profile has been verified! You can now receive session bookings.",
        relatedId: tutor._id,
        onModel: 'Tutor'
      });
    } else if (status === "rejected") {
      await Notification.create({
        recipient: tutor.user,
        type: "verification",
        message: `Your tutor profile verification was rejected. Reason: ${comment}`,
        relatedId: tutor._id,
        onModel: 'Tutor'
      });
    }

    const updatedTutor = await tutor.save();
    res.json({ success: true, data: updatedTutor });
  } else {
    res.status(404).json({ success: false, message: "Tutor not found" });
  }
}));

router.get("/me", protect, getMe)
router.get("/logout", logout)

module.exports = router

