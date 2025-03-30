const express = require("express")
const asyncHandler = require("express-async-handler")
const Session = require("../models/Session")
const Tutor = require("../models/Tutor")
const Notification = require("../models/Notification")
const { protect, authorize } = require("../middleware/auth") // Add authorize to imports
const {
  getSessions,
  getSession,
  createSession,
  updateSession,
  deleteSession,
  getStudentSessions,
  getTutorSessions
} = require('../controllers/sessions')

const router = express.Router()

// @desc    Get earnings for a tutor
// @route   GET /api/sessions/earnings
// @access  Private/Tutor
router.get("/earnings", protect, authorize("tutor"), asyncHandler(async (req, res) => {
  try {
    const tutorProfile = await Tutor.findOne({ user: req.user.id });
    if (!tutorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Tutor profile not found'
      });
    }

    const sessions = await Session.find({
      tutor: tutorProfile._id,
      status: { $in: ['completed', 'pending', 'cancelled'] }
    });

    // Calculate earnings
    const completedSessions = sessions.filter(s => s.status === 'completed');
    const totalEarnings = completedSessions.reduce((sum, session) => sum + session.price, 0);

    // Calculate weekly earnings
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const weeklyEarnings = completedSessions
      .filter(s => new Date(s.date) >= lastWeek)
      .reduce((sum, session) => sum + session.price, 0);

    // Calculate monthly earnings
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const monthlyEarnings = completedSessions
      .filter(s => new Date(s.date) >= lastMonth)
      .reduce((sum, session) => sum + session.price, 0);

    res.json({
      success: true,
      data: {
        totalEarnings,
        weeklyEarnings,
        monthlyEarnings,
        completed: sessions.filter(s => s.status === 'completed').length,
        pending: sessions.filter(s => s.status === 'pending').length,
        cancelled: sessions.filter(s => s.status === 'cancelled').length
      }
    });
  } catch (error) {
    console.error('Earnings calculation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating earnings'
    });
  }
}));

// @desc    Get tutor's sessions
// @route   GET /api/sessions/tutor
// @access  Private/Tutor
router.get("/tutor", protect, authorize("tutor"), asyncHandler(async (req, res) => {
  const sessions = await Session.find({ 
    tutor: req.user.id // Use user ID instead of "tutor" string
  }).populate('student', 'name email profilePicture');

  res.json({
    success: true,
    data: sessions
  });
}));

// @desc    Get student's sessions
// @route   GET /api/sessions/student
// @access  Private/Student
router.get("/student", protect, authorize("student"), asyncHandler(async (req, res) => {
  const sessions = await Session.find({
    student: req.user.id // Use user ID instead of "student" string
  }).populate('tutor', 'name email profilePicture');

  res.json({
    success: true,
    data: sessions
  });
}));

// @desc    Get session by ID
// @route   GET /api/sessions/:id
// @access  Private
router.get(
  "/:id",
  protect,
  asyncHandler(async (req, res) => {
    const session = await Session.findById(req.params.id)
      .populate({
        path: "student",
        select: "name email profilePicture",
      })
      .populate({
        path: "tutor",
        select: "name email profilePicture",
      })

    if (session) {
      // Check if user is authorized to view this session
      if (
        session.student._id.toString() === req.user.id.toString() ||
        session.tutor._id.toString() === req.user.id.toString() ||
        req.user.role === "admin"
      ) {
        res.json({
          success: true,
          data: session,
        })
      } else {
        res.status(403)
        throw new Error("Not authorized to view this session")
      }
    } else {
      res.status(404)
      throw new Error("Session not found")
    }
  }),
)

