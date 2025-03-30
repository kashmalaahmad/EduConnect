"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { format, subMonths } from "date-fns"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

const ReportingDashboard = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTutors: 0,
    totalStudents: 0,
    totalSessions: 0,
    totalEarnings: 0,
    averageRating: 0,
    completedSessions: 0,
    pendingSessions: 0,
  })
  const [monthlyData, setMonthlyData] = useState([])
  const [subjectData, setSubjectData] = useState([])
  const [locationData, setLocationData] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [timeRange, setTimeRange] = useState("6months")
  const [selectedDateRange, setSelectedDateRange] = useState({
    start: subMonths(new Date(), 1),
    end: new Date()
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const [statsRes, monthlyRes, subjectRes, locationRes] = await Promise.all([
          axios.get("/api/admin/stats/platform"),
          axios.get("/api/admin/reports/export", {
            params: { 
              type: "revenue",
              range: timeRange,
              format: 'json'
            }
          }),
          axios.get("/api/admin/stats/platform", {
            params: { type: "subjects" }
          }),
          axios.get("/api/admin/stats/platform", {
            params: { type: "locations" }
          })
        ]);

        if (statsRes.data?.success) {
          setStats({
            totalUsers: statsRes.data.data.totalUsers || 0,
            totalTutors: statsRes.data.data.totalTutors || 0,
            totalStudents: statsRes.data.data.totalStudents || 0,
            totalSessions: statsRes.data.data.totalSessions || 0,
            totalEarnings: statsRes.data.data.totalRevenue || 0,
            averageRating: statsRes.data.data.averageRating || 0,
            completedSessions: statsRes.data.data.sessionStats?.find(s => s._id === 'completed')?.count || 0,
            pendingSessions: statsRes.data.data.sessionStats?.find(s => s._id === 'pending')?.count || 0,
          });
        }

        // Transform monthly data to match chart requirements
        if (monthlyRes.data?.success) {
          const transformedData = monthlyRes.data.data.map(item => ({
            ...item,
            earnings: Number(item.earnings || 0),
            sessions: Number(item.sessions || 0),
            month: format(new Date(item.month), 'MMM yyyy')
          }));
          setMonthlyData(transformedData);
        }

        if (subjectRes.data?.success) {
          setSubjectData(subjectRes.data.data.subjectStats || []);
        }

        if (locationRes.data?.success) {
          setLocationData(locationRes.data.data.cityStats || []);
        }

        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err.response?.data?.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeRange]);

  const handleTimeRangeChange = (e) => {
    setTimeRange(e.target.value)
  }

  const formatCurrency = (amount) => {
    return `PKR ${amount.toFixed(2)}`
  }

  const handleExport = async (type, format = 'csv') => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/admin/reports/export`, {
        params: {
          type,
          startDate: selectedDateRange.start,
          endDate: selectedDateRange.end,
          format
        },
        responseType: format === 'csv' ? 'blob' : 'json'
      });

      if (format === 'csv' && response.data) {
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${type}-report.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }
      
      setError(null);
    } catch (error) {
      console.error('Export error:', error);
      setError(error.response?.data?.message || 'Failed to export report');
    } finally {
      setLoading(false);
    }
  };

  // Colors for pie charts
  const COLORS = ["#4f46e5", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#6366f1"]

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Date Range Filter */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Date Range</h2>
          <div className="flex gap-4">
            <input
              type="date"
              value={format(selectedDateRange.start, 'yyyy-MM-dd')}
              onChange={(e) => setSelectedDateRange(prev => ({
                ...prev,
                start: new Date(e.target.value)
              }))}
              className="border rounded px-3 py-2"
            />
            <input
              type="date"
              value={format(selectedDateRange.end, 'yyyy-MM-dd')}
              onChange={(e) => setSelectedDateRange(prev => ({
                ...prev,
                end: new Date(e.target.value)
              }))}
              className="border rounded px-3 py-2"
            />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-gray-500 text-sm font-medium mb-2">Total Users</h3>
          <p className="text-3xl font-bold text-primary">{stats.totalUsers}</p>
          <div className="flex justify-between mt-2 text-sm">
            <span className="text-gray-500">Students: {stats.totalStudents}</span>
            <span className="text-gray-500">Tutors: {stats.totalTutors}</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-gray-500 text-sm font-medium mb-2">Total Sessions</h3>
          <p className="text-3xl font-bold text-primary">{stats.totalSessions}</p>
          <div className="flex justify-between mt-2 text-sm">
            <span className="text-gray-500">Completed: {stats.completedSessions}</span>
            <span className="text-gray-500">Pending: {stats.pendingSessions}</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-gray-500 text-sm font-medium mb-2">Total Earnings</h3>
          <p className="text-3xl font-bold text-primary">{formatCurrency(stats.totalEarnings)}</p>
          <p className="text-sm text-gray-500 mt-2">
            Avg. {formatCurrency(stats.totalSessions > 0 ? stats.totalEarnings / stats.totalSessions : 0)} per session
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-gray-500 text-sm font-medium mb-2">Average Rating</h3>
          <p className="text-3xl font-bold text-primary">{stats.averageRating.toFixed(1)} / 5</p>
          <div className="flex items-center mt-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                className={`h-4 w-4 ${star <= Math.round(stats.averageRating) ? "text-yellow-400" : "text-gray-300"}`}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
        </div>
      </div>

      {/* Add Export Buttons */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={() => handleExport('subjects')}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Export Subjects Report
        </button>
        <button
          onClick={() => handleExport('cities')}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Export Cities Report
        </button>
        <button
          onClick={() => handleExport('growth')}
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
        >
          Export Growth Report
        </button>
      </div>

      {/* Monthly Earnings Chart */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Monthly Earnings</h2>
          <select
            value={timeRange}
            onChange={handleTimeRangeChange}
            className="border border-gray-300 rounded-md py-1 px-3 focus:outline-none focus:ring-primary focus:border-primary"
          >
            <option value="3months">Last 3 Months</option>
            <option value="6months">Last 6 Months</option>
            <option value="12months">Last 12 Months</option>
          </select>
        </div>

        <div className="h-80">
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value, name) => [formatCurrency(value), name]} />
                <Legend />
                <Bar dataKey="earnings" name="Earnings" fill="#4f46e5" />
                <Bar dataKey="sessions" name="Sessions" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-500">No earnings data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Subject Distribution */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-6">Sessions by Subject</h2>

          <div className="h-80">
            {subjectData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={subjectData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {subjectData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name, props) => [`${value} sessions`, props.payload.name]} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-gray-500">No subject data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Location Distribution */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-6">Sessions by Location</h2>

          <div className="h-80">
            {locationData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={locationData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {locationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name, props) => [`${value} sessions`, props.payload.name]} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-gray-500">No location data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-6">Recent Activity</h2>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Event
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  User
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Details
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Date & Time
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentActivity.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                    No recent activity
                  </td>
                </tr>
              ) : (
                recentActivity.map((activity) => (
                  <tr key={activity._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${activity.typeColor}`}>
                        {activity.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{activity.user.name}</div>
                      <div className="text-sm text-gray-500">{activity.user.role}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{activity.details}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(activity.createdAt), "MMM dd, yyyy HH:mm")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default ReportingDashboard

