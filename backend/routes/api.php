<?php

use App\Http\Controllers\AnnouncementController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CacheController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\FineController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\TwoFactorController;
use App\Http\Controllers\AcademicYearController;
use App\Http\Controllers\ReportController;
use Illuminate\Support\Facades\Route;

// Public auth routes
Route::post('/login', [AuthController::class, 'login']);
Route::post('/mobile/login', [AuthController::class, 'mobileLogin']);
Route::post('/register-student', [AuthController::class, 'registerStudent']);
Route::get('/announcements/public', [AnnouncementController::class, 'public']);

// Authenticated routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // 2FA (available to all authenticated users)
    Route::get('/user/two-factor-status', [TwoFactorController::class, 'status']);
    Route::post('/user/two-factor-authentication', [TwoFactorController::class, 'enable']);
    Route::post('/user/confirmed-two-factor-authentication', [TwoFactorController::class, 'confirm']);
    Route::delete('/user/two-factor-authentication', [TwoFactorController::class, 'disable']);
    Route::get('/user/two-factor-qr-code', [TwoFactorController::class, 'qrCode']);
    Route::get('/user/two-factor-recovery-codes', [TwoFactorController::class, 'recoveryCodes']);

    // Check-in (available to all authenticated users - students, officers, admins)
    Route::post('/checkin', [AttendanceController::class, 'processCheckin']);

    // Officer and admin routes
    Route::middleware('role:officer,admin')->group(function () {
        Route::post('/register', [AuthController::class, 'register']);
        Route::get('/dashboard', [AuthController::class, 'dashboard']);
        Route::post('/user-profile-image', [AuthController::class, 'uploadUserProfileImage']);
        Route::put('/user-password', [AuthController::class, 'updateUserPassword']);
        Route::get('/users', [AuthController::class, 'getUsers']);
        Route::get('/users/archived', [AuthController::class, 'getArchivedUsers']);
        Route::put('/users/{id}', [AuthController::class, 'updateUser']);
        Route::delete('/users/{id}', [AuthController::class, 'archiveUser']);
        Route::post('/users/{id}/restore', [AuthController::class, 'restoreUser']);

        // Students
        Route::get('/students', [StudentController::class, 'index']);
        Route::post('/students', [StudentController::class, 'store']);
        Route::get('/students/search', [StudentController::class, 'search']);
        Route::get('/students/faces', [StudentController::class, 'getFaceData']);
        Route::get('/students/archived', [StudentController::class, 'archived']);
        Route::post('/students/check-barcode', [StudentController::class, 'checkBarcodeUniqueness']);
        Route::get('/students/{id}', [StudentController::class, 'show']);
        Route::put('/students/{id}', [StudentController::class, 'update']);
        Route::delete('/students/{id}', [StudentController::class, 'destroy']);
        Route::post('/students/{id}/restore', [StudentController::class, 'restore']);
        Route::post('/students/{id}/face', [StudentController::class, 'saveFaceData']);
        Route::post('/students/{id}/regenerate-barcode', [StudentController::class, 'regenerateBarcode']);

        // Events
        Route::get('/events', [EventController::class, 'index']);
        Route::post('/events', [EventController::class, 'store']);
        Route::get('/events/active', [EventController::class, 'active']);
        Route::get('/events/analytics', [EventController::class, 'allAnalytics']);
        Route::get('/events/{id}', [EventController::class, 'show']);
        Route::get('/events/{id}/analytics', [EventController::class, 'analytics']);
        Route::put('/events/{id}', [EventController::class, 'update']);
        Route::delete('/events/{id}', [EventController::class, 'destroy']);

        // Attendance (admin/officer only)
        Route::get('/attendance/live/{eventId}', [AttendanceController::class, 'liveAttendance']);
        Route::get('/attendance', [AttendanceController::class, 'index']);
        Route::get('/reports', [AttendanceController::class, 'reports']);

        // Fines Management (admin/officer only)
        Route::get('/fines', [FineController::class, 'index']);
        Route::get('/fines/statistics', [FineController::class, 'statistics']);
        Route::get('/fines/report', [FineController::class, 'report']);
        Route::post('/fines/{fine}/pay', [FineController::class, 'markAsPaid']);
        Route::post('/fines/{fine}/waive', [FineController::class, 'waive']);

        // Academic Years Management (admin/officer only)
        Route::get('/academic-years', [AcademicYearController::class, 'index']);
        Route::get('/academic-years/active', [AcademicYearController::class, 'active']);
        Route::post('/academic-years', [AcademicYearController::class, 'store']);
        Route::get('/academic-years/{id}', [AcademicYearController::class, 'show']);
        Route::put('/academic-years/{id}', [AcademicYearController::class, 'update']);
        Route::post('/academic-years/{id}/activate', [AcademicYearController::class, 'activate']);
        Route::post('/academic-years/{id}/archive', [AcademicYearController::class, 'archive']);
        Route::delete('/academic-years/{id}', [AcademicYearController::class, 'destroy']);

        // Reports (admin/officer only)
        Route::get('/reports/event/{id}/pdf', [ReportController::class, 'exportPDF']);
        Route::get('/reports/event/{id}/excel', [ReportController::class, 'exportExcel']);
        Route::get('/reports/student/{id}/pdf', [ReportController::class, 'studentReport']);
        Route::get('/reports/summary/pdf', [ReportController::class, 'summaryReport']);

        // Audit Logs (admin only)
        Route::middleware('role:admin')->group(function () {
            Route::get('/audit-logs', [AuditLogController::class, 'index']);
            Route::post('/cache/clear', [CacheController::class, 'clear']);

            // Announcements
            Route::get('/announcements', [AnnouncementController::class, 'index']);
            Route::post('/announcements', [AnnouncementController::class, 'store']);
            Route::put('/announcements/{id}', [AnnouncementController::class, 'update']);
            Route::delete('/announcements/{id}', [AnnouncementController::class, 'destroy']);
            Route::post('/announcements/sync-events', function () {
                \App\Services\EventAnnouncementService::syncAllEventAnnouncements();
                return response()->json(['message' => 'Event announcements synced successfully.']);
            });
        });
    });

    // Student routes
    Route::middleware('role:student')->group(function () {
        Route::get('/student-dashboard', [AuthController::class, 'studentDashboard']);
        Route::get('/student-attendance', [AuthController::class, 'studentAttendance']);
        Route::get('/student-events', [AuthController::class, 'studentEvents']);
        Route::get('/student-profile', [AuthController::class, 'studentProfile']);
        Route::put('/student-password', [AuthController::class, 'updateStudentPassword']);
        Route::post('/student-profile-image', [AuthController::class, 'uploadProfileImage']);
        
        // Student fines
        Route::get('/student-fines', [FineController::class, 'studentFines']);
    });
});
