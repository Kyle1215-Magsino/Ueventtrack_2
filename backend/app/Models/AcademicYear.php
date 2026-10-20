<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AcademicYear extends Model
{
    use HasFactory;

    protected $fillable = [
        'year_name',
        'start_date',
        'end_date',
        'is_active',
        'is_archived',
        'description',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'is_active' => 'boolean',
        'is_archived' => 'boolean',
    ];

    /**
     * Get all events for this academic year
     */
    public function events(): HasMany
    {
        return $this->hasMany(Event::class);
    }

    /**
     * Get all students for this academic year
     */
    public function students(): HasMany
    {
        return $this->hasMany(Student::class);
    }

    /**
     * Activate this academic year (and deactivate others)
     */
    public function activate(): void
    {
        // Deactivate all other academic years
        static::where('id', '!=', $this->id)->update(['is_active' => false]);
        
        // Activate this one
        $this->update(['is_active' => true]);
    }

    /**
     * Archive this academic year
     */
    public function archive(): void
    {
        $this->update([
            'is_archived' => true,
            'is_active' => false,
        ]);
    }

    /**
     * Get the active academic year
     */
    public static function active(): ?self
    {
        return static::where('is_active', true)->first();
    }

    /**
     * Scope to get only archived academic years
     */
    public function scopeArchived($query)
    {
        return $query->where('is_archived', true);
    }

    /**
     * Scope to get only non-archived academic years
     */
    public function scopeNotArchived($query)
    {
        return $query->where('is_archived', false);
    }
}
