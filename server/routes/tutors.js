const express = require("express")
const mongoose = require("mongoose")
const asyncHandler = require("express-async-handler")
const Tutor = require("../models/Tutor")
const User = require("../models/User")
const Notification = require("../models/Notification")
const Wishlist = require("../models/Wishlist")
const Session = require("../models/Session")
const { protect, authorize } = require("../middleware/auth")
const {
  getTutors,
  createTutor,
  updateTutor,
  deleteTutor,
  getPendingVerifications,
  getVerificationStats,
  verifyTutor
} = require("../controllers/tutors")
const multer = require('multer')
const path = require('path')

// Configure multer for profile picture uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/profile-pictures')
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`)
  }
})

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png/
    const mimetype = filetypes.test(file.mimetype)
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase())

    if (mimetype && extname) {
      return cb(null, true)
    }
    cb(new Error('Only .png, .jpg and .jpeg format allowed!'))
  }
})

const router = express.Router()

// Helper function to transform availability data
function transformAvailability(availability) {
  // If availability is already an array, return it
  if (Array.isArray(availability)) {
    return availability;
  }

  // If it's an object with day keys, convert to array format
  if (availability && typeof availability === 'object') {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    return days.reduce((acc, day) => {
      if (availability[day] && Array.isArray(availability[day])) {
        availability[day].forEach(slot => {
          acc.push({
            day: day.charAt(0).toUpperCase() + day.slice(1),
            startTime: slot.start,
            endTime: slot.end
          });
        });
      }
      return acc;
    }, []);
  }

  // Return empty array as fallback
  return [];
}

// @desc    Get all tutors
// @route   GET /api/tutors
// @access  Public
router.get("/", getTutors)

// @desc    Get single tutor
// @route   GET /api/tutors/:id
router.get('/:id', asyncHandler(async (req, res) => {
  try {
    console.log('Fetching tutor with ID:', req.params.id);
    
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.log('Invalid tutor ID format:', req.params.id);
      return res.status(400).json({
        success: false,
        message: 'Invalid tutor ID format'
      });
    }

    const tutor = await Tutor.findById(req.params.id)
      .populate('user', 'name email profilePicture')
      .lean();

    console.log('Found tutor:', tutor);

    if (!tutor) {
      return res.status(404).json({
        success: false,
        message: 'Tutor not found'
      });
    }

    // Transform data before sending
    const tutorData = {
      _id: tutor._id,
      name: tutor.user?.name || 'Unknown',
      email: tutor.user?.email || '',
      profileImage: tutor.user?.profilePicture || null,
      subjects: tutor.subjects || [],
      qualifications: tutor.qualifications || [],
      hourlyRate: tutor.hourlyRate || 0,
      city: tutor.city || '',
      bio: tutor.bio || '',
      teachingMode: tutor.teachingMode || 'both',
      availability: (tutor.availability || [])
        .filter(slot => slot.startTime && slot.endTime)
        .map(slot => ({
          day: slot.day.toLowerCase(),
          startTime: slot.startTime,
          endTime: slot.endTime
        })),
      rating: tutor.rating || 0,
      reviewCount: tutor.reviewCount || 0,
      isVerified: tutor.verificationStatus === 'verified'
    };

    res.json({
      success: true,
      data: tutorData
    });

  } catch (error) {
    console.error('Error fetching tutor:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tutor details',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server Error'
    });
  }
}));

// @desc    Get tutor's own profile
// @route   GET /api/tutors/profile/me
// @access  Private/Tutor
router.get(
  "/profile/me",
  protect,
  authorize("tutor"),
  asyncHandler(async (req, res) => {
    try {
      const tutor = await Tutor.findOne({ user: req.user._id })
        .populate("user", "name email profilePicture")
        .lean();

      if (!tutor) {
        return res.status(404).json({
          success: false,
          message: "Tutor profile not found"
        });
      }

      // Transform tutor data
      const transformedTutor = {
        _id: tutor._id,
        name: tutor.user?.name || 'Unknown',
        email: tutor.user?.email || '',
        profilePicture: tutor.user?.profilePicture || '',
        city: tutor.city || '',
        bio: tutor.bio || '',
        subjects: Array.isArray(tutor.subjects) ? tutor.subjects : [],
        qualifications: Array.isArray(tutor.qualifications) ? tutor.qualifications : [],  
        hourlyRate: Number(tutor.hourlyRate) || 0,
        teachingMode: tutor.teachingMode || 'both',
        availability: transformAvailability(tutor.availability),
        rating: Number(tutor.rating) || 0,
        reviewCount: Number(tutor.reviewCount) || 0,
        verificationStatus: tutor.verificationStatus || 'pending',
        isVerified: tutor.verificationStatus === 'verified'
      };

      res.json({
        success: true, 
        data: transformedTutor
      });

    } catch (err) {
      console.error("Error fetching tutor profile:", err);
      res.status(500).json({
        success: false,
        message: "Error fetching tutor profile"
      });
    }
  })
);

// @desc    Create or update tutor profile
// @route   POST /api/tutors/profile
// @access  Private/Tutor
router.post("/profile", protect, authorize("tutor"), upload.single('profilePicture'), asyncHandler(async (req, res) => {
  try {
    // Parse JSON strings back to objects
    const availability = req.body.availability ? JSON.parse(req.body.availability) : [];
    const subjects = req.body.subjects ? JSON.parse(req.body.subjects) : [];
    const qualifications = req.body.qualifications ? JSON.parse(req.body.qualifications) : [];
    
    // Validate availability format
    const validatedAvailability = availability
      .filter(slot => slot.day && slot.startTime && slot.endTime)
      .map(slot => ({
        day: slot.day.charAt(0).toUpperCase() + slot.day.slice(1),
        startTime: slot.startTime || slot.start,
        endTime: slot.endTime || slot.end
      }));

    // Find or create tutor profile
    let tutor = await Tutor.findOne({ user: req.user.id });
    
    const updateData = {
      subjects: subjects.map(s => typeof s === 'string' ? s : s.name),
      qualifications: qualifications.map(q => ({
        degree: q.degree,
        institution: q.institution,
        year: q.year,
        document: q.document || ''
      })),
      hourlyRate: req.body.hourlyRate,
      teachingMode: req.body.teachingMode,
      availability: validatedAvailability,
      city: req.body.city,
      bio: req.body.bio
    };

    if (req.file) {
      updateData.profilePicture = `/uploads/profile-pictures/${req.file.filename}`;
    }

    if (tutor) {
      tutor = await Tutor.findOneAndUpdate(
        { user: req.user.id },
        { $set: updateData },
        { new: true, runValidators: true }
      );
    } else {
      tutor = await Tutor.create({
        user: req.user.id,
        ...updateData
      });
    }

    res.status(201).json({
      success: true,
      data: tutor
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}));

// @desc    Update tutor profile
// @route   PUT /api/tutors/profile
// @access  Private/Tutor
router.put(
  "/profile",
  protect,
  authorize("tutor"),
  asyncHandler(async (req, res) => {
    const {
      subjects,
      qualifications,
      hourlyRate,
      teachingMode,
      availability,
      bio,
      city
    } = req.body;

    const tutor = await Tutor.findOne({ user: req.user.id });

    if (!tutor) {
      return res.status(404).json({
        success: false,
        message: "Tutor profile not found"
      });
    }

    // Update fields
    if (subjects) tutor.subjects = subjects;
    if (qualifications) tutor.qualifications = qualifications;
    if (hourlyRate) tutor.hourlyRate = hourlyRate;
    if (teachingMode) tutor.teachingMode = teachingMode;
    if (availability) tutor.availability = availability;
    if (bio) tutor.bio = bio;
    if (city) tutor.city = city;

    const updatedTutor = await tutor.save();

    res.json({
      success: true,
      data: updatedTutor
    });
  })
);

// @desc    Verify tutor
// @route   PUT /api/tutors/:id/verify
// @access  Private/Admin
router.put("/:id/verify", protect, authorize("admin"), asyncHandler(async (req, res) => {
  const { status, comment } = req.body

  const tutor = await Tutor.findById(req.params.id)

  if (tutor) {
    tutor.verificationStatus = status
    tutor.verificationComment = comment || ""

    if (status === "verified") {
      tutor.verifiedAt = Date.now()

      // Update user's isVerified status
      await User.findByIdAndUpdate(tutor.user, { isVerified: true })

      // Create notification for tutor
      await Notification.create({
        recipient: tutor.user,
        type: "verification",
        message: "Your tutor profile has been verified! You can now receive session bookings.",
        relatedId: tutor._id,
      })
    } else if (status === "rejected") {
      // Create notification for tutor
      await Notification.create({
        recipient: tutor.user,
        type: "verification",
        message: `Your tutor profile verification was rejected. Reason: ${comment}`,
        relatedId: tutor._id,
      })
    }

    const updatedTutor = await tutor.save()

    res.json({
      success: true,
      data: updatedTutor,
    })
  } else {
    res.status(404)
    throw new Error("Tutor not found")
  }
}))

// @desc    Get pending verifications
// @route   GET /api/tutors/verifications/pending
// @access  Private/Admin
router.get("/verifications/pending", protect, authorize("admin"), asyncHandler(async (req, res) => {
  const tutors = await Tutor.find({ verificationStatus: "pending" }).populate({
    path: "user",
    select: "name email profilePicture city bio",
  })

  res.json({
    success: true,
    count: tutors.length,
    data: tutors,
  })
}))

// @desc    Get verification statistics
// @route   GET /api/tutors/verifications/stats
// @access  Private/Admin
router.get("/verifications/stats", protect, authorize("admin"), asyncHandler(async (req, res) => {
  const stats = await Tutor.aggregate([
    {
      $group: {
        _id: "$verificationStatus",
        count: { $sum: 1 },
      },
    },
  ])

  // Convert to object for easier access
  const statsObj = stats.reduce((acc, curr) => {
    acc[curr._id] = curr.count
    return acc
  }, {})

  res.json({
    success: true,
    data: {
      pending: statsObj.pending || 0,
      verified: statsObj.verified || 0,
      rejected: statsObj.rejected || 0,
    },
  })
}))

// @desc    Get tutor's booked sessions
// @route   GET /api/tutors/:id/sessions
// @access  Public
router.get("/:id/sessions", asyncHandler(async (req, res) => {
  const sessions = await Session.find({
    tutor: req.params.id,
    status: { $in: ['pending', 'confirmed'] }
  }).select('date startTime duration');

  res.json({
    success: true,
    data: sessions
  });
}));

// Get tutor availability
router.get('/:id/availability', protect, asyncHandler(async (req, res) => {
  const tutor = await Tutor.findById(req.params.id);
  
  if (!tutor) {
    return res.status(404).json({
      success: false,
      message: 'Tutor not found'
    });
  }

  // Filter out slots with empty times
  const availability = tutor.availability.filter(
    slot => slot.startTime && slot.endTime
  );

  res.json({
    success: true,
    data: availability
  });
}));

// Update tutor availability
router.put('/:id/availability', protect, asyncHandler(async (req, res) => {
  const { availability } = req.body;

  // Validate and clean availability data
  const cleanedAvailability = availability
    .filter(slot => slot.startTime && slot.endTime)
    .map(slot => ({
      ...slot,
      day: slot.day.toLowerCase()
    }));

  const tutor = await Tutor.findByIdAndUpdate(
    req.params.id,
    { availability: cleanedAvailability },
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    data: tutor
  });
}));

// Protected routes
router.post('/', protect, createTutor)
router.put('/:id', protect, updateTutor)
router.delete('/:id', protect, deleteTutor)

// Admin routes
router.get("/verification/pending", protect, authorize("admin"), getPendingVerifications)
router.get("/verification/stats", protect, authorize("admin"), getVerificationStats)
router.put("/verification/:id", protect, authorize("admin"), verifyTutor)

module.exports = router

