"use client";

import { createContext, useContext, useState } from "react";
import axios from "axios";

const SessionContext = createContext();

export const SessionProvider = ({ children }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getSessions = async (role) => {
    setLoading(true);
    try {
      const endpoint = role === 'tutor' ? '/api/sessions/tutor' : '/api/sessions/student';
      const response = await axios.get(endpoint);
      setSessions(response.data.data || []);
      return response.data.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch sessions");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createSession = async (sessionData) => {
    setLoading(true);
    try {
      const response = await axios.post('/api/sessions', sessionData);
      setSessions(prev => [...prev, response.data.data]);
      return response.data.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create session");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateSession = async (sessionId, updateData) => {
    setLoading(true);
    try {
      const response = await axios.put(`/api/sessions/${sessionId}`, updateData);
      setSessions(prev => prev.map(session => 
        session._id === sessionId ? response.data.data : session
      ));
      return response.data.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update session");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <SessionContext.Provider
      value={{
        sessions,
        loading,
        error,
        getSessions,
        createSession,
        updateSession
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
};

export default SessionContext;
