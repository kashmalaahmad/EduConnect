"use client"

import { useState, useEffect } from "react"
import { useSession } from "../../context"
import { format } from "date-fns"
import Calendar from '../Calendar'  // Updated import path
import axios from "axios"
import { Link } from "react-router-dom"

// Update function definition to use default parameter instead of defaultProps
const TutorSessionManagement = ({ limit = 5 }) => {
  const { sessions, getSessions, updateSession } = useSession()
  const [view, setView] = useState("list") // 'list' or 'calendar'
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedSession, setSelectedSession] = useState(null)

  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    try {
      setLoading(true)
      await getSessions("tutor")
      setError(null)
    } catch (err) {
      setError("Failed to load sessions")
    } finally {
      setLoading(false)
    }
  }

  const handleSessionStatusUpdate = async (sessionId, status) => {
    try {
      setLoading(true)
      await axios.put(`/api/sessions/${sessionId}/status`, { status })

      // After status update, fetch latest sessions
      await loadSessions()

      // Create notification for student
      const session = sessions.find(s => s._id === sessionId)
      await axios.post('/api/notifications', {
        recipient: session.student._id,
        type: 'session-update',
        message: `Your session has been ${status} by the tutor`,
        relatedId: sessionId
      })

    } catch (error) {
      setError(`Failed to ${status} session`)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "confirmed":
        return "bg-green-100 text-green-800"
      case "completed":
        return "bg-blue-100 text-blue-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6 p-4">
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-md">{error}</div>
      )}

      <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold text-gray-800">Session Management</h2>
        <div className="space-x-2">
          <button
            onClick={() => setView("list")}
            className={`px-4 py-2 rounded-md border ${
              view === "list" 
                ? "bg-primary text-white border-primary" 
                : "bg-gray-50 text-gray-900 border-gray-300 hover:bg-gray-100"
            }`}
          >
            List View
          </button>
          <button
            onClick={() => setView("calendar")}
            className={`px-4 py-2 rounded-md border ${
              view === "calendar" 
                ? "bg-primary text-white border-primary" 
                : "bg-gray-50 text-gray-900 border-gray-300 hover:bg-gray-100"
            }`}
          >
            Calendar View
          </button>
        </div>
      </div>

      {view === "calendar" ? (
        <Calendar sessions={sessions} onSessionSelect={setSelectedSession} />
      ) : (
        <div className="grid gap-4">
          {(limit ? sessions.slice(0, limit) : sessions).map((session) => (
            <div key={session._id} className="bg-gray-50 p-6 rounded-lg shadow-md border border-gray-200">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                  <h3 className="text-lg font-semibold">{session.subject}</h3>
                  <p className="text-gray-600">
                    {format(new Date(session.date), "PPP")} at {session.startTime}
                  </p>
                  <p className="text-gray-600">Duration: {session.duration} minutes</p>
                  <p className="text-gray-600">Student: {session.student?.name}</p>
                </div>
                <div className="md:ml-4 mt-4 md:mt-0">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-4 ${getStatusBadgeClass(
                      session.status
                    )}`}
                  >
                    {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {session.status === "pending" && (
                      <>
                        <button
                          onClick={() => handleSessionStatusUpdate(session._id, "confirmed")}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleSessionStatusUpdate(session._id, "cancelled")}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors"
                        >
                          Decline
                        </button>
                      </>
                    )}
                    {session.status === "confirmed" && (
                      <button
                        onClick={() => handleSessionStatusUpdate(session._id, "completed")}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
                      >
                        Mark as Completed
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {limit && sessions.length > limit && (
            <Link
              to="/tutor/sessions"
              className="text-center text-blue-600 hover:text-blue-800 underline"
            >
              View all sessions
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

export default TutorSessionManagement