import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Modal, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import axios from 'axios';

// Import screens
import StudentDashboardScreen from './src/screens/StudentDashboardScreen_New';

const Stack = createNativeStackNavigator();

// Update this to your backend IP address
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
    login,
    logout,
    isAuthenticated: !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function HomeScreenContent({ navigation }) {
  const { user, isAuthenticated } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [annIdx, setAnnIdx] = useState(0);

  const fetchData = async () => {
    try {
      const announcementsRes = await axios.get(`${API_URL}/announcements/public`);
      setAnnouncements(announcementsRes.data || []);

      const eventsRes = await axios.get(`${API_URL}/events/active`);
      setEvents(eventsRes.data || []);
    } catch (error) {
      console.log('Error fetching data:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (announcements.length <= 1) return;
    const interval = setInterval(() => {
      setAnnIdx(i => (i + 1) % announcements.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [announcements]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleLogin = () => {
    setShowLoginModal(true);
  };

  const handleRegister = () => {
    setShowRegisterModal(true);
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

  const current = announcements[annIdx] || { tag: 'Info', text: 'Welcome to U-EventTrack' };
  const tagColor = getTagColor(current.tag);

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      {/* Navbar */}
      <View style={styles.navbar}>
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Text style={styles.logoIcon}>📅</Text>
          </View>
          <View>
            <Text style={styles.title}>U-EventTrack</Text>
            <Text style={styles.subtitle}>MinSU Bongabong</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.signInBtn} onPress={handleLogin}>
          <Text style={styles.signInText}>Sign In</Text>
        </TouchableOpacity>
      </View>

      {/* Announcement Ticker */}
      <View style={styles.announcementBanner}>
        <View style={styles.announcementContent}>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.announcementTextContainer}>
            <View style={[styles.announcementTag, { backgroundColor: tagColor.bg }]}>
              <Text style={[styles.announcementTagText, { color: tagColor.text }]}>
                {current.tag.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.announcementText} numberOfLines={2}>{current.text}</Text>
          </View>
        </View>
        <View style={styles.announcementDots}>
          {announcements.map((_, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => setAnnIdx(i)}
              style={[styles.dot, i === annIdx && styles.dotActive]}
            />
          ))}
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#10b981']} />
        }
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroBadge}>
            <View style={styles.heroBadgeDot} />
            <Text style={styles.heroBadgeText}>Mindoro State University — Bongabong Campus</Text>
          </View>
          <Text style={styles.heroTitle}>
            Smart{'\n'}
            <Text style={styles.heroTitleGradient}>Attendance</Text>{'\n'}
            for USG Events
          </Text>
          <Text style={styles.heroSubtitle}>
            Streamline event attendance with RFID, facial recognition, and GPS-based check-in — all tracked in real time.
          </Text>
          
          <View style={styles.heroButtons}>
            <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
              <Text style={styles.primaryButtonText}>🔐 Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={handleRegister}>
              <Text style={styles.secondaryButtonText}>Register as Student →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.trustBadges}>
            {['RFID Scan', 'Face ID', 'GPS Verified', 'Live Dashboard'].map((badge) => (
              <View key={badge} style={styles.trustBadge}>
                <Text style={styles.trustCheck}>✓</Text>
                <Text style={styles.trustText}>{badge}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Stats Strip */}
        <View style={styles.statsStrip}>
          {[
            { value: '3+', label: 'Check-in Methods', icon: '✓' },
            { value: '100%', label: 'Digital Records', icon: '📋' },
            { value: 'Live', label: 'Real-Time Updates', icon: '⚡' },
            { value: 'GPS', label: 'Location Verified', icon: '📍' },
          ].map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Text style={styles.statIcon}>{stat.icon}</Text>
              </View>
              <View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Active Events */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#10b981" />
            <Text style={styles.loadingText}>Loading events...</Text>
          </View>
        ) : events.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionBadge}>
                <Text style={styles.sectionBadgeText}>EVENTS</Text>
              </View>
              <Text style={styles.sectionTitle}>Active Events</Text>
              <Text style={styles.sectionSubtitle}>Upcoming and ongoing USG events</Text>
            </View>
            
            {events.slice(0, 3).map((event) => (
              <View key={event.id} style={styles.eventCard}>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: event.status === 'ongoing' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)' }
                ]}>
                  <Text style={[
                    styles.statusText,
                    { color: event.status === 'ongoing' ? '#10b981' : '#3b82f6' }
                  ]}>
                    {event.status.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.eventName}>{event.event_name}</Text>
                {event.description && (
                  <Text style={styles.eventDescription} numberOfLines={2}>
                    {event.description}
                  </Text>
                )}
                <View style={styles.eventDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailIcon}>📅</Text>
                    <Text style={styles.detailText}>{formatDate(event.event_date)}</Text>
                  </View>
                  {event.venue && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailIcon}>📍</Text>
                      <Text style={styles.detailText}>{event.venue}</Text>
                    </View>
                  )}
                </View>
                {event.status === 'ongoing' && (
                  <View style={styles.liveIndicatorCard}>
                    <View style={styles.liveDotCard} />
                    <Text style={styles.liveTextCard}>Event is currently ongoing</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        ) : null}

        {/* Features */}
        <View style={[styles.section, styles.sectionGray]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionBadgeText}>FEATURES</Text>
            </View>
            <Text style={styles.sectionTitle}>Everything You Need</Text>
            <Text style={styles.sectionSubtitle}>
              Modern tools designed for efficient, campus-wide USG event attendance management.
            </Text>
          </View>
          
          {[
            { title: 'Multi-Method Check-In', desc: 'RFID scanning, facial recognition, and manual entry', icon: '✓', color: '#10b981' },
            { title: 'Real-Time Monitoring', desc: 'Live attendance dashboard with instant updates', icon: '⚡', color: '#3b82f6' },
            { title: 'GPS Verification', desc: 'Location-based validation ensures physical presence', icon: '📍', color: '#f97316' },
            { title: 'Analytics & Reports', desc: 'Comprehensive reports with charts and graphs', icon: '📊', color: '#8b5cf6' },
          ].map((feature) => (
            <View key={feature.title} style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: feature.color + '20' }]}>
                <Text style={[styles.featureIconText, { color: feature.color }]}>{feature.icon}</Text>
              </View>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDesc}>{feature.desc}</Text>
            </View>
          ))}
        </View>

        {/* CTA Banner */}
        <View style={styles.ctaBanner}>
          <View style={styles.ctaBadge}>
            <View style={styles.ctaBadgeDot} />
            <Text style={styles.ctaBadgeText}>Ready to go digital?</Text>
          </View>
          <Text style={styles.ctaTitle}>Join U-EventTrack Today</Text>
          <Text style={styles.ctaSubtitle}>
            Join Mindoro State University's digital attendance system for USG events.
          </Text>
          <View style={styles.ctaButtons}>
            <TouchableOpacity style={styles.ctaPrimaryButton} onPress={handleRegister}>
              <Text style={styles.ctaPrimaryButtonText}>Register as Student →</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.ctaSecondaryButton} onPress={handleLogin}>
              <Text style={styles.ctaSecondaryButtonText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerLogo}>
            <View style={styles.footerLogoIcon}>
              <Text style={styles.footerLogoIconText}>📅</Text>
            </View>
            <View>
              <Text style={styles.footerTitle}>U-EventTrack</Text>
              <Text style={styles.footerSubtitle}>MinSU Bongabong Campus</Text>
            </View>
          </View>
          <Text style={styles.footerCopyright}>
            © {new Date().getFullYear()} Mindoro State University — Bongabong Campus. All rights reserved.
          </Text>
          <Text style={styles.footerTech}>RFID · Face ID · GPS</Text>
        </View>
      </ScrollView>

      {/* Login Modal */}
      <LoginModal 
        visible={showLoginModal} 
        onClose={() => setShowLoginModal(false)}
        onSuccess={(userData) => {
          setShowLoginModal(false);
          Alert.alert('Success', `Welcome back, ${userData.name}!`);
          // Navigate to dashboard
          if (userData.role === 'student') {
            navigation.navigate('StudentDashboard');
          }
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
    </View>
  );
}

