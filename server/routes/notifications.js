const express = require("express")
const asyncHandler = require("express-async-handler")
const Notification = require("../models/Notification")
const { protect } = require("../middleware/auth")

const router = express.Router()

// @desc    Get user's notifications
// @route   GET /api/notifications
// @access  Private
router.get(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    const notifications = await Notification.find({ recipient: req.user.id })
      .populate({
        path: "sender",
        select: "name profilePicture",
      })
      .sort({ createdAt: -1 })

    res.json({
      success: true,
      count: notifications.length,
      data: notifications,
    })
  })
)

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
router.put(
  "/:id/read",
  protect,
  asyncHandler(async (req, res) => {
    const notification = await Notification.findById(req.params.id)

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }

    // Check if user is authorized to update this notification
    if (notification.recipient.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this notification"
      });
    }

    notification.read = true;
    await notification.save();

    res.json({
      success: true,
      data: notification
    });
  })
);

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
router.put(
  "/read-all",
  protect,
  asyncHandler(async (req, res) => {
    await Notification.updateMany({ recipient: req.user.id, isRead: false }, { isRead: true })

    res.json({
      success: true,
      message: "All notifications marked as read",
    })
  })
)

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
router.delete(
  "/:id",
  protect,
  asyncHandler(async (req, res) => {
    const notification = await Notification.findById(req.params.id)

    if (notification) {
      // Check if user is the recipient
      if (notification.recipient.toString() !== req.user.id) {
        res.status(403)
        throw new Error("Not authorized")
      }

      await notification.remove()

      res.json({
        success: true,
        message: "Notification removed",
      })
    } else {
      res.status(404)
      throw new Error("Notification not found")
    }
  })
)

module.exports = router

