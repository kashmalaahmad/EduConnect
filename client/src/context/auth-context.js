"use client"

import { createContext, useContext, useState, useEffect } from "react"
import axios from "axios"

// Configure axios defaults and interceptors
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
axios.defaults.withCredentials = true;
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const AuthContext = createContext()

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    checkAuthStatus();
  }, [])

  useEffect(() => {
    // Configure axios defaults and interceptors
    axios.defaults.baseURL = process.env.REACT_APP_API_URL;
    
    // Request interceptor for API calls
    axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for API calls
    axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          setUser(null);
          // Optionally redirect to login
        }
        return Promise.reject(error);
      }
    );
  }, []);

  const loginErrorHandler = (error) => {
    if (error.response?.status === 500) {
      return "Server error. Please try again later.";
    }
    return error.response?.data?.message || "Login failed. Please try again.";
  };

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      const response = await axios.get('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data?.success) {
        setUser(response.data.data);
      } else {
        setUser(null);
        localStorage.removeItem('token');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post("/api/auth/login", { email, password });
      if (response.data.success) {
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        setUser(user);
        return { success: true };
      }
      return { success: false, error: response.data.message };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || "Login failed" };
    }
  };

  const adminLogin = async (email, password) => {
    try {
      setError(null);
      const res = await axios.post("/api/auth/admin/login", {
        email,
        password,
      });

      const { token, user } = res.data;
      
      if (!token || !user || user.role !== 'admin') {
        throw new Error("Invalid admin credentials");
      }

      localStorage.setItem("token", token);
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      setUser(user);
      return user;

    } catch (err) {
      const errorMessage = loginErrorHandler(err);
      setError(errorMessage);
      throw err;
    }
  };

  const register = async (formData) => {
    try {
      const response = await axios.post('/api/auth/register', formData);
      if (response.data.success) {
        setUser(response.data.user);
        // Handle successful registration
        return { success: true };
      } 
      return { success: false, error: response.data.message };
    } catch (err) {
      return { 
        success: false, 
        error: err.response?.data?.message || "Registration failed" 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("token")
    setUser(null)
  }

  const updateProfile = async (profileData) => {
    try {
      setError(null)
      const token = localStorage.getItem("token")
      const res = await axios.put(
        "/api/auth/profile",
        profileData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      setUser(res.data.data)
      return res.data.data
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile. Please try again.")
      throw err
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        register,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export default AuthContext