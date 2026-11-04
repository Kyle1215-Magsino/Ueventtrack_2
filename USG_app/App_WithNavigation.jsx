import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import axios from 'axios';

// Import screens
import HomeScreen from './src/screens/HomeScreen_New';
import StudentDashboardScreen from './src/screens/StudentDashboardScreen_New';
import StudentEventsScreen from './src/screens/StudentEventsScreen_New';
import StudentAttendanceScreen from './src/screens/StudentAttendanceScreen_New';

const Stack = createNativeStackNavigator();
const API_URL = 'http://10.54.162.26:8000/api';

// Auth Context
const AuthContext = React.createContext();

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/mobile/login`, {
        email: email.trim(),
        password: password,
      });

      if (response.data.user && response.data.token) {
        setToken(response.data.token);
        setUser(response.data.user);
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        return { success: true, user: response.data.user };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed',
      };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated: !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="StudentDashboard" component={StudentDashboardScreen} />
          <Stack.Screen name="StudentEvents" component={StudentEventsScreen} />
          <Stack.Screen name="StudentAttendance" component={StudentAttendanceScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}
