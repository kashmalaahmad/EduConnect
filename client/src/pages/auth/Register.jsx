"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../../context"
import TutorFields from "../../components/auth/TutorFields"

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student",
    subjects: [{ name: "", proficiencyLevel: "Beginner" }],
    qualifications: [{ degree: "", institution: "", year: "", document: null }],
    hourlyRate: "",
    city: "",
    bio: "",
    teachingMode: "both",
    availability: DAYS_OF_WEEK.map(day => ({
      day: day.toLowerCase(), // Ensure day is lowercase when initializing
      startTime: "",
      endTime: ""
    })),
    profilePicture: null
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState(null) // Add local error state
  const { register } = useAuth() // Only destructure register from auth context
  const navigate = useNavigate()

  const { name, email, password, confirmPassword, role } = formData

  const handleFormDataChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    if (formError) setFormError(null) // Clear local error state
  }

  const onSubmit = async (e) => {
    e.preventDefault()

    // Basic validation
    if (!name || !email || !password || !confirmPassword) {
      setFormError("Please enter all required fields")
      return
    }

    if (password !== confirmPassword) {
      setFormError("Passwords do not match")
      return
    }

    if (password.length < 6) {
      setFormError("Password must be at least 6 characters")
      return
    }

    // Tutor specific validation
    if (role === "tutor") {
      const { hourlyRate, subjects, qualifications } = formData
      if (!hourlyRate || hourlyRate <= 0) {
        setFormError("Please enter a valid hourly rate")
        return
      }

      if (subjects.length === 0 || subjects.some(subject => !subject.name)) {
        setFormError("Please add at least one subject with a name")
        return
      }

      if (qualifications.some(qual => !qual.degree || !qual.institution || !qual.year)) {
        setFormError("Please fill in all qualification details")
        return
      }

      // Clean up qualifications by removing document field if empty
      const cleanedQualifications = qualifications.map(qual => {
        const cleaned = {
          degree: qual.degree,
          institution: qual.institution,
          year: qual.year
        }
        // Only add document if it has a valid value
        if (qual.document && typeof qual.document === "string") {
          cleaned.document = qual.document
        }
        return cleaned
      })

      // Filter out availability slots that have both start and end times
      const filteredAvailability = formData.availability
        .filter(slot => slot.startTime && slot.endTime)
        .map(slot => ({
          ...slot,
          day: slot.day.toLowerCase() // Ensure day is lowercase before submission
        }))

      if (filteredAvailability.length === 0) {
        setFormError("Please add at least one availability slot")
        return
      }

      // Create updated form data with cleaned values
      const updatedFormData = {
        ...formData,
        qualifications: cleanedQualifications,
        availability: filteredAvailability
      }

      try {
        setIsSubmitting(true)
        const { success, error } = await register(updatedFormData)
        if (success) {
          navigate(`/${role}/dashboard`)
        } else if (error) {
          setFormError(error)
        }
      } catch (err) {
        setFormError(err.message || "Registration failed. Please try again.")
      } finally {
        setIsSubmitting(false)
      }
    } else {
      // Student registration
      try {
        setIsSubmitting(true)
        const { success, error } = await register(formData)
        if (success) {
          navigate(`/${role}/dashboard`)
        } else if (error) {
          setFormError(error)
        }
      } catch (err) {
        setFormError(err.message || "Registration failed. Please try again.")
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              Sign in here
            </Link>
          </p>
        </div>

        {formError && ( // Use local error state
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md" role="alert">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{formError}</p>
              </div>
            </div>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={onSubmit}>
          <div className="space-y-4">
            {/* Basic Information */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => handleFormDataChange("name", e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => handleFormDataChange("email", e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Create a password"
                value={password}
                onChange={(e) => handleFormDataChange("password", e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => handleFormDataChange("confirmPassword", e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                I want to register as a
              </label>
              <select
                id="role"
                name="role"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={role}
                onChange={(e) => handleFormDataChange("role", e.target.value)}
              >
                <option value="student">Student</option>
                <option value="tutor">Tutor</option>
              </select>
            </div>

            {/* Tutor Specific Fields */}
            {role === "tutor" && (
              <TutorFields
                formData={formData}
                onChange={handleFormDataChange}
              />
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Account...
                </span>
              ) : (
                "Create Account"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Register