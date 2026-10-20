import { useState } from 'react';
import { registerStudent } from '../api/authApi';
import { toast } from 'react-toastify';
import { Mail, Lock, Eye, EyeOff, User, CreditCard, GraduationCap, ArrowRight, UserPlus } from 'lucide-react';
import Modal from './Modal';

export default function StudentRegisterModal({ open, onClose, onSwitchToLogin }) {
  const [form, setForm] = useState({
    student_id: '', first_name: '', last_name: '', email: '',
    course: '', year_level: 1, password: '', password_confirmation: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState({ pwd: false, confirm: false });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.password_confirmation) {
      toast.error('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await registerStudent(form);
      toast.success('Account created! You can now login.');
      setForm({ student_id: '', first_name: '', last_name: '', email: '', course: '', year_level: 1, password: '', password_confirmation: '' });
      setTimeout(() => { onClose(); onSwitchToLogin(); }, 1000);
    } catch (err) {
      const msg = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join(' ')
        : err.response?.data?.message || 'Registration failed.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  return (
    <Modal open={open} onClose={onClose} maxWidth="max-w-xl">
      {/* Simple Green Header */}
      <div className="bg-green-600 rounded-t-2xl px-6 py-6 text-center">
        <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-white/30 shadow-xl mx-auto mb-3 bg-white">
          <img src="/usg-logo.png" alt="USG Logo" className="w-full h-full object-cover" />
        </div>
        <h2 className="text-xl font-black text-white mb-0.5">Create Account</h2>
        <p className="text-green-50 text-xs">U-EventTrack • MinSU Bongabong</p>
      </div>

      {/* Form */}
      <div className="px-6 pt-5 pb-6">
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Student ID & Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Student ID</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <CreditCard className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                </div>
                <input type="text" required value={form.student_id} onChange={e => set('student_id', e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 transition"
                  placeholder="e.g. 00414" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Mail className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                </div>
                <input type="email" required value={form.email} onChange={e => set('email', e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 transition"
                  placeholder="your@email.com" />
              </div>
            </div>
          </div>

          {/* First Name & Last Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">First Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <User className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                </div>
                <input type="text" required value={form.first_name} onChange={e => set('first_name', e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 transition"
                  placeholder="First name" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Last Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <User className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                </div>
                <input type="text" required value={form.last_name} onChange={e => set('last_name', e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 transition"
                  placeholder="Last name" />
              </div>
            </div>
          </div>

          {/* Course & Year Level */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Course</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none z-10">
                  <GraduationCap className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                </div>
                <select required value={form.course} onChange={e => set('course', e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 transition appearance-none cursor-pointer">
                  <option value="">Select Course</option>
                  <option value="BSEED">BSEED</option>
                  <option value="BSIT">BSIT</option>
                  <option value="BSCPE">BSCPE</option>
                  <option value="BSFI">BSFI</option>
                  <option value="BSHM">BSHM</option>
                  <option value="BSCRIM">BSCRIM</option>
                  <option value="BSPOLSCI">BSPOLSCI</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Year Level</label>
              <select required value={form.year_level} onChange={e => set('year_level', parseInt(e.target.value))}
                className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 transition appearance-none cursor-pointer">
                <option value={1}>1st Year</option>
                <option value={2}>2nd Year</option>
                <option value={3}>3rd Year</option>
                <option value={4}>4th Year</option>
              </select>
            </div>
          </div>

          {/* Password & Confirm Password */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Lock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                </div>
                <input type={showPw.pwd ? 'text' : 'password'} required minLength={6} value={form.password}
                  onChange={e => set('password', e.target.value)}
                  className="w-full pl-9 pr-9 py-2 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 transition"
                  placeholder="Min 6 characters" />
                <button type="button" onClick={() => setShowPw(v => ({ ...v, pwd: !v.pwd }))}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition">
                  {showPw.pwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Confirm Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Lock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                </div>
                <input type={showPw.confirm ? 'text' : 'password'} required minLength={6} value={form.password_confirmation}
                  onChange={e => set('password_confirmation', e.target.value)}
                  className="w-full pl-9 pr-9 py-2 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 transition"
                  placeholder="Confirm password" />
                <button type="button" onClick={() => setShowPw(v => ({ ...v, confirm: !v.confirm }))}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition">
                  {showPw.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-green-500/30 hover:shadow-green-500/50 flex items-center justify-center gap-2">
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating Account...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Create Account
              </>
            )}
          </button>
        </form>

        <div className="mt-4 pt-4 border-t-2 border-green-300 dark:border-gray-800">
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <button onClick={onSwitchToLogin} className="text-green-600 dark:text-green-400 font-bold hover:text-green-700 dark:hover:text-green-500 transition inline-flex items-center gap-1">
              Sign In
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </p>
        </div>
      </div>
    </Modal>
  );
}
