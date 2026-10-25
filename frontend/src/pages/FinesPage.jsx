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
  const [collegeFilter, setCollegeFilter] = useState('all');
  const [programFilter, setProgramFilter] = useState('all');
  const [selectedFine, setSelectedFine] = useState(null);
  const [showWaiveModal, setShowWaiveModal] = useState(false);
  const [waiveReason, setWaiveReason] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Define college structure
  const collegePrograms = {
    'CBM': ['BSHM', 'BSENTREP', 'BSTOURISM'],
    'CCS': ['BSIT', 'BSCPE'],
    'CTE': ['BSEDUC', 'BSCRIM', 'BSPOLSCI', 'BSFI']
  };

  // Get colleges that have students with fines
  const colleges = Object.keys(collegePrograms).filter(college =>
    fines.some(f => collegePrograms[college].includes(f.student?.course))
  );

  // Get programs based on selected college
  const programs = collegeFilter === 'all'
    ? [...new Set(fines.map(f => f.student?.course).filter(Boolean))]
    : collegePrograms[collegeFilter] || [];

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

  // Filter fines based on college and program
  const filteredFines = fines.filter(fine => {
    const studentCourse = fine.student?.course;
    
    // College filter
    if (collegeFilter !== 'all') {
      const collegePrograms_list = collegePrograms[collegeFilter] || [];
      if (!collegePrograms_list.includes(studentCourse)) {
        return false;
      }
    }
    
    // Program filter
    if (programFilter !== 'all') {
      if (studentCourse !== programFilter) {
        return false;
      }
    }
    
    return true;
  });

  const fetchStatistics = async () => {
    try {
      const data = await getFineStatistics();
      setStats(data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const markAsPaid = async (fineId) => {
    setSelectedFine(fines.find(f => f.id === fineId));
    setShowPaymentModal(true);
  };

  const handlePayment = async () => {
    try {
      await markFineAsPaid(selectedFine.id);
      toast.success('Fine marked as paid');
      setShowPaymentModal(false);
      setSelectedFine(null);
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
            <div className="text-3xl font-bold text-red-700 dark:text-red-400 mt-2">₱{Number(stats.total_unpaid || 0).toFixed(2)}</div>
            <div className="text-xs text-red-500 dark:text-red-500 mt-1">{stats.count_unpaid} violations</div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-5 rounded-xl border border-green-200 dark:border-green-800">
            <div className="text-xs text-green-600 dark:text-green-400 font-semibold uppercase tracking-wide">Paid Fines</div>
            <div className="text-3xl font-bold text-green-700 dark:text-green-400 mt-2">₱{Number(stats.total_paid || 0).toFixed(2)}</div>
            <div className="text-xs text-green-500 dark:text-green-500 mt-1">{stats.count_paid} violations</div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wide">Waived Fines</div>
            <div className="text-3xl font-bold text-blue-700 dark:text-blue-400 mt-2">₱{Number(stats.total_waived || 0).toFixed(2)}</div>
            <div className="text-xs text-blue-500 dark:text-blue-500 mt-1">{stats.count_waived} violations</div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-green-300 dark:border-gray-800 p-5">
        {/* Filters */}
        <div className="mb-4 space-y-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Status</label>
            <div className="flex gap-1 bg-green-50 dark:bg-gray-800 border border-green-200 dark:border-gray-700 rounded-xl p-1 w-fit">
              <button
                onClick={() => setFilter('all')}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === 'all'
                    ? 'bg-white dark:bg-gray-700 text-green-600 dark:text-green-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('unpaid')}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === 'unpaid'
                    ? 'bg-white dark:bg-gray-700 text-green-600 dark:text-green-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                Unpaid
              </button>
              <button
                onClick={() => setFilter('paid')}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === 'paid'
                    ? 'bg-white dark:bg-gray-700 text-green-600 dark:text-green-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                Paid
              </button>
              <button
                onClick={() => setFilter('waived')}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === 'waived'
                    ? 'bg-white dark:bg-gray-700 text-green-600 dark:text-green-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                Waived
              </button>
            </div>
          </div>

          {/* College and Program Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">College</label>
              <select
                value={collegeFilter}
                onChange={(e) => {
                  setCollegeFilter(e.target.value);
                  setProgramFilter('all');
                }}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">All Colleges</option>
                <option value="CBM">CBM - College of Business and Management</option>
                <option value="CCS">CCS - College of Computer Studies</option>
                <option value="CTE">CTE - College of Teacher Education</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Program</label>
              <select
                value={programFilter}
                onChange={(e) => setProgramFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">All Programs</option>
                {programs.map(program => (
                  <option key={program} value={program}>{program}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Results count */}
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredFines.length} of {fines.length} fines
          </div>
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
            {filteredFines.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No fines found
                  </td>
                </tr>
            ) : (
                filteredFines.map((fine) => (
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
                            className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-1.5"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Mark Paid
                          </button>
                          <button
                            onClick={() => {
                              setSelectedFine(fine);
                              setShowWaiveModal(true);
                            }}
                            className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-1.5"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Waive
                          </button>
                        </div>
                      )}
                      {fine.payment_status === 'paid' && (
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm font-medium">Payment Received</span>
                        </div>
                      )}
                      {fine.payment_status === 'waived' && fine.waiver_reason && (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm font-medium">Fine Waived</span>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 max-w-xs ml-7">
                            <span className="font-medium">Reason:</span> {fine.waiver_reason}
                          </div>
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

      {/* Payment Confirmation Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-200 dark:border-gray-700 animate-modal-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Confirm Payment</h3>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedFine(null);
                }}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Fine Details */}
            <div className="mb-5 p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium uppercase tracking-wide">Fine Payment</p>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300">₱{parseFloat(selectedFine?.amount || 0).toFixed(2)}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Student:</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{selectedFine?.student?.first_name} {selectedFine?.student?.last_name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Student ID:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">MBC2023-{selectedFine?.student?.student_id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Event:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedFine?.event?.event_name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Violation:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">{selectedFine?.violation_type}</span>
                </div>
              </div>
            </div>

            {/* Confirmation Message */}
            <div className="mb-5 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Please confirm that the student has paid <span className="font-bold">₱{parseFloat(selectedFine?.amount || 0).toFixed(2)}</span>. This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handlePayment}
                className="flex-1 bg-green-600 text-white px-4 py-2.5 rounded-xl hover:bg-green-700 font-medium text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Confirm Payment
              </button>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
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
