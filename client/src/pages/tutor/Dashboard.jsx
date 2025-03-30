import TutorSessionManagement from '../../components/sessions/TutorSessionManagement';
import EarningsDashboard from '../../components/earnings/EarningsDashboard';
import { SessionProvider } from '../../context';

const TutorDashboard = () => {
  return (
    <SessionProvider>
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Tutor Dashboard</h1>
          
          <div className="space-y-8">
            {/* Earnings Section */}
            <section className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">Earnings Overview</h2>
                <select className="bg-gray-50 border border-gray-300 rounded-md shadow-sm px-3 py-2">
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="year">This Year</option>
                </select>
              </div>
              <EarningsDashboard />
            </section>

            {/* Sessions Section */}
            <section className="bg-gray-50 rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Session Management</h2>
              <TutorSessionManagement />
            </section>
          </div>
        </div>
      </div>
    </SessionProvider>
  );
};

export default TutorDashboard;
