<?php

namespace App\Console\Commands;

use App\Models\Event;
use App\Models\Student;
use App\Models\Attendance;
use App\Models\Fine;
use Illuminate\Console\Command;
use Carbon\Carbon;

class CalculateFines extends Command
{
    protected $signature = 'fines:calculate {--event_id=}';
    protected $description = 'Calculate fines for late attendance and absences';

    public function handle()
    {
        $this->info('Calculating fines...');
        
        $eventId = $this->option('event_id');
        
        if ($eventId) {
            $events = Event::where('id', $eventId)->where('status', 'completed')->get();
        } else {
            // Get all completed events
            $events = Event::where('status', 'completed')->get();
        }
        
        if ($events->isEmpty()) {
            $this->warn('No completed events found.');
            return 0;
        }
        
        $totalFinesCreated = 0;
        
        foreach ($events as $event) {
            $this->line("Processing event: {$event->event_name}");
            
            // Get all active students
            $students = Student::active()->get();
            
            foreach ($students as $student) {
                // Check if student has attendance record for this event
                $attendance = Attendance::where('event_id', $event->id)
                    ->where('student_id', $student->id)
                    ->first();
                
                // Check if fine already exists for this student-event combination
                $existingFine = Fine::where('event_id', $event->id)
                    ->where('student_id', $student->id)
                    ->first();
                
                if ($existingFine) {
                    // Fine already exists, skip
                    continue;
                }
                
                if (!$attendance) {
                    // Student was absent - create fine for whole event
                    $fine = Fine::create([
                        'student_id' => $student->id,
                        'event_id' => $event->id,
                        'period' => 'whole_event',
                        'violation_type' => 'absent',
                        'amount' => 100.00, // ₱100 for complete absence
                        'payment_status' => 'unpaid',
                        'notes' => 'Complete absence from event',
                    ]);
                    
                    $totalFinesCreated++;
                    $this->line("  → Created fine for {$student->first_name} {$student->last_name} (Absent) - ₱100");
                    
                } elseif ($attendance->status === 'late') {
                    // Student was late - create fine
                    $fine = Fine::create([
                        'student_id' => $student->id,
                        'event_id' => $event->id,
                        'period' => 'check_in',
                        'violation_type' => 'late',
                        'amount' => 50.00, // ₱50 for being late
                        'payment_status' => 'unpaid',
                        'notes' => 'Late check-in',
                    ]);
                    
                    $totalFinesCreated++;
                    $this->line("  → Created fine for {$student->first_name} {$student->last_name} (Late) - ₱50");
                }
            }
        }
        
        $this->info("✓ Completed! Created {$totalFinesCreated} fine(s).");
        
        return 0;
    }
}
