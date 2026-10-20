<?php

namespace Database\Seeders;

use App\Models\AcademicYear;
use Illuminate\Database\Seeder;

class AcademicYearSeeder extends Seeder
{
    public function run(): void
    {
        // Create 2024-2025 academic year
        AcademicYear::create([
            'year_name' => '2024-2025',
            'start_date' => '2024-08-01',
            'end_date' => '2025-05-31',
            'is_active' => true,
            'is_archived' => false,
            'description' => 'Academic Year 2024-2025',
        ]);

        // Create 2025-2026 academic year
        AcademicYear::create([
            'year_name' => '2025-2026',
            'start_date' => '2025-08-01',
            'end_date' => '2026-05-31',
            'is_active' => false,
            'is_archived' => false,
            'description' => 'Academic Year 2025-2026',
        ]);

        // Create 2023-2024 academic year (archived)
        AcademicYear::create([
            'year_name' => '2023-2024',
            'start_date' => '2023-08-01',
            'end_date' => '2024-05-31',
            'is_active' => false,
            'is_archived' => true,
            'description' => 'Academic Year 2023-2024 (Archived)',
        ]);
    }
}
