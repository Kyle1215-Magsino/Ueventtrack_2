import { useState, useEffect } from 'react';
import { Calendar, LogIn, ArrowRight, Check, Users, Smartphone, QrCode, Eye, BarChart2, ChevronRight, Sparkles } from 'lucide-react';
import LoginModal from '../components/LoginModal';
import StudentRegisterModal from '../components/StudentRegisterModal';
import { getPublicAnnouncements } from '../api/announcementApi';

const FALLBACK_ANNOUNCEMENTS = [
  { id: 1, tag: 'Event', text: 'Campus Leadership Summit on April 5, 2026 at the Main Gymnasium' },
  { id: 2, tag: 'Update', text: 'Face enrollment is now open. Visit the Face Enrollment page' },
  { id: 3, tag: 'Info', text: 'U-EventTrack v2 is live! Enjoy all new features' },
];

export default function HomePage() {
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [announcements, setAnnouncements] = useState(FALLBACK_ANNOUNCEMENTS);
  const [annIdx, setAnnIdx] = useState(0);

  useEffect(() => {
    getPublicAnnouncements()
      .then(res => { if (res.data?.length) setAnnouncements(res.data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (announcements.length <= 1) return;
    const interval = setInterval(() => {
      setAnnIdx(i => (i + 1) % announcements.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [announcements]);

  const openLogin = () => { setRegisterOpen(false); setLoginOpen(true); };
  const openRegister = () => { setLoginOpen(false); setRegisterOpen(true); };

  return (
    <div className="min-h-screen bg-white">
      {/* Custom Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Cal+Sans:wght@600&display=swap');
        
        * { font-family: 'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif; }
        
        .font-display { font-family: 'Cal Sans', 'Inter', sans-serif; }
      `}</style>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 p-[2px] shadow-lg">
                <div className="w-full h-full rounded-2xl bg-white flex items-center justify-center overflow-hidden p-0.5">
                  <img src="/usg-logo.png" alt="USG" className="w-full h-full object-cover rounded-xl" />
                </div>
              </div>
              <div>
                <div className="font-bold text-lg text-gray-900 tracking-tight">U-EventTrack</div>
                <div className="text-[10px] text-gray-500 font-medium tracking-wide">MinSU BONGABONG</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={openLogin} 
                className="hidden sm:block px-5 py-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
              >
                Sign In
              </button>
              <button 
                onClick={openRegister} 
                className="group px-6 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-full hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/20 hover:shadow-gray-900/40 hover:scale-105 flex items-center gap-2"
              >
                Get Started
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 lg:px-8 relative overflow-hidden">
        {/* Gradient Orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-green-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl" />
        
        <div className="max-w-7xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/60 rounded-full">
                <Sparkles className="w-3.5 h-3.5 text-green-600" />
                <span className="text-xs font-bold text-green-700 tracking-wide">SMART ATTENDANCE SYSTEM</span>
              </div>

              {/* Headline */}
              <h1 className="font-display text-6xl sm:text-7xl lg:text-8xl font-semibold text-gray-900 leading-[0.95] tracking-tight">
                Attendance
                <br />
                <span className="bg-gradient-to-r from-green-600 via-emerald-500 to-teal-600 bg-clip-text text-transparent">
                  Reimagined
                </span>
              </h1>

              {/* Subheading */}
              <p className="text-xl text-gray-600 leading-relaxed max-w-lg font-medium">
                The modern way to track student attendance at campus events with{' '}
                <span className="text-gray-900 font-semibold">barcode scanning</span>,{' '}
                <span className="text-gray-900 font-semibold">facial recognition</span>, and{' '}
                <span className="text-gray-900 font-semibold">real-time analytics</span>.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-start gap-4 pt-2">
                <button 
                  onClick={openLogin}
                  className="group px-8 py-4 bg-gray-900 text-white text-base font-bold rounded-2xl hover:bg-gray-800 transition-all shadow-2xl shadow-gray-900/20 hover:shadow-gray-900/40 hover:scale-105 flex items-center gap-3"
                >
                  <LogIn className="w-5 h-5" />
                  Sign In Now
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button 
                  onClick={openRegister}
                  className="px-8 py-4 bg-white text-gray-900 text-base font-bold rounded-2xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all"
                >
                  Register as Student
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center gap-6 pt-4">
                {[
                  { icon: <Check className="w-4 h-4" />, text: 'Real-time Tracking' },
                  { icon: <Check className="w-4 h-4" />, text: '3 Check-in Methods' },
                  { icon: <Check className="w-4 h-4" />, text: 'Mobile Ready' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                      {item.icon}
                    </div>
                    <span className="text-sm font-semibold text-gray-700">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right - Logo Display */}
            <div className="hidden lg:flex justify-center items-center">
              <div className="w-[380px] h-[380px] rounded-full bg-gradient-to-br from-green-600 via-emerald-600 to-teal-700 p-2 shadow-xl">
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                  <img 
                    src="/usg-logo.png" 
                    alt="USG Logo" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="mt-20 grid grid-cols-3 gap-8 max-w-3xl">
            {[
              { value: '3', label: 'Check-in Methods', sublabel: 'Barcode, Face, Mobile' },
              { value: '100%', label: 'Digital Records', sublabel: 'Paperless System' },
              { value: 'Live', label: 'Real-time Updates', sublabel: 'Instant Sync' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-5xl font-black bg-gradient-to-br from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-sm font-bold text-gray-900">{stat.label}</div>
                <div className="text-xs text-gray-500 font-medium mt-0.5">{stat.sublabel}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-block px-4 py-2 bg-gray-900 text-white rounded-full text-xs font-bold uppercase tracking-wider mb-6">
              Features
            </div>
            <h2 className="font-display text-5xl lg:text-6xl font-semibold text-gray-900 mb-6 tracking-tight">
              Everything You Need
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto font-medium">
              Modern tools designed for efficient campus-wide attendance management
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <QrCode className="w-7 h-7" />,
                title: 'Barcode Scanning',
                desc: 'Fast and reliable barcode-based check-in for quick student verification at events',
                gradient: 'from-green-500 to-emerald-600',
              },
              {
                icon: <Eye className="w-7 h-7" />,
                title: 'Face Recognition',
                desc: 'Touchless facial recognition attendance for maximum convenience and hygiene',
                gradient: 'from-emerald-500 to-teal-600',
              },
              {
                icon: <Smartphone className="w-7 h-7" />,
                title: 'Mobile App',
                desc: 'Native mobile application for students to check-in and view their attendance',
                gradient: 'from-teal-500 to-cyan-600',
              },
              {
                icon: <BarChart2 className="w-7 h-7" />,
                title: 'Real-time Analytics',
                desc: 'Live dashboards with attendance trends, insights, and detailed reports',
                gradient: 'from-green-500 to-emerald-600',
              },
              {
                icon: <Users className="w-7 h-7" />,
                title: 'Student Management',
                desc: 'Complete student database with course tracking and profile management',
                gradient: 'from-emerald-500 to-teal-600',
              },
              {
                icon: <Calendar className="w-7 h-7" />,
                title: 'Event Management',
                desc: 'Create and manage events with automated attendance tracking and notifications',
                gradient: 'from-teal-500 to-cyan-600',
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="group relative bg-white rounded-3xl p-8 shadow-sm hover:shadow-2xl border-2 border-gray-100 hover:border-transparent transition-all duration-300 hover:-translate-y-2"
              >
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity duration-300" 
                  style={{ backgroundImage: `linear-gradient(to bottom right, var(--tw-gradient-stops))` }} />
                
                <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${feature.gradient} text-white mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed font-medium">{feature.desc}</p>
                <ChevronRight className="w-5 h-5 text-gray-300 absolute bottom-8 right-8 group-hover:text-green-600 group-hover:translate-x-1 transition-all" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-block px-4 py-2 bg-gray-900 text-white rounded-full text-xs font-bold uppercase tracking-wider mb-6">
              How It Works
            </div>
            <h2 className="font-display text-5xl lg:text-6xl font-semibold text-gray-900 tracking-tight">
              Get Started in 3 Steps
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              { step: '01', title: 'Create Event', desc: 'Set up your campus event with date, time, and location details in seconds' },
              { step: '02', title: 'Check-in Students', desc: 'Students scan barcodes, use face recognition, or mobile app to check-in instantly' },
              { step: '03', title: 'Track & Analyze', desc: 'View real-time attendance data and generate comprehensive reports automatically' },
            ].map((item, i) => (
              <div key={i} className="relative text-center">
                {i < 2 && (
                  <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-[2px] bg-gradient-to-r from-green-300 to-transparent" />
                )}
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-green-500 to-emerald-600 text-white text-3xl font-black mb-6 shadow-xl relative">
                  {item.step}
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-green-500 to-emerald-600 blur-xl opacity-50" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed font-medium">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 lg:px-8 bg-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff12_1px,transparent_1px),linear-gradient(to_bottom,#ffffff12_1px,transparent_1px)] bg-[size:32px_32px]" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl" />
        
        <div className="max-w-4xl mx-auto text-center relative">
          <h2 className="font-display text-5xl lg:text-6xl font-semibold text-white mb-6 tracking-tight">
            Ready to Transform
            <br />
            Your Event Attendance?
          </h2>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto font-medium">
            Join MinSU Bongabong Campus in modernizing event management with U-EventTrack
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={openLogin}
              className="group w-full sm:w-auto px-8 py-4 bg-white text-gray-900 text-lg font-bold rounded-2xl hover:bg-gray-100 transition-all shadow-2xl hover:scale-105 flex items-center justify-center gap-3"
            >
              <LogIn className="w-5 h-5" />
              Get Started Today
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={openRegister}
              className="w-full sm:w-auto px-8 py-4 bg-white/10 backdrop-blur-sm text-white text-lg font-bold rounded-2xl border-2 border-white/20 hover:bg-white/20 transition-all"
            >
              Register as Student
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-gray-500 py-12 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 p-[2px]">
                <div className="w-full h-full rounded-2xl bg-black flex items-center justify-center overflow-hidden p-0.5">
                  <img src="/usg-logo.png" alt="USG" className="w-full h-full object-cover rounded-xl" />
                </div>
              </div>
              <span className="text-xl font-bold text-white tracking-tight">U-EventTrack</span>
            </div>
            <p className="text-sm font-medium">Modern attendance tracking for campus events</p>
            <p className="text-sm">© {new Date().getFullYear()} MinSU Bongabong Campus. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <LoginModal 
        open={loginOpen} 
        onClose={() => setLoginOpen(false)}
        onSwitchToRegister={openRegister}
      />
      <StudentRegisterModal 
        open={registerOpen} 
        onClose={() => setRegisterOpen(false)}
        onSwitchToLogin={openLogin}
      />
    </div>
  );
}
