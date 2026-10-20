<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Student;
use App\Exports\AttendanceReportExport;
use Barryvdh\DomPDF\Facade\Pdf as PDF;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Http\Request;
use Carbon\Carbon;

class ReportController extends Controller
{
    /**
     * Export attendance report as PDF
     */
    public function exportPDF(Request $request, $eventId)
    {
        $event = Event::with(['attendances.student'])->findOrFail($eventId);
        
        // Get all active students
        $students = Student::active()->get();
        $attendanceMap = $event->attendances->keyBy('student_id');

        // Prepare data
        $attendanceData = $students->map(function ($student) use ($attendanceMap) {
            $attendance = $attendanceMap->get($student->id);
            
            return [
                'student_id' => $student->student_id,
                'last_name' => $student->last_name,
                'first_name' => $student->first_name,
                'course' => $student->course,
                'year_level' => $student->year_level,
                'status' => $attendance ? $attendance->status : 'absent',
                'check_in_time' => $attendance ? Carbon::parse($attendance->checked_in_at)->format('M d, Y h:i A') : '-',
                'method' => $attendance ? ucfirst($attendance->checkin_method) : '-',
            ];
        });

        // Calculate summary
        $totalStudents = $students->count();
        $presentCount = $attendanceData->where('status', 'present')->count();
        $lateCount = $attendanceData->where('status', 'late')->count();
        $absentCount = $attendanceData->where('status', 'absent')->count();
        $attendanceRate = $totalStudents > 0 ? round((($presentCount + $lateCount) / $totalStudents) * 100, 2) : 0;

        $summary = [
            'total_students' => $totalStudents,
            'present' => $presentCount,
            'late' => $lateCount,
            'absent' => $absentCount,
            'attendance_rate' => $attendanceRate,
        ];

        $pdf = PDF::loadView('reports.attendance-pdf', [
            'event' => $event,
            'attendanceData' => $attendanceData,
            'summary' => $summary,
            'generatedAt' => Carbon::now()->format('F d, Y h:i A'),
        ]);

        $pdf->setPaper('a4', 'landscape');

        $filename = 'attendance-report-' . $event->id . '-' . date('Y-m-d') . '.pdf';
        
        return $pdf->download($filename);
    }

    /**
     * Export attendance report as Excel
     */
    public function exportExcel(Request $request, $eventId)
    {
        $event = Event::findOrFail($eventId);
        
        $filename = 'attendance-report-' . $event->id . '-' . date('Y-m-d') . '.xlsx';
        
        return Excel::download(new AttendanceReportExport($event), $filename);
    }

    /**
     * Generate summary report for all events
     */
    public function summaryReport(Request $request)
    {
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');
        
        $query = Event::with('attendances');
        
        if ($startDate) {
            $query->where('event_date', '>=', $startDate);
        }
        
        if ($endDate) {
            $query->where('event_date', '<=', $endDate);
        }
        
        $events = $query->orderBy('event_date', 'desc')->get();
        $totalStudents = Student::active()->count();

        $reportData = $events->map(function ($event) use ($totalStudents) {
            $uniqueAttendees = $event->attendances->unique('student_id')->count();
            $presentCount = $event->attendances->where('status', 'present')->unique('student_id')->count();
            $lateCount = $event->attendances->where('status', 'late')->unique('student_id')->count();
            $absentCount = $totalStudents - $uniqueAttendees;
            $attendanceRate = $totalStudents > 0 ? round(($uniqueAttendees / $totalStudents) * 100, 2) : 0;

            return [
                'event_name' => $event->event_name,
                'event_date' => $event->event_date->format('M d, Y'),
                'venue' => $event->venue,
                'status' => $event->status,
                'total_attendees' => $uniqueAttendees,
                'present' => $presentCount,
                'late' => $lateCount,
                'absent' => $absentCount,
                'attendance_rate' => $attendanceRate,
            ];
        });

        $pdf = PDF::loadView('reports.summary-pdf', [
            'events' => $reportData,
            'totalStudents' => $totalStudents,
            'dateRange' => [
                'start' => $startDate ? Carbon::parse($startDate)->format('M d, Y') : 'All time',
                'end' => $endDate ? Carbon::parse($endDate)->format('M d, Y') : 'Present',
            ],
            'generatedAt' => Carbon::now()->format('F d, Y h:i A'),
        ]);

        $pdf->setPaper('a4', 'landscape');
        
        $filename = 'events-summary-report-' . date('Y-m-d') . '.pdf';
        
        return $pdf->download($filename);
    }

    /**
     * Generate student attendance report
     */
    public function studentReport(Request $request, $studentId)
    {
        $student = Student::with(['attendances.event'])->findOrFail($studentId);
        
        $attendances = $student->attendances->sortByDesc('created_at');
        
        $totalEvents = Event::where('status', '!=', 'cancelled')->count();
        $attendedCount = $attendances->unique('event_id')->count();
        $presentCount = $attendances->where('status', 'present')->count();
        $lateCount = $attendances->where('status', 'late')->count();
        $absentCount = $totalEvents - $attendedCount;
        $attendanceRate = $totalEvents > 0 ? round(($attendedCount / $totalEvents) * 100, 2) : 0;

        $summary = [
            'total_events' => $totalEvents,
            'attended' => $attendedCount,
            'present' => $presentCount,
            'late' => $lateCount,
            'absent' => $absentCount,
            'attendance_rate' => $attendanceRate,
        ];

        $pdf = PDF::loadView('reports.student-pdf', [
            'student' => $student,
            'attendances' => $attendances,
            'summary' => $summary,
            'generatedAt' => Carbon::now()->format('F d, Y h:i A'),
        ]);

        $pdf->setPaper('a4', 'portrait');
        
        $filename = 'student-attendance-' . $student->student_id . '-' . date('Y-m-d') . '.pdf';
        
        return $pdf->download($filename);
    }
}
