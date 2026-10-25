import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  getAllOfficerRegistrations, 
  approveOfficerRegistration,
  rejectOfficerRegistration 
} from '../api/officerRegistrationApi';
import LoadingSpinner from '../components/LoadingSpinner';

export default function OfficerRegistrationsPage() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending_approval');
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [approvalData, setApprovalData] = useState({
    role: 'usg_officer',
    permissions: [],
  });

  useEffect(() => {
    fetchRegistrations();
  }, [filter]);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const data = await getAllOfficerRegistrations(params);
      setRegistrations(data);
    } catch (error) {
      console.error('Error fetching registrations:', error);
      toast.error('Failed to load registrations');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      await approveOfficerRegistration(selectedRegistration.id, approvalData);
      toast.success('Registration approved successfully');
      setShowApproveModal(false);
      setSelectedRegistration(null);
      fetchRegistrations();
    } catch (error) {
      console.error('Error approving registration:', error);
      toast.error('Failed to approve registration');
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      await rejectOfficerRegistration(selectedRegistration.id, { rejection_reason: rejectionReason });
      toast.success('Registration rejected');
      setShowRejectModal(false);
      setSelectedRegistration(null);
      setRejectionReason('');
      fetchRegistrations();
    } catch (error) {
      console.error('Error rejecting registration:', error);
      toast.error('Failed to reject registration');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending_verification: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
      pending_approval: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
      approved: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
      rejected: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
    };

    const labels = {
      pending_verification: 'Pending Email Verification',
      pending_approval: 'Pending Approval',
      approved: 'Approved',
      rejected: 'Rejected',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const filteredRegistrations = registrations;

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Officer Registrations</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Review and approve officer account requests</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-1 w-fit">
        <button
          onClick={() => setFilter('all')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
            filter === 'all'
              ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm border border-gray-200 dark:border-gray-700'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('pending_approval')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
            filter === 'pending_approval'
              ? 'bg-white dark:bg-gray-900 text-blue-700 dark:text-blue-400 shadow-sm border border-blue-200 dark:border-gray-700'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => setFilter('approved')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
            filter === 'approved'
              ? 'bg-white dark:bg-gray-900 text-green-700 dark:text-green-400 shadow-sm border border-green-200 dark:border-gray-700'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          Approved
        </button>
        <button
          onClick={() => setFilter('rejected')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
            filter === 'rejected'
              ? 'bg-white dark:bg-gray-900 text-red-700 dark:text-red-400 shadow-sm border border-red-200 dark:border-gray-700'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          Rejected
        </button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Position</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Submitted</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                {filteredRegistrations.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      No registrations found
                    </td>
                  </tr>
                ) : (
                  filteredRegistrations.map((reg) => (
                    <tr key={reg.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {reg.full_name}
                        </div>
                        {reg.student_id && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">{reg.student_id}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {reg.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {reg.usg_position}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(reg.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(reg.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {reg.status === 'pending_approval' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setSelectedRegistration(reg);
                                setShowApproveModal(true);
                              }}
                              className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-1.5"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                setSelectedRegistration(reg);
                                setShowRejectModal(true);
                              }}
                              className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-1.5"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Reject
                            </button>
                          </div>
                        )}
                        {reg.status === 'rejected' && reg.rejection_reason && (
                          <div className="text-xs text-red-600 dark:text-red-400 max-w-xs">
                            <span className="font-medium">Reason:</span> {reg.rejection_reason}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Approve Officer Registration</h3>
            
            <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-semibold">Name:</span> {selectedRegistration?.full_name}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                <span className="font-semibold">Email:</span> {selectedRegistration?.email}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                <span className="font-semibold">Position:</span> {selectedRegistration?.usg_position}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Assign Role
              </label>
              <select
                value={approvalData.role}
                onChange={(e) => setApprovalData({ ...approvalData, role: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
              >
                <option value="usg_officer">USG Officer</option>
                <option value="event_organizer">Event Organizer</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleApprove}
                className="flex-1 py-2.5 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors"
              >
                Approve
              </button>
              <button
                onClick={() => {
                  setShowApproveModal(false);
                  setSelectedRegistration(null);
                }}
                className="flex-1 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Reject Registration</h3>
            
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-semibold">Name:</span> {selectedRegistration?.full_name}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                <span className="font-semibold">Email:</span> {selectedRegistration?.email}
              </p>
            </div>

            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Reason for Rejection *
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows="4"
              placeholder="Explain why this registration is being rejected..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 resize-none mb-4"
            />

            <div className="flex gap-3">
              <button
                onClick={handleReject}
                className="flex-1 py-2.5 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors"
              >
                Reject
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedRegistration(null);
                  setRejectionReason('');
                }}
                className="flex-1 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
