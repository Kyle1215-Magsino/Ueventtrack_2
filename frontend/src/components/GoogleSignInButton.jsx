import { useState } from 'react';
import { toast } from 'react-toastify';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function GoogleSignInButton({ className = '' }) {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    
    try {
      // Get Google OAuth URL from backend
      const response = await api.get('/auth/google');
      const googleAuthUrl = response.data.url;

      // Open Google OAuth in popup window
      const width = 500;
      const height = 600;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const popup = window.open(
        googleAuthUrl,
        'Google Sign In',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // Listen for OAuth callback
      const handleMessage = async (event) => {
        // Verify origin for security
        if (event.origin !== window.location.origin) return;

        if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
          const { user, token } = event.data;
          
          // Store token and user data
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
          
          // Update auth context
          if (login) {
            login(user, token);
          }

          toast.success('Successfully signed in with Google!');
          popup?.close();
          window.removeEventListener('message', handleMessage);
          
          // Redirect based on role
          if (user.role === 'student') {
            window.location.href = '/student-dashboard';
          } else {
            window.location.href = '/dashboard';
          }
        } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
          toast.error(event.data.message || 'Failed to sign in with Google');
          popup?.close();
          window.removeEventListener('message', handleMessage);
          setLoading(false);
        }
      };

      window.addEventListener('message', handleMessage);

      // Check if popup was blocked
      if (!popup || popup.closed) {
        toast.error('Pop-up was blocked. Please allow pop-ups for this site.');
        setLoading(false);
        window.removeEventListener('message', handleMessage);
      }

      // Cleanup if popup is closed manually
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
          setLoading(false);
        }
      }, 500);

    } catch (error) {
      console.error('Google Sign-In error:', error);
      toast.error('Failed to initiate Google Sign-In');
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleGoogleSignIn}
      disabled={loading}
      className={`flex items-center justify-center gap-3 px-4 py-2.5 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow ${className}`}
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      <span>{loading ? 'Signing in...' : 'Sign in with Google'}</span>
    </button>
  );
}
