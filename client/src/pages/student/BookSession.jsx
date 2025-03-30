import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context';
import axios from 'axios';
import { MapPinIcon as MapPin, CalendarIcon, ClockIcon } from "@heroicons/react/24/outline";

const BookSession = () => {
  const { id } = useParams(); // tutor id
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State
  const [tutor, setTutor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('');
  const [sessionType, setSessionType] = useState('online');
  const [duration, setDuration] = useState(60);
  const [topic, setTopic] = useState('');
  const [notes, setNotes] = useState('');
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    const fetchTutorData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/tutors/${id}`);
        if (response.data?.success) {
          console.log('Tutor data:', response.data.data);
          const formattedAvailability = (response.data.data.availability || []).map(slot => ({
            ...slot,
            day: slot.day.toLowerCase()
          }));
          setTutor({
            ...response.data.data,
            availability: formattedAvailability
          });
        }
      } catch (error) {
        console.error('Error fetching tutor:', error);
        setError('Failed to load tutor data');
      } finally {
        setLoading(false);
      }
    };

    fetchTutorData();
  }, [id]);

  const getAvailableTimeSlots = () => {
    if (!selectedDate || !tutor?.availability) {
      console.log('No date or availability:', { selectedDate, availability: tutor?.availability });
      return [];
    }

    // Get day name (Monday, Tuesday, etc.) from the selected date
    const dayOfWeek = new Date(selectedDate)
      .toLocaleDateString('en-US', { weekday: 'long' })
      .toLowerCase();

    console.log('Day of week:', dayOfWeek);
    console.log('Available slots:', tutor.availability);

    // Find the matching availability slot
    const availableSlot = tutor.availability.find(
      slot => slot.day.toLowerCase() === dayOfWeek
    );

    console.log('Matching slot:', availableSlot);

    if (!availableSlot) {
      console.log('No matching slot found');
      return [];
    }

    // Parse the time strings into Date objects for comparison
    const startTime = new Date(`1970-01-01T${availableSlot.startTime}`);
    const endTime = new Date(`1970-01-01T${availableSlot.endTime}`);

    console.log('Start time:', startTime);
    console.log('End time:', endTime);

    const slots = [];
    let currentTime = new Date(startTime);

    // Generate 30-minute slots
    while (currentTime < endTime) {
      slots.push(
        currentTime.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        })
      );
      currentTime = new Date(currentTime.getTime() + 30 * 60000); // Add 30 minutes
    }

    console.log('Generated slots:', slots);
    return slots;
  };

  const isDateDisabled = (date) => {
    if (!tutor?.availability) return true;
    
    const dayName = new Date(date)
      .toLocaleDateString('en-US', { weekday: 'long' })
      .toLowerCase();
    
    const isAvailable = tutor.availability.some(
      slot => slot.day.toLowerCase() === dayName
    );

    console.log('Checking availability for:', dayName, isAvailable);
    return !isAvailable;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = {};
    if (!selectedTime) newErrors.time = 'Please select a time';
    if (!topic.trim()) newErrors.topic = 'Please enter a topic';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const response = await axios.post('/api/sessions', {
        tutorId: id,
        date: `${selectedDate.toISOString().split('T')[0]}T${selectedTime}`,
        type: sessionType,
        duration,
        topic,
        notes
      });

      setShowConfirmation(true);
    } catch (error) {
      console.error('Error booking session:', error);
      setErrors({ submit: 'Failed to book session. Please try again.' });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!tutor) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Failed to load tutor data.
        </div>
      </div>
    );
  }

  if (showConfirmation) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">Session Booked!</h2>
          <p className="text-gray-600 mb-6">
            Your session with {tutor.name} has been successfully scheduled.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() => navigate('/student/sessions')}
              className="bg-primary text-white py-2 px-6 rounded hover:bg-primary-dark"
            >
              View My Sessions
            </button>
            <button
              onClick={() => navigate(`/student/tutors/${id}`)}
              className="bg-gray-200 text-gray-800 py-2 px-6 rounded hover:bg-gray-300"
            >
              Back to Tutor Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <button
          onClick={() => navigate(`/student/tutors/${id}`)}
          className="flex items-center text-primary hover:underline"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
          </svg>
          Back to Tutor Profile
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-primary text-white p-4">
          <h1 className="text-2xl font-bold">Book a Session with {tutor.name}</h1>
          <p className="text-sm opacity-90">{tutor.subject} • ${tutor.rate}/hour</p>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Select Date and Time</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-700 mb-2">Date</label>
                    <div className="relative">
                      <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <input
                        type="date"
                        value={selectedDate.toISOString().split('T')[0]}
                        onChange={(e) => {
                          console.log('Selected date:', e.target.value);
                          setSelectedDate(new Date(e.target.value));
                        }}
                        className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                        required
                        min={new Date().toISOString().split('T')[0]}
                        onKeyDown={(e) => e.preventDefault()}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 mb-2">Available Time Slots</label>
                    <div className="grid grid-cols-2 gap-2">
                      {getAvailableTimeSlots().length > 0 ? (
                        getAvailableTimeSlots().map((time) => (
                          <button
                            key={time}
                            type="button"
                            className={`p-2 border rounded ${
                              selectedTime === time
                                ? 'bg-primary text-white border-primary'
                                : 'bg-white hover:bg-gray-50'
                            }`}
                            onClick={() => setSelectedTime(time)}
                          >
                            {time}
                          </button>
                        ))
                      ) : (
                        <p className="col-span-2 text-gray-500">
                          No available time slots for this date.
                        </p>
                      )}
                    </div>
                    {errors.time && (
                      <p className="text-red-500 text-sm mt-1">{errors.time}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Session Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-700 mb-2">Session Type</label>
                    <div className="flex space-x-4">
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          className="form-radio"
                          name="sessionType"
                          value="online"
                          checked={sessionType === "online"}
                          onChange={(e) => setSessionType(e.target.value)}
                        />
                        <span className="ml-2">Online</span>
                      </label>
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          className="form-radio"
                          name="sessionType"
                          value="in-person"
                          checked={sessionType === "in-person"}
                          onChange={(e) => setSessionType(e.target.value)}
                        />
                        <span className="ml-2">In-person</span>
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 mb-2">Duration</label>
                    <select
                      className="block w-full border border-gray-300 rounded px-4 py-2"
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                    >
                      <option value={30}>30 minutes</option>
                      <option value={60}>1 hour</option>
                      <option value={90}>1 hour 30 minutes</option>
                      <option value={120}>2 hours</option>
                    </select>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-gray-700 mb-2">
                      Topic <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className={`block w-full border ${
                        errors.topic ? 'border-red-500' : 'border-gray-300'
                      } rounded px-4 py-2`}
                      placeholder="What would you like to focus on?"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                    />
                    {errors.topic && (
                      <p className="text-red-500 text-sm mt-1">{errors.topic}</p>
                    )}
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-gray-700 mb-2">Additional Notes</label>
                    <textarea
                      className="block w-full border border-gray-300 rounded px-4 py-2"
                      rows={4}
                      placeholder="Any additional information the tutor should know"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    ></textarea>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Confirm Booking</h2>
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-500 text-sm">Tutor</p>
                      <p className="font-medium">{tutor.name}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">Subject</p>
                      <p className="font-medium">{tutor.subject}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">Date</p>
                      <p className="font-medium">{selectedDate.toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">Time</p>
                      <p className="font-medium">{selectedTime}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">Duration</p>
                      <p className="font-medium">
                        {duration === 60
                          ? "1 hour"
                          : duration === 30
                          ? "30 minutes"
                          : `${duration / 60} hours`}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">Session Type</p>
                      <p className="font-medium capitalize">{sessionType}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-gray-500 text-sm">Topic</p>
                      <p className="font-medium">{topic}</p>
                    </div>
                    {notes && (
                      <div className="col-span-2">
                        <p className="text-gray-500 text-sm">Additional Notes</p>
                        <p className="font-medium">{notes}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <div className="flex justify-between">
                    <p className="font-medium">Session Fee</p>
                    <p className="font-medium">${(tutor.rate * duration / 60).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between mt-8">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="bg-gray-200 text-gray-800 py-2 px-6 rounded hover:bg-gray-300"
                >
                  Back
                </button>
              ) : (
                <div></div>
              )}
              
              {step < 3 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (step === 1 && !selectedTime) {
                      setErrors({ time: "Please select a time" });
                      return;
                    }
                    setErrors({});
                    setStep(step + 1);
                  }}
                  className="bg-primary text-white py-2 px-6 rounded hover:bg-primary-dark"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="submit"
                  className="bg-primary text-white py-2 px-6 rounded hover:bg-primary-dark"
                >
                  Confirm Booking
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookSession;