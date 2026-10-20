<?php

namespace App\Http\Controllers;

use App\Http\Requests\StudentRequest;
use App\Models\AuditLog;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class StudentController extends Controller
{
    public function index(): JsonResponse
    {
        $students = Cache::remember('students_active', 300, function () {
            return Student::where('archived', false)
                ->orderBy('last_name')
                ->get()
                ->toArray();
        });

        return response()->json($students);
    }

    public function store(StudentRequest $request): JsonResponse
    {
        $data = $request->validated();
        
        // Auto-generate barcode with format: MBC2023-{student_id}
        $data['barcode'] = 'MBC2023-' . $data['student_id'];
        
        $student = Student::create($data);

        // Clear cache
        Cache::forget('students_active');

        AuditLog::record('created', "Added student: {$student->first_name} {$student->last_name}", 'Student', $student->id, $request->user()?->id, $request->ip());

        return response()->json(['student' => $student, 'message' => 'Student created.'], 201);
    }

    public function show(int $id): JsonResponse
    {
        $student = Student::with(['attendances.event'])->findOrFail($id);

        return response()->json($student);
    }

    public function update(StudentRequest $request, int $id): JsonResponse
    {
        $student = Student::findOrFail($id);
        $data = $request->validated();
        
        // Auto-generate barcode with format: MBC2023-{student_id}
        $data['barcode'] = 'MBC2023-' . $data['student_id'];
        
        $student->update($data);

        // Clear cache
        Cache::forget('students_active');

        AuditLog::record('updated', "Updated student: {$student->first_name} {$student->last_name}", 'Student', $student->id, $request->user()?->id, $request->ip());

        return response()->json(['student' => $student, 'message' => 'Student updated.']);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $student = Student::findOrFail($id);
        $student->update(['archived' => true]);

        // Clear cache
        Cache::forget('students_active');

        AuditLog::record('deleted', "Archived student: {$student->first_name} {$student->last_name}", 'Student', $student->id, $request->user()?->id, $request->ip());

        return response()->json(['message' => 'Student archived.']);
    }

    public function archived(): JsonResponse
    {
        $students = Student::where('archived', true)
            ->orderBy('last_name')
            ->get();

        return response()->json($students);
    }

    public function restore(Request $request, int $id): JsonResponse
    {
        $student = Student::findOrFail($id);
        $student->update(['archived' => false, 'status' => 'active']);

        // Clear cache
        Cache::forget('students_active');

        AuditLog::record('restored', "Restored student: {$student->first_name} {$student->last_name}", 'Student', $student->id, $request->user()?->id, $request->ip());

        return response()->json(['message' => 'Student restored.']);
    }

    public function search(Request $request): JsonResponse
    {
        $q = $request->query('q', '');

        $students = Student::where('archived', false)
            ->where(function ($query) use ($q) {
                $query->where('student_id', 'like', "%{$q}%")
                    ->orWhere('first_name', 'like', "%{$q}%")
                    ->orWhere('last_name', 'like', "%{$q}%");
            })
            ->orderBy('last_name')
            ->get();

        return response()->json($students);
    }

    public function saveFaceData(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'face_data' => 'nullable|string',
        ]);

        $student = Student::findOrFail($id);
        $student->update([
            'face_data'        => $request->face_data,
            'face_enrolled_at' => $request->face_data ? now() : null,
        ]);

        return response()->json(['message' => 'Face data saved.', 'face_enrolled_at' => $student->fresh()->face_enrolled_at]);
    }

    public function getFaceData(): JsonResponse
    {
        $students = Student::active()
            ->whereNotNull('face_data')
            ->where('face_data', '!=', '')
            ->select(['id', 'student_id', 'first_name', 'last_name', 'face_data', 'face_enrolled_at'])
            ->get();

        return response()->json($students);
    }

    public function checkBarcodeUniqueness(Request $request): JsonResponse
    {
        $request->validate([
            'barcode' => 'required|string',
            'exclude_student_id' => 'nullable|integer',
        ]);

        $query = Student::where('barcode', $request->barcode);
        
        if ($request->exclude_student_id) {
            $query->where('id', '!=', $request->exclude_student_id);
        }

        $existingStudent = $query->first();

        if ($existingStudent) {
            return response()->json([
                'available' => false,
                'message' => 'This barcode is already assigned to another student.',
                'student' => [
                    'student_id' => $existingStudent->student_id,
                    'name' => $existingStudent->first_name . ' ' . $existingStudent->last_name,
                    'course' => $existingStudent->course,
                ]
            ], 200);
        }

        return response()->json([
            'available' => true,
            'message' => 'Barcode is available.',
        ], 200);
    }

    public function regenerateBarcode(Request $request, int $id): JsonResponse
    {
        $student = Student::findOrFail($id);
        
        // Generate a unique barcode
        do {
            $barcode = 'MBC2023-' . $student->student_id . '-' . strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, 4));
        } while (Student::where('barcode', $barcode)->exists());

        $student->update(['barcode' => $barcode]);

        AuditLog::record('updated', "Regenerated barcode for student: {$student->first_name} {$student->last_name}", 'Student', $student->id, $request->user()?->id, $request->ip());

        \Log::info('Barcode regenerated', [
            'student_id' => $student->student_id,
            'student_name' => $student->first_name . ' ' . $student->last_name,
            'new_barcode' => $barcode,
        ]);

        return response()->json([
            'message' => 'Barcode regenerated successfully.',
            'barcode' => $barcode,
            'student' => $student->fresh(),
        ], 200);
    }
}
