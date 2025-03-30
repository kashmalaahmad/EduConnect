"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import axios from "axios"
import { useAuth, useWishlist } from "../../context"

const StudentDashboard = () => {
  const { user } = useAuth();
  const { wishlistCount, loading: wishlistLoading } = useWishlist();
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState({
    upcomingSessions: [],
    pastSessions: [],
    pendingReviews: [],
    wishlistItems: []
  })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      const [sessionsRes, reviewsRes, wishlistRes] = await Promise.allSettled([
        axios.get('http://localhost:5000/api/sessions/student'),
        axios.get('http://localhost:5000/api/reviews/pending'),
        axios.get('http://localhost:5000/api/wishlist')
      ]);

      const now = new Date();
      
      // Handle each promise result safely
      const sessions = sessionsRes.status === 'fulfilled' ? sessionsRes.value.data.data || [] : [];
      const pendingReviews = reviewsRes.status === 'fulfilled' ? reviewsRes.value.data.data || [] : [];
      const wishlistItems = wishlistRes.status === 'fulfilled' ? wishlistRes.value.data.data || [] : [];
      
      setStats({
        upcomingSessions: sessions.filter(s => new Date(s.date) > now),
        pastSessions: sessions.filter(s => new Date(s.date) <= now),
        pendingReviews,
        wishlistItems
      });

      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Some dashboard data could not be loaded. Please refresh to try again.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900">Upcoming Sessions</h3>
          <p className="text-3xl font-bold text-black mt-2">{stats.upcomingSessions.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900">Past Sessions</h3>
          <p className="text-3xl font-bold text-black mt-2">{stats.pastSessions.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900">Pending Reviews</h3>
          <p className="text-3xl font-bold text-black mt-2">{stats.pendingReviews.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900">Wishlist</h3>
          <p className="text-3xl font-bold text-black mt-2">
            {wishlistLoading ? (
              <span className="text-gray-400">...</span>
            ) : (
              wishlistCount || 0
            )}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link 
          to="/student/search" 
          className="bg-blue-600 text-white p-6 rounded-lg shadow hover:bg-blue-700 transition-colors"
        >
          <h3 className="text-xl font-semibold text-white">Find a Tutor</h3>
          <p className="mt-2 text-sm text-white opacity-90">Search and book sessions with tutors</p>
        </Link>
        <Link 
          to="/student/sessions" 
          className="bg-green-600 text-white p-6 rounded-lg shadow hover:bg-green-700 transition-colors"
        >
          <h3 className="text-xl font-semibold text-white">Manage Sessions</h3>
          <p className="mt-2 text-sm text-white opacity-90">View and manage your tutoring sessions</p>
        </Link>
        <Link 
          to="/student/wishlist" 
          className="bg-purple-600 text-white p-6 rounded-lg shadow hover:bg-purple-700 transition-colors"
        >
          <h3 className="text-xl font-semibold text-white">My Wishlist</h3>
          <p className="mt-2 text-sm text-white opacity-90">View your saved tutors</p>
        </Link>
      </div>

      {/* Upcoming Sessions */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Upcoming Sessions</h2>
          <Link to="/student/sessions" className="text-primary hover:text-primary-dark">View All</Link>
        </div>
        {/* Session cards */}
      </div>

      {/* Recent Reviews */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Recent Reviews</h2>
          <Link to="/student/reviews" className="text-primary hover:text-primary-dark">View All</Link>
        </div>
        {/* Review cards */}
      </div>

      {/* Wishlisted Tutors */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Saved Tutors</h2>
          <Link to="/student/wishlist" className="text-primary hover:text-primary-dark">View All</Link>
        </div>
        {/* Tutor cards */}
      </div>
    </div>
  )
}

export default StudentDashboard