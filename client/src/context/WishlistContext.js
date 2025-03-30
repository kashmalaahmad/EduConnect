"use client";

import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from './auth-context';

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState([]);
  const [sortBy, setSortBy] = useState("name"); // 'name', 'rating', 'price'
  const [filterBy, setFilterBy] = useState({
    subject: "",
    minRating: 0,
    maxPrice: Infinity,
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchWishlist = async () => {
    try {
      if (!user) {
        setWishlist([]);
        setLoading(false);
        return;
      }

      const response = await axios.get('/api/wishlist');
      if (response.data?.success) {
        setWishlist(response.data.data || []);
      }
    } catch (error) {
      if (error.response?.status !== 401) {
        console.error('Failed to fetch wishlist:', error);
      }
      setWishlist([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchWishlist();
    } else {
      setWishlist([]);
      setLoading(false);
    }
  }, [user]);

  const addToWishlist = async (tutor) => {
    try {
      const response = await axios.post("http://localhost:5000/api/wishlist", {
        tutorId: tutor._id
      });

      if (response.data.success) {
        setWishlist(prev => [...prev, tutor]);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Error adding to wishlist:", err);
      throw new Error(err.response?.data?.message || "Failed to add to wishlist");
    }
  };

  const removeFromWishlist = async (tutorId) => {
    try {
      const res = await axios.delete(`http://localhost:5000/api/wishlist/${tutorId}`);
      setWishlist(res.data.data || []);
    } catch (err) {
      console.error("Failed to remove from wishlist:", err);
    }
  };

  const isInWishlist = (tutorId) => {
    return wishlist.some((tutor) => tutor._id === tutorId);
  };

  // Get sorted and filtered wishlist
  const getSortedAndFilteredWishlist = () => {
    return wishlist
      .filter((tutor) => {
        const matchesSubject =
          !filterBy.subject ||
          tutor.subjects.some((s) =>
            s.toLowerCase().includes(filterBy.subject.toLowerCase())
          );
        const matchesRating = tutor.rating >= filterBy.minRating;
        const matchesPrice = tutor.hourlyRate <= filterBy.maxPrice;
        return matchesSubject && matchesRating && matchesPrice;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "rating":
            return b.rating - a.rating;
          case "price":
            return a.hourlyRate - b.hourlyRate;
          default:
            return a.name.localeCompare(b.name);
        }
      });
  };

  const value = {
    wishlist: getSortedAndFilteredWishlist(),
    wishlistCount: wishlist.length || 0,
    loading,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    setSortBy,
    setFilterBy,
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
};

export default WishlistContext;