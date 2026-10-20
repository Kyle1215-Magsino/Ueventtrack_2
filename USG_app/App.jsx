import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Modal, TextInput, KeyboardAvoidingView, Platform, Alert, Image, Switch } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialIcons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { createStyles } from './styles';
import EventDetailsModal from './src/components/EventDetailsModal';
import BarcodeScanner from './src/components/BarcodeScanner';
import { useTheme } from './src/context/ThemeContext';

const API_URL = 'http://10.100.103.26:8000/api';

// Configure axios timeout
axios.defaults.timeout = 10000; // 10 seconds timeout

const FALLBACK_ANNOUNCEMENTS = [
  { id: 1, tag: 'Event', text: 'Campus Leadership Summit on April 5, 2026 at the Main Gymnasium. All students are encouraged to attend!' },
  { id: 2, tag: 'Reminder', text: 'Face enrollment is now open. Visit the Face Enrollment page to register your biometric data.' },
  { id: 3, tag: 'Info', text: "Barcode scanners are available at the Registrar's Office. Contact admin for assistance." },
  { id: 4, tag: 'Event', text: 'General Assembly on April 12, 2026. Attendance is mandatory for all enrolled students.' },
  { id: 5, tag: 'Update', text: 'U-EventTrack v2 is live! Enjoy barcode scanning, facial recognition, and mobile app access.' },
];

