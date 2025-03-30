"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, Link } from "react-router-dom"
import axios from "axios"
import { useAuth, useWishlist } from "../../context"
import { useTutor } from "../../context"
import BookingForm from "../../components/sessions/BookingForm"
import { StarIcon } from "@heroicons/react/20/solid"
import { HeartIcon as HeartOutlineIcon } from "@heroicons/react/24/outline"
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid"
import { DEFAULT_PROFILE_IMAGE } from "../../utils/constants"

const TutorProfile = () => {
  const { id } = useParams()
  const { user } = useAuth()
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()

  const [tutor, setTutor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [review, setReview] = useState({
    rating: 5,
    comment: "",
  })
  const [submitLoading, setSubmitLoading] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [localReviews, setLocalReviews] = useState([]) // For storing locally added reviews

  const fetchTutorData = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      console.log('Fetching tutor with ID:', id);
      
      const response = await axios.get(`/api/tutors/${id}`);
      console.log('Server response:', response.data);
      
      if (response.data?.success) {
        console.log('Tutor data:', response.data.data);
        setTutor(response.data.data);
      } else {
        throw new Error(response.data?.message || 'Failed to fetch tutor data');
      }
    } catch (err) {
      console.error('Error fetching tutor:', err);
      setError(err.response?.data?.message || 'Failed to load tutor data');
      setTutor(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTutorData();
  }, [fetchTutorData]);

  const handleWishlistToggle = () => {
    if (isInWishlist(id)) {
      removeFromWishlist(id)
    } else {
      addToWishlist(tutor)
    }
  }

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    setSubmitLoading(true)
    setSubmitError(null)
    setSubmitSuccess(false)

    try {
      const response = await axios.post(`http://localhost:5000/api/reviews`, {
        tutorId: id,
        rating: review.rating,
        comment: review.comment,
      })

      const newReview = {
        _id: response.data?.data?._id || `local-${Date.now()}`,
        rating: review.rating,
        comment: review.comment,
        student: { name: user?.name || "You" },
        createdAt: new Date().toISOString(),
      }

      setLocalReviews((prev) => [newReview, ...prev])
      setSubmitSuccess(true)
      setReview({ rating: 5, comment: "" }) // Reset form
    } catch (error) {
      console.error("Failed to submit review:", error)
      setSubmitError(
        error.response?.data?.message || "Failed to submit review. Please try again later."
      )
    } finally {
      setSubmitLoading(false)
    }
  }

  const renderStars = (rating = 0) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <StarIcon
        key={index}
        className={`h-5 w-5 ${
          index < Math.floor(rating) ? "text-yellow-400" : "text-gray-300"
        }`}
      />
    ))
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary">
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <circle
              className="opacity-75"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <span className="block sm:inline">{error}</span>
        </div>
        <div className="mt-4">
          <Link to="/student/search" className="text-blue-600 hover:underline">
            &larr; Back to tutors
          </Link>
        </div>
      </div>
    )
  }

  if (!tutor) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div
          className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <span className="block sm:inline">Tutor not found.</span>
        </div>
        <div className="mt-4">
          <Link to="/student/search" className="text-blue-600 hover:underline">
            &larr; Back to tutors
          </Link>
        </div>
      </div>
    )
  }

  const tutorData = tutor

  const allReviews = [...localReviews]

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to="/student/search" className="text-blue-600 hover:underline">
          &larr; Back to tutors
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="relative">
          <div className="h-48 bg-gradient-to-r from-blue-600 to-blue-800"></div>
          <div className="absolute top-24 left-8 flex items-end">
            <img
              src={tutorData.profileImage || DEFAULT_PROFILE_IMAGE}
              alt={`${tutorData.name}'s profile`}
              className="w-40 h-40 rounded-full border-4 border-white object-cover"
              onError={(e) => {
                e.target.onerror = null
                e.target.src = DEFAULT_PROFILE_IMAGE
              }}
            />
          </div>
          {user && user.role === "student" && (
            <button
              onClick={handleWishlistToggle}
              className="absolute top-4 right-4 p-2 rounded-full bg-white shadow-md hover:bg-gray-100"
            >
              {isInWishlist(id) ? (
                <HeartSolidIcon className="h-6 w-6 text-red-500" />
              ) : (
                <HeartOutlineIcon className="h-6 w-6 text-gray-500" />
              )}
            </button>
          )}
        </div>

        <div className="pt-20 px-8 pb-8">
          <div className="flex flex-col md:flex-row justify-between items-start">
            <div>
              <div className="flex items-center">
                <h1 className="text-3xl font-bold">{tutorData.name}</h1>
                {tutorData.isVerified && (
                  <span className="ml-2 bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Verified
                  </span>
                )}
              </div>
              <div className="flex items-center mt-2">
                <div className="flex">{renderStars(tutorData.rating)}</div>
                <span className="ml-2 text-gray-600">
                  {tutorData.rating.toFixed(1)} ({tutorData.reviewCount} reviews)
                </span>
              </div>
              <p className="text-gray-600 mt-2">{tutorData.city}</p>
            </div>

            <div className="mt-4 md:mt-0">
              <div className="text-2xl font-bold text-blue-600">${tutorData.hourlyRate}/hr</div>
              {user && user.role === "student" && (
                <div className="space-x-4 mt-2">
                  <button
                    onClick={handleWishlistToggle}
                    className={`px-4 py-2 rounded ${
                      isInWishlist(id) ? "bg-red-500 text-white" : "bg-blue-600 text-white"
                    }`}
                  >
                    {isInWishlist(id) ? "Remove from Wishlist" : "Add to Wishlist"}
                  </button>
                  <button
                    onClick={() => setShowBookingForm(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Book Session
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-bold mb-4">Education & Qualifications</h2>
            <div className="space-y-4">
              {tutorData.qualifications.map((qual, idx) => (
                <div key={idx} className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-semibold">{qual.degree}</h3>
                  <p className="text-gray-600">{qual.institution}</p>
                  <p className="text-sm text-gray-500">{qual.year}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-bold mb-4">Subjects & Expertise</h2>
            <div className="flex flex-wrap gap-3">
              {tutorData.subjects.map((subject, idx) => (
                <div key={idx} className="bg-blue-50 px-4 py-2 rounded-full">
                  <span className="font-medium">{subject.name}</span>
                  <span className="text-sm text-gray-600 ml-2">({subject.proficiencyLevel})</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-bold mb-4">Weekly Availability</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tutorData.availability
                .filter((slot) => slot.startTime && slot.endTime)
                .map((slot, idx) => (
                  <div key={idx} className="border rounded-lg p-4">
                    <h3 className="font-semibold capitalize">{slot.day}</h3>
                    <p className="text-gray-600">
                      {slot.startTime} - {slot.endTime}
                    </p>
                  </div>
                ))}
            </div>
          </div>

          {showBookingForm && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold mb-4">Book a Session</h2>
              <BookingForm tutorId={id} />
            </div>
          )}

          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4">Reviews</h2>
            {!Array.isArray(allReviews) || allReviews.length === 0 ? (
              <p className="text-gray-500 italic">No reviews yet</p>
            ) : (
              <div className="space-y-6">
                {allReviews.map((review) => (
                  <div key={review._id} className="border-b pb-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center">
                          <h3 className="font-semibold">{review.student?.name || "Anonymous Student"}</h3>
                          <span className="ml-2 text-gray-500 text-sm">
                            {review.createdAt
                              ? new Date(review.createdAt).toLocaleDateString()
                              : "Unknown date"}
                          </span>
                        </div>
                        <div className="flex mt-1">{renderStars(review.rating || 0)}</div>
                      </div>
                    </div>
                    <p className="mt-2 text-gray-700">{review.comment || ""}</p>
                  </div>
                ))}
              </div>
            )}

            {user && (
              <form onSubmit={handleSubmitReview} className="mt-6">
                <h3 className="text-lg font-semibold mb-2">Write a Review</h3>

                {submitSuccess && (
                  <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
                    Review submitted successfully!
                  </div>
                )}

                {submitError && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                    {submitError}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Rating</label>
                    <select
                      value={review.rating}
                      onChange={(e) =>
                        setReview({ ...review, rating: Number(e.target.value) })
                      }
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      {[5, 4, 3, 2, 1].map((rating) => (
                        <option key={rating} value={rating}>
                          {rating} Stars
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Comment</label>
                    <textarea
                      value={review.comment}
                      onChange={(e) =>
                        setReview({ ...review, comment: e.target.value })
                      }
                      rows="4"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="mt-4">
                    <button
                      type="submit"
                      disabled={submitLoading}
                      className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg shadow-sm transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitLoading ? (
                        <span className="flex items-center justify-center">
                          <svg
                            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Submitting...
                        </span>
                      ) : (
                        "Submit Review"
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TutorProfile