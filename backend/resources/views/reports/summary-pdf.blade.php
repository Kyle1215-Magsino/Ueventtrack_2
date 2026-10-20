<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Events Summary Report</title>
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
        .info-section {
            margin-bottom: 20px;
            padding: 10px;
            background: #f3f4f6;
            border-radius: 5px;
            text-align: center;
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
            font-size: 10px;
        }
        td {
            padding: 8px 5px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 10px;
        }
        tr:nth-child(even) {
            background: #f9fafb;
        }
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
        <h1>📊 Events Summary Report</h1>
        <p style="margin: 5px 0; color: #666;">{{ $dateRange['start'] }} - {{ $dateRange['end'] }}</p>
    </div>

    <div class="info-section">
        <strong>Total Students: {{ $totalStudents }}</strong> | 
        <strong>Total Events: {{ count($events) }}</strong> |
        <strong>Generated: {{ $generatedAt }}</strong>
    </div>

    <table>
        <thead>
            <tr>
                <th>Event Name</th>
                <th>Date</th>
                <th>Venue</th>
                <th>Status</th>
                <th>Attendees</th>
                <th>Present</th>
                <th>Late</th>
                <th>Absent</th>
                <th>Rate</th>
            </tr>
        </thead>
        <tbody>
            @foreach($events as $event)
            <tr>
                <td>{{ $event['event_name'] }}</td>
                <td>{{ $event['event_date'] }}</td>
                <td>{{ $event['venue'] }}</td>
                <td style="text-transform: capitalize;">{{ $event['status'] }}</td>
                <td style="text-align: center; font-weight: bold;">{{ $event['total_attendees'] }}</td>
                <td style="text-align: center; color: #10b981;">{{ $event['present'] }}</td>
                <td style="text-align: center; color: #f59e0b;">{{ $event['late'] }}</td>
                <td style="text-align: center; color: #ef4444;">{{ $event['absent'] }}</td>
                <td style="text-align: center; font-weight: bold;">{{ $event['attendance_rate'] }}%</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        <p><strong>Mindoro State University - Bongabong Campus</strong></p>
        <p>U-EventTrack Attendance Management System</p>
    </div>
</body>
</html>
