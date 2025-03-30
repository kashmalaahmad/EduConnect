// src/pages/student/SessionDetail.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import ReviewForm from "../../components/reviews/ReviewForm";
import { useAuth, useSession } from "../../context";

const SessionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { sessions, updateSession } = useSession();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [canReview, setCanReview] = useState(false);

  // Find session in context
  useEffect(() => {
    if (sessions) {
      const foundSession = sessions.find((s) => s.id === id);

      if (foundSession) {
        setSession(foundSession);
        setNotes(foundSession.notes || "");
      }

      setLoading(false);
    }
  }, [id, sessions]);

  // Fetch session details
  useEffect(() => {
    fetchSessionDetails();
  }, [id]);

  const fetchSessionDetails = async () => {
    try {
      const response = await axios.get(`/api/sessions/${id}`);
      setSession(response.data.data);
      // Can only review if session is completed and not already reviewed
      setCanReview(
        response.data.data.status === "completed" &&
        !response.data.data.hasReview
      );
    } catch (error) {
      console.error("Error fetching session:", error);
    }
  };

  // Mock available times for rescheduling
  useEffect(() => {
    if (showRescheduleModal && selectedDate) {
      // In a real app, you would fetch available times from an API
      setTimeout(() => {
        setAvailableTimes([
          "09:00",
          "10:00",
          "11:00",
          "14:00",
          "15:00",
          "16:00",
        ]);
      }, 500);
    }
  }, [showRescheduleModal, selectedDate]);

  // Handle session cancellation
  const handleCancelSession = () => {
    const updatedSession = {
      ...session,
      status: "cancelled",
      updatedAt: new Date().toISOString(),
    };

    updateSession(updatedSession);
    setSession(updatedSession);
    setShowCancelModal(false);
  };

  // Handle session rescheduling
  const handleRescheduleSession = (e) => {
    e.preventDefault();

    if (!selectedDate || !selectedTime) {
      setError("Please select both date and time");
      return;
    }

    const updatedSession = {
      ...session,
      date: selectedDate,
      time: selectedTime,
      status: "rescheduled",
      updatedAt: new Date().toISOString(),
    };

    updateSession(updatedSession);
    setSession(updatedSession);
    setShowRescheduleModal(false);
    setSelectedDate("");
    setSelectedTime("");
    setError("");
  };

  // Handle notes update
  const handleUpdateNotes = () => {
    const updatedSession = {
      ...session,
      notes,
      updatedAt: new Date().toISOString(),
    };

    updateSession(updatedSession);
    setSession(updatedSession);
  };

  // Handle review submission
  const handleReviewSubmit = async (reviewData) => {
    try {
      await axios.post(`/api/reviews`, {
        tutorId: session.tutor._id,
        sessionId: session._id,
        ...reviewData,
      });

      // Update session to reflect review has been added
      fetchSessionDetails();

      // Notify tutor
      await axios.post("/api/notifications", {
        recipient: session.tutor._id,
        type: "review",
        message: "A student has left you a new review",
        relatedId: session._id,
      });
    } catch (error) {
      console.error("Error submitting review:", error);
    }
  };

  // Format session status for display
  const formatStatus = (status) => {
    switch (status) {
      case "scheduled":
        return (
          <span className="inline-block px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">
            Scheduled
          </span>
        );
      case "completed":
        return (
          <span className="inline-block px-3 py-1 text-sm font-medium bg-green-100 text-green-800 rounded-full">
            Completed
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-block px-3 py-1 text-sm font-medium bg-red-100 text-red-800 rounded-full">
            Cancelled
          </span>
        );
      case "rescheduled":
        return (
          <span className="inline-block px-3 py-1 text-sm font-medium bg-yellow-100 text-yellow-800 rounded-full">
            Rescheduled
          </span>
        );
      default:
        return (
          <span className="inline-block px-3 py-1 text-sm font-medium bg-gray-100 text-gray-800 rounded-full">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Session Not Found</h2>
          <p className="text-gray-600 mb-6">
            The session you are looking for does not exist or has been removed.
          </p>
          <Link
            to="/student/sessions"
            className="inline-flex items-center text-blue-500 hover:underline"
          >
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 19l-7-7 7-7"
              ></path>
            </svg>
            Back to Sessions
          </Link>
        </div>
      </div>
    );
  }

  const sessionDate = new Date(`${session.date}T${session.time}`);
  const isPastSession = sessionDate < new Date();
  const isUpcomingSession = !isPastSession && session.status === "scheduled";

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Link
          to="/student/sessions"
          className="flex items-center text-blue-500 hover:underline"
        >
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 19l-7-7 7-7"
            ></path>
          </svg>
          Back to Sessions
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-blue-500 text-white p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-1">
                Session with {session.tutorName}
              </h1>
              <p className="text-blue-100">
                {new Date(session.date).toLocaleDateString()} at {session.time}
              </p>
            </div>
            <div className="mt-4 md:mt-0">{formatStatus(session.status)}</div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold mb-2">Session Details</h2>
              <ul className="space-y-2">
                <li className="flex justify-between">
                  <span className="text-gray-500">Date</span>
                  <span>{new Date(session.date).toLocaleDateString()}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-500">Time</span>
                  <span>{session.time}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-500">Duration</span>
                  <span>{session.duration} minutes</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-500">Type</span>
                  <span className="capitalize">{session.type}</span>
                </li>
              </ul>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold mb-2">Topic</h2>
              <p>{session.topic}</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold mb-2">Tutor Information</h2>
              <p className="mb-2">{session.tutorName}</p>
              <Link
                to={`/student/tutors/${session.tutorId}`}
                className="text-blue-500 hover:underline"
              >
                View Profile
              </Link>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-3">Session Notes</h2>
            {user.role === "student" ? (
              <div>
                <textarea
                  className="w-full border border-gray-300 rounded-md p-3 mb-2"
                  rows="4"
                  placeholder="Add notes for this session..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                ></textarea>
                <button
                  onClick={handleUpdateNotes}
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                >
                  Save Notes
                </button>
              </div>
            ) : (
              <p className="text-gray-700">
                {session.notes || "No notes added."}
              </p>
            )}
          </div>

          {isUpcomingSession && (
            <div className="flex flex-wrap gap-3 mt-8">
              <button
                onClick={() => setShowRescheduleModal(true)}
                className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600"
              >
                Reschedule
              </button>
              <button
                onClick={() => setShowCancelModal(true)}
                className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700"
              >
                Cancel Session
              </button>
            </div>
          )}

          {canReview && (
            <div className="mt-8">
              <h2 className="text-xl font-bold mb-4">Leave a Review</h2>
              <ReviewForm onSubmit={handleReviewSubmit} />
            </div>
          )}
        </div>
      </div>

      {/* Cancel Session Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Cancel Session</h3>
            <p className="mb-6">
              Are you sure you want to cancel your session with {session.tutorName} on{" "}
              {new Date(session.date).toLocaleDateString()} at {session.time}?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Keep Session
              </button>
              <button
                onClick={handleCancelSession}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Session Modal */}
      {showRescheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Reschedule Session</h3>

            <form onSubmit={handleRescheduleSession}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Select a new date</label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded-md p-2"
                  min={new Date().toISOString().split("T")[0]}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  required
                />
              </div>

              {selectedDate && (
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Select a new time</label>
                  {availableTimes.length === 0 ? (
                    <div className="animate-pulse h-10 bg-gray-200 rounded"></div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {availableTimes.map((time) => (
                        <button
                          key={time}
                          type="button"
                          className={`p-2 border rounded ${
                            selectedTime === time
                              ? "bg-blue-500 text-white border-blue-500"
                              : "bg-white hover:bg-blue-50"
                          }`}
                          onClick={() => setSelectedTime(time)}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowRescheduleModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Reschedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionDetail;