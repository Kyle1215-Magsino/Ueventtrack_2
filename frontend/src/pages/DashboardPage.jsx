import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboard } from '../api/authApi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LineChart, Line, CartesianGrid, Area, AreaChart } from 'recharts';

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
import LoadingSpinner from '../components/LoadingSpinner';

const statCardConfig = [
  { key: 'totalStudents', label: 'Total Students', href: '/students', iconBg: 'bg-green-100', iconColor: 'text-green-600', icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
  )},
  { key: 'totalEvents', label: 'Total Events', href: '/events', iconBg: 'bg-green-100', iconColor: 'text-green-700', icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
  )},
  { key: 'totalAttendance', label: 'Total Attendance', href: '/attendance', iconBg: 'bg-green-100', iconColor: 'text-green-600', icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
  )},
  { key: 'ongoingEvents', label: 'Ongoing Events', href: '/events', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  )},
  { key: 'upcomingEvents', label: 'Upcoming Events', href: '/events', iconBg: 'bg-green-50', iconColor: 'text-green-500', icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  )},
];

const REFRESH_INTERVAL_MS = 30_000;

export default function DashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const intervalRef = useRef(null);

  const fetchData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await getDashboard();
      setData(res.data);
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(() => fetchData(), REFRESH_INTERVAL_MS);
    return () => clearInterval(intervalRef.current);
  }, [fetchData]);

  if (loading) return <LoadingSpinner />;
  if (!data) return <p className="text-gray-500 dark:text-gray-400">Failed to load dashboard.</p>;

  const monthlyChart = data.chartLabels.map((label, i) => ({
    month: label,
    Present: data.chartValues[i],
    Late: data.chartLateValues[i],
  }));

  const dailyChart = data.dailyLabels.map((label, i) => ({
    day: label,
    Attendance: data.dailyValues[i],
  }));

  return (
    <div>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Overview of attendance and event activity</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {lastUpdated && (
            <span className="hidden sm:block text-xs text-gray-400 dark:text-gray-500">
              Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 border border-green-200 dark:border-green-800 rounded-lg transition-colors disabled:opacity-60"
          >
            <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {statCardConfig.map((card, i) => (
          <button
            key={card.key}
            onClick={() => navigate(card.href)}
            style={{ animationDelay: `${i * 0.07}s` }}
            className="group animate-staggerIn bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm hover:shadow-lg border-2 border-green-200 dark:border-gray-800 hover:border-green-400 dark:hover:border-green-600 transition-all duration-200 text-left w-full cursor-pointer relative overflow-hidden"
          >
            {/* Gradient background on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-transparent dark:from-green-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            
            <div className="relative">
              {/* Icon and Arrow */}
              <div className="flex items-start justify-between mb-4">
                <div className={`${card.iconBg} ${card.iconColor} dark:bg-opacity-20 rounded-xl p-3 shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all duration-200`}>
                  {card.icon}
                </div>
                <svg className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-green-500 dark:group-hover:text-green-400 group-hover:translate-x-1 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              
              {/* Value */}
              <div className="mb-2">
                <p className="text-4xl font-black text-gray-900 dark:text-white tracking-tight group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-200">
                  {data[card.key]}
                </p>
              </div>
              
              {/* Label */}
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors duration-200">
                {card.label}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-900 p-5 rounded-xl shadow-sm border border-green-300 dark:border-gray-800">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Monthly Attendance</h3>
          <div key={monthlyChart.length} style={{ width: '100%', minHeight: 260 }}>
          <ResponsiveContainer width="100%" height={260} debounce={50}>
            <BarChart data={monthlyChart} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} barCategoryGap="30%" maxBarSize={32}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#dcfce7" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f0fdf4' }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              <Bar dataKey="Present" fill="#22C55E" radius={[4, 4, 0, 0]} isAnimationActive animationBegin={0} animationDuration={600} animationEasing="ease-out" />
              <Bar dataKey="Late" fill="#f59e0b" radius={[4, 4, 0, 0]} isAnimationActive animationBegin={100} animationDuration={600} animationEasing="ease-out" />
            </BarChart>
          </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 p-5 rounded-xl shadow-sm border border-green-300 dark:border-gray-800">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Daily Attendance (This Month)</h3>
          <div key={dailyChart.length} style={{ width: '100%', minHeight: 260 }}>
          <ResponsiveContainer width="100%" height={260} debounce={50}>
            <AreaChart data={dailyChart} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="attendanceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22C55E" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#dcfce7" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#86efac', strokeWidth: 1 }} />
              <Area type="monotone" dataKey="Attendance" stroke="#22C55E" strokeWidth={2.5} fill="url(#attendanceGrad)" dot={{ r: 3, fill: '#22C55E', strokeWidth: 0 }} activeDot={{ r: 5, fill: '#22C55E', stroke: '#fff', strokeWidth: 2 }} isAnimationActive animationBegin={0} animationDuration={700} animationEasing="ease-out" />
            </AreaChart>
          </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Attendance & Upcoming Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 p-5 rounded-xl shadow-sm border border-green-300 dark:border-gray-800">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Recent Attendance</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-green-300 dark:border-gray-800">
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Student</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Event</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {data.recentAttendance.map(a => (
                  <tr key={a.id} className="hover:bg-green-50 dark:hover:bg-gray-800">
                    <td className="px-3 py-2.5 font-medium text-gray-900 dark:text-white">{a.student?.first_name} {a.student?.last_name}</td>
                    <td className="px-3 py-2.5 text-gray-600 dark:text-gray-300">{a.event?.event_name}</td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${a.status === 'present' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-gray-500 dark:text-gray-400 text-xs">{new Date(a.check_in_time).toLocaleString()}</td>
                  </tr>
                ))}
                {data.recentAttendance.length === 0 && (
                  <tr><td colSpan={4} className="px-3 py-8 text-center text-gray-400 dark:text-gray-500">No attendance records yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-5 rounded-xl shadow-sm border border-green-300 dark:border-gray-800">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Upcoming Events</h3>
          <div className="space-y-3">
            {data.upcomingEventsList.map(e => (
              <div key={e.id} className="flex items-center gap-4 p-3 rounded-lg border border-green-300 dark:border-gray-800 hover:bg-green-50 dark:hover:bg-gray-800 transition">
                <div className="w-12 h-12 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">{e.event_name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(e.event_date).toLocaleDateString()} &middot; {e.venue}</p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">upcoming</span>
              </div>
            ))}
            {data.upcomingEventsList.length === 0 && <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-8">No upcoming events.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}






