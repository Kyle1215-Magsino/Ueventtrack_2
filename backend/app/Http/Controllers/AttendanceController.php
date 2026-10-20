<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Event;
use App\Models\Student;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class AttendanceController extends Controller
{
    public function processCheckin(Request $request): JsonResponse
    {
        $request->validate([
            'student_identifier' => 'required|string',
            'event_id' => 'required|exists:events,id',
            'verification_method' => 'required|in:barcode,facial,manual',
            'location_lat' => 'nullable|numeric',
            'location_lng' => 'nullable|numeric',
        ]);

        $event = Event::findOrFail($request->event_id);

        // Find student by student_id, barcode, or email
        $student = Student::where('student_id', $request->student_identifier)
            ->orWhere('barcode', $request->student_identifier)
            ->orWhere('email', $request->student_identifier)
            ->first();

        if (!$student) {
            // Log failed attempt
            \Log::warning('Check-in failed: Student not found', [
                'identifier' => $request->student_identifier,
                'event_id' => $request->event_id,
                'method' => $request->verification_method,
            ]);
            
            return response()->json([
                'message' => 'Student not found. Please verify your ID or barcode.',
                'error' => 'STUDENT_NOT_FOUND'
            ], 404);
        }

        if ($student->status !== 'active') {
            // Log inactive student attempt
            \Log::warning('Check-in failed: Inactive student', [
                'student_id' => $student->student_id,
                'student_name' => $student->first_name . ' ' . $student->last_name,
                'event_id' => $request->event_id,
            ]);
            
            return response()->json([
                'message' => 'Student account is inactive. Please contact the administrator.',
                'error' => 'STUDENT_INACTIVE'
            ], 422);
        }

        // Check for duplicate check-in (ONE BARCODE :: ONE STUDENT per event)
        $existing = Attendance::where('student_id', $student->id)
            ->where('event_id', $event->id)
            ->first();

        if ($existing) {
            // Log duplicate attempt
            \Log::info('Check-in blocked: Duplicate attempt', [
                'student_id' => $student->student_id,
                'student_name' => $student->first_name . ' ' . $student->last_name,
                'event_id' => $request->event_id,
                'event_name' => $event->event_name,
                'original_checkin' => $existing->check_in_time,
                'verification_method' => $request->verification_method,
            ]);
            
            return response()->json([
                'message' => 'You have already checked in for this event.',
                'error' => 'ALREADY_CHECKED_IN',
                'details' => [
                    'student_name' => $student->first_name . ' ' . $student->last_name,
                    'event_name' => $event->event_name,
                    'original_checkin_time' => $existing->check_in_time->format('M d, Y h:i A'),
                    'status' => $existing->status,
                ]
            ], 422);
        }

        // Determine late status
        $eventStart = Carbon::parse($event->event_date->format('Y-m-d') . ' ' . $event->start_time);
        $status = Carbon::now()->gt($eventStart) ? 'late' : 'present';

        // Location verification
        $locationVerified = false;
        if ($request->location_lat && $request->location_lng && $event->venue_lat && $event->venue_lng) {
            $distance = $this->haversine(
                $request->location_lat,
                $request->location_lng,
                $event->venue_lat,
                $event->venue_lng
            );
            $locationVerified = $distance <= $event->venue_radius;
        }

        $attendance = Attendance::create([
            'student_id' => $student->id,
            'event_id' => $event->id,
            'check_in_time' => Carbon::now(),
            'verification_method' => $request->verification_method,
            'location_lat' => $request->location_lat,
            'location_lng' => $request->location_lng,
            'location_verified' => $locationVerified,
            'status' => $status,
        ]);

        // Log successful check-in
        \Log::info('Check-in successful', [
            'student_id' => $student->student_id,
            'student_name' => $student->first_name . ' ' . $student->last_name,
            'event_id' => $request->event_id,
            'event_name' => $event->event_name,
            'status' => $status,
            'verification_method' => $request->verification_method,
            'location_verified' => $locationVerified,
        ]);

        // Clear attendance cache
        Cache::forget('attendance_logs');

        // Auto-update event status to ongoing
        if ($event->status === 'upcoming') {
            $event->update(['status' => 'ongoing']);
        }

        $attendance->load('student');

        return response()->json([
            'attendance' => $attendance,
            'message' => 'Check-in successful.',
            'status' => $status,
            'student_name' => $student->first_name . ' ' . $student->last_name,
            'student_id' => $student->student_id,
            'course' => $student->course,
            'year_level' => $student->year_level,
        ], 201);
    }

    public function liveAttendance(int $eventId): JsonResponse
    {
        $attendances = Attendance::where('event_id', $eventId)
            ->with('student')
            ->orderByDesc('check_in_time')
            ->get();

        $stats = [
            'total' => $attendances->count(),
            'present' => $attendances->where('status', 'present')->count(),
            'late' => $attendances->where('status', 'late')->count(),
            'locationVerified' => $attendances->where('location_verified', true)->count(),
        ];

        return response()->json([
            'attendances' => $attendances,
            'stats' => $stats,
        ]);
    }

    public function index(): JsonResponse
    {
        $attendances = Cache::remember('attendance_logs', 300, function () {
            return Attendance::with(['student:id,student_id,first_name,last_name,course', 'event:id,event_name'])
                ->orderByDesc('check_in_time')
                ->get();
        });

        return response()->json($attendances);
    }

    public function reports(Request $request): JsonResponse
    {
        $period = $request->query('period', 'all');

        $start = match ($period) {
            'weekly'  => now()->startOfWeek(),
            'monthly' => now()->startOfMonth(),
            'yearly'  => now()->startOfYear(),
            default   => null,
        };

        [$trendSelect, $trendOrder] = match ($period) {
            'weekly', 'monthly' => ["DATE(check_in_time) as period_label", 'period_label'],
            default             => ["DATE_FORMAT(check_in_time, '%Y-%m') as period_label", 'period_label'],
        };

        $eventQuery  = fn () => $start ? Event::where('event_date', '>=', $start->toDateString()) : Event::query();
        $attendQuery = fn () => $start ? Attendance::where('check_in_time', '>=', $start) : Attendance::query();

        $totalStudents = Student::active()->count();
        $totalEvents   = $eventQuery()->count();
        $totalCheckins = $attendQuery()->count();
        $presentCount  = $attendQuery()->where('status', 'present')->count();
        $lateCount     = $attendQuery()->where('status', 'late')->count();

        $perEvent = $eventQuery()
            ->withCount(['attendances' => fn ($q) => $start ? $q->where('check_in_time', '>=', $start) : $q])
            ->orderByDesc('event_date')
            ->get()
            ->map(fn ($e) => [
                'event_name' => $e->event_name,
                'event_date' => $e->event_date->format('Y-m-d'),
                'attendees'  => $e->attendances_count,
            ]);

        $byCourse = $attendQuery()
            ->join('students', 'attendances.student_id', '=', 'students.id')
            ->selectRaw('students.course, COUNT(*) as total')
            ->groupBy('students.course')
            ->get();

        $trends = $attendQuery()
            ->selectRaw("$trendSelect, COUNT(*) as total")
            ->groupBy('period_label')
            ->orderBy($trendOrder)
            ->get()
            ->map(fn ($t) => ['month' => $t->period_label, 'total' => $t->total]);

        return response()->json([
            'totalStudents' => $totalStudents,
            'totalEvents'   => $totalEvents,
            'totalCheckins' => $totalCheckins,
            'presentCount'  => $presentCount,
            'lateCount'     => $lateCount,
            'perEvent'      => $perEvent,
            'byCourse'      => $byCourse,
            'monthlyTrends' => $trends,
        ]);
    }

    private function haversine(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earthRadius = 6371000; // meters
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);
        $a = sin($dLat / 2) ** 2 + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }
}
