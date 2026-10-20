<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
    use HasFactory;

    protected $fillable = [
        'event_name',
        'description',
        'event_date',
        'start_time',
        'end_time',
        'venue',
        'venue_lat',
        'venue_lng',
        'venue_radius',
        'status',
        'created_by',
        'academic_year_id',
    ];

    protected function casts(): array
    {
        return [
            'event_date' => 'date',
            'venue_lat' => 'double',
            'venue_lng' => 'double',
            'venue_radius' => 'integer',
        ];
    }

    public function organizer()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function attendances()
    {
        return $this->hasMany(Attendance::class, 'event_id');
    }

    public function academicYear()
    {
        return $this->belongsTo(AcademicYear::class);
    }
}