// Login Modal Component
function LoginModal({ visible, onClose, onSuccess }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      onSuccess(result.user);
      setEmail('');
      setPassword('');
    } else {
      Alert.alert('Login Failed', result.message);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
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
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                editable={!loading}
              />
            </View>

            <TouchableOpacity 
              style={[styles.modalButton, loading && styles.buttonDisabled]}
              onPress={handleLogin}
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
  const [formData, setFormData] = useState({
    student_id: '',
    first_name: '',
    last_name: '',
    email: '',
    course: '',
    year_level: '1',
    password: '',
    password_confirmation: '',
  });
  const [loading, setLoading] = useState(false);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRegister = async () => {
    // Validation
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
        year_level: '1',
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
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
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
                value={formData.email}
                onChangeText={(val) => updateField('email', val)}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Course</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., BSIT, BSCS, BSBA"
                value={formData.course}
                onChangeText={(val) => updateField('course', val)}
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Year Level</Text>
              <View style={styles.yearLevelContainer}>
                {['1', '2', '3', '4'].map((year) => (
                  <TouchableOpacity
                    key={year}
                    style={[
                      styles.yearButton,
                      formData.year_level === year && styles.yearButtonActive
                    ]}
                    onPress={() => updateField('year_level', year)}
                    disabled={loading}
                  >
                    <Text style={[
                      styles.yearButtonText,
                      formData.year_level === year && styles.yearButtonTextActive
                    ]}>
                      {year}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="At least 6 characters"
                value={formData.password}
                onChangeText={(val) => updateField('password', val)}
                secureTextEntry
                autoCapitalize="none"
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Re-enter password"
                value={formData.password_confirmation}
                onChangeText={(val) => updateField('password_confirmation', val)}
                secureTextEntry
                autoCapitalize="none"
                editable={!loading}
              />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  // Navbar
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(229, 231, 235, 0.8)',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 36,
    height: 36,
    backgroundColor: '#10b981',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoIcon: {
    fontSize: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 2,
  },
  signInBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
  },
  signInText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
  // Announcement Banner
  announcementBanner: {
    backgroundColor: '#059669',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(16, 185, 129, 0.4)',
  },
  announcementContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  liveDot: {
    width: 10,
    height: 10,
    backgroundColor: '#fde047',
    borderRadius: 5,
    marginRight: 6,
  },
  liveText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'rgba(254, 249, 195, 1)',
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginRight: 12,
  },
  announcementTextContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  announcementTag: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
  },
  announcementTagText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  announcementText: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: '500',
  },
  announcementDots: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 3,
  },
  dotActive: {
    backgroundColor: '#fff',
    transform: [{ scale: 1.25 }],
  },
  // Content
  content: {
    flex: 1,
  },
  // Hero
  hero: {
    padding: 24,
    backgroundColor: '#f0fdf4',
    minHeight: 500,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 20,
    marginBottom: 24,
  },
  heroBadgeDot: {
    width: 6,
    height: 6,
    backgroundColor: '#10b981',
    borderRadius: 3,
    marginRight: 8,
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#059669',
  },
  heroTitle: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 20,
    lineHeight: 48,
  },
  heroTitleGradient: {
    color: '#10b981',
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 24,
    marginBottom: 32,
  },
  heroButtons: {
    marginBottom: 40,
  },
  primaryButton: {
    backgroundColor: '#10b981',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  trustBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  trustCheck: {
    fontSize: 12,
    color: '#10b981',
    marginRight: 6,
  },
  trustText: {
    fontSize: 12,
    color: '#6b7280',
  },
  // Stats Strip
  statsStrip: {
    backgroundColor: '#059669',
    paddingVertical: 40,
    paddingHorizontal: 16,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statIcon: {
    fontSize: 20,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(187, 247, 208, 0.7)',
    marginTop: 2,
  },
  // Section
  section: {
    padding: 20,
    backgroundColor: '#fff',
  },
  sectionGray: {
    backgroundColor: '#f9fafb',
  },
  sectionHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  sectionBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 20,
    marginBottom: 16,
  },
  sectionBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#059669',
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  // Event Card
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  eventName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  eventDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  eventDetails: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  detailText: {
    fontSize: 13,
    color: '#6b7280',
  },
  liveIndicatorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  liveDotCard: {
    width: 8,
    height: 8,
    backgroundColor: '#10b981',
    borderRadius: 4,
    marginRight: 8,
  },
  liveTextCard: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
  },
  // Feature Card
  featureCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  featureIconText: {
    fontSize: 24,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  featureDesc: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 18,
  },
  // CTA Banner
  ctaBanner: {
    backgroundColor: '#059669',
    padding: 40,
    alignItems: 'center',
  },
  ctaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    marginBottom: 24,
  },
  ctaBadgeDot: {
    width: 6,
    height: 6,
    backgroundColor: '#fff',
    borderRadius: 3,
    marginRight: 8,
  },
  ctaBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  ctaTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  ctaSubtitle: {
    fontSize: 14,
    color: 'rgba(187, 247, 208, 1)',
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  ctaButtons: {
    width: '100%',
  },
  ctaPrimaryButton: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  ctaPrimaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  ctaSecondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
  },
  ctaSecondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  // Footer
  footer: {
    backgroundColor: '#030712',
    paddingVertical: 40,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  footerLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  footerLogoIcon: {
    width: 36,
    height: 36,
    backgroundColor: '#10b981',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  footerLogoIconText: {
    fontSize: 20,
  },
  footerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  footerSubtitle: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  footerCopyright: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  footerTech: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  // Loading
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalContentLarge: {
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#6b7280',
  },
  modalBody: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  modalButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  yearLevelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  yearButton: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  yearButtonActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  yearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  yearButtonTextActive: {
    color: '#fff',
  },
});


export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="Home" component={HomeScreenContent} />
          <Stack.Screen name="StudentDashboard" component={StudentDashboardScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}
