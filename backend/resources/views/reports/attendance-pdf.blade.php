<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Attendance Report - {{ $event->event_name }}</title>
    <style>
        @page { margin: 20px; }
        body {
            font-family: 'Arial', sans-serif;
            font-size: 11px;
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
        .header h2 {
            margin: 5px 0;
            color: #666;
            font-size: 16px;
        }
        .info-section {
            margin-bottom: 20px;
            padding: 10px;
            background: #f3f4f6;
            border-radius: 5px;
        }
        .info-row {
            display: flex;
            margin-bottom: 5px;
        }
        .info-label {
            font-weight: bold;
            width: 150px;
            color: #059669;
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
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .summary-box .label {
            font-size: 12px;
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
            padding: 10px 5px;
            text-align: left;
            font-weight: bold;
            font-size: 11px;
        }
        td {
            padding: 8px 5px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 10px;
        }
        tr:nth-child(even) {
            background: #f9fafb;
        }
        .status-badge {
            padding: 3px 8px;
            border-radius: 12px;
            font-weight: bold;
            font-size: 9px;
            text-transform: uppercase;
        }
        .status-present { background: #d1fae5; color: #065f46; }
        .status-late { background: #fed7aa; color: #92400e; }
        .status-absent { background: #fee2e2; color: #991b1b; }
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
        <h1>📋 Attendance Report</h1>
        <h2>{{ $event->event_name }}</h2>
    </div>

    <div class="info-section">
        <div class="info-row">
            <span class="info-label">Event Date:</span>
            <span>{{ \Carbon\Carbon::parse($event->event_date)->format('F d, Y') }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Time:</span>
            <span>{{ $event->start_time }} - {{ $event->end_time }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Venue:</span>
            <span>{{ $event->venue }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Status:</span>
            <span style="text-transform: capitalize; font-weight: bold; color: #10b981;">{{ $event->status }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Generated:</span>
            <span>{{ $generatedAt }}</span>
        </div>
    </div>

    <div class="summary-boxes">
        <div class="summary-box total">
            <div class="value">{{ $summary['total_students'] }}</div>
            <div class="label">Total Students</div>
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

    <table>
        <thead>
            <tr>
                <th>Student ID</th>
                <th>Last Name</th>
                <th>First Name</th>
                <th>Course</th>
                <th>Year</th>
                <th>Status</th>
                <th>Check-in Time</th>
                <th>Method</th>
            </tr>
        </thead>
        <tbody>
            @foreach($attendanceData as $record)
            <tr>
                <td>{{ $record['student_id'] }}</td>
                <td>{{ $record['last_name'] }}</td>
                <td>{{ $record['first_name'] }}</td>
                <td>{{ $record['course'] }}</td>
                <td>{{ $record['year_level'] }}</td>
                <td>
                    <span class="status-badge status-{{ $record['status'] }}">
                        {{ $record['status'] }}
                    </span>
                </td>
                <td>{{ $record['check_in_time'] }}</td>
                <td>{{ $record['method'] }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        <p><strong>Mindoro State University - Bongabong Campus</strong></p>
        <p>U-EventTrack Attendance Management System</p>
        <p>Generated on {{ $generatedAt }}</p>
    </div>
</body>
</html>
