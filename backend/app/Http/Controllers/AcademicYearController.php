<?php

namespace App\Http\Controllers;

use App\Models\AcademicYear;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AcademicYearController extends Controller
{
    /**
     * Get all academic years
     */
    public function index(Request $request)
    {
        $query = AcademicYear::query();

        // Filter by archived status
        if ($request->has('archived')) {
            if ($request->archived == 'true') {
                $query->archived();
            } else {
                $query->notArchived();
            }
        }

        $academicYears = $query->orderBy('start_date', 'desc')->get();

        return response()->json($academicYears);
    }

    /**
     * Get the active academic year
     */
    public function active()
    {
        $activeYear = AcademicYear::active();

        if (!$activeYear) {
            return response()->json([
                'message' => 'No active academic year found'
            ], 404);
        }

        return response()->json($activeYear);
    }

    /**
     * Store a new academic year
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'year_name' => 'required|string|unique:academic_years,year_name',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $academicYear = AcademicYear::create($request->all());

        // If this is set as active, activate it
        if ($request->is_active) {
            $academicYear->activate();
        }

        return response()->json([
            'message' => 'Academic year created successfully',
            'data' => $academicYear
        ], 201);
    }

    /**
     * Get a specific academic year
     */
    public function show($id)
    {
        $academicYear = AcademicYear::with(['events', 'students'])->findOrFail($id);
        
        return response()->json($academicYear);
    }

    /**
     * Update an academic year
     */
    public function update(Request $request, $id)
    {
        $academicYear = AcademicYear::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'year_name' => 'sometimes|string|unique:academic_years,year_name,' . $id,
            'start_date' => 'sometimes|date',
            'end_date' => 'sometimes|date|after:start_date',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $academicYear->update($request->all());

        return response()->json([
            'message' => 'Academic year updated successfully',
            'data' => $academicYear
        ]);
    }

    /**
     * Activate an academic year
     */
    public function activate($id)
    {
        $academicYear = AcademicYear::findOrFail($id);
        
        // Cannot activate an archived year
        if ($academicYear->is_archived) {
            return response()->json([
                'message' => 'Cannot activate an archived academic year'
            ], 400);
        }

        $academicYear->activate();

        return response()->json([
            'message' => 'Academic year activated successfully',
            'data' => $academicYear->fresh()
        ]);
    }

    /**
     * Archive an academic year
     */
    public function archive($id)
    {
        $academicYear = AcademicYear::findOrFail($id);
        
        $academicYear->archive();

        return response()->json([
            'message' => 'Academic year archived successfully',
            'data' => $academicYear->fresh()
        ]);
    }

    /**
     * Delete an academic year
     */
    public function destroy($id)
    {
        $academicYear = AcademicYear::findOrFail($id);
        
        // Check if it has related data
        if ($academicYear->events()->count() > 0 || $academicYear->students()->count() > 0) {
            return response()->json([
                'message' => 'Cannot delete academic year with existing events or students. Archive it instead.'
            ], 400);
        }

        $academicYear->delete();

        return response()->json([
            'message' => 'Academic year deleted successfully'
        ]);
    }
}
