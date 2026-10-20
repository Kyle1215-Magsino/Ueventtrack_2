<?php

namespace App\Exports;

use App\Models\Event;
use App\Models\Student;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Border;

class AttendanceReportExport implements FromCollection, WithHeadings, WithMapping, WithStyles, WithTitle
{
    protected $event;
    protected $attendances;
    protected $rowIndex = 1;

    public function __construct(Event $event)
    {
        $this->event = $event->load(['attendances.student']);
        $this->attendances = $event->attendances->keyBy('student_id');
    }

    public function collection()
    {
        // Get all active students
        $students = Student::active()->get();

        // Add attendance status for each student
        return $students->map(function ($student) {
            $attendance = $this->attendances->get($student->id);
            
            return (object)[
                'student' => $student,
                'attendance' => $attendance,
                'status' => $attendance ? $attendance->status : 'absent',
                'check_in_time' => $attendance ? $attendance->checked_in_at : null,
                'method' => $attendance ? $attendance->checkin_method : null,
            ];
        });
    }

    public function headings(): array
    {
        return [
            'Student ID',
            'Last Name',
            'First Name',
            'Course',
            'Year Level',
            'Status',
            'Check-in Time',
            'Method',
        ];
    }

    public function map($row): array
    {
        $this->rowIndex++;
        
        return [
            $row->student->student_id,
            $row->student->last_name,
            $row->student->first_name,
            $row->student->course,
            $row->student->year_level,
            strtoupper($row->status),
            $row->check_in_time ? \Carbon\Carbon::parse($row->check_in_time)->format('Y-m-d H:i:s') : '-',
            $row->method ? ucfirst($row->method) : '-',
        ];
    }

    public function styles(Worksheet $sheet)
    {
        // Style header row
        $sheet->getStyle('A1:H1')->applyFromArray([
            'font' => [
                'bold' => true,
                'color' => ['rgb' => 'FFFFFF'],
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '10b981'],
            ],
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                ],
            ],
        ]);

        // Auto-size columns
        foreach (range('A', 'H') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        // Color code status cells
        $rowCount = $this->rowIndex;
        for ($i = 2; $i <= $rowCount; $i++) {
            $status = $sheet->getCell("F{$i}")->getValue();
            
            if ($status === 'PRESENT') {
                $sheet->getStyle("F{$i}")->applyFromArray([
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'startColor' => ['rgb' => 'd1fae5'],
                    ],
                    'font' => ['color' => ['rgb' => '065f46']],
                ]);
            } elseif ($status === 'LATE') {
                $sheet->getStyle("F{$i}")->applyFromArray([
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'startColor' => ['rgb' => 'fed7aa'],
                    ],
                    'font' => ['color' => ['rgb' => '92400e']],
                ]);
            } elseif ($status === 'ABSENT') {
                $sheet->getStyle("F{$i}")->applyFromArray([
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'startColor' => ['rgb' => 'fee2e2'],
                    ],
                    'font' => ['color' => ['rgb' => '991b1b']],
                ]);
            }
        }

        return [];
    }

    public function title(): string
    {
        return substr($this->event->event_name, 0, 31); // Excel sheet name limit
    }
}