// @desc    Create a new session
// @route   POST /api/sessions
// @access  Private/Student
router.post(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    const { tutor, subject, date, startTime, endTime, duration, mode, price, notes } = req.body

    // Check if tutor exists and is verified
    const tutorDoc = await Tutor.findOne({ user: tutor, verificationStatus: "verified" })

    if (!tutorDoc) {
      res.status(400)
      throw new Error("Tutor not found or not verified")
    }

    // Check if slot is available (not double-booked)
    const sessionDate = new Date(date)
    const existingSessions = await Session.find({
      tutor,
      date: {
        $gte: new Date(sessionDate.setHours(0, 0, 0)),
        $lt: new Date(sessionDate.setHours(23, 59, 59)),
      },
      status: { $in: ["pending", "confirmed"] },
    })

    // Check for time conflicts
    const hasConflict = existingSessions.some((session) => {
      const sessionStart = session.startTime
      const sessionEnd = session.endTime

      return (
        (startTime >= sessionStart && startTime < sessionEnd) ||
        (endTime > sessionStart && endTime <= sessionEnd) ||
        (startTime <= sessionStart && endTime >= sessionEnd)
      )
    })

    if (hasConflict) {
      res.status(400)
      throw new Error("This time slot is already booked")
    }

    // Create session
    const session = await Session.create({
      student: req.user.id,
      tutor,
      subject,
      date,
      startTime,
      endTime,
      duration,
      mode,
      price,
      notes,
    })

    // Create notification for tutor
    await Notification.create({
      recipient: tutor,
      sender: req.user.id,
      type: "session-request",
      message: `You have a new session request from ${req.user.name} for ${subject}`,
      relatedId: session._id,
    })

    res.status(201).json({
      success: true,
      data: session,
    })
  }),
)

// @desc    Get all sessions for a user (student or tutor)
// @route   GET /api/sessions
// @access  Private
router.get(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    const { role } = req.user
    const query = {}

    if (role === "student") {
      query.student = req.user.id
    } else if (role === "tutor") {
      query.tutor = req.user.id
    } else if (role === "admin") {
      // Admin can see all sessions
    } else {
      res.status(403)
      throw new Error("Not authorized")
    }

    const sessions = await Session.find(query)
      .populate({
        path: "student",
        select: "name email profilePicture",
      })
      .populate({
        path: "tutor",
        select: "name email profilePicture",
      })
      .sort({ date: 1, startTime: 1 })

    res.json({
      success: true,
      count: sessions.length,
      data: sessions,
    })
  }),
)

// @desc    Update session status
// @route   PUT /api/sessions/:id/status
// @access  Private
router.put(
  "/:id/status",
  protect,
  asyncHandler(async (req, res) => {
    const { status } = req.body

    const session = await Session.findById(req.params.id)
      .populate({
        path: "student",
        select: "name",
      })
      .populate({
        path: "tutor",
        select: "name",
      })

    if (session) {
      // Check if user is authorized to update this session
      if (
        (status === "cancelled" && session.student._id.toString() === req.user.id.toString()) ||
        ((status === "confirmed" || status === "completed") &&
          session.tutor._id.toString() === req.user.id.toString()) ||
        req.user.role === "admin"
      ) {
        session.status = status

        const updatedSession = await session.save()

        // Create notification for the other party
        let recipient
        let message

        if (status === "cancelled") {
          recipient = session.tutor._id
          message = `${session.student.name} has cancelled the session for ${session.subject}`
        } else if (status === "confirmed") {
          recipient = session.student._id
          message = `${session.tutor.name} has confirmed your session for ${session.subject}`
        } else if (status === "completed") {
          recipient = session.student._id
          message = `${session.tutor.name} has marked your session for ${session.subject} as completed`
        }

        await Notification.create({
          recipient,
          sender: req.user.id,
          type: "session-update",
          message,
          relatedId: session._id,
        })

        res.json({
          success: true,
          data: updatedSession,
        })
      } else {
        res.status(403)
        throw new Error("Not authorized to update this session")
      }
    } else {
      res.status(404)
      throw new Error("Session not found")
    }
  }),
)

// @desc    Get session statistics
// @route   GET /api/sessions/stats
// @access  Private/Admin
router.get(
  "/stats",
  protect,
  asyncHandler(async (req, res) => {
    if (req.user.role !== "admin") {
      res.status(403)
      throw new Error("Not authorized")
    }

    // Count sessions by status
    const statusStats = await Session.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ])

    // Count sessions by subject
    const subjectStats = await Session.aggregate([
      {
        $group: {
          _id: "$subject",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 10,
      },
    ])

    // Count sessions by month
    const monthlyStats = await Session.aggregate([
      {
        $group: {
          _id: {
            month: { $month: "$date" },
            year: { $year: "$date" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ])

    // Calculate completion rate
    const totalSessions = await Session.countDocuments({
      status: { $in: ["completed", "cancelled"] },
    })
    const completedSessions = await Session.countDocuments({ status: "completed" })
    const completionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0

    res.json({
      success: true,
      data: {
        statusStats,
        subjectStats,
        monthlyStats,
        completionRate: Math.round(completionRate * 100) / 100,
      },
    })
  }),
)

module.exports = router;