// Dashboard Tab Component
function DashboardTab({ dashboardData, greeting, attendanceRate, streak, nextEvent, recentCheckins, formatDate, formatTime, styles }) {
  return (
    <>
      {/* Next Event Banner */}
      {nextEvent && (
        <View style={styles.nextEventBanner}>
          <View style={styles.nextEventIconBox}>
            <Ionicons name="notifications" size={20} color="#fff" />
          </View>
          <View style={styles.nextEventInfo}>
            <Text style={styles.nextEventLabel}>Next Upcoming Event</Text>
            <Text style={styles.nextEventName}>{nextEvent.event_name}</Text>
            <Text style={styles.nextEventDetails}>
              {formatDate(nextEvent.event_date)} • {formatTime(nextEvent.start_time)}–{formatTime(nextEvent.end_time)}
            </Text>
          </View>
        </View>
      )}

      {/* Stats Grid */}
      <View style={styles.statsContainer}>
        {[
          { label: 'Events Attended', value: dashboardData.attendedEvents, icon: 'calendar', color: '#10b981', bg: '#dcfce7' },
          { label: 'Present', value: dashboardData.totalPresent, icon: 'checkmark-circle', color: '#059669', bg: '#d1fae5' },
          { label: 'Late', value: dashboardData.totalLate, icon: 'time', color: '#f59e0b', bg: '#fef3c7' },
          { label: 'Streak', value: `${streak}`, icon: 'flame', color: '#f97316', bg: '#fed7aa' },
        ].map((stat, index) => (
          <View key={stat.label} style={styles.statCard}>
            <View style={styles.statCardInner}>
              <View style={[styles.statIconBox, { backgroundColor: stat.bg }]}>
                <Ionicons name={stat.icon} size={20} color={stat.color} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Attendance Rate */}
      <View style={styles.attendanceCard}>
        <View style={styles.attendanceCircle}>
          <Text style={styles.attendancePercent}>{attendanceRate}%</Text>
        </View>
        <View style={styles.attendanceInfo}>
          <Text style={styles.attendanceTitle}>Attendance Rate</Text>
          <Text style={styles.attendanceSubtitle}>
            {dashboardData.attendedEvents} of {dashboardData.totalEvents} events
          </Text>
        </View>
      </View>

      {/* Recent Check-ins */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="time" size={20} color="#10b981" />
          <Text style={styles.sectionTitle}>Recent Check-ins</Text>
        </View>
        {recentCheckins.length > 0 ? (
          recentCheckins.map((rec, idx) => (
            <View key={rec.id || idx} style={styles.checkinItem}>
              <View style={[
                styles.checkinIconBox,
                { backgroundColor: rec.status === 'present' ? '#dcfce7' : '#fef3c7' }
              ]}>
                <Ionicons 
                  name={rec.status === 'present' ? 'checkmark' : 'time'} 
                  size={16} 
                  color={rec.status === 'present' ? '#16a34a' : '#f59e0b'} 
                />
              </View>
              <View style={styles.checkinInfo}>
                <Text style={styles.checkinEventName}>{rec.event?.event_name}</Text>
                <Text style={styles.checkinTime}>
                  {formatDate(rec.check_in_time)} • {rec.status}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No check-ins yet</Text>
        )}
      </View>

      {/* Upcoming Events */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="calendar" size={20} color="#10b981" />
          <Text style={styles.sectionTitle}>Upcoming Events</Text>
        </View>
        {dashboardData.upcomingEvents.map(e => (
          <View key={e.id} style={styles.eventItem}>
            <View style={styles.eventIconBox}>
              <Ionicons name="calendar-outline" size={20} color="#10b981" />
            </View>
            <View style={styles.eventInfo}>
              <Text style={styles.eventName}>{e.event_name}</Text>
              <Text style={styles.eventDetails}>{formatDate(e.event_date)} • {e.venue}</Text>
            </View>
            <View style={styles.eventBadge}>
              <Text style={styles.eventBadgeText}>{e.status}</Text>
            </View>
          </View>
        ))}
        {dashboardData.upcomingEvents.length === 0 && (
          <Text style={styles.emptyText}>No upcoming events</Text>
        )}
      </View>
    </>
  );
}

// Events Tab Component
function EventsTab({ dashboardData, formatDate, formatTime, onEventPress, styles }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    axios.get(`${API_URL}/student-events`)
      .then(res => setEvents(res.data || []))
      .catch(err => console.log('Error:', err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading && events.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.loadingText}>Loading events...</Text>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeaderRow}>
        <Ionicons name="calendar" size={20} color="#10b981" />
        <Text style={styles.sectionTitle}>Available Events</Text>
      </View>
      {events.map(e => (
        <TouchableOpacity 
          key={e.id} 
          style={styles.eventCard}
          onPress={() => onEventPress(e)}
          activeOpacity={0.7}
        >
          <View style={[
            styles.statusBadge,
            { backgroundColor: e.status === 'ongoing' ? 'rgba(16, 185, 129, 0.1)' : 
                              e.status === 'completed' ? 'rgba(107, 114, 128, 0.1)' : 
                              'rgba(59, 130, 246, 0.1)' }
          ]}>
            <Text style={[
              styles.statusText,
              { color: e.status === 'ongoing' ? '#10b981' : 
                       e.status === 'completed' ? '#6b7280' : 
                       '#3b82f6' }
            ]}>
              {e.status.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.eventCardName}>{e.event_name}</Text>
          {e.description && (
            <Text style={styles.eventDescription} numberOfLines={2}>
              {e.description}
            </Text>
          )}
          <View style={styles.eventDetailRow}>
            <Ionicons name="calendar-outline" size={16} color="#10b981" />
            {e.status === 'completed' ? (
              <View style={styles.endedDateContainer}>
                <Text style={styles.endedLabel}>Ended</Text>
                <Text style={styles.eventDetailText}>{formatDate(e.event_date)}</Text>
              </View>
            ) : (
              <Text style={styles.eventDetailText}>{formatDate(e.event_date)}</Text>
            )}
          </View>
          {e.venue && (
            <View style={styles.eventDetailRow}>
              <Ionicons name="location-outline" size={16} color="#10b981" />
              <Text style={styles.eventDetailText}>{e.venue}</Text>
            </View>
          )}
          {e.checked_in && (
            <View style={styles.checkedInBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#10b981" />
              <Text style={styles.checkedInText}>Checked In</Text>
            </View>
          )}
          <View style={styles.tapHint}>
            <Text style={styles.tapHintText}>Tap for details</Text>
            <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
          </View>
        </TouchableOpacity>
      ))}
      {events.length === 0 && (
        <Text style={styles.emptyText}>No events available</Text>
      )}
    </View>
  );
}

// Attendance Tab Component
function AttendanceTab({ dashboardData, formatDate, formatTime, styles }) {
  const [tab, setTab] = useState('all');
  const records = dashboardData.attendanceRecords || [];
  const absentEvents = dashboardData.allPastEvents?.filter(e => 
    !records.find(r => r.event_id === e.id)
  ) || [];

  const filtered = tab === 'all' ? records : 
                   tab === 'absent' ? absentEvents :
                   records.filter(r => r.status === tab);

  const counts = {
    all: records.length,
    present: records.filter(r => r.status === 'present').length,
    late: records.filter(r => r.status === 'late').length,
    absent: absentEvents.length,
  };

  return (
    <>
      {/* Tabs */}
      <View style={styles.attendanceTabs}>
        {[
          { key: 'all', label: 'All' },
          { key: 'present', label: 'Present' },
          { key: 'late', label: 'Late' },
          { key: 'absent', label: 'Absent' },
        ].map(t => (
          <TouchableOpacity
            key={t.key}
            style={[
              styles.attendanceTab,
              tab === t.key && (t.key === 'absent' ? styles.attendanceTabActiveRed : styles.attendanceTabActive)
            ]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[
              styles.attendanceTabText,
              tab === t.key && styles.attendanceTabTextActive
            ]}>
              {t.label} ({counts[t.key]})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="clipboard" size={20} color="#10b981" />
          <Text style={styles.sectionTitle}>My Attendance</Text>
        </View>
        
        {tab === 'absent' ? (
          absentEvents.length > 0 ? (
            absentEvents.map(e => (
              <View key={e.id} style={styles.absentEventCard}>
                <View style={styles.absentEventInfo}>
                  <Text style={styles.absentEventName}>{e.event_name}</Text>
                  <Text style={styles.absentEventDetails}>
                    {formatDate(e.event_date)} • {formatTime(e.start_time)}–{formatTime(e.end_time)}
                  </Text>
                </View>
                <View style={styles.absentBadge}>
                  <Text style={styles.absentBadgeText}>Absent</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyStateGood}>
              <Ionicons name="checkmark-circle" size={48} color="#10b981" />
              <Text style={styles.emptyStateGoodText}>No absences!</Text>
              <Text style={styles.emptyStateGoodSubtext}>You attended all completed events</Text>
            </View>
          )
        ) : (
          filtered.length > 0 ? (
            filtered.map((rec, idx) => (
              <View key={rec.id || idx} style={styles.attendanceRecordCard}>
                <View style={[
                  styles.attendanceRecordIcon,
                  { backgroundColor: rec.status === 'present' ? '#dcfce7' : '#fef3c7' }
                ]}>
                  <Ionicons 
                    name={rec.status === 'present' ? 'checkmark' : 'time'} 
                    size={20} 
                    color={rec.status === 'present' ? '#16a34a' : '#f59e0b'} 
                  />
                </View>
                <View style={styles.attendanceRecordInfo}>
                  <Text style={styles.attendanceRecordEvent}>{rec.event?.event_name}</Text>
                  <Text style={styles.attendanceRecordDetails}>
                    {formatDate(rec.check_in_time)} • {new Date(rec.check_in_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </Text>
                  <View style={styles.attendanceRecordMeta}>
                    <View style={[
                      styles.attendanceRecordBadge,
                      { backgroundColor: rec.status === 'present' ? '#dcfce7' : '#fef3c7' }
                    ]}>
                      <Text style={[
                        styles.attendanceRecordBadgeText,
                        { color: rec.status === 'present' ? '#16a34a' : '#f59e0b' }
                      ]}>
                        {rec.status}
                      </Text>
                    </View>
                    <Text style={styles.attendanceRecordMethod}>{rec.verification_method}</Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No records found</Text>
          )
        )}
      </View>
    </>
  );
}

// Settings Tab Component
function SettingsTab({ user, dashboardData, styles }) {
  const { isDark, toggleTheme } = useTheme();
  const student = dashboardData?.student;

  return (
    <View style={styles.settingsContent}>
      {/* Profile Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="person" size={20} color="#10b981" />
          <Text style={styles.sectionTitle}>Profile Information</Text>
        </View>
        
        <View style={styles.profileInfoCard}>
          <View style={styles.profileInfoRow}>
            <Text style={styles.profileInfoLabel}>Name</Text>
            <Text style={styles.profileInfoValue}>
              {student?.first_name} {student?.last_name}
            </Text>
          </View>
          <View style={styles.profileInfoRow}>
            <Text style={styles.profileInfoLabel}>Student ID</Text>
            <Text style={styles.profileInfoValue}>{student?.student_id}</Text>
          </View>
          <View style={styles.profileInfoRow}>
            <Text style={styles.profileInfoLabel}>Email</Text>
            <Text style={styles.profileInfoValue}>{student?.email || user?.email}</Text>
          </View>
          <View style={styles.profileInfoRow}>
            <Text style={styles.profileInfoLabel}>Course</Text>
            <Text style={styles.profileInfoValue}>{student?.course}</Text>
          </View>
          <View style={styles.profileInfoRow}>
            <Text style={styles.profileInfoLabel}>Year Level</Text>
            <Text style={styles.profileInfoValue}>Year {student?.year_level}</Text>
          </View>
        </View>
      </View>

      {/* Appearance Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="color-palette" size={20} color="#10b981" />
          <Text style={styles.sectionTitle}>Appearance</Text>
        </View>
        
        <View style={styles.settingItem}>
          <View style={styles.settingItemLeft}>
            <View style={styles.settingIconBox}>
              <Ionicons name={isDark ? "moon" : "sunny"} size={20} color="#10b981" />
            </View>
            <View style={styles.settingItemText}>
              <Text style={styles.settingItemTitle}>Dark Mode</Text>
              <Text style={styles.settingItemSubtitle}>
                {isDark ? 'Dark theme enabled' : 'Light theme enabled'}
              </Text>
            </View>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: '#d1d5db', true: '#10b981' }}
            thumbColor={isDark ? '#fff' : '#f3f4f6'}
          />
        </View>
      </View>

      {/* About Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="information-circle" size={20} color="#10b981" />
          <Text style={styles.sectionTitle}>About</Text>
        </View>
        
        <View style={styles.aboutCard}>
          <Text style={styles.aboutTitle}>U-EventTrack</Text>
          <Text style={styles.aboutDescription}>
            Digital attendance system for Mindoro State University, Bongabong Campus USG events.
          </Text>
          <View style={styles.aboutFeatures}>
            <View style={styles.aboutFeatureItem}>
              <Ionicons name="checkmark-circle" size={16} color="#10b981" />
              <Text style={styles.aboutFeatureText}>Face Recognition</Text>
            </View>
            <View style={styles.aboutFeatureItem}>
              <Ionicons name="qr-code" size={16} color="#10b981" />
              <Text style={styles.aboutFeatureText}>QR Code Scanning</Text>
            </View>
            <View style={styles.aboutFeatureItem}>
              <Ionicons name="location" size={16} color="#10b981" />
              <Text style={styles.aboutFeatureText}>GPS Verification</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.settingsFooter}>
        <Text style={styles.settingsFooterText}>
          © {new Date().getFullYear()} MinSU Bongabong Campus
        </Text>
      </View>
    </View>
  );
}

export default function App() {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors);
  
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [annIdx, setAnnIdx] = useState(0);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  
  // Landing page login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const fetchPublicData = async () => {
    try {
      // Add timeout to prevent hanging
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );
      
      const fetchData = Promise.all([
        axios.get(`${API_URL}/announcements/public`),
        axios.get(`${API_URL}/events/active`)
      ]);
      
      const [announcementsRes, eventsRes] = await Promise.race([fetchData, timeout]);
      
      // Use API announcements if available, otherwise use fallback
      if (announcementsRes.data && announcementsRes.data.length > 0) {
        setAnnouncements(announcementsRes.data);
      } else {
        setAnnouncements(FALLBACK_ANNOUNCEMENTS);
      }
      
      setEvents(eventsRes.data || []);
    } catch (error) {
      console.log('Error fetching public data:', error.message);
      // Use fallback if API call fails
      setAnnouncements(FALLBACK_ANNOUNCEMENTS);
      setEvents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchDashboard = async () => {
    if (!token) return;
    try {
      const response = await axios.get(`${API_URL}/student-dashboard`);
      setDashboardData(response.data);
    } catch (error) {
      console.log('Error fetching dashboard:', error.message);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchPublicData();
  }, []);

  useEffect(() => {
    if (announcements.length <= 1) return;
    const interval = setInterval(() => {
      setAnnIdx(i => (i + 1) % announcements.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [announcements]);

  useEffect(() => {
    if (user && token) {
      fetchDashboard();
    }
  }, [user, token]);

  const handleLogin = async (email, password) => {
    try {
      console.log('Attempting login with:', email);
      console.log('API URL:', `${API_URL}/mobile/login`);
      
      const response = await axios.post(`${API_URL}/mobile/login`, {
        email: email.trim(),
        password: password,
      });

      console.log('Login response:', response.data);

      if (response.data.user && response.data.token) {
        setToken(response.data.token);
        setUser(response.data.user);
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        return { success: true, user: response.data.user };
      } else {
        console.log('Login response missing user or token');
        return { success: false, message: 'Invalid response from server' };
      }
    } catch (error) {
      console.log('Login error:', error);
      console.log('Error response:', error.response?.data);
      console.log('Error status:', error.response?.status);
      console.log('Error message:', error.message);
      
      let errorMessage = 'Login failed';
      
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        errorMessage = 'Connection timeout. Please check if the backend server is running.';
      } else if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
        errorMessage = 'Network error. Please check your connection and ensure the backend server is running at ' + API_URL;
      } else if (error.response?.status === 401) {
        errorMessage = 'Invalid email or password';
      } else if (error.response?.status === 403) {
        errorMessage = error.response?.data?.message || 'Account is archived';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      return {
        success: false,
        message: errorMessage,
      };
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            setToken(null);
            setUser(null);
            setDashboardData(null);
            delete axios.defaults.headers.common['Authorization'];
            Alert.alert('Success', 'You have been logged out successfully');
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleQuickLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    const result = await handleLogin(email, password);
    setLoading(false);

    if (result.success) {
      setEmail('');
      setPassword('');
    } else {
      Alert.alert('Login Failed', result.message);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (user && token) {
      await fetchDashboard();
    } else {
      await fetchPublicData();
    }
  };

  const getTagColor = (tag) => {
    const colors = {
      Event: { bg: 'rgba(16, 185, 129, 0.2)', text: '#10b981' },
      Reminder: { bg: 'rgba(245, 158, 11, 0.2)', text: '#f59e0b' },
      Info: { bg: 'rgba(59, 130, 246, 0.2)', text: '#3b82f6' },
      Update: { bg: 'rgba(16, 185, 129, 0.2)', text: '#10b981' },
      Alert: { bg: 'rgba(239, 68, 68, 0.2)', text: '#ef4444' },
    };
    return colors[tag] || { bg: 'rgba(107, 114, 128, 0.2)', text: '#6b7280' };
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    // Handle both "HH:MM:SS" and "HH:MM" formats
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handleEventPress = (event) => {
    setSelectedEvent(event);
    setShowEventDetails(true);
  };

  const handleBarcodeScan = async (barcode) => {
    try {
      // Check if user is logged in
      if (!token) {
        Alert.alert('Error', 'Please login first to check in to events');
        return;
      }

      let eventId = null;
      let studentIdentifier = null;

      // Check if it's an event barcode (EVENT-{event_id})
      if (barcode.startsWith('EVENT-')) {
        eventId = parseInt(barcode.replace('EVENT-', ''));
        studentIdentifier = dashboardData?.student?.student_id;
      }
      // Check if it's a student barcode (MBC2023-{student_id})
      else if (barcode.startsWith('MBC2023-')) {
        // For student barcode, we need to know which event to check in to
        // We'll use the next upcoming event or let user select
        const upcomingEvents = dashboardData?.upcomingEvents || [];
        
        if (upcomingEvents.length === 0) {
          Alert.alert('No Events', 'There are no upcoming events to check in to.');
          return;
        }
        
        // If there's only one upcoming event, use it
        if (upcomingEvents.length === 1) {
          eventId = upcomingEvents[0].id;
          studentIdentifier = barcode; // Use the scanned barcode as identifier
        } else {
          // Multiple events - show selection
          Alert.alert(
            'Select Event',
            'Multiple events available. Which event are you checking in to?',
            upcomingEvents.map(event => ({
              text: event.event_name,
              onPress: () => {
                performCheckin(event.id, barcode);
              }
            })).concat([{ text: 'Cancel', style: 'cancel' }])
          );
          return;
        }
      }
      // Try parsing as just event ID number
      else {
        const parsedId = parseInt(barcode);
        if (!isNaN(parsedId)) {
          eventId = parsedId;
          studentIdentifier = dashboardData?.student?.student_id;
        } else {
          Alert.alert('Invalid Barcode', 'This barcode format is not recognized.');
          return;
        }
      }

      if (!eventId || isNaN(eventId)) {
        Alert.alert('Invalid Barcode', 'Could not determine event from barcode.');
        return;
      }

      await performCheckin(eventId, studentIdentifier);
    } catch (error) {
      console.log('Check-in error:', error);
      const message = error.response?.data?.message || 'Failed to check in. Please try again.';
      Alert.alert('Check-in Failed', message);
    }
  };

  const performCheckin = async (eventId, studentIdentifier) => {
    try {
      // Call the check-in API
      const response = await axios.post(
        `${API_URL}/checkin`,
        {
          student_identifier: studentIdentifier,
          event_id: eventId,
          verification_method: 'barcode',
          location_lat: null,
          location_lng: null,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.attendance) {
        const status = response.data.status === 'late' ? '(Late)' : '';
        
        Alert.alert(
          'Check-in Successful!',
          `You have been checked in ${status}`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Refresh dashboard data
                fetchDashboard();
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', response.data.message || 'Check-in failed');
      }
    } catch (error) {
      console.log('Check-in error:', error);
      const message = error.response?.data?.message || 'Failed to check in. Please try again.';
      Alert.alert('Check-in Failed', message);
    }
  };

  const current = announcements.length > 0 && announcements[annIdx] 
    ? announcements[annIdx] 
    : FALLBACK_ANNOUNCEMENTS[0];
  const tagColor = getTagColor(current.tag);

  // If logged in, show dashboard with tabs
  if (user && dashboardData) {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const attendanceRate = dashboardData.totalEvents > 0 ? Math.round((dashboardData.attendedEvents / dashboardData.totalEvents) * 100) : 0;
    const streak = dashboardData.streak || 0;
    const nextEvent = dashboardData.nextEvent || null;

    const recentCheckins = (dashboardData.attendanceRecords || [])
      .sort((a, b) => new Date(b.check_in_time) - new Date(a.check_in_time))
      .slice(0, 5);

    return (
      <View style={styles.container}>
        <StatusBar 
          style={isDark ? "light" : "dark"} 
          backgroundColor="transparent"
          translucent={false}
        />
        
        {/* Dashboard Header */}
        <View style={styles.dashboardHeader}>
          <View style={styles.headerRow}>
            <View style={styles.profileSection}>
              <View style={styles.profileInitials}>
                <Text style={styles.profileInitialsText}>
                  {dashboardData.student?.first_name?.charAt(0)}{dashboardData.student?.last_name?.charAt(0)}
                </Text>
              </View>
              <View style={styles.headerTextContainer}>
                <Text style={styles.dashboardGreeting}>{greeting}, {dashboardData.student?.first_name}!</Text>
                <Text style={styles.dashboardDate}>{today}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <View style={styles.buttonRow}>
                <Ionicons name="log-out-outline" size={16} color="#dc2626" />
                <Text style={styles.logoutText}>Logout</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Content */}
        <ScrollView 
          style={styles.dashboardContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#10b981']} />
          }
        >
          {activeTab === 'dashboard' && <DashboardTab dashboardData={dashboardData} greeting={greeting} attendanceRate={attendanceRate} streak={streak} nextEvent={nextEvent} recentCheckins={recentCheckins} formatDate={formatDate} formatTime={formatTime} styles={styles} />}
          {activeTab === 'events' && <EventsTab dashboardData={dashboardData} formatDate={formatDate} formatTime={formatTime} onEventPress={handleEventPress} styles={styles} />}
          {activeTab === 'attendance' && <AttendanceTab dashboardData={dashboardData} formatDate={formatDate} formatTime={formatTime} styles={styles} />}
          {activeTab === 'settings' && <SettingsTab user={user} dashboardData={dashboardData} styles={styles} />}
        </ScrollView>

        {/* Bottom Tab Navigation */}
        <View style={styles.bottomTabs}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'dashboard' && styles.tabActive]}
            onPress={() => setActiveTab('dashboard')}
          >
            <Ionicons name={activeTab === 'dashboard' ? 'home' : 'home-outline'} size={24} color={activeTab === 'dashboard' ? '#10b981' : '#6b7280'} />
            <Text style={[styles.tabText, activeTab === 'dashboard' && styles.tabTextActive]}>Dashboard</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'events' && styles.tabActive]}
            onPress={() => setActiveTab('events')}
          >
            <Ionicons name={activeTab === 'events' ? 'calendar' : 'calendar-outline'} size={24} color={activeTab === 'events' ? '#10b981' : '#6b7280'} />
            <Text style={[styles.tabText, activeTab === 'events' && styles.tabTextActive]}>Events</Text>
          </TouchableOpacity>
          
          {/* Scanner Button (Middle) */}
          <View style={styles.scannerButtonContainer}>
            <View style={styles.scannerButtonOuter}>
              <TouchableOpacity 
                style={styles.scannerButton}
                onPress={() => setShowScanner(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="qr-code" size={32} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.scannerButtonText}>Scan</Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'attendance' && styles.tabActive]}
            onPress={() => setActiveTab('attendance')}
          >
            <Ionicons name={activeTab === 'attendance' ? 'clipboard' : 'clipboard-outline'} size={24} color={activeTab === 'attendance' ? '#10b981' : '#6b7280'} />
            <Text style={[styles.tabText, activeTab === 'attendance' && styles.tabTextActive]}>Attendance</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'settings' && styles.tabActive]}
            onPress={() => setActiveTab('settings')}
          >
            <Ionicons name={activeTab === 'settings' ? 'settings' : 'settings-outline'} size={24} color={activeTab === 'settings' ? '#10b981' : '#6b7280'} />
            <Text style={[styles.tabText, activeTab === 'settings' && styles.tabTextActive]}>Settings</Text>
          </TouchableOpacity>
        </View>

        {/* Event Details Modal */}
        <EventDetailsModal
          visible={showEventDetails}
          event={selectedEvent}
          onClose={() => {
            setShowEventDetails(false);
            setSelectedEvent(null);
          }}
          formatDate={formatDate}
          formatTime={formatTime}
        />

        {/* Barcode Scanner Modal */}
        <BarcodeScanner
          visible={showScanner}
          onClose={() => setShowScanner(false)}
          onScan={handleBarcodeScan}
          token={token}
        />
      </View>
    );
  }

  // Home screen (not logged in)
  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <StatusBar 
          style={isDark ? "light" : "dark"} 
          backgroundColor="transparent"
          translucent={false}
        />
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={{ marginTop: 12, color: '#6b7280' }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar 
        style={isDark ? "light" : "dark"}
        backgroundColor="transparent"
        translucent={false}
      />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, backgroundColor: colors.background }}
      >
        <ScrollView 
          contentContainerStyle={{ 
            flexGrow: 1, 
            justifyContent: 'center',
            paddingHorizontal: 24,
            paddingVertical: 60,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo Section */}
          <View style={{ alignItems: 'center', marginBottom: 100 }}>
            <View style={{
              width: 90,
              height: 90,
              borderRadius: 45,
              backgroundColor: '#ffffff',
              justifyContent: 'center',
              alignItems: 'center',
              overflow: 'hidden',
              borderWidth: 3,
              borderColor: '#10b981',
            }}>
              <Image 
                source={require('./assets/usg-logo.png')} 
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            </View>
          </View>

          {/* Login Form */}
          <View style={{ width: '100%' }}>
            <TextInput
              style={{ 
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.15)' : '#f0f2f5',
                borderWidth: 1.5,
                borderColor: '#10b981',
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 16,
                fontSize: 15,
                color: colors.text,
                marginBottom: 12,
              }}
              placeholder="Email address"
              placeholderTextColor={isDark ? '#8a8d91' : '#65676b'}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
        
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.15)' : '#f0f2f5',
              borderWidth: 1.5,
              borderColor: '#10b981',
              borderRadius: 12,
              marginBottom: 20,
            }}>
              <TextInput
                style={{ 
                  flex: 1,
                  paddingHorizontal: 16,
                  paddingVertical: 16,
                  fontSize: 15,
                  color: colors.text,
                }}
                placeholder="Password"
                placeholderTextColor={isDark ? '#8a8d91' : '#65676b'}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                style={{ paddingHorizontal: 16 }}
              >
                <Ionicons 
                  name={showPassword ? "eye-off" : "eye"} 
                  size={20} 
                  color={isDark ? '#8a8d91' : '#65676b'}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={{
                backgroundColor: '#10b981',
                borderRadius: 25,
                paddingVertical: 14,
                alignItems: 'center',
                marginBottom: 16,
                width: '100%',
              }}
              onPress={handleQuickLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={{ color: '#fff', fontSize: 17, fontWeight: '600' }}>Log In</Text>
              )}
            </TouchableOpacity>

          </View>

          {/* Register Section */}
          <View style={{ width: '100%', alignItems: 'center', marginBottom: 50 }}>
            <TouchableOpacity 
              style={{
                borderWidth: 1,
                borderColor: '#10b981',
                borderRadius: 25,
                paddingVertical: 12,
                width: '100%',
                alignItems: 'center',
              }}
              onPress={() => setShowRegisterModal(true)}
            >
              <Text style={{ color: '#10b981', fontSize: 15, fontWeight: '500' }}>Create new account</Text>
            </TouchableOpacity>
          </View>

          {/* Forgotten Password */}
          <TouchableOpacity style={{ alignItems: 'center', paddingBottom: 40 }}>
            <Text style={[{ fontSize: 15 }, { color: colors.text }]}>
              Forgotten Password?
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Login Modal */}
      <LoginModal 
        visible={showLoginModal} 
        onClose={() => setShowLoginModal(false)}
        onLogin={handleLogin}
        onSuccess={(userData) => {
          setShowLoginModal(false);
          Alert.alert('Success', `Welcome back, ${userData.name}!`);
        }}
      />

      {/* Register Modal */}
      <RegisterModal 
        visible={showRegisterModal} 
        onClose={() => setShowRegisterModal(false)}
        onSuccess={() => {
          setShowRegisterModal(false);
          Alert.alert('Success', 'Account created! Please sign in.');
          setShowLoginModal(true);
        }}
      />

      {/* Event Details Modal */}
      <EventDetailsModal
        visible={showEventDetails}
        event={selectedEvent}
        onClose={() => {
          setShowEventDetails(false);
          setSelectedEvent(null);
        }}
        formatDate={formatDate}
        formatTime={formatTime}
      />
    </View>
  );
}


