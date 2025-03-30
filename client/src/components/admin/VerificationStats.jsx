import { useState, useEffect } from 'react';
import axios from 'axios';

const VerificationStats = () => {
  const [stats, setStats] = useState({
    pending: 0,
    verified: 0,
    rejected: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get('/api/admin/verifications/stats');
        if (response.data.success) {
          setStats(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching verification stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <div className="animate-pulse">Loading stats...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
        <h3 className="text-yellow-800 font-semibold">Pending</h3>
        <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
      </div>
      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
        <h3 className="text-green-800 font-semibold">Verified</h3>
        <p className="text-2xl font-bold text-green-600">{stats.verified}</p>
      </div>
      <div className="bg-red-50 p-4 rounded-lg border border-red-200">
        <h3 className="text-red-800 font-semibold">Rejected</h3>
        <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
      </div>
    </div>
  );
};

export default VerificationStats;
