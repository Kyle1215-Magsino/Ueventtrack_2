import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getStudent, deleteStudent } from '../api/studentApi';
import { downloadStudentPDF } from '../api/reportApi';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-toastify';

export default function StudentViewPage() {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getStudent(id).then(res => setStudent(res.data)).finally(() => setLoading(false));
  }, [id]);

  const handleArchive = async () => {
    if (!confirm('Archive this student?')) return;
    try {
      await deleteStudent(id);
      toast.success('Student archived.');
      setTimeout(() => navigate('/students'), 1000);
    } catch {
      toast.error('Failed to archive student.');
    }
  };

  const handleDownloadPDF = async () => {
    try {
      await downloadStudentPDF(id);
      toast.success('Student report downloaded!');
    } catch (error) {
      toast.error('Failed to download student report');
      console.error('PDF download error:', error);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      await downloadStudentPDF(id);
      toast.success('Student report downloaded!');
    } catch (error) {
      toast.error('Failed to download student report');
      console.error('PDF download error:', error);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!student) return <p>Student not found.</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{student.first_name} {student.last_name}</h1>
        <div className="flex gap-2">
          <button 
            onClick={handleDownloadPDF}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download Report
          </button>
          <Link to={`/students/${id}/edit`} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">Edit</Link>
          <button onClick={handleArchive} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Archive</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-green-300">
          <h3 className="font-semibold text-gray-900 mb-4">Student Info</h3>
          <dl className="space-y-2 text-sm">
            <div><dt className="text-gray-500">Student ID</dt><dd className="font-medium">{student.student_id}</dd></div>
            <div><dt className="text-gray-500">Email</dt><dd className="font-medium">{student.email}</dd></div>
            <div><dt className="text-gray-500">Course</dt><dd className="font-medium">{student.course}</dd></div>
            <div><dt className="text-gray-500">Year Level</dt><dd className="font-medium">{student.year_level}</dd></div>
            <div><dt className="text-gray-500">RFID Tag</dt><dd className="font-medium">{student.rfid_tag || 'N/A'}</dd></div>
            <div><dt className="text-gray-500">Status</dt><dd>
              <span className={`px-2 py-1 rounded text-xs ${student.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {student.status}
              </span>
            </dd></div>
            <div><dt className="text-gray-500">Face Enrolled</dt><dd className="font-medium">{student.face_data ? 'Yes' : 'No'}</dd></div>
          </dl>
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-green-300">
          <h3 className="font-semibold text-gray-900 mb-4">Attendance History</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-green-50">
                <tr>
                  <th className="px-3 py-2 text-left">Event</th>
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Method</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {student.attendances?.map(a => (
                  <tr key={a.id}>
                    <td className="px-3 py-2">{a.event?.event_name}</td>
                    <td className="px-3 py-2">{new Date(a.check_in_time).toLocaleString()}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-1 rounded text-xs ${a.status === 'present' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 capitalize">{a.verification_method}</td>
                  </tr>
                ))}
                {!student.attendances?.length && (
                  <tr><td colSpan={4} className="px-3 py-4 text-center text-gray-500">No attendance records.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}






