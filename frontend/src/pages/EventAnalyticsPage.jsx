import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEventAnalytics } from '../api/eventApi';
import { downloadEventPDF, downloadEventExcel } from '../api/reportApi';
import { ArrowLeft, Users, Clock, TrendingUp, BarChart3, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { Doughnut, Pie, Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function EventAnalyticsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAnalytics();
  }, [id]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await getEventAnalytics(id);
      setAnalytics(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load analytics');
      console.error('Analytics error:', err);
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-xl font-semibold text-gray-900 mb-2">Error Loading Analytics</p>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/events')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  const { event, overview, checkin_methods, timing_analysis, course_breakdown, year_level_breakdown, hourly_checkins, status_breakdown, top_earliest_checkins, top_latest_checkins } = analytics;

  // Chart configurations
  const methodsChartData = {
    labels: checkin_methods.map(m => m.method),
    datasets: [{
      data: checkin_methods.map(m => m.count),
      backgroundColor: ['#10b981', '#3b82f6', '#f59e0b'],
      borderWidth: 0,
    }]
  };

  const statusChartData = {
    labels: status_breakdown.map(s => s.status),
    datasets: [{
      data: status_breakdown.map(s => s.count),
      backgroundColor: status_breakdown.map(s => s.color),
      borderWidth: 0,
    }]
  };

  const courseChartData = {
    labels: course_breakdown.map(c => c.course),
    datasets: [{
      label: 'Students',
      data: course_breakdown.map(c => c.count),
      backgroundColor: '#10b981',
    }]
  };

  const yearLevelChartData = {
    labels: year_level_breakdown.map(y => y.label),
    datasets: [{
      label: 'Students',
      data: year_level_breakdown.map(y => y.count),
      backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'],
    }]
  };

  const hourlyChartData = {
    labels: hourly_checkins.map(h => h.hour),
    datasets: [{
      label: 'Check-ins',
      data: hourly_checkins.map(h => h.count),
      borderColor: '#10b981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      fill: true,
      tension: 0.4,
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      }
    }
  };

  const barChartOptions = {
    ...chartOptions,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: { beginAtZero: true }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/events')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Events
          </button>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  📊 Event Analytics
                </h1>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="font-semibold text-green-600">{event.name}</span>
                  <span>•</span>
                  <span>{new Date(event.date).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>{event.venue}</span>
                  <span>•</span>
                  <span className="capitalize px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                    {event.status}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleDownloadPDF}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 text-sm font-semibold"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download PDF
                </button>
                <button
                  onClick={handleDownloadExcel}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2 text-sm font-semibold"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Excel
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Attendance Rate"
            value={`${overview.attendance_rate}%`}
            icon={<TrendingUp className="w-6 h-6" />}
            color="blue"
          />
          <StatCard
            title="Total Attendees"
            value={overview.total_attendees}
            subtitle={`${overview.total_checkins} check-ins`}
            icon={<Users className="w-6 h-6" />}
            color="green"
          />
          <StatCard
            title="Present"
            value={overview.present_count}
            subtitle={`${((overview.present_count / overview.total_students) * 100).toFixed(1)}%`}
            icon={<BarChart3 className="w-6 h-6" />}
            color="emerald"
          />
          <StatCard
            title="Late"
            value={overview.late_count}
            subtitle={`${overview.absent_count} absent`}
            icon={<Clock className="w-6 h-6" />}
            color="amber"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <ChartCard title="📱 Check-in Methods">
            <Doughnut data={methodsChartData} options={chartOptions} />
          </ChartCard>

          <ChartCard title="📊 Status Breakdown">
            <Pie data={statusChartData} options={chartOptions} />
          </ChartCard>

          <ChartCard title="📚 Course Distribution">
            <Bar data={courseChartData} options={barChartOptions} />
          </ChartCard>

          <ChartCard title="🎓 Year Level Distribution">
            <Bar data={yearLevelChartData} options={barChartOptions} />
          </ChartCard>
        </div>

        {/* Hourly Check-ins */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">⏰ Hourly Check-in Activity</h3>
          <div className="h-64">
            <Line data={hourlyChartData} options={chartOptions} />
          </div>
        </div>

        {/* Timing Analysis */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">⏱️ Timing Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">First Check-in</p>
              <p className="font-semibold text-gray-900">
                {timing_analysis.first_checkin ? new Date(timing_analysis.first_checkin).toLocaleTimeString() : 'N/A'}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Last Check-in</p>
              <p className="font-semibold text-gray-900">
                {timing_analysis.last_checkin ? new Date(timing_analysis.last_checkin).toLocaleTimeString() : 'N/A'}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Average Time</p>
              <p className="font-semibold text-gray-900">{timing_analysis.average_checkin_time || 'N/A'}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Time Span</p>
              <p className="font-semibold text-gray-900">{timing_analysis.time_span_minutes} min</p>
            </div>
          </div>
        </div>

        {/* Top Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TableCard title="🏆 Top Earliest Check-ins" data={top_earliest_checkins} />
          <TableCard title="⏱️ Top Latest Check-ins" data={top_latest_checkins} />
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon, color = 'green' }) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    amber: 'bg-amber-100 text-amber-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">{title}</h3>
      <div className="h-64">
        {children}
      </div>
    </div>
  );
}

function TableCard({ title, data }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">{title}</h3>
        <p className="text-gray-500 text-center py-8">No data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">Student ID</th>
              <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">Name</th>
              <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">Time</th>
              <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">Method</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-2 text-sm text-gray-600">{row.student_id}</td>
                <td className="py-3 px-2 text-sm text-gray-900 font-medium">{row.name}</td>
                <td className="py-3 px-2 text-sm text-gray-600">
                  {new Date(row.checked_in_at).toLocaleTimeString()}
                </td>
                <td className="py-3 px-2">
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">
                    {row.method}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
