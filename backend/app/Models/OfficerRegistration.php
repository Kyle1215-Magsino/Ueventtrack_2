<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OfficerRegistration extends Model
{
    use HasFactory;

    protected $fillable = [
        'full_name',
        'student_id',
        'email',
        'usg_position',
        'reason',
        'password',
        'email_verification_token',
        'email_verified_at',
        'status',
        'rejection_reason',
        'reviewed_by',
        'reviewed_at',
        'permissions',
    ];

    protected $hidden = [
        'password',
        'email_verification_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'reviewed_at' => 'datetime',
        'permissions' => 'array',
    ];

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function isEmailVerified()
    {
        return !is_null($this->email_verified_at);
    }

    public function isPendingApproval()
    {
        return $this->status === 'pending_approval';
    }

    public function isApproved()
    {
        return $this->status === 'approved';
    }

    public function isRejected()
    {
        return $this->status === 'rejected';
    }
}
