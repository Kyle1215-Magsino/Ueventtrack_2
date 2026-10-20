<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Student extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'first_name',
        'last_name',
        'email',
        'course',
        'year_level',
        'barcode',
        'face_data',
        'face_enrolled_at',
        'profile_image',
        'status',
        'archived',
        'academic_year_id',
    ];

    protected function casts(): array
    {
        return [
            'archived'         => 'boolean',
            'year_level'        => 'integer',
            'face_enrolled_at'  => 'datetime',
        ];
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active')->where('archived', false);
    }

    public function userAccount()
    {
        return $this->hasOne(User::class, 'student_record_id');
    }

    public function attendances()
    {
        return $this->hasMany(Attendance::class, 'student_id');
    }

    public function academicYear()
    {
        return $this->belongsTo(AcademicYear::class);
    }
}
