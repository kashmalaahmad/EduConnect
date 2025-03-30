"use client"

import { Link } from "react-router-dom"
import { MapPinIcon as MapPin } from "@heroicons/react/24/outline"
import { StarIcon as Star } from "@heroicons/react/24/solid"
import { useWishlist } from "../../context"
import { DEFAULT_AVATAR } from '../../utils/constants';
import IconLocation from "@heroicons/react/24/outline/MapPinIcon";

const TutorCard = ({ tutor }) => {
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist()
  const inWishlist = isInWishlist(tutor._id)

  const handleWishlistToggle = (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (inWishlist) {
      removeFromWishlist(tutor._id)
    } else {
      addToWishlist(tutor)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <Link to={`/student/tutors/${tutor._id}`} className="block">
        <div className="p-6">
          <div className="flex items-start">
            <img
              src={tutor.profilePicture || DEFAULT_AVATAR}
              alt={tutor.name}
              className="w-16 h-16 rounded-full object-cover mr-4"
              onError={(e) => {
                e.target.onerror = null
                e.target.src = DEFAULT_AVATAR
              }}
            />
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h2 className="text-xl font-bold">{tutor.name}</h2>
                <button
                  onClick={handleWishlistToggle}
                  className={`p-2 rounded-full ${
                    inWishlist ? "text-red-500 hover:bg-red-50" : "text-gray-400 hover:bg-gray-50"
                  }`}
                  title={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill={inWishlist ? "currentColor" : "none"}
                    stroke="currentColor"
                    strokeWidth={inWishlist ? "0" : "1.5"}
                  >
                    <path
                      fillRule="evenodd"
                      d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
              <div className="flex items-center mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= Math.round(tutor.rating || 0) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                    }`}
                  />
                ))}
                <span className="ml-1 text-sm text-gray-600">
                  {tutor.rating ? tutor.rating.toFixed(1) : "0"} ({tutor.reviewCount || 0})
                </span>
              </div>
              {tutor.city && (
                <div className="flex items-center mt-1 text-gray-600">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span className="text-sm">{tutor.city}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>

      <div className="p-4">
        {/* Subject tags */}
        <div className="flex flex-wrap gap-2 mb-3">
          {tutor.subjects.map((subject, idx) => (
            <span key={idx} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              {subject.name} ({subject.proficiencyLevel})
            </span>
          ))}
        </div>

        {/* Bio preview */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{tutor.bio}</p>

        {/* Teaching mode and location */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span className="flex items-center">
            <IconLocation className="w-4 h-4 mr-1" />
            {tutor.city} • {tutor.teachingMode}
          </span>
          <span className="font-medium text-primary">
            ${tutor.hourlyRate}/hr
          </span>
        </div>

        {/* Availability preview */}
        <div className="mt-3 text-xs text-gray-500">
          <p>Available: {tutor.availability
            .filter(slot => slot.startTime && slot.endTime)
            .map(slot => slot.day)
            .join(', ')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TutorCard

