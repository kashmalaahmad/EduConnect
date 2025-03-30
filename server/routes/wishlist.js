const express = require("express")
const asyncHandler = require("express-async-handler")
const { protect } = require("../middleware/auth")
const Wishlist = require("../models/Wishlist")

const router = express.Router()

// @desc    Get student's wishlist
// @route   GET /api/wishlist
// @access  Private/Student
router.get(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    const wishlist = await Wishlist.find({ student: req.user.id })
      .populate({
        path: "tutor",
        populate: {
          path: "user",
          select: "name email profilePicture"
        }
      })

    // Transform the data with null checks
    const transformedWishlist = wishlist.map(item => {
      if (!item.tutor) {
        return null;
      }
      
      return {
        _id: item.tutor._id,
        name: item.tutor.user?.name || 'Unknown',
        email: item.tutor.user?.email || '',
        profilePicture: item.tutor.user?.profilePicture || '',
        subjects: item.tutor.subjects || [],
        hourlyRate: item.tutor.hourlyRate || 0,
        rating: item.tutor.rating || 0,
        reviewCount: item.tutor.reviewCount || 0,
        city: item.tutor.city || ''
      };
    }).filter(Boolean); // Remove any null entries

    res.json({
      success: true,
      count: transformedWishlist.length,
      data: transformedWishlist
    });
  })
)

// @desc    Add tutor to wishlist
// @route   POST /api/wishlist
// @access  Private/Student
router.post(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    const { tutorId } = req.body

    // Check if already in wishlist
    const existing = await Wishlist.findOne({
      student: req.user.id,
      tutor: tutorId,
    })

    if (existing) {
      res.status(400)
      throw new Error("Tutor already in wishlist")
    }

    const wishlist = await Wishlist.create({
      student: req.user.id,
      tutor: tutorId,
    })

    res.status(201).json({
      success: true,
      data: wishlist,
    })
  })
)

// @desc    Remove tutor from wishlist
// @route   DELETE /api/wishlist/:tutorId
// @access  Private/Student
router.delete(
  "/:tutorId",
  protect,
  asyncHandler(async (req, res) => {
    const result = await Wishlist.findOneAndDelete({
      student: req.user.id,
      tutor: req.params.tutorId,
    })

    if (!result) {
      res.status(404)
      throw new Error("Wishlist item not found")
    }

    res.json({
      success: true,
      data: {},
    })
  })
)

module.exports = router

