import { useState, useEffect } from 'react';
import { getStudents, deleteStudent, getArchivedStudents, restoreStudent } from '../api/studentApi';
import DataTable from '../components/DataTable';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import StudentAddModal from '../components/StudentAddModal';
import StudentViewModal from '../components/StudentViewModal';
import StudentEditModal from '../components/StudentEditModal';
import { toast } from 'react-toastify';

export default function StudentsPage() {
  const [tab, setTab] = useState('active'); // 'active' | 'archived'
  const [students, setStudents] = useState([]);
  const [archived, setArchived] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [viewId, setViewId] = useState(null);
  const [editId, setEditId] = useState(null);
  const [archiveId, setArchiveId] = useState(null);
  const [archiving, setArchiving] = useState(false);
  const [restoreId, setRestoreId] = useState(null);
  const [restoring, setRestoring] = useState(false);
  const [search, setSearch] = useState('');
  const [collegeFilter, setCollegeFilter] = useState('all');
  const [programFilter, setProgramFilter] = useState('all');

  // Define college structure
  const collegePrograms = {
    'CBM': ['BSHM', 'BSENTREP', 'BSTOURISM'],
    'CCS': ['BSIT', 'BSCPE'],
    'CTE': ['BSEDUC', 'BSCRIM', 'BSPOLSCI', 'BSFI']
  };

  // Get programs based on selected college
  const programs = collegeFilter === 'all'
    ? [...new Set([...students, ...archived].map(s => s.course).filter(Boolean))]
    : collegePrograms[collegeFilter] || [];

  const fetchAll = () => {
    console.log('Fetching students...');
    setLoading(true);
    Promise.all([getStudents(), getArchivedStudents()])
      .then(([a, b]) => { 
        console.log('API Response - Active:', a.data);
        console.log('API Response - Archived:', b.data);
        console.log('Students fetched:', a.data?.length || 0, 'active,', b.data?.length || 0, 'archived');
        setStudents(a.data || []); 
        setArchived(b.data || []); 
      })
      .catch((error) => {
        console.error('Error fetching students:', error);
        console.error('Error response:', error.response);
        if (error.response?.status === 401) {
          toast.error('Session expired. Please login again.');
        } else {
          toast.error('Failed to load students. Please refresh the page.');
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const handleArchive = async () => {
    setArchiving(true);
    try {
      await deleteStudent(archiveId);
      toast.success('Student archived.');
      setArchiveId(null);
      fetchAll();
    } catch {
      toast.error('Failed to archive student.');
    } finally {
      setArchiving(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      await restoreStudent(restoreId);
      toast.success('Student restored.');
      setRestoreId(null);
      fetchAll();
    } catch {
      toast.error('Failed to restore student.');
    } finally {
      setRestoring(false);
    }
  };

  const activeColumns = [
    { key: 'student_id', label: 'Student ID', accessor: 'student_id' },
    { key: 'name', label: 'Name', accessor: row => `${row.last_name}, ${row.first_name}` },
    { key: 'email', label: 'Email', accessor: 'email' },
    { key: 'course', label: 'Course', accessor: 'course' },
    { key: 'year_level', label: 'Year', accessor: 'year_level' },
    { key: 'status', label: 'Status', render: row => (
      <span className={`px-2 py-1 rounded text-xs font-medium ${row.status === 'active' ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'}`}>
        {row.status}
      </span>
    )},
    { key: 'actions', label: 'Actions', sortable: false, render: row => (
      <div className="flex items-center gap-1">
        <button onClick={() => setViewId(row.id)} title="View" className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
        </button>
        <button onClick={() => setEditId(row.id)} title="Edit" className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
        </button>
        <button onClick={() => setArchiveId(row.id)} title="Archive" className="p-1.5 rounded-lg text-orange-500 hover:bg-orange-50 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
        </button>
      </div>
    )},
  ];

  // Filter active students by college and program
  const filteredStudents = students.filter(student => {
    const studentCourse = student.course;
    
    // College filter
    if (collegeFilter !== 'all') {
      const collegeProgramsList = collegePrograms[collegeFilter] || [];
      if (!collegeProgramsList.includes(studentCourse)) {
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

  const filteredArchived = archived.filter(s => {
    const studentCourse = s.course;
    const q = search.toLowerCase();
    
    // Search filter
    const matchesSearch = (
      s.student_id?.toLowerCase().includes(q) ||
      s.first_name?.toLowerCase().includes(q) ||
      s.last_name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.course?.toLowerCase().includes(q)
    );

    if (!matchesSearch) return false;

    // College filter
    if (collegeFilter !== 'all') {
      const collegeProgramsList = collegePrograms[collegeFilter] || [];
      if (!collegeProgramsList.includes(studentCourse)) {
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

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Students</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage student records</p>
        </div>
        {tab === 'active' && (
          <button onClick={() => setAddOpen(true)} className="px-4 py-2.5 bg-green-500 text-white rounded-xl hover:bg-green-600 font-medium text-sm transition shadow-sm">
            + Add Student
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-green-50 dark:bg-gray-800 border border-green-200 dark:border-gray-700 rounded-xl p-1 w-fit">
        <button
          onClick={() => setTab('active')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === 'active'
              ? 'bg-white dark:bg-gray-900 text-green-700 dark:text-green-400 shadow-sm border border-green-200 dark:border-gray-700'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          Active
          <span className={`ml-2 px-1.5 py-0.5 rounded text-xs font-semibold ${
            tab === 'active' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
          }`}>{students.length}</span>
        </button>
        <button
          onClick={() => setTab('archived')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === 'archived'
              ? 'bg-white dark:bg-gray-900 text-orange-600 dark:text-orange-400 shadow-sm border border-orange-200 dark:border-gray-700'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          Archived
          <span className={`ml-2 px-1.5 py-0.5 rounded text-xs font-semibold ${
            tab === 'archived' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
          }`}>{archived.length}</span>
        </button>
      </div>

      {loading ? <LoadingSpinner /> : (
        <>
          {/* Active tab */}
          {tab === 'active' && (
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-green-300 dark:border-gray-800 p-5">
              {/* College and Program Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
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
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Showing {filteredStudents.length} of {students.length} students
              </div>

              <DataTable columns={activeColumns} data={filteredStudents} />
            </div>
          )}

          {/* Archived tab */}
          {tab === 'archived' && (
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-orange-200 dark:border-gray-800 overflow-hidden">
              {/* Filters Section */}
              <div className="p-4 border-b border-orange-100 dark:border-gray-800 space-y-4">
                {/* Search */}
                <div className="relative max-w-sm">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search archived students..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-orange-200 dark:border-gray-700 rounded-xl bg-orange-50 dark:bg-gray-800 text-gray-900 dark:text-gray-200 text-sm focus:ring-2 focus:ring-orange-300 focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  />
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
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                  Showing {filteredArchived.length} of {archived.length} archived students
                </div>
              </div>

              {filteredArchived.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="w-14 h-14 bg-orange-50 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-7 h-7 text-orange-300 dark:text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 font-medium">{search ? 'No matching records.' : 'No archived students yet.'}</p>
                </div>
              ) : (
                <table className="min-w-full text-sm">
                  <thead className="bg-orange-50 dark:bg-gray-800 border-b border-orange-100 dark:border-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Student ID</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Course</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Year</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-orange-50 dark:divide-gray-800">
                    {filteredArchived.map(s => (
                      <tr key={s.id} className="hover:bg-orange-50 dark:hover:bg-gray-800 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-gray-400">{s.student_id}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                              {s.first_name?.charAt(0)}
                            </div>
                            <span className="font-medium text-gray-700 dark:text-gray-200">{s.last_name}, {s.first_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{s.email}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{s.course}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{s.year_level}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setRestoreId(s.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-800 rounded-lg text-xs font-medium hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Restore
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      )}

      <StudentAddModal open={addOpen} onClose={() => setAddOpen(false)} onCreated={fetchAll} />
      <StudentViewModal
        studentId={viewId}
        open={!!viewId}
        onClose={() => setViewId(null)}
        onEdit={() => { setEditId(viewId); setViewId(null); }}
      />
      <StudentEditModal
        studentId={editId}
        open={!!editId}
        onClose={() => setEditId(null)}
        onUpdated={fetchAll}
      />

      {/* Archive confirmation */}
      <Modal open={!!archiveId} onClose={() => setArchiveId(null)} maxWidth="max-w-sm">
        <div className="p-6 text-center">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Archive Student?</h3>
          <p className="text-sm text-gray-500 mb-6">This will move the student to the Archive tab. You can restore them anytime.</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => setArchiveId(null)} className="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 text-sm font-medium">Cancel</button>
            <button onClick={handleArchive} disabled={archiving} className="px-6 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 text-sm font-medium disabled:opacity-50">
              {archiving ? 'Archiving...' : 'Archive'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Restore confirmation */}
      <Modal open={!!restoreId} onClose={() => setRestoreId(null)} maxWidth="max-w-sm">
        <div className="p-6 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Restore Student?</h3>
          <p className="text-sm text-gray-500 mb-6">This will move the student back to the Active tab.</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => setRestoreId(null)} className="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 text-sm font-medium">Cancel</button>
            <button onClick={handleRestore} disabled={restoring} className="px-6 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 text-sm font-medium disabled:opacity-50">
              {restoring ? 'Restoring...' : 'Restore'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}






