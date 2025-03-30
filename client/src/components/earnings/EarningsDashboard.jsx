import { useState, useEffect } from 'react';
import axios from 'axios';

const EarningsDashboard = () => {
  const [earnings, setEarnings] = useState({
    totalEarnings: 0,
    weeklyEarnings: 0,
    monthlyEarnings: 0,
    pendingAmount: 0,
    paidAmount: 0,
    sessionCount: 0,
    completed: 0,
    pending: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('/api/sessions/earnings', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data?.success) {
        setEarnings(response.data.data);
      } else {
        throw new Error(response.data?.message || 'Failed to fetch earnings');
      }
    } catch (err) {
      console.error('Failed to fetch earnings:', err);
      setError(err.response?.data?.message || 'Unable to load earnings data');
      setEarnings({
        totalEarnings: 0,
        weeklyEarnings: 0,
        monthlyEarnings: 0,
        pendingAmount: 0,
        paidAmount: 0,
        sessionCount: 0,
        completed: 0,
        pending: 0
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center p-8">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );

  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Total Earnings</h3>
          <p className="text-3xl font-bold text-indigo-600">
            ${earnings.totalEarnings.toFixed(2)}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            From {earnings.completed} completed sessions
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">This Week</h3>
          <p className="text-3xl font-bold text-green-600">
            ${earnings.weeklyEarnings.toFixed(2)}
          </p>
          <div className="text-sm text-gray-600 mt-1">
            Weekly progress
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">This Month</h3>
          <p className="text-3xl font-bold text-blue-600">
            ${earnings.monthlyEarnings.toFixed(2)}
          </p>
          <div className="text-sm text-gray-600 mt-1">
            Monthly earnings
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-800 mb-6">Session Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-yellow-50 rounded-lg border-2 border-yellow-200">
            <p className="text-sm font-medium text-yellow-800">Pending Sessions</p>
            <p className="text-3xl font-bold text-yellow-700 mt-2">
              {earnings.pending}
            </p>
          </div>
          
          <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200">
            <p className="text-sm font-medium text-green-800">Completed Sessions</p>
            <p className="text-3xl font-bold text-green-700 mt-2">
              {earnings.completed}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EarningsDashboard;
