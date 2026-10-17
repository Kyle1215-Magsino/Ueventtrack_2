import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  getAllFines, 
  getFineStatistics, 
  markFineAsPaid, 
  waiveFine 
} from '../api/fineApi';

const FinesPage = () => {
  const [fines, setFines] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedFine, setSelectedFine] = useState(null);
  const [showWaiveModal, setShowWaiveModal] = useState(false);
  const [waiveReason, setWaiveReason] = useState('');

  useEffect(() => {
    fetchFines();
    fetchStatistics();
  }, [filter]);

  const fetchFines = async () => {
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const data = await getAllFines(params);
      setFines(data.data || data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching fines:', error);
      toast.error('Failed to load fines');
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const data = await getFineStatistics();
      setStats(data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const markAsPaid = async (fineId) => {
    if (!confirm('Mark this fine as paid?')) return;

    try {
      await markFineAsPaid(fineId);
      toast.success('Fine marked as paid');
      fetchFines();
      fetchStatistics();
    } catch (error) {
      console.error('Error marking fine as paid:', error);
      toast.error('Failed to mark fine as paid');
    }
  };

  const handleWaive = async () => {
    if (!waiveReason.trim()) {
      toast.error('Please provide a reason for waiving the fine');
      return;
    }

    try {
      await waiveFine(selectedFine.id, waiveReason);
      toast.success('Fine waived successfully');
      setShowWaiveModal(false);
      setWaiveReason('');
      setSelectedFine(null);
      fetchFines();
      fetchStatistics();
    } catch (error) {
      console.error('Error waiving fine:', error);
      toast.error('Failed to waive fine');
    }
  };

  const getPeriodLabel = (period) => {
    const labels = {
      'morning_in': 'Morning Time-In',
      'morning_out': 'Morning Time-Out',
      'afternoon_in': 'Afternoon Time-In',
      'afternoon_out': 'Afternoon Time-Out',
      'whole_morning': 'Whole Morning',
      'whole_afternoon': 'Whole Afternoon',
      'whole_day': 'Whole Day'
    };
    return labels[period] || period;
  };

  const getStatusBadge = (status) => {
    const styles = {
      unpaid: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
      paid: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
      waived: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status]}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
        <div className="mt-4 text-gray-600 dark:text-gray-400">Loading fines...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Student Fines</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage attendance penalties and payments</p>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          <div className="bg-red-50 dark:bg-red-900/20 p-5 rounded-xl border border-red-200 dark:border-red-800">
            <div className="text-xs text-red-600 dark:text-red-400 font-semibold uppercase tracking-wide">Unpaid Fines</div>
            <div className="text-3xl font-bold text-red-700 dark:text-red-400 mt-2">₱{stats.total_unpaid?.toFixed(2)}</div>
            <div className="text-xs text-red-500 dark:text-red-500 mt-1">{stats.count_unpaid} violations</div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-5 rounded-xl border border-green-200 dark:border-green-800">
            <div className="text-xs text-green-600 dark:text-green-400 font-semibold uppercase tracking-wide">Paid Fines</div>
            <div className="text-3xl font-bold text-green-700 dark:text-green-400 mt-2">₱{stats.total_paid?.toFixed(2)}</div>
            <div className="text-xs text-green-500 dark:text-green-500 mt-1">{stats.count_paid} violations</div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wide">Waived Fines</div>
            <div className="text-3xl font-bold text-blue-700 dark:text-blue-400 mt-2">₱{stats.total_waived?.toFixed(2)}</div>
            <div className="text-xs text-blue-500 dark:text-blue-500 mt-1">{stats.count_waived} violations</div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-green-300 dark:border-gray-800 p-5">
        {/* Filters */}
        <div className="mb-4 flex gap-1 bg-green-50 dark:bg-gray-800 border border-green-200 dark:border-gray-700 rounded-xl p-1 w-fit">
          <button
            onClick={() => setFilter('all')}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === 'all'
                ? 'bg-white dark:bg-gray-900 text-green-700 dark:text-green-400 shadow-sm border border-green-200 dark:border-gray-700'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('unpaid')}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === 'unpaid'
                ? 'bg-white dark:bg-gray-900 text-red-700 dark:text-red-400 shadow-sm border border-red-200 dark:border-gray-700'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            Unpaid
          </button>
          <button
            onClick={() => setFilter('paid')}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === 'paid'
                ? 'bg-white dark:bg-gray-900 text-green-700 dark:text-green-400 shadow-sm border border-green-200 dark:border-gray-700'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            Paid
          </button>
          <button
            onClick={() => setFilter('waived')}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === 'waived'
                ? 'bg-white dark:bg-gray-900 text-blue-700 dark:text-blue-400 shadow-sm border border-blue-200 dark:border-gray-700'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            Waived
          </button>
        </div>

        {/* Fines Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Student</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Event</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Period</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Violation</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
            {fines.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No fines found
                  </td>
                </tr>
            ) : (
                fines.map((fine) => (
                  <tr key={fine.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {fine.student?.first_name} {fine.student?.last_name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">MBC2023-{fine.student?.student_id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-gray-100">{fine.event?.event_name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(fine.event?.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {getPeriodLabel(fine.period)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 capitalize">
                      {fine.violation_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600 dark:text-red-400">
                      ₱{parseFloat(fine.amount).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(fine.payment_status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {fine.payment_status === 'unpaid' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => markAsPaid(fine.id)}
                            className="px-3 py-1.5 text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-lg transition-colors"
                          >
                            Mark Paid
                          </button>
                          <button
                            onClick={() => {
                              setSelectedFine(fine);
                              setShowWaiveModal(true);
                            }}
                            className="px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-colors"
                          >
                            Waive
                          </button>
                        </div>
                      )}
                      {fine.payment_status === 'waived' && fine.waiver_reason && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 max-w-xs">
                          <span className="font-medium">Reason:</span> {fine.waiver_reason}
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

      {/* Waive Modal */}
      {showWaiveModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-200 dark:border-gray-700 animate-modal-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Waive Fine</h3>
              <button
                onClick={() => {
                  setShowWaiveModal(false);
                  setWaiveReason('');
                  setSelectedFine(null);
                }}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-5 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-semibold text-gray-900 dark:text-gray-100">Student:</span> {selectedFine?.student?.first_name} {selectedFine?.student?.last_name}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                <span className="font-semibold text-gray-900 dark:text-gray-100">Event:</span> {selectedFine?.event?.event_name}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                <span className="font-semibold text-red-600 dark:text-red-400">Amount:</span> <span className="font-bold text-red-600 dark:text-red-400">₱{parseFloat(selectedFine?.amount).toFixed(2)}</span>
              </p>
            </div>

            <label className="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Reason for Waiving *</label>
            <textarea
              value={waiveReason}
              onChange={(e) => setWaiveReason(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-700 rounded-xl p-3 mb-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none"
              rows="3"
              placeholder="Enter reason for waiving this fine..."
            />

            <div className="flex gap-3">
              <button
                onClick={handleWaive}
                className="flex-1 bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 font-medium text-sm transition-colors shadow-sm"
              >
                Waive Fine
              </button>
              <button
                onClick={() => {
                  setShowWaiveModal(false);
                  setWaiveReason('');
                  setSelectedFine(null);
                }}
                className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2.5 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 font-medium text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinesPage;
