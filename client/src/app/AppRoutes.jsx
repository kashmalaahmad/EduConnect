"use client"

import { Routes, Route, Navigate } from "react-router-dom"
import { useAuth } from "../context"

// Auth Pages
import Login from "../pages/auth/Login"
import Register from "../pages/auth/Register"

// Student Pages
import StudentDashboard from "../pages/student/StudentDashboard"
import TutorSearch from "../pages/student/TutorSearch"
import TutorProfile from "../pages/student/TutorProfile"
import BookSession from "../pages/student/BookSession"
import SessionDetail from "../pages/student/SessionDetail"
import Wishlist from "../pages/student/Wishlist"
import SessionManagement from "../components/sessions/SessionManagement"

// Tutor Pages
import TutorDashboard from "../pages/tutor/TutorDashboard"
import ProfileManagement from "../pages/tutor/ProfileManagement"
import TutorSessionManagement from "../components/sessions/TutorSessionManagement"
import EarningsTracker from "../pages/tutor/EarningsTracker"

// Admin Pages
import AdminDashboard from "../pages/admin/AdminDashboard"
import TutorVerification from "../pages/admin/TutorVerification"
import VerificationDetails from "../pages/admin/VerificationDetails"
import ReportingDashboard from "../pages/admin/ReportingDashboard"
import UserManagement from "../pages/admin/UserManagement"
import AdminSessions from "../pages/admin/AdminSessions" // Add this import

// Common Pages
import Home from "../pages/Home"
import NotFound from "../pages/NotFound"
import Notifications from "../pages/Notifications"
import UserProfile from "../pages/UserProfile"

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" />
  }

  return children
}

// App Routes Component
const AppRoutes = () => {
  const { user } = useAuth()

  return (
    <Routes>
      <Route path="/" element={!user ? <Home /> : <Navigate to={`/${user.role}/dashboard`} />} />
      <Route path="/login" element={!user ? <Login /> : <Navigate to={`/${user.role}/dashboard`} />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to={`/${user.role}/dashboard`} />} />

      {/* Student Routes */}
      <Route path="/student/dashboard" element={<ProtectedRoute allowedRoles={["student"]}><StudentDashboard /></ProtectedRoute>} />
      <Route path="/student/search" element={<ProtectedRoute allowedRoles={["student"]}><TutorSearch /></ProtectedRoute>} />
      <Route path="/student/tutors/:id" element={<ProtectedRoute allowedRoles={["student"]}><TutorProfile /></ProtectedRoute>} />
      <Route path="/student/book/:id" element={<ProtectedRoute allowedRoles={["student"]}><BookSession /></ProtectedRoute>} />
      <Route path="/student/sessions" element={<ProtectedRoute allowedRoles={["student"]}><SessionManagement /></ProtectedRoute>} />
      <Route path="/student/sessions/:id" element={<ProtectedRoute allowedRoles={["student"]}><SessionDetail /></ProtectedRoute>} />
      <Route path="/student/wishlist" element={<ProtectedRoute allowedRoles={["student"]}><Wishlist /></ProtectedRoute>} />

      {/* Tutor Routes */}
      <Route path="/tutor/dashboard" element={<ProtectedRoute allowedRoles={["tutor"]}><TutorDashboard /></ProtectedRoute>} />
      <Route path="/tutor/sessions" element={<ProtectedRoute allowedRoles={["tutor"]}><TutorSessionManagement /></ProtectedRoute>} />
      <Route path="/tutor/sessions/:id" element={<ProtectedRoute allowedRoles={["tutor"]}><SessionDetail /></ProtectedRoute>} />
      <Route path="/tutor/earnings" element={<ProtectedRoute allowedRoles={["tutor"]}><EarningsTracker /></ProtectedRoute>} />
      <Route path="/tutor/profile" element={<ProtectedRoute allowedRoles={["tutor"]}><ProfileManagement /></ProtectedRoute>} />

      {/* Admin Routes */}
      <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute allowedRoles={["admin"]}><UserManagement /></ProtectedRoute>} />
      <Route path="/admin/sessions" element={<ProtectedRoute allowedRoles={["admin"]}><AdminSessions /></ProtectedRoute>} />
      <Route path="/admin/verification" element={<ProtectedRoute allowedRoles={["admin"]}><TutorVerification /></ProtectedRoute>} />
      <Route path="/admin/verification/:id" element={<ProtectedRoute allowedRoles={["admin"]}><VerificationDetails /></ProtectedRoute>} />
      <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={["admin"]}><ReportingDashboard /></ProtectedRoute>} />

      {/* Common Routes */}
      <Route path="/notifications" element={<ProtectedRoute allowedRoles={["student", "tutor", "admin"]}><Notifications /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute allowedRoles={["student", "tutor", "admin"]}><UserProfile /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

// Export the component first, then create router configuration
export default AppRoutes;

// Create router configuration separately
export const router = {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
};