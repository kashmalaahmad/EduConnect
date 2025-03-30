import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const VerificationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tutor, setTutor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchVerificationDetails();
  }, [id]);

  const fetchVerificationDetails = async () => {
    try {
      const response = await axios.get(`/api/admin/verification/${id}`);
      setTutor(response.data.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch verification details');
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (status) => {
    try {
      setSubmitting(true);
      await axios.put(`/api/auth/${id}/verify`, {
        status,
        comment: comment.trim()
      });
      navigate('/admin/verification');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update verification status');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="animate-pulse">Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!tutor) return <div>Tutor not found</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-6">Verification Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Basic Information</h3>
              <div className="space-y-2">
                <p><span className="font-medium">Name:</span> {tutor.user?.name}</p>
                <p><span className="font-medium">Email:</span> {tutor.user?.email}</p>
                <p><span className="font-medium">City:</span> {tutor.city}</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Subjects</h3>
              <div className="flex flex-wrap gap-2">
                {tutor.subjects?.map((subject, index) => (
                  <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                    {subject}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Qualifications</h3>
            <div className="space-y-4">
              {tutor.qualifications?.map((qual, index) => (
                <div key={index} className="border-b pb-4">
                  <p><span className="font-medium">Degree:</span> {qual.degree}</p>
                  <p><span className="font-medium">Institution:</span> {qual.institution}</p>
                  <p><span className="font-medium">Year:</span> {qual.year}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Verification Comment</h3>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full border rounded-md p-2"
              rows="4"
              placeholder="Add a comment about the verification decision..."
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              onClick={() => navigate('/admin/verification')}
              className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-50"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              onClick={() => handleVerification('rejected')}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              disabled={submitting}
            >
              Reject
            </button>
            <button
              onClick={() => handleVerification('verified')}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              disabled={submitting}
            >
              Verify
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationDetails;