import { useState, useEffect } from 'react';
import { getReports } from '../api/attendanceApi';
import { downloadSummaryPDF } from '../api/reportApi';
import { toast } from 'react-toastify';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, AreaChart, Area } from 'recharts';
import LoadingSpinner from '../components/LoadingSpinner';
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-green-200 dark:border-gray-700 rounded-xl px-4 py-2.5 shadow-lg text-sm">
      {label && <p className="font-semibold text-gray-700 dark:text-gray-200 mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-medium">{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

const COLORS = ['#22C55E', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

const PERIODS = [
  { key: 'all',     label: 'All Time' },
  { key: 'weekly',  label: 'This Week' },
  { key: 'monthly', label: 'This Month' },
  { key: 'yearly',  label: 'This Year' },
];

const TREND_TITLE = {
  weekly:  'Daily Trends (This Week)',
  monthly: 'Daily Trends (This Month)',
  yearly:  'Monthly Trends (This Year)',
  all:     'Monthly Attendance Trends',
};

function formatTrendTick(val, period) {
  if (!val) return val;
  if (period === 'weekly' || period === 'monthly') {
    const d = new Date(val + 'T00:00:00');
    if (period === 'weekly') return d.toLocaleDateString('en', { weekday: 'short' });
    return d.getDate().toString();
  }
  // yearly or all: val = YYYY-MM
  return new Date(val + '-01').toLocaleDateString('en', { month: 'short' });
}

export default function ReportsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('all');

  useEffect(() => {
    setLoading(true);
    getReports(period).then(res => setData(res.data)).finally(() => setLoading(false));
  }, [period]);

  const pieData = data ? [
    { name: 'Present', value: data.presentCount },
    { name: 'Late', value: data.lateCount },
  ] : [];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Attendance statistics and trends</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
        {data && (
          <>
          <button
            onClick={async () => {
              try {
                await downloadSummaryPDF();
                toast.success('Summary PDF downloaded!');
              } catch (error) {
                toast.error('Failed to download PDF');
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Export PDF
          </button>
          <button
            onClick={() => {
              const headers = ['Event', 'Attendees'];
              const lines = (data.perEvent || []).map(r =>
                [`"${String(r.event_name).replace(/"/g,'""')}"`, r.attendees].join(','));
              const csv = [headers.join(','), ...lines].join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url; a.download = `report_${period}.csv`; a.click();
              URL.revokeObjectURL(url);
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 border border-green-200 dark:border-green-800 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Export CSV
          </button>
          </>
        )}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
          {PERIODS.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                period === p.key
                  ? 'bg-white dark:bg-gray-900 text-green-700 dark:text-green-400 shadow-sm border border-green-200 dark:border-green-800'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        </div>
      </div>

      {(!data && loading) ? <LoadingSpinner /> : !data ? <p className="text-gray-400 dark:text-gray-500 text-sm py-20 text-center">Failed to load data.</p> : (
      <div className={loading ? 'opacity-60 pointer-events-none transition-opacity' : 'transition-opacity'}>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Total Students', value: data.totalStudents, iconBg: 'bg-green-100 dark:bg-green-900/30', iconColor: 'text-green-600 dark:text-green-400', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg> },
          { label: 'Total Events', value: data.totalEvents, iconBg: 'bg-green-100 dark:bg-green-900/30', iconColor: 'text-green-700 dark:text-green-400', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
          { label: 'Total Check-ins', value: data.totalCheckins, iconBg: 'bg-green-100 dark:bg-green-900/30', iconColor: 'text-green-600 dark:text-green-400', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg> },
          { label: 'Present', value: data.presentCount, iconBg: 'bg-emerald-100 dark:bg-emerald-900/30', iconColor: 'text-emerald-600 dark:text-emerald-400', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
          { label: 'Late', value: data.lateCount, iconBg: 'bg-yellow-100 dark:bg-yellow-900/30', iconColor: 'text-yellow-600 dark:text-yellow-400', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
        ].map(c => (
          <div key={c.label} className="bg-white dark:bg-gray-900 rounded-xl p-5 shadow-sm border border-green-300 dark:border-gray-800 hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 ${c.iconBg} ${c.iconColor} rounded-lg flex items-center justify-center mb-3`}>{c.icon}</div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{c.value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Attendance status pie chart */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-xl shadow-sm border border-green-300 dark:border-gray-800">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Attendance Status Distribution</h3>
          <div key={pieData.map(d => d.value).join(',')} style={{ width: '100%', minHeight: 250 }}>
          <ResponsiveContainer width="100%" height={250} debounce={50}>
            <PieChart>
              <Pie
                data={pieData} dataKey="value" nameKey="name"
                cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                paddingAngle={4}
                isAnimationActive animationBegin={0} animationDuration={600} animationEasing="ease-out"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} stroke="none" />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          </div>
        </div>

        {/* Trend chart */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-xl shadow-sm border border-green-300 dark:border-gray-800">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{TREND_TITLE[period]}</h3>
          <div key={data.monthlyTrends?.length} style={{ width: '100%', minHeight: 250 }}>
          <ResponsiveContainer width="100%" height={250} debounce={50}>
            <AreaChart data={data.monthlyTrends} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22C55E" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#dcfce7" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => formatTrendTick(v, period)} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#86efac', strokeWidth: 1 }} />
              <Area type="monotone" dataKey="total" name="Check-ins" stroke="#22C55E" strokeWidth={2.5} fill="url(#trendGrad)" dot={{ r: 3, fill: '#22C55E', strokeWidth: 0 }} activeDot={{ r: 5, fill: '#22C55E', stroke: '#fff', strokeWidth: 2 }} isAnimationActive animationBegin={0} animationDuration={700} animationEasing="ease-out" />
            </AreaChart>
          </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Per-event attendance */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-xl shadow-sm border border-green-300 dark:border-gray-800">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Attendance by Event</h3>
          <div key={data.perEvent?.length} style={{ width: '100%', minHeight: 300 }}>
          <ResponsiveContainer width="100%" height={300} debounce={50}>
            <BarChart data={data.perEvent} layout="vertical" margin={{ top: 4, right: 8, left: 4, bottom: 0 }} maxBarSize={20}>
              <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#dcfce7" />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="event_name" width={140} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f0fdf4' }} />
              <Bar dataKey="attendees" fill="#22C55E" radius={[0, 4, 4, 0]} isAnimationActive animationBegin={0} animationDuration={600} animationEasing="ease-out" />
            </BarChart>
          </ResponsiveContainer>
          </div>
        </div>

        {/* Attendance by course */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-xl shadow-sm border border-green-300 dark:border-gray-800">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Attendance by Course</h3>
          <div key={data.byCourse?.length} style={{ width: '100%', minHeight: 300 }}>
          <ResponsiveContainer width="100%" height={300} debounce={50}>
            <BarChart data={data.byCourse} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} barCategoryGap="35%" maxBarSize={40}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#dcfce7" />
              <XAxis dataKey="course" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f0fdf4' }} />
              <Bar dataKey="total" name="Attendees" fill="#10b981" radius={[4, 4, 0, 0]} isAnimationActive animationBegin={0} animationDuration={600} animationEasing="ease-out" />
            </BarChart>
          </ResponsiveContainer>
          </div>
        </div>
      </div>

      </div>
      )}
    </div>
  );
}






