<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Student Attendance Report</title>
    <style>
        @page { margin: 20px; }
        body {
            font-family: 'Arial', sans-serif;
            font-size: 12px;
            color: #333;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 3px solid #10b981;
            padding-bottom: 15px;
        }
        .header h1 {
            margin: 0;
            color: #10b981;
            font-size: 24px;
        }
        .student-info {
            margin-bottom: 20px;
            padding: 15px;
            background: #f3f4f6;
            border-radius: 5px;
        }
        .info-row {
            margin-bottom: 8px;
        }
        .info-label {
            font-weight: bold;
            color: #059669;
            display: inline-block;
            width: 150px;
        }
        .summary-boxes {
            display: flex;
            justify-content: space-around;
            margin-bottom: 20px;
        }
        .summary-box {
            text-align: center;
            padding: 15px;
            border-radius: 8px;
            flex: 1;
            margin: 0 5px;
        }
        .summary-box.total { background: #dbeafe; border: 2px solid #3b82f6; }
        .summary-box.present { background: #d1fae5; border: 2px solid #10b981; }
        .summary-box.late { background: #fed7aa; border: 2px solid #f59e0b; }
        .summary-box.absent { background: #fee2e2; border: 2px solid #ef4444; }
        .summary-box .value {
            font-size: 24px;
            font-weight: bold;
        }
        .summary-box .label {
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        thead {
            background: #10b981;
            color: white;
        }
        th {
            padding: 10px 8px;
            text-align: left;
            font-weight: bold;
        }
        td {
            padding: 8px;
            border-bottom: 1px solid #e5e7eb;
        }
        tr:nth-child(even) {
            background: #f9fafb;
        }
        .status-badge {
            padding: 3px 8px;
            border-radius: 12px;
            font-weight: bold;
            font-size: 10px;
            text-transform: uppercase;
        }
        .status-present { background: #d1fae5; color: #065f46; }
        .status-late { background: #fed7aa; color: #92400e; }
        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 10px;
            color: #6b7280;
            border-top: 1px solid #e5e7eb;
            padding-top: 10px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📝 Student Attendance Report</h1>
    </div>

    <div class="student-info">
        <div class="info-row">
            <span class="info-label">Student ID:</span>
            <span>{{ $student->student_id }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Name:</span>
            <span>{{ $student->first_name }} {{ $student->last_name }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Course:</span>
            <span>{{ $student->course }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Year Level:</span>
            <span>{{ $student->year_level }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Email:</span>
            <span>{{ $student->email }}</span>
        </div>
    </div>

    <div class="summary-boxes">
        <div class="summary-box total">
            <div class="value">{{ $summary['total_events'] }}</div>
            <div class="label">Total Events</div>
        </div>
        <div class="summary-box present">
            <div class="value">{{ $summary['present'] }}</div>
            <div class="label">Present</div>
        </div>
        <div class="summary-box late">
            <div class="value">{{ $summary['late'] }}</div>
            <div class="label">Late</div>
        </div>
        <div class="summary-box absent">
            <div class="value">{{ $summary['absent'] }}</div>
            <div class="label">Absent</div>
        </div>
    </div>

    <div style="text-align: center; margin-bottom: 15px;">
        <strong style="font-size: 16px; color: #10b981;">Attendance Rate: {{ $summary['attendance_rate'] }}%</strong>
    </div>

    <h3 style="color: #10b981; border-bottom: 2px solid #10b981; padding-bottom: 5px;">Attendance History</h3>

    <table>
        <thead>
            <tr>
                <th>Event Name</th>
                <th>Date</th>
                <th>Venue</th>
                <th>Status</th>
                <th>Check-in Time</th>
                <th>Method</th>
            </tr>
        </thead>
        <tbody>
            @forelse($attendances as $attendance)
            <tr>
                <td>{{ $attendance->event->event_name }}</td>
                <td>{{ \Carbon\Carbon::parse($attendance->event->event_date)->format('M d, Y') }}</td>
                <td>{{ $attendance->event->venue }}</td>
                <td>
                    <span class="status-badge status-{{ $attendance->status }}">
                        {{ $attendance->status }}
                    </span>
                </td>
                <td>{{ \Carbon\Carbon::parse($attendance->checked_in_at)->format('M d, Y h:i A') }}</td>
                <td style="text-transform: capitalize;">{{ $attendance->checkin_method }}</td>
            </tr>
            @empty
            <tr>
                <td colspan="6" style="text-align: center; padding: 20px; color: #6b7280;">
                    No attendance records found
                </td>
            </tr>
            @endforelse
        </tbody>
    </table>

    <div class="footer">
        <p><strong>Mindoro State University - Bongabong Campus</strong></p>
        <p>U-EventTrack Attendance Management System</p>
        <p>Generated on {{ $generatedAt }}</p>
    </div>
</body>
</html>
