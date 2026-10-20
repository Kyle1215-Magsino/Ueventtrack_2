import { NavLink } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import RegisterOfficerModal from './RegisterOfficerModal';

const CalendarIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const GridIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" /></svg>;
const UsersIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const CheckIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const FaceIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>;
const ListIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>;
const ChartIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
const CashIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const StudentIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
const PlusUserIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>;
const AuditIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>;
const BullhornIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>;

function NavItem({ to, icon, label, onClick }) {
  return (
    <NavLink to={to} onClick={onClick}
      className={({ isActive }) =>
        `group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 animate-staggerIn ${
          isActive
            ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-l-2 border-green-500 pl-[11px]'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 border-l-2 border-transparent pl-[11px]'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span className={isActive ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200'}>
            {icon}
          </span>
          {label}
        </>
      )}
    </NavLink>
  );
}

function SectionLabel({ label }) {
  return <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400 px-3 pt-5 pb-1.5">{label}</p>;
}

export default function Sidebar({ onNavigate }) {
  const { user } = useAuth();
  const [registerOpen, setRegisterOpen] = useState(false);

  return (
    <aside className="w-64 bg-white dark:bg-gray-900 h-screen flex flex-col border-r border-green-200 dark:border-gray-800 animate-slideInDrawer">
      {/* Logo */}
      <div className="px-5 h-16 flex items-center border-b border-green-200 dark:border-gray-800 flex-shrink-0 animate-fadeIn">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden bg-white border-2 border-green-600">
            <img 
              src="/usg-logo.png" 
              alt="USG Logo" 
              className="w-full h-full object-cover"
            />
          </div>
          <span className="font-bold text-gray-900 dark:text-white text-lg tracking-tight">U-EventTrack</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto">
        <SectionLabel label="Overview" />
        <div style={{ animationDelay: '0.03s' }}>
          <NavItem to="/dashboard" icon={<GridIcon />} label="Dashboard" onClick={onNavigate} />
        </div>

        <SectionLabel label="Management" />
        <div style={{ animationDelay: '0.06s' }}>
          <NavItem to="/students" icon={<StudentIcon />} label="Students" onClick={onNavigate} />
        </div>
        <div style={{ animationDelay: '0.09s' }}>
          <NavItem to="/events" icon={<CalendarIcon />} label="Events" onClick={onNavigate} />
        </div>

        <SectionLabel label="Operations" />
        <div style={{ animationDelay: '0.12s' }}>
          <NavItem to="/checkin" icon={<CheckIcon />} label="Check-In" onClick={onNavigate} />
        </div>
        <div style={{ animationDelay: '0.15s' }}>
          <NavItem to="/face-enrollment" icon={<FaceIcon />} label="Face Enrollment" onClick={onNavigate} />
        </div>
        <div style={{ animationDelay: '0.165s' }}>
          <NavItem to="/announcements" icon={<BullhornIcon />} label="Announcements" onClick={onNavigate} />
        </div>

        <SectionLabel label="Analytics" />
        <div style={{ animationDelay: '0.18s' }}>
          <NavItem to="/attendance" icon={<ListIcon />} label="Attendance Logs" onClick={onNavigate} />
        </div>
        <div style={{ animationDelay: '0.21s' }}>
          <NavItem to="/fines" icon={<CashIcon />} label="Fines" onClick={onNavigate} />
        </div>
        <div style={{ animationDelay: '0.24s' }}>
          <NavItem to="/reports" icon={<ChartIcon />} label="Reports" onClick={onNavigate} />
        </div>

        {user?.role === 'admin' && (
          <>
            <SectionLabel label="Admin" />
            <div style={{ animationDelay: '0.27s' }}>
              <NavItem to="/users" icon={<UsersIcon />} label="Users" onClick={onNavigate} />
            </div>
            <div style={{ animationDelay: '0.3s' }}>
              <NavItem to="/audit-logs" icon={<AuditIcon />} label="Audit Logs" onClick={onNavigate} />
            </div>
            <div style={{ animationDelay: '0.33s' }}>
              <button onClick={() => setRegisterOpen(true)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-150 animate-staggerIn">
                <span className="text-gray-600 dark:text-gray-400"><PlusUserIcon /></span>
                Register Officer
              </button>
            </div>
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-green-200 dark:border-gray-800 flex-shrink-0 animate-fadeIn" style={{ animationDelay: '0.38s' }}>
        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{user?.name}</p>
        <p className="text-[10px] text-gray-500 dark:text-gray-500 capitalize">{user?.role}</p>
      </div>

      <RegisterOfficerModal open={registerOpen} onClose={() => setRegisterOpen(false)} />
    </aside>
  );
}







