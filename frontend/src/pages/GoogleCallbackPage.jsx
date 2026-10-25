import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api/axios';

export default function GoogleCallbackPage() {
  const location = useLocation();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the full URL with query parameters
        const fullUrl = window.location.href;
        
        // Call backend to exchange code for token
        const response = await api.get(`/auth/google/callback${location.search}`);
        
        if (response.data.user && response.data.token) {
          // Send success message to parent window
          if (window.opener) {
            window.opener.postMessage({
              type: 'GOOGLE_AUTH_SUCCESS',
              user: response.data.user,
              token: response.data.token
            }, window.location.origin);
          }
          
          // Close popup
          window.close();
        }
      } catch (error) {
        console.error('OAuth callback error:', error);
        
        // Send error message to parent window
        if (window.opener) {
          window.opener.postMessage({
            type: 'GOOGLE_AUTH_ERROR',
            message: error.response?.data?.message || 'Authentication failed'
          }, window.location.origin);
        }
        
        // Close popup after 2 seconds
        setTimeout(() => window.close(), 2000);
      }
    };

    handleCallback();
  }, [location]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Completing sign in...</p>
      </div>
    </div>
  );
}
