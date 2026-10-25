<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\AuditLog;
use App\Models\Event;
use App\Models\Student;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class AuthController extends Controller
{
    /**
     * Update event statuses based on current date/time
     */
    private function updateEventStatuses(): void
    {
        $now = Carbon::now();
        $today = $now->toDateString();
        $currentTime = $now->toTimeString();

        // Update completed events (past end time)
        Event::where('status', '!=', 'cancelled')
            ->where(function ($query) use ($today, $currentTime) {
                // Events before today
                $query->where('event_date', '<', $today)
                    // OR events today but past end time
                    ->orWhere(function ($q) use ($today, $currentTime) {
                        $q->where('event_date', '=', $today)
                            ->where('end_time', '<', $currentTime);
                    });
            })
            ->update(['status' => 'completed']);

        // Update ongoing events (between start and end time today)
        Event::where('status', 'upcoming')
            ->where('event_date', '=', $today)
            ->where('start_time', '<=', $currentTime)
            ->where('end_time', '>=', $currentTime)
            ->update(['status' => 'ongoing']);

        // Update future ongoing events back to upcoming (fix incorrect statuses)
        Event::where('status', 'ongoing')
            ->where('event_date', '>', $today)
            ->update(['status' => 'upcoming']);
    }

    public function getUsers(Request $request): JsonResponse
    {
        $users = User::whereIn('role', ['admin', 'officer'])
            ->where('archived', false)
            ->orderBy('created_at', 'desc')
            ->get(['id', 'name', 'email', 'role', 'profile_image', 'created_at']);

        return response()->json($users);
    }

    public function getArchivedUsers(Request $request): JsonResponse
    {
        $users = User::whereIn('role', ['admin', 'officer'])
            ->where('archived', true)
            ->orderBy('created_at', 'desc')
            ->get(['id', 'name', 'email', 'role', 'profile_image', 'created_at']);

        return response()->json($users);
    }

    public function archiveUser(Request $request, $id): JsonResponse
    {
        $user = User::findOrFail($id);

        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'You cannot archive your own account.'], 422);
        }

        $user->update(['archived' => true]);

        AuditLog::record('deleted', "Archived user: {$user->name}", 'User', $user->id, $request->user()?->id, $request->ip());

        return response()->json(['message' => 'User archived.']);
    }

    public function restoreUser(Request $request, $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $user->update(['archived' => false]);

        AuditLog::record('restored', "Restored user: {$user->name}", 'User', $user->id, $request->user()?->id, $request->ip());

        return response()->json(['message' => 'User restored.']);
    }

    public function updateUser(Request $request, $id): JsonResponse
    {
        $user = User::findOrFail($id);

        $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|max:255|unique:users,email,' . $user->id,
            'role'     => 'required|in:officer,admin',
            'password' => 'nullable|string|min:6|confirmed',
        ]);

        $data = $request->only('name', 'email', 'role');

        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }

        $user->update($data);

        return response()->json(['user' => $user->only('id', 'name', 'email', 'role', 'profile_image', 'created_at'), 'message' => 'User updated.']);
    }

    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $remember = $request->boolean('remember', false);

        if (!Auth::attempt($request->only('email', 'password'), $remember)) {
            return response()->json(['message' => 'Invalid credentials.'], 401);
        }

        $user = Auth::user()->load('studentRecord');

        // Check if user is archived
        if ($user->archived) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
            return response()->json(['message' => 'This account has been archived and cannot log in.'], 403);
        }

        // Check if student record is archived (for student role)
        if ($user->role === 'student' && $user->studentRecord && $user->studentRecord->archived) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
            return response()->json(['message' => 'This student account has been archived and cannot log in.'], 403);
        }

        $request->session()->regenerate();

        AuditLog::record('login', "User logged in", 'User', $user->id, $user->id, $request->ip());

        return response()->json([
            'user' => $user,
            'role' => $user->role,
        ]);
    }

    public function mobileLogin(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Invalid credentials.'], 401);
        }

        // Check if user is archived
        if ($user->archived) {
            return response()->json(['message' => 'This account has been archived and cannot log in.'], 403);
        }

        // Load student record
        $user->load('studentRecord');

        // Check if student record is archived (for student role)
        if ($user->role === 'student' && $user->studentRecord && $user->studentRecord->archived) {
            return response()->json(['message' => 'This student account has been archived and cannot log in.'], 403);
        }

        // Create token for mobile app
        $token = $user->createToken('mobile-app')->plainTextToken;

        AuditLog::record('login', "User logged in via mobile", 'User', $user->id, $user->id, $request->ip());

        return response()->json([
            'token' => $token,
            'user' => $user,
            'role' => $user->role,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $userId = $request->user()?->id;
        AuditLog::record('logout', "User logged out", 'User', $userId, $userId, $request->ip());

        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Logged out.']);
    }

    public function user(Request $request): JsonResponse
    {
        return response()->json($request->user()->load('studentRecord'));
    }

    public function register(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => 'required|string|min:6|confirmed',
            'role' => 'nullable|in:officer,admin',
            'student_id' => 'nullable|string|max:50',
            'usg_position' => 'nullable|string|max:255',
            'reason' => 'nullable|string|max:1000',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role ?? 'officer',
            'usg_position' => $request->usg_position,
        ]);

        AuditLog::record('created', "Created account for {$user->name} ({$user->role})" . ($request->usg_position ? " - {$request->usg_position}" : ''), 'User', $user->id, $request->user()?->id, $request->ip());

        return response()->json(['user' => $user, 'message' => 'Account created.'], 201);
    }

    public function registerStudent(Request $request): JsonResponse
    {
        $request->validate([
            'student_id' => 'required|string|max:255|unique:students,student_id',
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'course' => 'required|string|max:255',
            'year_level' => 'required|integer|min:1|max:6',
            'password' => 'required|string|min:6|confirmed',
        ]);

        $student = Student::create([
            'student_id' => trim($request->student_id),
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'email' => $request->email,
            'course' => $request->course,
            'year_level' => $request->year_level,
        ]);

        $user = User::create([
            'name' => $request->first_name . ' ' . $request->last_name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'student',
            'student_record_id' => $student->id,
        ]);

        // Clear students cache so desktop admin sees new student immediately
        Cache::forget('students_active');
        
        // Log for debugging
        \Log::info('Student registered from mobile app', [
            'student_id' => $student->student_id,
            'name' => $student->first_name . ' ' . $student->last_name,
            'email' => $student->email
        ]);

        return response()->json(['user' => $user, 'message' => 'Student account created.'], 201);
    }

    public function dashboard(): JsonResponse
    {
        $totalStudents = Student::active()->count();
        $totalEvents = Event::count();
        $totalAttendance = Attendance::count();

        $ongoingEvents = Event::where('status', 'ongoing')->count();
        $upcomingEvents = Event::where('status', 'upcoming')->count();

        $recentAttendance = Attendance::with(['student', 'event'])
            ->orderByDesc('check_in_time')
            ->limit(10)
            ->get();

        $upcomingEventsList = Event::where('status', 'upcoming')
            ->orderBy('event_date')
            ->limit(5)
            ->get();

        // Monthly attendance chart data
        $monthlyData = Attendance::selectRaw("DATE_FORMAT(check_in_time, '%Y-%m') as month, status, COUNT(*) as total")
            ->groupBy('month', 'status')
            ->orderBy('month')
            ->get();

        $chartLabels = $monthlyData->pluck('month')->unique()->values();
        $chartValues = [];
        $chartLateValues = [];
        foreach ($chartLabels as $label) {
            $chartValues[] = $monthlyData->where('month', $label)->where('status', 'present')->sum('total');
            $chartLateValues[] = $monthlyData->where('month', $label)->where('status', 'late')->sum('total');
        }

        // Daily attendance for current month
        $startOfMonth = Carbon::now()->startOfMonth();
        $dailyData = Attendance::selectRaw("DATE(check_in_time) as day, COUNT(*) as total")
            ->where('check_in_time', '>=', $startOfMonth)
            ->groupBy('day')
            ->orderBy('day')
            ->get();

        return response()->json([
            'totalStudents' => $totalStudents,
            'totalEvents' => $totalEvents,
            'totalAttendance' => $totalAttendance,
            'ongoingEvents' => $ongoingEvents,
            'upcomingEvents' => $upcomingEvents,
            'recentAttendance' => $recentAttendance,
            'upcomingEventsList' => $upcomingEventsList,
            'chartLabels' => $chartLabels,
            'chartValues' => $chartValues,
            'chartLateValues' => $chartLateValues,
            'dailyLabels' => $dailyData->pluck('day'),
            'dailyValues' => $dailyData->pluck('total'),
        ]);
    }

    public function studentDashboard(Request $request): JsonResponse
    {
        // Update event statuses before fetching
        $this->updateEventStatuses();

        $user = $request->user()->load('studentRecord');
        $student = $user->studentRecord;

        if (!$student) {
            return response()->json(['message' => 'No student record linked.'], 404);
        }

        $attendances = Attendance::where('student_id', $student->id)->with('event')->get();

        $totalPresent = $attendances->where('status', 'present')->count();
        $totalLate = $attendances->where('status', 'late')->count();
        $totalEvents = Event::count();
        $attendedEvents = $attendances->count();

        $upcomingEvents = Event::where('status', 'upcoming')
            ->orderBy('event_date')
            ->limit(5)
            ->get();

        // Monthly chart data for this student
        $monthlyData = Attendance::where('student_id', $student->id)
            ->selectRaw("DATE_FORMAT(check_in_time, '%Y-%m') as month, status, COUNT(*) as total")
            ->groupBy('month', 'status')
            ->orderBy('month')
            ->get();

        $chartLabels = $monthlyData->pluck('month')->unique()->values();
        $chartPresent = [];
        $chartLate = [];
        foreach ($chartLabels as $label) {
            $chartPresent[] = $monthlyData->where('month', $label)->where('status', 'present')->sum('total');
            $chartLate[] = $monthlyData->where('month', $label)->where('status', 'late')->sum('total');
        }

        // Method breakdown
        $methodBreakdown = [
            'face'   => $attendances->where('verification_method', 'face')->count(),
            'rfid'   => $attendances->where('verification_method', 'rfid')->count(),
            'manual' => $attendances->where('verification_method', 'manual')->count(),
        ];

        // Attendance streak (consecutive events attended in date order)
        $allEventsSorted = Event::where('status', 'completed')
            ->orderByDesc('event_date')
            ->get();
        $attendedIds = $attendances->pluck('event_id')->toArray();
        $streak = 0;
        foreach ($allEventsSorted as $ev) {
            if (in_array($ev->id, $attendedIds)) {
                $streak++;
            } else {
                break;
            }
        }

        // All past events for "absent" calculation
        $allPastEvents = Event::where('status', 'completed')->get();

        // Next upcoming event
        $nextEvent = Event::where('status', 'upcoming')
            ->orderBy('event_date')
            ->orderBy('start_time')
            ->first();

        return response()->json([
            'totalPresent' => $totalPresent,
            'totalLate' => $totalLate,
            'totalEvents' => $totalEvents,
            'attendedEvents' => $attendedEvents,
            'attendanceRecords' => $attendances->values()->toArray(),
            'upcomingEvents' => $upcomingEvents->toArray(),
            'chartLabels' => $chartLabels,
            'chartPresent' => $chartPresent,
            'chartLate' => $chartLate,
            'student' => $student,
            'methodBreakdown' => $methodBreakdown,
            'streak' => $streak,
            'allPastEvents' => $allPastEvents->toArray(),
            'nextEvent' => $nextEvent,
        ]);
    }

    public function studentAttendance(Request $request): JsonResponse
    {
        $student = $request->user()->studentRecord;

        if (!$student) {
            return response()->json(['message' => 'No student record linked.'], 404);
        }

        $records = Attendance::where('student_id', $student->id)
            ->with('event')
            ->orderByDesc('check_in_time')
            ->get();

        // Attach all completed events for absent calculation
        $allPastEvents = Event::where('status', 'completed')->get();
        $attendedEventIds = $records->pluck('event_id')->toArray();
        $absentEvents = $allPastEvents->filter(fn($e) => !in_array($e->id, $attendedEventIds))->values();

        return response()->json([
            'records' => $records,
            'absentEvents' => $absentEvents,
        ]);
    }

    public function studentEvents(Request $request): JsonResponse
    {
        // Update event statuses before fetching
        $this->updateEventStatuses();

        $student = $request->user()->studentRecord;
        
        $events = Event::whereIn('status', ['upcoming', 'ongoing'])
            ->orderBy('event_date')
            ->orderBy('start_time')
            ->get();

        // Attach check-in status for this student
        if ($student) {
            $checkedInEventIds = Attendance::where('student_id', $student->id)
                ->pluck('event_id')
                ->toArray();

            $events->each(function ($event) use ($checkedInEventIds) {
                $event->checked_in = in_array($event->id, $checkedInEventIds);
            });
        }

        return response()->json($events);
    }

    public function studentProfile(Request $request): JsonResponse
    {
        $user = $request->user()->load('studentRecord');
        return response()->json($user);
    }

    public function uploadProfileImage(Request $request): JsonResponse
    {
        $request->validate([
            'profile_image' => 'required|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        $student = $request->user()->studentRecord;

        if (!$student) {
            return response()->json(['message' => 'No student record linked.'], 404);
        }

        // Delete old image if exists
        if ($student->profile_image) {
            Storage::disk('public')->delete($student->profile_image);
        }

        $path = $request->file('profile_image')->store('profile-images', 'public');
        $student->update(['profile_image' => $path]);

        return response()->json([
            'message' => 'Profile image updated.',
            'profile_image' => $path,
        ]);
    }

    public function uploadUserProfileImage(Request $request): JsonResponse
    {
        $request->validate([
            'profile_image' => 'required|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        $user = $request->user();

        if ($user->profile_image) {
            Storage::disk('public')->delete($user->profile_image);
        }

        $path = $request->file('profile_image')->store('profile-images', 'public');
        $user->update(['profile_image' => $path]);

        return response()->json([
            'message' => 'Profile image updated.',
            'profile_image' => $path,
        ]);
    }

    public function updateUserPassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => 'required|string',
            'password'         => 'required|string|min:6|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['message' => 'Current password is incorrect.'], 422);
        }

        $user->update(['password' => Hash::make($request->password)]);

        return response()->json(['message' => 'Password updated successfully.']);
    }

    public function updateStudentPassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => 'required|string',
            'password' => 'required|string|min:6|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['message' => 'Current password is incorrect.'], 422);
        }

        $user->update(['password' => Hash::make($request->password)]);

        return response()->json(['message' => 'Password updated successfully.']);
    }
}
