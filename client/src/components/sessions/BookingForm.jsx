"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { format, addDays, startOfWeek, isAfter, isBefore, isSameDay } from "date-fns"

const BookingForm = ({ tutorId }) => {
  const navigate = useNavigate()
  const [tutorProfile, setTutorProfile] = useState(null)
  const [availability, setAvailability] = useState([])
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedTime, setSelectedTime] = useState("")
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [validationErrors, setValidationErrors] = useState({})

  // Fetch tutor data including availability
  useEffect(() => {
    const fetchTutorData = async () => {
      if (!tutorId) {
        console.error("Missing tutorId")
        return
      }

      try {
        setLoading(true)
        setError(null)
        const response = await axios.get(`/api/tutors/${tutorId}`)

        if (response.data?.success) {
          const tutorData = response.data.data
          setTutorProfile(tutorData)

          // Filter valid availability slots
          const validSlots = tutorData.availability.filter(
            (slot) => slot.startTime && slot.endTime
          )
          setAvailability(validSlots)
        }
      } catch (err) {
        setError("Failed to fetch tutor availability")
        console.error("Error fetching tutor data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchTutorData()
  }, [tutorId])

  const getAvailableTimeSlots = () => {
    if (!selectedDate || !tutorProfile?.availability) {
      console.log('No date selected or no availability data');
      return [];
    }

    // Get the day of week in lowercase
    const dayOfWeek = new Date(selectedDate)
      .toLocaleDateString('en-US', { weekday: 'long' })
      .toLowerCase();

    console.log('Checking availability for:', dayOfWeek);
    console.log('Available slots:', tutorProfile.availability);

    // Find the matching availability slot
    const availableSlot = tutorProfile.availability.find(
      slot => slot.day.toLowerCase() === dayOfWeek
    );

    console.log('Matching slot:', availableSlot);

    if (!availableSlot) {
      console.log('No availability found for this day');
      return [];
    }

    // Generate 30-minute time slots between start and end time
    const timeSlots = [];
    const startTime = new Date(`2000-01-01T${availableSlot.startTime}`);
    const endTime = new Date(`2000-01-01T${availableSlot.endTime}`);

    let currentSlot = new Date(startTime);

    while (currentSlot < endTime) {
      timeSlots.push(
        currentSlot.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        })
      );
      currentSlot.setMinutes(currentSlot.getMinutes() + 30);
    }

    console.log('Generated time slots:', timeSlots);
    return timeSlots;
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date)
    setValidationErrors({ ...validationErrors, date: null })
  }

  const handleTimeSelect = (time) => {
    setSelectedTime(time)
    setValidationErrors({ ...validationErrors, time: null })
  }

  const nextWeek = () => {
    setWeekStart(addDays(weekStart, 7))
  }

  const prevWeek = () => {
    const prev = addDays(weekStart, -7)
    if (isAfter(addDays(prev, 6), new Date())) {
      setWeekStart(prev)
    }
  }

  const isDateDisabled = (date) => {
    if (!tutorProfile?.availability) return true;

    const dayOfWeek = date
      .toLocaleDateString('en-US', { weekday: 'long' })
      .toLowerCase();

    return !tutorProfile.availability.some(
      slot => slot.day.toLowerCase() === dayOfWeek
    );
  };

  // Generate week days
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(weekStart, i)
    const dayName = format(day, "EEEE") // Full day name

    // Safely check availability
    const hasAvailability =
      Array.isArray(availability) &&
      availability.some(
        (slot) => slot.day === dayName && slot.startTime && slot.endTime
      )

    return {
      date: day,
      dayName,
      hasAvailability,
    }
  })

  // If tutor data is missing, show an error
  if (!tutorId || !tutorProfile) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-xl font-bold mb-4">Error</h1>
        <p className="text-red-500">Missing tutor information. Please go back and try again.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Book a Session with {tutorProfile.name}</h1>

        {/* Error Message */}
        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
            role="alert"
          >
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {/* Calendar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <button
              type="button"
              onClick={prevWeek}
              className="text-primary hover:text-primary-dark"
            >
              &larr; Previous Week
            </button>
            <div className="text-lg font-medium">
              {format(weekStart, "MMM d")} - {format(addDays(weekStart, 6), "MMM d, yyyy")}
            </div>
            <button
              type="button"
              onClick={nextWeek}
              className="text-primary hover:text-primary-dark"
            >
              Next Week &rarr;
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {weekDays.map(({ date, dayName, hasAvailability }) => {
              const isToday = isSameDay(date, new Date())
              const isPastDay = isBefore(date, new Date()) && !isToday

              return (
                <div key={date.toString()} className="text-center">
                  <div className="text-sm font-medium mb-1">{format(date, "EEE")}</div>
                  <div className="text-xs text-gray-500 mb-2">{format(date, "MMM d")}</div>
                  <button
                    type="button"
                    onClick={() => hasAvailability && !isPastDay && handleDateSelect(date)}
                    className={`w-full py-2 rounded-md ${
                      selectedDate && isSameDay(selectedDate, date)
                        ? "bg-primary text-white"
                        : isPastDay
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : hasAvailability
                        ? "bg-gray-100 hover:bg-gray-200"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                    disabled={!hasAvailability || isPastDay}
                  >
                    {hasAvailability && !isPastDay ? "Available" : "Unavailable"}
                  </button>
                </div>
              )
            })}
          </div>
          {validationErrors.date && (
            <p className="text-red-500 text-sm mt-1">{validationErrors.date}</p>
          )}
        </div>

        {/* Time Slots */}
        {selectedDate && (
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Available Times</h3>
            {getAvailableTimeSlots().length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {getAvailableTimeSlots().map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => handleTimeSelect(time)}
                    className={`py-2 px-4 rounded-md text-center ${
                      selectedTime === time
                        ? "bg-primary text-white"
                        : "bg-gray-100 hover:bg-gray-200"
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No available times for this date.</p>
            )}
            {validationErrors.time && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.time}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default BookingForm