// Login Modal Component
function LoginModal({ visible, onClose, onLogin, onSuccess }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Load saved credentials when modal opens
  useEffect(() => {
    if (visible) {
      loadSavedCredentials();
    }
  }, [visible]);

  const loadSavedCredentials = async () => {
    try {
      const savedEmail = await AsyncStorage.getItem('savedEmail');
      const savedPassword = await AsyncStorage.getItem('savedPassword');
      const savedRememberMe = await AsyncStorage.getItem('rememberMe');
      
      if (savedRememberMe === 'true' && savedEmail && savedPassword) {
        setEmail(savedEmail);
        setPassword(savedPassword);
        setRememberMe(true);
      }
    } catch (error) {
      console.log('Error loading saved credentials:', error);
      // Ignore AsyncStorage errors - continue without saved credentials
    }
  };

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    const result = await onLogin(email, password);
    setLoading(false);

    if (result.success) {
      // Save credentials if Remember Me is checked
      if (rememberMe) {
        try {
          await AsyncStorage.setItem('savedEmail', email);
          await AsyncStorage.setItem('savedPassword', password);
          await AsyncStorage.setItem('rememberMe', 'true');
        } catch (error) {
          console.log('Error saving credentials:', error);
        }
      } else {
        // Clear saved credentials if Remember Me is unchecked
        try {
          await AsyncStorage.removeItem('savedEmail');
          await AsyncStorage.removeItem('savedPassword');
          await AsyncStorage.removeItem('rememberMe');
        } catch (error) {
          console.log('Error clearing credentials:', error);
        }
      }

      onSuccess(result.user);
      setEmail('');
      setPassword('');
      setRememberMe(false);
    } else {
      Alert.alert('Login Failed', result.message);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView 
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Sign In</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="your.email@minsu.edu.ph"
                placeholderTextColor={colors.placeholder}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.placeholder}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  editable={!loading}
                />
                <TouchableOpacity 
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons 
                    name={showPassword ? 'eye-off' : 'eye'} 
                    size={20} 
                    color="#6b7280" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Remember Me Checkbox */}
            <View style={styles.rememberMeContainer}>
              <TouchableOpacity 
                style={styles.rememberMeRow}
                onPress={() => setRememberMe(!rememberMe)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                  {rememberMe && (
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  )}
                </View>
                <Text style={styles.rememberMeText}>Remember Me</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={[styles.modalButton, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.modalButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// Register Modal Component
function RegisterModal({ visible, onClose, onSuccess }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  
  const [formData, setFormData] = useState({
    student_id: '',
    first_name: '',
    last_name: '',
    email: '',
    course: '',
    year_level: '',
    password: '',
    password_confirmation: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRegister = async () => {
    if (!formData.student_id || !formData.first_name || !formData.last_name || 
        !formData.email || !formData.course || !formData.password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (formData.password !== formData.password_confirmation) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_URL}/register-student`, {
        student_id: formData.student_id.trim(),
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim(),
        course: formData.course.trim(),
        year_level: parseInt(formData.year_level),
        password: formData.password,
        password_confirmation: formData.password_confirmation,
      });

      onSuccess();
      setFormData({
        student_id: '',
        first_name: '',
        last_name: '',
        email: '',
        course: '',
        year_level: '',
        password: '',
        password_confirmation: '',
      });
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      const errors = error.response?.data?.errors;
      
      if (errors) {
        const errorMessages = Object.values(errors).flat().join('\n');
        Alert.alert('Registration Failed', errorMessages);
      } else {
        Alert.alert('Registration Failed', message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView 
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.modalContent, styles.modalContentLarge]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Register as Student</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Student ID</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 2021-00123"
                placeholderTextColor={colors.placeholder}
                value={formData.student_id}
                onChangeText={(val) => updateField('student_id', val)}
                autoCapitalize="none"
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>First Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Juan"
                placeholderTextColor={colors.placeholder}
                value={formData.first_name}
                onChangeText={(val) => updateField('first_name', val)}
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Last Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Dela Cruz"
                placeholderTextColor={colors.placeholder}
                value={formData.last_name}
                onChangeText={(val) => updateField('last_name', val)}
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="juan.delacruz@minsu.edu.ph"
                placeholderTextColor={colors.placeholder}
                value={formData.email}
                onChangeText={(val) => updateField('email', val)}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Course</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.course}
                  onValueChange={(val) => updateField('course', val)}
                  style={styles.picker}
                  enabled={!loading}
                >
                  <Picker.Item label="Select your course" value="" />
                  <Picker.Item label="BSEED" value="BSEED" />
                  <Picker.Item label="BSIT" value="BSIT" />
                  <Picker.Item label="BSCPE" value="BSCPE" />
                  <Picker.Item label="BSFI" value="BSFI" />
                  <Picker.Item label="BSHM" value="BSHM" />
                  <Picker.Item label="BSCRIM" value="BSCRIM" />
                  <Picker.Item label="BSPOLSCI" value="BSPOLSCI" />
                </Picker>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Year Level</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.year_level}
                  onValueChange={(val) => updateField('year_level', val)}
                  style={styles.picker}
                  enabled={!loading}
                >
                  <Picker.Item label="Select your year level" value="" />
                  <Picker.Item label="Year 1" value="1" />
                  <Picker.Item label="Year 2" value="2" />
                  <Picker.Item label="Year 3" value="3" />
                  <Picker.Item label="Year 4" value="4" />
                </Picker>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="At least 6 characters"
                  placeholderTextColor={colors.placeholder}
                  value={formData.password}
                  onChangeText={(val) => updateField('password', val)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  editable={!loading}
                />
                <TouchableOpacity 
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons 
                    name={showPassword ? 'eye-off' : 'eye'} 
                    size={20} 
                    color="#6b7280" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Re-enter password"
                  placeholderTextColor={colors.placeholder}
                  value={formData.password_confirmation}
                  onChangeText={(val) => updateField('password_confirmation', val)}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  editable={!loading}
                />
                <TouchableOpacity 
                  style={styles.eyeIcon}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons 
                    name={showConfirmPassword ? 'eye-off' : 'eye'} 
                    size={20} 
                    color="#6b7280" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.modalButton, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.modalButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
