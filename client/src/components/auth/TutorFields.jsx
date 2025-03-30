"use client";

import { useState } from "react";
import { TEACHING_MODES } from "../../utils/constants";

const TutorFields = ({ formData, onChange }) => {
  const handleSubjectChange = (index, field, value) => {
    const updatedSubjects = [...formData.subjects];
    
    // If the current subject is a string (from initial state or backend)
    if (typeof updatedSubjects[index] === 'string' || !updatedSubjects[index]) {
      updatedSubjects[index] = {
        name: field === 'name' ? value : '',
        proficiencyLevel: field === 'proficiencyLevel' ? value : 'Beginner'
      };
    } else {
      // Update existing subject object
      updatedSubjects[index] = {
        ...updatedSubjects[index],
        [field]: value
      };
    }

    onChange("subjects", updatedSubjects);
  };

  const addSubject = () => {
    onChange("subjects", [
      ...formData.subjects,
      { name: "", proficiencyLevel: "Beginner" }
    ]);
  };

  const removeSubject = (index) => {
    const updatedSubjects = formData.subjects.filter((_, i) => i !== index);
    onChange("subjects", updatedSubjects);
  };

  const handleQualificationChange = (index, field, value) => {
    const updatedQualifications = formData.qualifications.map((qual, i) => {
      if (i === index) {
        return { ...qual, [field]: value };
      }
      return qual;
    });
    onChange("qualifications", updatedQualifications);
  };

  const addQualification = () => {
    onChange("qualifications", [
      ...formData.qualifications,
      { degree: "", institution: "", year: "", document: null }
    ]);
  };

  const removeQualification = (index) => {
    const updatedQualifications = formData.qualifications.filter((_, i) => i !== index);
    onChange("qualifications", updatedQualifications);
  };

  const handleAvailabilityChange = (day, field, value) => {
    const updatedAvailability = formData.availability.map(slot => {
      if (slot.day === day) {
        return { ...slot, [field]: value };
      }
      return slot;
    });
    onChange("availability", updatedAvailability);
  };

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <div>
        <label htmlFor="hourlyRate" className="block text-sm font-medium text-gray-700">
          Hourly Rate (PKR)
        </label>
        <input
          type="number"
          id="hourlyRate"
          value={formData.hourlyRate}
          onChange={(e) => onChange("hourlyRate", e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          min="0"
          step="0.01"
          required
        />
      </div>

      <div>
        <label htmlFor="city" className="block text-sm font-medium text-gray-700">
          City
        </label>
        <input
          type="text"
          id="city"
          value={formData.city}
          onChange={(e) => onChange("city", e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          required
        />
      </div>

      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
          Bio
        </label>
        <textarea
          id="bio"
          value={formData.bio}
          onChange={(e) => onChange("bio", e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          rows={3}
          required
        />
      </div>

      {/* Subjects Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Subjects
        </label>
        {formData.subjects.map((subject, index) => (
          <div key={index} className="flex gap-4 items-start mb-4">
            <div className="flex-1">
              <input
                type="text"
                value={typeof subject === 'string' ? subject : subject.name}
                onChange={(e) => handleSubjectChange(index, "name", e.target.value)}
                className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Subject name"
                required
              />
            </div>
            <div className="flex-1">
              <select
                value={typeof subject === 'string' ? 'Beginner' : subject.proficiencyLevel}
                onChange={(e) => handleSubjectChange(index, "proficiencyLevel", e.target.value)}
                className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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
        <button
          type="button"
          onClick={addSubject}
          className="mt-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Add Subject
        </button>
      </div>

      {/* Qualifications Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Qualifications
        </label>
        {formData.qualifications.map((qual, index) => (
          <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <input
              type="text"
              value={qual.degree}
              onChange={(e) => handleQualificationChange(index, "degree", e.target.value)}
              className="border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Degree"
              required
            />
            <input
              type="text"
              value={qual.institution}
              onChange={(e) => handleQualificationChange(index, "institution", e.target.value)}
              className="border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Institution"
              required
            />
            <div className="flex gap-2">
              <input
                type="text"
                value={qual.year}
                onChange={(e) => handleQualificationChange(index, "year", e.target.value)}
                className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Year"
                required
              />
              <button
                type="button"
                onClick={() => removeQualification(index)}
                className="text-red-600 hover:text-red-800"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={addQualification}
          className="mt-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Add Qualification
        </button>
      </div>

      {/* Availability Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Availability (Fill in only for days you are available)
        </label>
        {formData.availability.map((slot) => (
          <div key={slot.day} className="grid grid-cols-3 gap-4 mb-4">
            <div className="flex items-center">
              <span className="text-sm font-medium capitalize">{slot.day}</span>
            </div>
            <input
              type="time"
              value={slot.startTime}
              onChange={(e) => handleAvailabilityChange(slot.day, "startTime", e.target.value)}
              className="border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
            <input
              type="time"
              value={slot.endTime}
              onChange={(e) => handleAvailabilityChange(slot.day, "endTime", e.target.value)}
              className="border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TutorFields;