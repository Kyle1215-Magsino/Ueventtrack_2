import { useState, useRef, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import StudentSidebar from './StudentSidebar';
import LogoutConfirmModal from './LogoutConfirmModal';
import OfficerProfileModal from './OfficerProfileModal';
import StudentProfileModal from './StudentProfileModal';
import SettingsModal from './SettingsModal';
import NotificationBell from './NotificationBell';


const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/students': 'Students',
  '/events': 'Events',
  '/checkin': 'Check-In',
  '/face-enrollment': 'Face Enrollment',
  '/attendance': 'Attendance Logs',
  '/fines': 'Fines',
  '/reports': 'Reports',
  '/audit-logs': 'Audit Logs',
  '/announcements': 'Announcements',
  '/student-dashboard': 'Dashboard',
  '/student-attendance': 'My Attendance',
  '/student-events': 'Events',
};

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerClosing, setDrawerClosing] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const openDrawer = () => { setDrawerClosing(false); setDrawerOpen(true); };
  const closeDrawer = () => {
    setDrawerClosing(true);
    setTimeout(() => { setDrawerOpen(false); setDrawerClosing(false); }, 250);
  };
  const toggleDrawer = () => drawerOpen ? closeDrawer() : openDrawer();

  const pageTitle = PAGE_TITLES[location.pathname] || 'U-EventTrack';

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    setLogoutOpen(false);
    await logout();
    navigate('/');
  };

  const SidebarComponent = user?.role === 'student' ? StudentSidebar : Sidebar;

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* ── Desktop sidebar ── */}
      <div className="hidden lg:block flex-shrink-0 w-64 sticky top-0 h-screen">
        <SidebarComponent />
      </div>

      {/* ── Mobile drawer ── */}
      {drawerOpen && (
        <>
          <div
            className={`fixed inset-0 z-20 lg:hidden bg-black/40 backdrop-blur-sm ${drawerClosing ? 'animate-backdropOut' : 'animate-backdropIn'}`}
            onClick={closeDrawer}
          />
          <div className={`fixed top-0 left-0 z-30 h-screen lg:hidden shadow-2xl ${drawerClosing ? 'animate-slideOutDrawer' : 'animate-slideInDrawer'}`}>
            <SidebarComponent onNavigate={closeDrawer} />
          </div>
        </>
      )}

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">

        {/* Top bar */}
        <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 sm:px-6 h-14 flex items-center gap-3 sticky top-0 z-10">
          <button
            onClick={() => toggleDrawer()}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all active:scale-95 flex-shrink-0 lg:hidden"
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ transition: 'transform 0.3s ease' }}>
              {/* Top line: rotates into \ when open */}
              <line
                x1="4" y1="6" x2="20" y2="6"
                strokeLinecap="round" strokeWidth={2}
                style={{
                  transformOrigin: '12px 6px',
                  transform: drawerOpen ? 'translateY(6px) rotate(45deg)' : 'none',
                  transition: 'transform 0.3s ease',
                }}
              />
              {/* Middle line: fades out when open */}
              <line
                x1="4" y1="12" x2="20" y2="12"
                strokeLinecap="round" strokeWidth={2}
                style={{
                  transformOrigin: '12px 12px',
                  opacity: drawerOpen ? 0 : 1,
                  transition: 'opacity 0.2s ease',
                }}
              />
              {/* Bottom line: rotates into / when open */}
              <line
                x1="4" y1="18" x2="20" y2="18"
                strokeLinecap="round" strokeWidth={2}
                style={{
                  transformOrigin: '12px 18px',
                  transform: drawerOpen ? 'translateY(-6px) rotate(-45deg)' : 'none',
                  transition: 'transform 0.3s ease',
                }}
              />
            </svg>
          </button>

          <p className="font-semibold text-gray-900 dark:text-white text-sm flex-1 tracking-tight">{pageTitle}</p>

          <NotificationBell />

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(v => !v)}
              className="flex items-center gap-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl px-2.5 py-1.5 transition-colors"
            >
              {user?.role === 'student' && user?.student_record?.profile_image ? (
                <img src={`/storage/${user.student_record.profile_image}`} alt="Profile" className="w-8 h-8 rounded-full object-cover ring-2 ring-green-100" />
              ) : user?.role !== 'student' && user?.profile_image ? (
                <img src={`/storage/${user.profile_image}`} alt="Profile" className="w-8 h-8 rounded-full object-cover ring-2 ring-green-100" />
              ) : (
                <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </div>
              )}
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-tight">{user?.name}</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 capitalize">{user?.role}</p>
              </div>
              <svg className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 py-1 z-50 animate-modal-in">
                <div className="px-4 py-3 border-b border-gray-50 dark:border-gray-700">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{user?.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 capitalize">{user?.role}</p>
                </div>
                <button
                  onClick={() => { setDropdownOpen(false); setProfileOpen(true); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  My Profile
                </button>
                <button
                  onClick={() => { setDropdownOpen(false); setSettingsOpen(true); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  Settings
                </button>
                <div className="border-t border-gray-50 dark:border-gray-700 mt-1" />
                <button
                  onClick={() => { setDropdownOpen(false); setLogoutOpen(true); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>

        <main key={location.pathname} className="flex-1 p-5 sm:p-6 overflow-auto animate-pageEnter">
          <Outlet />
        </main>
      </div>

      <LogoutConfirmModal
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onConfirm={handleLogout}
        userName={user?.name}
      />

      <OfficerProfileModal
        open={profileOpen && user?.role !== 'student'}
        onClose={() => setProfileOpen(false)}
      />

      <StudentProfileModal
        open={profileOpen && user?.role === 'student'}
        onClose={() => setProfileOpen(false)}
      />

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}






