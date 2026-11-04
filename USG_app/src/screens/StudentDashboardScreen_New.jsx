import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useAuth } from '../../App';
import axios from 'axios';

const API_URL = 'http://10.54.162.26:8000/api';

export default function StudentDashboardScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = async () => {
    try {
      const response = await axios.get(`${API_URL}/student-dashboard`);
      setData(response.data);
    } catch (error) {
      console.log('Error fetching dashboard:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  const handleLogout = () => {
    logout();
    navigation.navigate('Home');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Failed to load dashboard</Text>
        <Text style={styles.errorText}>Please try refreshing the page.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchDashboard}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const attendanceRate = data.totalEvents > 0 ? Math.round((data.attendedEvents / data.totalEvents) * 100) : 0;
  const streak = data.streak || 0;
  const nextEvent = data.nextEvent || null;

  const recentCheckins = (data.attendanceRecords || [])
    .sort((a, b) => new Date(b.check_in_time) - new Date(a.check_in_time))
    .slice(0, 5);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          {data.student?.profile_image ? (
            <View style={styles.profileImage}>
              <Text style={styles.profileImageText}>👤</Text>
            </View>
          ) : (
            <View style={styles.profileInitials}>
              <Text style={styles.profileInitialsText}>
                {data.student?.first_name?.charAt(0)}{data.student?.last_name?.charAt(0)}
              </Text>
            </View>
          )}
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>{greeting}, {data.student?.first_name}!</Text>
            <Text style={styles.headerSubtitle}>{today}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#10b981']} />
        }
      >
        {/* Next Event Banner */}
        {nextEvent && (
          <View style={styles.nextEventBanner}>
            <View style={styles.nextEventIcon}>
              <Text style={styles.nextEventIconText}>🔔</Text>
            </View>
            <View style={styles.nextEventContent}>
              <Text style={styles.nextEventLabel}>Next Upcoming Event</Text>
              <Text style={styles.nextEventName}>{nextEvent.event_name}</Text>
              <Text style={styles.nextEventDetails}>
                {nextEvent.event_date} • {nextEvent.start_time}–{nextEvent.end_time} • {nextEvent.venue}
              </Text>
            </View>
            <View style={styles.nextEventBadge}>
              <Text style={styles.nextEventBadgeText}>Upcoming</Text>
            </View>
          </View>
        )}

        {/* Stat Cards */}
        <View style={styles.statsGrid}>
          {[
            { label: 'Events Attended', value: data.attendedEvents, icon: '📋', color: '#10b981' },
            { label: 'Present', value: data.totalPresent, icon: '✓', color: '#059669' },
            { label: 'Late', value: data.totalLate, icon: '⏰', color: '#f59e0b' },
            { label: 'Attendance Streak', value: `${streak} event${streak !== 1 ? 's' : ''}`, icon: '🔥', color: '#f97316' },
          ].map((stat, index) => (
            <View key={stat.label} style={styles.statCard}>
              <View style={styles.statCardInner}>
                <View style={[styles.statIconContainer, { backgroundColor: stat.color + '20' }]}>
                  <Text style={styles.statIcon}>{stat.icon}</Text>
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Attendance Rate */}
        <View style={styles.attendanceRateCard}>
          <View style={styles.attendanceRateCircle}>
            <Text style={styles.attendanceRateValue}>{attendanceRate}%</Text>
          </View>
          <View style={styles.attendanceRateInfo}>
            <Text style={styles.attendanceRateTitle}>Attendance Rate</Text>
            <Text style={styles.attendanceRateSubtitle}>
              {data.attendedEvents} of {data.totalEvents} events attended
            </Text>
            <View style={styles.attendanceRateLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
                <Text style={styles.legendText}>Present: {data.totalPresent}</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
                <Text style={styles.legendText}>Late: {data.totalLate}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Recent Check-ins */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>⏰</Text>
            <Text style={styles.sectionTitle}>Recent Check-ins</Text>
          </View>
          {recentCheckins.length > 0 ? (
            <View style={styles.checkinsContainer}>
              {recentCheckins.map((rec, idx) => (
                <View key={rec.id || idx} style={styles.checkinItem}>
                  <View style={[
                    styles.checkinIcon,
                    { backgroundColor: rec.status === 'present' ? '#dcfce7' : '#fef3c7' }
                  ]}>
                    <Text style={[
                      styles.checkinIconText,
                      { color: rec.status === 'present' ? '#16a34a' : '#f59e0b' }
                    ]}>
                      {rec.status === 'present' ? '✓' : '⏰'}
                    </Text>
                  </View>
                  <View style={styles.checkinContent}>
                    <Text style={styles.checkinEventName}>{rec.event?.event_name}</Text>
                    <View style={styles.checkinDetails}>
                      <Text style={[
                        styles.checkinStatus,
                        { color: rec.status === 'present' ? '#16a34a' : '#f59e0b' }
                      ]}>
                        {rec.status}
                      </Text>
                      <Text style={styles.checkinTime}>
                        {new Date(rec.check_in_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at{' '}
                        {new Date(rec.check_in_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </Text>
                      <Text style={styles.checkinMethod}>{rec.verification_method}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>⏰</Text>
              <Text style={styles.emptyStateText}>No check-ins yet</Text>
            </View>
          )}
        </View>

        {/* Upcoming Events */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>📅</Text>
            <Text style={styles.sectionTitle}>Upcoming Events</Text>
            {data.upcomingEvents.length > 0 && (
              <Text style={styles.sectionCount}>{data.upcomingEvents.length} event{data.upcomingEvents.length !== 1 ? 's' : ''}</Text>
            )}
          </View>
          {data.upcomingEvents.map(e => (
            <View key={e.id} style={styles.eventCard}>
              <View style={styles.eventIconContainer}>
                <Text style={styles.eventIcon}>📅</Text>
              </View>
              <View style={styles.eventContent}>
                <Text style={styles.eventName}>{e.event_name}</Text>
                <View style={styles.eventDetails}>
                  <Text style={styles.eventDetail}>📅 {e.event_date}</Text>
                  <Text style={styles.eventDetail}>📍 {e.venue}</Text>
                </View>
              </View>
              <View style={styles.eventBadge}>
                <Text style={styles.eventBadgeText}>{e.status}</Text>
              </View>
            </View>
          ))}
          {data.upcomingEvents.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>📅</Text>
              <Text style={styles.emptyStateText}>No upcoming events</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileImageText: {
    fontSize: 24,
  },
  profileInitials: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInitialsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  logoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#dc2626',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  nextEventBanner: {
    backgroundColor: '#059669',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  nextEventIcon: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  nextEventIconText: {
    fontSize: 20,
  },
  nextEventContent: {
    flex: 1,
  },
  nextEventLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
    marginBottom: 4,
  },
  nextEventName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  nextEventDetails: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  nextEventBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  nextEventBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
    marginBottom: 20,
  },
  statCard: {
    width: '50%',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  statCardInner: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#dcfce7',
    minHeight: 140,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statIcon: {
    fontSize: 20,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  attendanceRateCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#dcfce7',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  attendanceRateCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 8,
    borderColor: '#10b981',
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  attendanceRateValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  attendanceRateInfo: {
    flex: 1,
  },
  attendanceRateTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  attendanceRateSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  attendanceRateLegend: {
    flexDirection: 'row',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 10,
    color: '#9ca3af',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#dcfce7',
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
  },
  sectionCount: {
    fontSize: 10,
    color: '#9ca3af',
  },
  checkinsContainer: {
    borderLeftWidth: 2,
    borderLeftColor: '#dcfce7',
    paddingLeft: 16,
  },
  checkinItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  checkinIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  checkinIconText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkinContent: {
    flex: 1,
  },
  checkinEventName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  checkinDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  checkinStatus: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
    marginRight: 12,
  },
  checkinTime: {
    fontSize: 10,
    color: '#9ca3af',
    marginRight: 12,
  },
  checkinMethod: {
    fontSize: 10,
    color: '#9ca3af',
    textTransform: 'capitalize',
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dcfce7',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  eventIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#dcfce7',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  eventIcon: {
    fontSize: 20,
  },
  eventContent: {
    flex: 1,
  },
  eventName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  eventDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  eventDetail: {
    fontSize: 10,
    color: '#9ca3af',
    marginRight: 12,
  },
  eventBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#dcfce7',
    borderRadius: 12,
  },
  eventBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#16a34a',
    textTransform: 'capitalize',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 8,
    opacity: 0.3,
  },
  emptyStateText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 20,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#10b981',
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
