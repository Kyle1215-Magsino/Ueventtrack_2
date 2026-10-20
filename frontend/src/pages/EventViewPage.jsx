import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getEvent, deleteEvent } from '../api/eventApi';
import { downloadEventPDF, downloadEventExcel } from '../api/reportApi';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-toastify';

export default function EventViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEvent(id).then(res => setData(res.data)).finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('Delete this event and all its attendance records?')) return;
    try {
      await deleteEvent(id);
      toast.success('Event deleted.');
      setTimeout(() => navigate('/events'), 1000);
    } catch {
      toast.error('Failed to delete event.');
    }
  };

  const handleDownloadPDF = async () => {
    try {
      await downloadEventPDF(id);
      toast.success('PDF report downloaded!');
    } catch (error) {
      toast.error('Failed to download PDF report');
      console.error('PDF download error:', error);
    }
  };

  const handleDownloadExcel = async () => {
    try {
      await downloadEventExcel(id);
      toast.success('Excel report downloaded!');
    } catch (error) {
      toast.error('Failed to download Excel report');
      console.error('Excel download error:', error);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!data) return <p>Event not found.</p>;

  const { event, attendanceCounts } = data;

  const statusColors = {
    upcoming: 'bg-green-100 text-green-700',
    ongoing: 'bg-green-100 text-green-700',
    completed: 'bg-gray-100 text-gray-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{event.event_name}</h1>
        <div className="flex gap-2">
          <Link 
            to={`/events/${id}/analytics`} 
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Analytics
          </Link>
          <button 
            onClick={handleDownloadPDF}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            PDF
          </button>
          <button 
            onClick={handleDownloadExcel}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Excel
          </button>
          <Link to={`/events/${id}/edit`} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">Edit</Link>
          <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-green-300">
          <h3 className="font-semibold text-gray-900 mb-4">Event Details</h3>
          <dl className="space-y-2 text-sm">
            <div><dt className="text-gray-500">Date</dt><dd className="font-medium">{event.event_date}</dd></div>
            <div><dt className="text-gray-500">Time</dt><dd className="font-medium">{event.start_time} - {event.end_time}</dd></div>
            <div><dt className="text-gray-500">Venue</dt><dd className="font-medium">{event.venue}</dd></div>
            <div><dt className="text-gray-500">Status</dt><dd>
              <span className={`px-2 py-1 rounded text-xs ${statusColors[event.status]}`}>{event.status}</span>
            </dd></div>
            {event.description && <div><dt className="text-gray-500">Description</dt><dd>{event.description}</dd></div>}
            <div><dt className="text-gray-500">Organizer</dt><dd className="font-medium">{event.organizer?.name}</dd></div>
          </dl>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-green-300">
          <h3 className="font-semibold text-gray-900 mb-4">Attendance Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between"><span>Total</span><span className="font-bold">{attendanceCounts.total}</span></div>
            <div className="flex justify-between"><span>Present</span><span className="font-bold text-green-600">{attendanceCounts.present}</span></div>
            <div className="flex justify-between"><span>Late</span><span className="font-bold text-yellow-600">{attendanceCounts.late}</span></div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-green-300">
        <h3 className="font-semibold text-gray-900 mb-4">Attendees</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-green-50">
              <tr>
                <th className="px-3 py-2 text-left">Student ID</th>
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-left">Check-in Time</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Method</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {event.attendances?.map(a => (
                <tr key={a.id}>
                  <td className="px-3 py-2">MBC2023-{a.student?.student_id}</td>
                  <td className="px-3 py-2">{a.student?.first_name} {a.student?.last_name}</td>
                  <td className="px-3 py-2">{new Date(a.check_in_time).toLocaleString()}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-1 rounded text-xs ${a.status === 'present' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 capitalize">{a.verification_method}</td>
                </tr>
              ))}
              {!event.attendances?.length && (
                <tr><td colSpan={5} className="px-3 py-4 text-center text-gray-500">No attendees yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}






