import React, { useState, useEffect } from 'react';
import { useSession } from '../../context';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import axios from 'axios';

const EarningsTracker = () => {
  const { sessions } = useSession();
  const [timeframe, setTimeframe] = useState('month'); // 'week', 'month', 'year'
  const [earnings, setEarnings] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    cancelled: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    calculateEarnings();
  }, [sessions, timeframe]);

  const fetchEarningsData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/sessions/earnings');
      if (response.data?.success) {
        setEarnings(response.data.data);
      }
    } catch (err) {
      setError('Failed to fetch earnings data');
    } finally {
      setLoading(false);
    }
  };

  const calculateEarnings = () => {
    const now = new Date();
    let startDate;

    switch (timeframe) {
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = startOfMonth(now);
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        startDate = startOfMonth(now);
    }

    const filteredSessions = sessions.filter(
      session => new Date(session.date) >= startDate
    );

    const total = filteredSessions.reduce((acc, session) => {
      if (session.status === 'completed') {
        return acc + (session.duration / 60) * session.tutor.hourlyRate;
      }
      return acc;
    }, 0);

    const completed = filteredSessions.filter(
      session => session.status === 'completed'
    ).length;

    const pending = filteredSessions.filter(
      session => session.status === 'pending'
    ).length;

    const cancelled = filteredSessions.filter(
      session => session.status === 'cancelled'
    ).length;

    setEarnings({
      total,
      completed,
      pending,
      cancelled
    });
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Earnings Tracker</h1>
        <div className="space-x-2">
          <button
            onClick={() => setTimeframe('week')}
            className={`px-4 py-2 rounded ${
              timeframe === 'week' ? 'bg-primary text-white' : 'bg-gray-200'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setTimeframe('month')}
            className={`px-4 py-2 rounded ${
              timeframe === 'month' ? 'bg-primary text-white' : 'bg-gray-200'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setTimeframe('year')}
            className={`px-4 py-2 rounded ${
              timeframe === 'year' ? 'bg-primary text-white' : 'bg-gray-200'
            }`}
          >
            Year
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">Total Earnings</h3>
          <p className="text-3xl font-bold text-primary">
            ${earnings.total.toFixed(2)}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">Completed Sessions</h3>
          <p className="text-3xl font-bold text-green-600">
            {earnings.completed}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">Pending Sessions</h3>
          <p className="text-3xl font-bold text-yellow-600">
            {earnings.pending}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">Cancelled Sessions</h3>
          <p className="text-3xl font-bold text-red-600">
            {earnings.cancelled}
          </p>
        </div>
      </div>

      <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Recent Sessions</h2>
        <div className="space-y-4">
          {sessions
            .filter(session => session.status === 'completed')
            .slice(0, 5)
            .map(session => (
              <div
                key={session._id}
                className="flex justify-between items-center border-b pb-4"
              >
                <div>
                  <p className="font-medium">{session.student.name}</p>
                  <p className="text-gray-600">
                    {format(new Date(session.date), 'PPP')}
                  </p>
                </div>
                <p className="font-semibold">
                  ${((session.duration / 60) * session.tutor.hourlyRate).toFixed(2)}
                </p>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default EarningsTracker;