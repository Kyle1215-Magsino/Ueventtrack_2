<?php

namespace App\Services;

use App\Models\Fine;
use App\Models\Attendance;
use App\Models\Event;
use Carbon\Carbon;

class FineCalculationService
{
    // Fine amounts per your requirements
    const FINE_PER_CHECKPOINT = 25.00;  // ₱25 per missed check-in/out
    const FINE_WHOLE_MORNING = 50.00;   // ₱50 if miss entire morning
    const FINE_WHOLE_AFTERNOON = 50.00; // ₱50 if miss entire afternoon
    const FINE_WHOLE_DAY = 100.00;      // ₱100 if miss entire day
    
    /**
     * Calculate and create fines for an attendance record
     * 
     * Fine Structure:
     * - ₱25 per missed check-in or check-out
     * - ₱50 if miss entire morning (both check-in and check-out)
     * - ₱50 if miss entire afternoon (both check-in and check-out)
     * - ₱100 if miss entire day (all 4 checkpoints)
     */
    public static function calculateFinesForAttendance(Attendance $attendance)
    {
        $event = $attendance->event;
        
        // Only process if event has defined periods (whole-day event)
        if (!$event->is_whole_day) {
            return;
        }
        
        $fines = [];
        $missedCheckpoints = [];
        
        // Check each checkpoint
        $morningInMissed = self::isMorningTimeInMissing($attendance, $event);
        $morningOutMissed = self::isMorningTimeOutMissing($attendance, $event);
        $afternoonInMissed = self::isAfternoonTimeInMissing($attendance, $event);
        $afternoonOutMissed = self::isAfternoonTimeOutMissing($attendance, $event);
        
        // Check if missed entire day (all 4 checkpoints)
        if ($morningInMissed && $morningOutMissed && $afternoonInMissed && $afternoonOutMissed) {
            // Absent for entire day - ₱100
            $fines[] = self::createFine($attendance, 'whole_day', 'absent', self::FINE_WHOLE_DAY);
            return $fines;
        }
        
        // Check if missed entire morning (both checkpoints)
        if ($morningInMissed && $morningOutMissed) {
            // Missed entire morning - ₱50
            $fines[] = self::createFine($attendance, 'whole_morning', 'absent', self::FINE_WHOLE_MORNING);
        } else {
            // Check individual morning checkpoints - ₱25 each
            if ($morningInMissed) {
                $fines[] = self::createFine($attendance, 'morning_in', 'absent', self::FINE_PER_CHECKPOINT);
            }
            if ($morningOutMissed) {
                $fines[] = self::createFine($attendance, 'morning_out', 'incomplete', self::FINE_PER_CHECKPOINT);
            }
        }
        
        // Check if missed entire afternoon (both checkpoints)
        if ($afternoonInMissed && $afternoonOutMissed) {
            // Missed entire afternoon - ₱50
            $fines[] = self::createFine($attendance, 'whole_afternoon', 'absent', self::FINE_WHOLE_AFTERNOON);
        } else {
            // Check individual afternoon checkpoints - ₱25 each
            if ($afternoonInMissed) {
                $fines[] = self::createFine($attendance, 'afternoon_in', 'absent', self::FINE_PER_CHECKPOINT);
            }
            if ($afternoonOutMissed) {
                $fines[] = self::createFine($attendance, 'afternoon_out', 'incomplete', self::FINE_PER_CHECKPOINT);
            }
        }
        
        return $fines;
    }
    
    /**
     * Check if morning time-in is missing (₱25)
     */
    private static function isMorningTimeInMissing(Attendance $attendance, Event $event)
    {
        return !$attendance->check_in_time;
    }
    
    /**
     * Check if morning time-out is missing (₱25)
     */
    private static function isMorningTimeOutMissing(Attendance $attendance, Event $event)
    {
        return !$attendance->morning_check_out_time;
    }
    
    /**
     * Check if afternoon time-in is missing (₱25)
     */
    private static function isAfternoonTimeInMissing(Attendance $attendance, Event $event)
    {
        return !$attendance->afternoon_check_in_time;
    }
    
    /**
     * Check if afternoon time-out is missing (₱25)
     */
    private static function isAfternoonTimeOutMissing(Attendance $attendance, Event $event)
    {
        return !$attendance->check_out_time;
    }
    
    /**
     * Create a fine record
     */
    private static function createFine(Attendance $attendance, string $period, string $violationType, float $amount)
    {
        return Fine::create([
            'student_id' => $attendance->student_id,
            'event_id' => $attendance->event_id,
            'period' => $period,
            'violation_type' => $violationType,
            'amount' => $amount,
            'payment_status' => 'unpaid',
        ]);
    }
    
    /**
     * Calculate total fines for a student
     */
    public static function getTotalFinesForStudent(int $studentId, string $status = null)
    {
        $query = Fine::where('student_id', $studentId);
        
        if ($status) {
            $query->where('payment_status', $status);
        }
        
        return $query->sum('amount');
    }
    
    /**
     * Mark fine as paid
     */
    public static function markAsPaid(Fine $fine)
    {
        $fine->update([
            'payment_status' => 'paid',
            'paid_at' => now(),
        ]);
    }
    
    /**
     * Waive a fine
     */
    public static function waiveFine(Fine $fine, int $waivedBy, string $reason)
    {
        $fine->update([
            'payment_status' => 'waived',
            'waived_by' => $waivedBy,
            'waiver_reason' => $reason,
        ]);
    }
}
