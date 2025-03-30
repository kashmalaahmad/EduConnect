const express = require("express")
const asyncHandler = require("express-async-handler")
const mongoose = require("mongoose")
const Review = require("../models/Review")
const Tutor = require("../models/Tutor")
const Notification = require("../models/Notification")
const Session = require("../models/Session")
const { protect } = require("../middleware/auth")

const router = express.Router()

// IMPORTANT: Place specific routes before parametric routes
// @desc    Get pending reviews
// @route   GET /api/reviews/pending
// @access  Private
router.get(
  "/pending",
  protect,
  asyncHandler(async (req, res) => {
    try {
      const completedSessions = await Session.find({
        student: req.user.id,
        status: "completed",
        reviewed: false
      })
      .populate({
        path: "tutor",
        populate: {
          path: "user",
          select: "name email profilePicture"
        }
      })
      .lean();

      return res.json({
        success: true,
        data: completedSessions || []
      });
    } catch (error) {
      console.error("Error fetching pending reviews:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch pending reviews",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  })
);

// @desc    Check if user can review a tutor
// @route   GET /api/reviews/can-review/:tutorId
// @access  Private
router.get(
  "/can-review/:tutorId",
  protect,
  asyncHandler(async (req, res) => {
    const { tutorId } = req.params;
    const existingReview = await Review.findOne({
      student: req.user.id,
      tutor: tutorId
    });

    res.json({
      success: true,
      canReview: !existingReview
    });
  })
);

// @desc    Get reviews for a tutor
// @route   GET /api/reviews/tutor/:id
// @access  Public
router.get(
  "/tutor/:id",
  asyncHandler(async (req, res) => {
    const reviews = await Review.find({ tutor: req.params.id })
      .populate({
        path: "student",
        select: "name profilePicture",
      })
      .sort({ createdAt: -1 })

    res.json({
      success: true,
      count: reviews.length,
      data: reviews,
    })
  }),
)

// @desc    Get review by ID
// @route   GET /api/reviews/:id
// @access  Private
router.get(
  "/:id",
  protect,
  asyncHandler(async (req, res) => {
    const review = await Review.findById(req.params.id)
      .populate({
        path: "student",
        select: "name profilePicture",
      })
      .populate({
        path: "tutor",
        select: "name profilePicture",
      })
      .populate("session")

    if (review) {
      res.json({
        success: true,
        data: review,
      })
    } else {
      res.status(404)
      throw new Error("Review not found")
    }
  }),
)

// @desc    Create a new review
// @route   POST /api/reviews
// @access  Private/Student
router.post(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    const { tutorId, rating, comment } = req.body;

    try {
      console.log('Creating review with data:', { tutorId, rating, comment, studentId: req.user.id });

      // Check if student has already reviewed this tutor
      const existingReview = await Review.findOne({
        student: req.user.id,
        tutor: tutorId
      });

      if (existingReview) {
        return res.status(400).json({
          success: false,
          message: "You have already reviewed this tutor"
        });
      }

      // First find the tutor
      const tutor = await Tutor.findById(tutorId).populate('user');
      if (!tutor) {
        return res.status(404).json({
          success: false,
          message: "Tutor not found"
        });
      }

      // Create and save the review first
      const review = await Review.create({
        student: req.user.id,
        tutor: tutorId,
        rating: Number(rating),
        comment: comment.trim()
      });

      // Calculate new rating
      const allReviews = await Review.find({ tutor: tutorId });
      const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = totalRating / allReviews.length;

      // Update tutor using findByIdAndUpdate to avoid validation issues
      await Tutor.findByIdAndUpdate(
        tutorId,
        {
          $set: {
            rating: Number(averageRating.toFixed(1)),
            reviewCount: allReviews.length
          }
        },
        { new: true, runValidators: false }
      );

      // Create notification if tutor has a user reference
      if (tutor.user) {
        await Notification.create({
          recipient: tutor.user._id,
          sender: req.user.id,
          type: "review",
          message: `You received a ${rating}-star review`,
          relatedId: review._id
        });
      }

      // Return populated review
      const populatedReview = await Review.findById(review._id)
        .populate('student', 'name profilePicture')
        .lean();

      return res.status(201).json({
        success: true,
        data: populatedReview
      });

    } catch (error) {
      console.error('Review creation error:', error);
      return res.status(500).json({
        success: false,
        message: "Failed to create review",
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  })
);

module.exports = router

