"use client"

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useTutor } from '../../context';
import { TEACHING_MODES, DAYS_OF_WEEK, TIME_SLOTS } from '../../utils/constants';
import axios from 'axios';

const ProfileManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { updateTutorProfile } = useTutor();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    subjects: [{ name: '', proficiencyLevel: 'Beginner' }],
    qualifications: [{ 
      degree: '', 
      institution: '', 
      year: '', 
      document: null 
    }],
    hourlyRate: '',
    city: '',
    bio: '',
    teachingMode: 'both',
    availability: DAYS_OF_WEEK.map(day => ({
      day: day.toLowerCase(),
      startTime: '',
      endTime: ''
    })),
    profilePicture: null
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/tutors/profile/me');
        if (response.data?.success) {
          const profile = response.data.data;
          setFormData(prev => ({
            ...prev,
            ...profile,
            subjects: profile.subjects?.length ? profile.subjects : [{ name: '', proficiencyLevel: 'Beginner' }],
            qualifications: profile.qualifications?.length ? profile.qualifications : [{ degree: '', institution: '', year: '' }]
          }));
        }
      } catch (err) {
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFormDataChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubjectChange = (index, field, value) => {
    const updatedSubjects = formData.subjects.map((subject, i) => {
      if (i === index) {
        const currentSubject = typeof subject === 'string' 
          ? { name: subject, proficiencyLevel: "Beginner" }
          : { ...subject };
        
        return {
          ...currentSubject,
          [field]: value
        };
      }
      return subject;
    });

    handleFormDataChange("subjects", updatedSubjects);
  };

  const addSubject = () => {
    handleFormDataChange("subjects", [
      ...formData.subjects,
      { name: "", proficiencyLevel: "Beginner" }
    ]);
  };

  const removeSubject = (index) => {
    const updatedSubjects = formData.subjects.filter((_, i) => i !== index);
    handleFormDataChange("subjects", updatedSubjects);
  };

  const handleQualificationChange = (index, field, value) => {
    const newQuals = [...formData.qualifications];
    if (!newQuals[index]) {
      newQuals[index] = {};
    }
    newQuals[index][field] = value;
    setFormData(prev => ({
      ...prev,
      qualifications: newQuals
    }));
  };

  const handleAddQualification = () => {
    setFormData(prev => ({
      ...prev,
      qualifications: [...prev.qualifications, { degree: '', institution: '', year: '', document: null }]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Create FormData object
      const formDataObj = new FormData();
      
      // Handle file uploads for qualifications
      const qualificationsWithFiles = formData.qualifications.map(qual => {
        if (qual.document instanceof File) {
          const documentKey = `qualification_${Date.now()}_${qual.document.name}`;
          formDataObj.append('documents', qual.document, documentKey);
          return { ...qual, document: documentKey };
        }
        return qual;
      });

      // Append other data
      formDataObj.append('subjects', JSON.stringify(formData.subjects));
      formDataObj.append('qualifications', JSON.stringify(qualificationsWithFiles));
      formDataObj.append('hourlyRate', formData.hourlyRate);
      formDataObj.append('city', formData.city);
      formDataObj.append('bio', formData.bio);
      formDataObj.append('teachingMode', formData.teachingMode);
      formDataObj.append('availability', JSON.stringify(formData.availability));
      
      if (formData.profilePicture instanceof File) {
        formDataObj.append('profilePicture', formData.profilePicture);
      }

      await axios.post('/api/tutors/profile', formDataObj, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/tutor/dashboard');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Manage Profile</h1>
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          Profile updated successfully! Redirecting...
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Profile Picture</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFormData({ ...formData, profilePicture: e.target.files[0] })}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full rounded-md border-gray-300"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows="4"
                className="w-full rounded-md border-gray-300"
                required
              ></textarea>
            </div>
          </div>
        </div>

        {/* Subjects */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Subjects</h2>
          <div className="space-y-4">
            {formData.subjects.map((subject, index) => (
              <div key={index} className="flex gap-4 items-start">
                <div className="flex-1">
                  <input
                    type="text"
                    value={typeof subject === 'string' ? subject : subject.name || ''}
                    onChange={(e) => handleSubjectChange(index, "name", e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Subject name"
                  />
                </div>
                <div className="flex-1">
                  <select
                    value={typeof subject === 'string' ? "Beginner" : (subject.proficiencyLevel || "Beginner")}
                    onChange={(e) => handleSubjectChange(index, "proficiencyLevel", e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Expert">Expert</option>
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => removeSubject(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addSubject}
            className="text-blue-600 hover:text-blue-800"
          >
            Add Subject
          </button>
        </div>

        {/* Qualifications */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Qualifications</h2>
          {formData.qualifications.map((qual, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <input
                type="text"
                value={qual.degree}
                onChange={(e) => handleQualificationChange(index, 'degree', e.target.value)}
                placeholder="Degree"
                className="rounded-md border-gray-300"
                required
              />
              <input
                type="text"
                value={qual.institution}
                onChange={(e) => handleQualificationChange(index, 'institution', e.target.value)}
                placeholder="Institution"
                className="rounded-md border-gray-300"
                required
              />
              <input
                type="number"
                value={qual.year}
                onChange={(e) => handleQualificationChange(index, 'year', e.target.value)}
                placeholder="Year"
                className="rounded-md border-gray-300"
                required
              />
              <input
                type="file"
                onChange={(e) => handleQualificationChange(index, 'document', e.target.files[0])}
                className="md:col-span-3"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddQualification}
            className="text-blue-600 hover:text-blue-800"
          >
            Add Qualification
          </button>
        </div>

        {/* Teaching Preferences */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Teaching Preferences</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate ($)</label>
              <input
                type="number"
                name="hourlyRate"
                value={formData.hourlyRate}
                onChange={handleChange}
                className="w-full rounded-md border-gray-300"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teaching Mode</label>
              <select
                name="teachingMode"
                value={formData.teachingMode}
                onChange={handleChange}
                className="w-full rounded-md border-gray-300"
              >
                {TEACHING_MODES.map(mode => (
                  <option key={mode.value} value={mode.value}>{mode.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Availability */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-lg font-semibold mb-4">Availability Schedule</h2>
          <div className="space-y-4">
            {DAYS_OF_WEEK.map((day) => (
              <div key={day} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                <div className="font-medium">{day}</div>
                <div className="col-span-2 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Start Time</label>
                    <select
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                      value={formData.availability.find(slot => slot.day.toLowerCase() === day.toLowerCase())?.startTime || ''}
                      onChange={(e) => {
                        const newAvailability = [...formData.availability];
                        const dayIndex = newAvailability.findIndex(slot => slot.day.toLowerCase() === day.toLowerCase());
                        if (dayIndex >= 0) {
                          newAvailability[dayIndex] = {
                            ...newAvailability[dayIndex],
                            startTime: e.target.value
                          };
                        } else {
                          newAvailability.push({
                            day: day.toLowerCase(),
                            startTime: e.target.value,
                            endTime: ''
                          });
                        }
                        setFormData(prev => ({ ...prev, availability: newAvailability }));
                      }}
                    >
                      <option value="">Not Available</option>
                      {TIME_SLOTS.map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">End Time</label>
                    <select
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                      value={formData.availability.find(slot => slot.day.toLowerCase() === day.toLowerCase())?.endTime || ''}
                      onChange={(e) => {
                        const newAvailability = [...formData.availability];
                        const dayIndex = newAvailability.findIndex(slot => slot.day.toLowerCase() === day.toLowerCase());
                        if (dayIndex >= 0) {
                          newAvailability[dayIndex] = {
                            ...newAvailability[dayIndex],
                            endTime: e.target.value
                          };
                        } else {
                          newAvailability.push({
                            day: day.toLowerCase(),
                            startTime: '',
                            endTime: e.target.value
                          });
                        }
                        setFormData(prev => ({ ...prev, availability: newAvailability }));
                      }}
                      disabled={!formData.availability.find(slot => slot.day.toLowerCase() === day.toLowerCase())?.startTime}
                    >
                      <option value="">Select End Time</option>
                      {TIME_SLOTS.filter(time => {
                        const startTime = formData.availability.find(slot => slot.day.toLowerCase() === day.toLowerCase())?.startTime;
                        return startTime && time > startTime;
                      }).map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <button
                    type="button"
                    className="text-red-600 hover:text-red-800"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        availability: prev.availability.filter(slot => slot.day.toLowerCase() !== day.toLowerCase())
                      }));
                    }}
                  >
                    Clear
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg shadow hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileManagement;

