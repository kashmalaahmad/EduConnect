const express = require("express");
const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose"); // Add this import
const User = require("../models/User");
const Session = require("../models/Session");
const Tutor = require("../models/Tutor");
const Notification = require("../models/Notification"); // Add this import
const { protect, authorize } = require("../middleware/auth");
const convertToCSV = require('../utils/convertToCSV');

const router = express.Router();

// @desc    Get user statistics
// @route   GET /api/admin/stats/users
// @access  Private/Admin
router.get(
  "/stats/users",
  protect,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    // Count users by role
    const roleStats = await User.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
        },
      },
    ]);

    // Count users by city
    const cityStats = await User.aggregate([
      {
        $match: { city: { $ne: "" } },
      },
      {
        $group: {
          _id: "$city",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    // Count users by month
    const monthlyStats = await User.aggregate([
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);

    res.json({
      success: true,
      data: {
        roleStats,
        cityStats,
        monthlyStats,
        totalUsers: await User.countDocuments(),
      },
    });
  })
);

// @desc    Get platform statistics
// @route   GET /api/admin/stats/platform
// @access  Private/Admin
router.get(
  "/stats/platform",
  protect,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const { type, startDate, endDate } = req.query;
    let data = {};
    let dateFilter = {};

    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      };
    }

    // Basic stats
    const [totalUsers, totalTutors, totalStudents, totalSessions, reviews] = await Promise.all([
      User.countDocuments(dateFilter),
      User.countDocuments({ ...dateFilter, role: 'tutor' }),
      User.countDocuments({ ...dateFilter, role: 'student' }),
      Session.countDocuments(dateFilter),
      Session.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, avgRating: { $avg: '$rating' } } }
      ])
    ]);

    // Session stats
    const sessionStats = await Session.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Revenue calculation
    const revenue = await Session.aggregate([
      { $match: { ...dateFilter, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$price' } } }
    ]);

    // Add all stats to response
    data = {
      totalUsers,
      totalTutors,
      totalStudents,
      totalSessions,
      averageRating: reviews[0]?.avgRating || 0,
      sessionStats,
      totalRevenue: revenue[0]?.total || 0
    };

    // Add additional stats based on type
    if (type === 'subjects') {
      data.subjectStats = await Session.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$subject', count: { $sum: 1 } } },
        { $project: { name: '$_id', value: '$count' } },
        { $sort: { value: -1 } },
        { $limit: 10 }
      ]);
    }

    if (type === 'locations') {
      data.cityStats = await User.aggregate([
        { $match: { ...dateFilter, city: { $exists: true, $ne: '' } } },
        { $group: { _id: '$city', count: { $sum: 1 } } },
        { $project: { name: '$_id', value: '$count' } },
        { $sort: { value: -1 } },
        { $limit: 10 }
      ]);
    }

    res.json({
      success: true,
      data
    });
  })
);

// @desc    Export report data
// @route   GET /api/admin/reports/export
// @access  Private/Admin
router.get(
  "/reports/export",
  protect,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    try {
      const { type, startDate, endDate, range = '6months', format = 'json' } = req.query;

      let dateFilter = {};
      if (startDate && endDate) {
        dateFilter = {
          createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        };
      } else if (range) {
        const months = parseInt(range);
        dateFilter = {
          createdAt: {
            $gte: new Date(new Date().setMonth(new Date().getMonth() - months)),
            $lte: new Date()
          }
        };
      }

      let data;
      switch (type) {
        case "revenue":
          data = await Session.aggregate([
            { $match: { ...dateFilter, status: "completed" } },
            {
              $group: {
                _id: {
                  year: { $year: "$createdAt" },
                  month: { $month: "$createdAt" }
                },
                earnings: { $sum: "$price" },
                sessions: { $sum: 1 }
              }
            },
            {
              $project: {
                _id: 0,
                month: {
                  $concat: [
                    { $toString: "$_id.year" },
                    "-",
                    { $toString: "$_id.month" }
                  ]
                },
                earnings: 1,
                sessions: 1
              }
            },
            { $sort: { month: 1 } }
          ]);
          break;

        case "subjects":
          data = await Session.aggregate([
            { $match: dateFilter },
            { $group: { _id: "$subject", count: { $sum: 1 } } },
            { $sort: { count: -1 } }
          ]);
          break;

        case "cities":
          data = await User.aggregate([
            { $match: { ...dateFilter, city: { $exists: true } } },
            { $group: { _id: "$city", count: { $sum: 1 } } },
            { $sort: { count: -1 } }
          ]);
          break;

        case "growth":
          data = await User.aggregate([
            { $match: dateFilter },
            {
              $group: {
                _id: {
                  year: { $year: "$createdAt" },
                  month: { $month: "$createdAt" }
                },
                count: { $sum: 1 }
              }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
          ]);
          break;

        default:
          return res.status(400).json({
            success: false,
            message: "Invalid report type. Allowed types: revenue, subjects, cities, growth"
          });
      }

      // Format data based on requested format
      if (format === 'csv') {
        const csv = convertToCSV(data);
        res.header('Content-Type', 'text/csv');
        res.attachment(`${type}-report.csv`);
        return res.send(csv);
      }

      res.json({
        success: true,
        data
      });
    } catch (error) {
      console.error('Export error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to export data'
      });
    }
  })
);

// @desc    Get admin activity log
// @route   GET /api/admin/activity
// @access  Private/Admin
router.get(
  "/activity",
  protect,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const { limit = 20 } = req.query;

    const activity = await mongoose.model('Notification').aggregate([
      {
        $sort: { createdAt: -1 }
      },
      {
        $limit: parseInt(limit)
      },
      {
        $lookup: {
          from: 'users',
          localField: 'sender',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          type: 1,
          message: 1,
          createdAt: 1,
          'user.name': 1,
          'user.role': 1,
          typeColor: {
            $switch: {
              branches: [
                { case: { $eq: ['$type', 'session-request'] }, then: 'bg-blue-100 text-blue-800' },
                { case: { $eq: ['$type', 'verification'] }, then: 'bg-green-100 text-green-800' },
                { case: { $eq: ['$type', 'session-update'] }, then: 'bg-yellow-100 text-yellow-800' }
              ],
              default: 'bg-gray-100 text-gray-800'
            }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: activity
    });
  })
);

// @desc    Get verification statistics
// @route   GET /api/admin/verifications/stats
// @access  Private/Admin
router.get(
  "/verifications/stats",
  protect,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const stats = await Tutor.aggregate([
      {
        $group: {
          _id: "$verificationStatus",
          count: { $sum: 1 }
        }
      }
    ]);

    const formattedStats = {
      pending: 0,
      verified: 0,
      rejected: 0
    };

    stats.forEach(stat => {
      formattedStats[stat._id] = stat.count;
    });

    res.json({
      success: true,
      data: formattedStats
    });
  })
);

// @desc    Get verification details
// @route   GET /api/admin/verification/:id
// @access  Private/Admin
router.get(
  "/verification/:id",
  protect,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const tutor = await Tutor.findById(req.params.id)
      .populate('user', 'name email profilePicture')
      .populate('qualifications')
      .populate('subjects');

    if (!tutor) {
      return res.status(404).json({
        success: false,
        message: "Tutor not found"
      });
    }

    res.json({
      success: true,
      data: tutor
    });
  })
);

// @desc    Get users with filters and pagination
// @route   GET /api/admin/users
// @access  Private/Admin
router.get(
  "/users",
  protect,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, role = '', search = '' } = req.query;

    // Build query
    let query = {};
    
    // Add role filter if specified
    if (role && role !== 'all') {
      query.role = role;
    }

    // Add search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Execute query with pagination
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .select('name email role createdAt profilePicture isActive');

    // Get total count for pagination
    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total
      }
    });
  })
);

// @desc    Update user status
// @route   PUT /api/admin/users/:id/status
// @access  Private/Admin
router.put(
  "/users/:id/status",
  protect,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const { isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  })
);

// @desc    Get all sessions with filters
// @route   GET /api/admin/sessions
// @access  Private/Admin
router.get(
  "/sessions",
  protect,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, status = '' } = req.query;

    // Build query
    let query = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    // Execute query with pagination
    const sessions = await Session.find(query)
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('student', 'name email')
      .populate('tutor', 'name email');

    // Get total count for pagination
    const total = await Session.countDocuments(query);

    res.json({
      success: true,
      data: sessions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total
      }
    });
  })
);

// @desc    Get session details
// @route   GET /api/admin/sessions/:id
// @access  Private/Admin
router.get(
  "/sessions/:id",
  protect,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const session = await Session.findById(req.params.id)
      .populate('student', 'name email profilePicture')
      .populate('tutor', 'name email profilePicture');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    res.json({
      success: true,
      data: session
    });
  })
);

// @desc    Update session status
// @route   PUT /api/admin/sessions/:id/status
// @access  Private/Admin
router.put(
  "/sessions/:id/status",
  protect,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const { status } = req.body;

    const session = await Session.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate('student', 'name email')
     .populate('tutor', 'name email');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Create notification for both student and tutor
    await Promise.all([
      Notification.create({
        recipient: session.student._id,
        type: 'session-update',
        message: `Your session status has been updated to ${status}`,
        relatedId: session._id,
        onModel: 'Session'
      }),
      Notification.create({
        recipient: session.tutor._id,
        type: 'session-update',
        message: `Session status has been updated to ${status}`,
        relatedId: session._id,
        onModel: 'Session'
      })
    ]);

    res.json({
      success: true,
      data: session
    });
  })
);

router.use(protect);
router.use(authorize("admin"));

router.get(
  "/dashboard",
  protect,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    try {
      const { page = 1, limit = 10 } = req.query;
      
      const [
        totalStudents,
        totalTutors,
        pendingVerifications,
        totalSessions,
        recentSessions,
        recentUsers
      ] = await Promise.all([
        User.countDocuments({ role: "student" }),
        User.countDocuments({ role: "tutor" }),
        Tutor.countDocuments({ verificationStatus: "pending" }),
        Session.countDocuments(),
        Session.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .populate("student", "name")
          .populate("tutor", "name"),
        User.find()
          .sort({ createdAt: -1 })
          .limit(parseInt(limit))
          .skip((parseInt(page) - 1) * parseInt(limit))
          .select("name email role createdAt profilePicture")
      ]);

      const stats = {
        totalStudents,
        totalTutors,
        totalUsers: totalStudents + totalTutors,
        pendingVerifications,
        totalSessions,
        recentSessions: recentSessions || [],
        recentUsers: recentUsers || []
      };

      res.json({
        success: true,
        data: stats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalStudents + totalTutors
        }
      });
    } catch (error) {
      console.error("Error getting dashboard stats:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching dashboard stats",
        error: error.message
      });
    }
  })
);

module.exports = router;

