<?php

namespace App\Services;

use App\Models\Event;
use App\Models\Attendance;
use App\Models\Student;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class EventAnalyticsService
{
    /**
     * Get comprehensive analytics for an event
     */
    public static function getEventAnalytics(int $eventId): array
    {
        $event = Event::with(['attendances.student'])->findOrFail($eventId);
        
        $totalStudents = Student::active()->count();
        $attendances = $event->attendances;
        $totalAttendees = $attendances->count();
        $uniqueAttendees = $attendances->unique('student_id')->count();

        return [
            'event' => [
                'id' => $event->id,
                'name' => $event->event_name,
                'date' => $event->event_date->format('Y-m-d'),
                'start_time' => $event->start_time,
                'end_time' => $event->end_time,
                'venue' => $event->venue,
                'status' => $event->status,
            ],
            'overview' => self::getOverviewStats($event, $totalStudents, $attendances),
            'checkin_methods' => self::getCheckinMethodsBreakdown($attendances),
            'timing_analysis' => self::getTimingAnalysis($event, $attendances),
            'course_breakdown' => self::getCourseBreakdown($attendances),
            'year_level_breakdown' => self::getYearLevelBreakdown($attendances),
            'hourly_checkins' => self::getHourlyCheckins($attendances),
            'status_breakdown' => self::getStatusBreakdown($event, $attendances),
            'top_earliest_checkins' => self::getTopEarliestCheckins($attendances, 5),
            'top_latest_checkins' => self::getTopLatestCheckins($attendances, 5),
        ];
    }

    /**
     * Get overview statistics
     */
    private static function getOverviewStats(Event $event, int $totalStudents, $attendances): array
    {
        $uniqueAttendees = $attendances->unique('student_id')->count();
        $attendanceRate = $totalStudents > 0 ? round(($uniqueAttendees / $totalStudents) * 100, 2) : 0;
        
        $presentCount = $attendances->where('status', 'present')->unique('student_id')->count();
        $lateCount = $attendances->where('status', 'late')->unique('student_id')->count();
        $absentCount = $totalStudents - $uniqueAttendees;

        return [
            'total_students' => $totalStudents,
            'total_attendees' => $uniqueAttendees,
            'total_checkins' => $attendances->count(),
            'attendance_rate' => $attendanceRate,
            'present_count' => $presentCount,
            'late_count' => $lateCount,
            'absent_count' => $absentCount,
            'duplicate_checkins' => $attendances->count() - $uniqueAttendees,
        ];
    }

    /**
     * Get check-in methods breakdown
     */
    private static function getCheckinMethodsBreakdown($attendances): array
    {
        $methodCounts = $attendances->groupBy('checkin_method')->map->count();
        $total = $attendances->count();

        $methods = ['barcode', 'face', 'mobile'];
        $breakdown = [];

        foreach ($methods as $method) {
            $count = $methodCounts->get($method, 0);
            $percentage = $total > 0 ? round(($count / $total) * 100, 2) : 0;
            
            $breakdown[] = [
                'method' => ucfirst($method),
                'count' => $count,
                'percentage' => $percentage,
            ];
        }

        return $breakdown;
    }

    /**
     * Get timing analysis
     */
    private static function getTimingAnalysis(Event $event, $attendances): array
    {
        if ($attendances->isEmpty()) {
            return [
                'first_checkin' => null,
                'last_checkin' => null,
                'peak_hour' => null,
                'average_checkin_time' => null,
            ];
        }

        $checkinTimes = $attendances->pluck('checked_in_at')->filter();
        
        $firstCheckin = $checkinTimes->min();
        $lastCheckin = $checkinTimes->max();
        
        // Calculate average check-in time
        $eventStart = Carbon::parse($event->event_date->format('Y-m-d') . ' ' . $event->start_time);
        $avgMinutesFromStart = 0;
        
        if ($checkinTimes->count() > 0) {
            $totalMinutes = $checkinTimes->sum(function ($time) use ($eventStart) {
                return Carbon::parse($time)->diffInMinutes($eventStart, false);
            });
            $avgMinutesFromStart = round($totalMinutes / $checkinTimes->count(), 2);
        }

        return [
            'first_checkin' => $firstCheckin ? Carbon::parse($firstCheckin)->format('Y-m-d H:i:s') : null,
            'last_checkin' => $lastCheckin ? Carbon::parse($lastCheckin)->format('Y-m-d H:i:s') : null,
            'average_checkin_time' => self::formatMinutesToTime($avgMinutesFromStart),
            'time_span_minutes' => $firstCheckin && $lastCheckin 
                ? Carbon::parse($firstCheckin)->diffInMinutes(Carbon::parse($lastCheckin)) 
                : 0,
        ];
    }

    /**
     * Get course breakdown
     */
    private static function getCourseBreakdown($attendances): array
    {
        $courseStats = $attendances->groupBy('student.course')->map(function ($group) {
            return [
                'count' => $group->unique('student_id')->count(),
                'percentage' => 0, // Will calculate after
            ];
        });

        $total = $attendances->unique('student_id')->count();
        
        $breakdown = [];
        foreach ($courseStats as $course => $stats) {
            $percentage = $total > 0 ? round(($stats['count'] / $total) * 100, 2) : 0;
            $breakdown[] = [
                'course' => $course ?: 'Unknown',
                'count' => $stats['count'],
                'percentage' => $percentage,
            ];
        }

        // Sort by count descending
        usort($breakdown, fn($a, $b) => $b['count'] - $a['count']);

        return $breakdown;
    }

    /**
     * Get year level breakdown
     */
    private static function getYearLevelBreakdown($attendances): array
    {
        $yearStats = $attendances->groupBy('student.year_level')->map(function ($group) {
            return $group->unique('student_id')->count();
        });

        $total = $attendances->unique('student_id')->count();
        
        $breakdown = [];
        foreach ([1, 2, 3, 4] as $year) {
            $count = $yearStats->get($year, 0);
            $percentage = $total > 0 ? round(($count / $total) * 100, 2) : 0;
            
            $breakdown[] = [
                'year_level' => $year,
                'label' => self::getYearLabel($year),
                'count' => $count,
                'percentage' => $percentage,
            ];
        }

        return $breakdown;
    }

    /**
     * Get hourly check-ins
     */
    private static function getHourlyCheckins($attendances): array
    {
        $hourlyData = $attendances
            ->filter(fn($a) => $a->checked_in_at)
            ->groupBy(function ($attendance) {
                return Carbon::parse($attendance->checked_in_at)->format('H:00');
            })
            ->map->count()
            ->sortKeys();

        $result = [];
        foreach ($hourlyData as $hour => $count) {
            $result[] = [
                'hour' => $hour,
                'count' => $count,
            ];
        }

        return $result;
    }

    /**
     * Get status breakdown
     */
    private static function getStatusBreakdown(Event $event, $attendances): array
    {
        $statusCounts = $attendances->groupBy('status')->map(function ($group) {
            return $group->unique('student_id')->count();
        });

        $total = $attendances->unique('student_id')->count();
        $totalStudents = Student::active()->count();

        $present = $statusCounts->get('present', 0);
        $late = $statusCounts->get('late', 0);
        $absent = $totalStudents - $total;

        return [
            [
                'status' => 'Present',
                'count' => $present,
                'percentage' => $totalStudents > 0 ? round(($present / $totalStudents) * 100, 2) : 0,
                'color' => '#10b981',
            ],
            [
                'status' => 'Late',
                'count' => $late,
                'percentage' => $totalStudents > 0 ? round(($late / $totalStudents) * 100, 2) : 0,
                'color' => '#f59e0b',
            ],
            [
                'status' => 'Absent',
                'count' => $absent,
                'percentage' => $totalStudents > 0 ? round(($absent / $totalStudents) * 100, 2) : 0,
                'color' => '#ef4444',
            ],
        ];
    }

    /**
     * Get top earliest check-ins
     */
    private static function getTopEarliestCheckins($attendances, int $limit = 5): array
    {
        return $attendances
            ->sortBy('checked_in_at')
            ->take($limit)
            ->map(function ($attendance) {
                return [
                    'student_id' => $attendance->student->student_id,
                    'name' => $attendance->student->first_name . ' ' . $attendance->student->last_name,
                    'course' => $attendance->student->course,
                    'checked_in_at' => Carbon::parse($attendance->checked_in_at)->format('Y-m-d H:i:s'),
                    'method' => ucfirst($attendance->checkin_method),
                ];
            })
            ->values()
            ->toArray();
    }

    /**
     * Get top latest check-ins
     */
    private static function getTopLatestCheckins($attendances, int $limit = 5): array
    {
        return $attendances
            ->sortByDesc('checked_in_at')
            ->take($limit)
            ->map(function ($attendance) {
                return [
                    'student_id' => $attendance->student->student_id,
                    'name' => $attendance->student->first_name . ' ' . $attendance->student->last_name,
                    'course' => $attendance->student->course,
                    'checked_in_at' => Carbon::parse($attendance->checked_in_at)->format('Y-m-d H:i:s'),
                    'method' => ucfirst($attendance->checkin_method),
                ];
            })
            ->values()
            ->toArray();
    }

    /**
     * Get all events analytics summary
     */
    public static function getAllEventsAnalytics(): array
    {
        $events = Event::with('attendances')->get();
        $totalStudents = Student::active()->count();

        $summary = $events->map(function ($event) use ($totalStudents) {
            $uniqueAttendees = $event->attendances->unique('student_id')->count();
            $attendanceRate = $totalStudents > 0 ? round(($uniqueAttendees / $totalStudents) * 100, 2) : 0;

            return [
                'event_id' => $event->id,
                'event_name' => $event->event_name,
                'event_date' => $event->event_date->format('Y-m-d'),
                'status' => $event->status,
                'total_attendees' => $uniqueAttendees,
                'attendance_rate' => $attendanceRate,
                'total_checkins' => $event->attendances->count(),
            ];
        });

        return [
            'total_events' => $events->count(),
            'total_students' => $totalStudents,
            'events' => $summary->toArray(),
        ];
    }

    /**
     * Helper: Format minutes to human-readable time
     */
    private static function formatMinutesToTime(float $minutes): string
    {
        $absMinutes = abs($minutes);
        $hours = floor($absMinutes / 60);
        $mins = round($absMinutes % 60);
        
        $prefix = $minutes < 0 ? '-' : '+';
        
        if ($hours > 0) {
            return "{$prefix}{$hours}h {$mins}m from start";
        }
        return "{$prefix}{$mins}m from start";
    }

    /**
     * Helper: Get year level label
     */
    private static function getYearLabel(int $year): string
    {
        return match($year) {
            1 => '1st Year',
            2 => '2nd Year',
            3 => '3rd Year',
            4 => '4th Year',
            default => "{$year}th Year",
        };
    }
}
