<?php

namespace App\Http\Controllers;

use App\Models\OfficerRegistration;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class OfficerRegistrationController extends Controller
{
    // Officer submits registration
    public function register(Request $request)
    {
        $validated = $request->validate([
            'full_name' => 'required|string|max:255',
            'student_id' => 'nullable|string|max:50',
            'email' => [
                'required',
                'email',
                'unique:users,email',
                'unique:officer_registrations,email',
                // Optional: Add school email domain validation
                // 'regex:/^[\w\-\.]+@(mindoro\.edu\.ph|msu\.edu\.ph)$/i'
            ],
            'usg_position' => 'required|string|max:255',
            'reason' => 'nullable|string|max:1000',
            'password' => 'required|string|min:8|confirmed',
        ]);

        // Create registration request
        $registration = OfficerRegistration::create([
            'full_name' => $validated['full_name'],
            'student_id' => $validated['student_id'],
            'email' => $validated['email'],
            'usg_position' => $validated['usg_position'],
            'reason' => $validated['reason'] ?? null,
            'password' => Hash::make($validated['password']),
            'email_verification_token' => Str::random(64),
            'status' => 'pending_verification',
        ]);

        // Send verification email
        $this->sendVerificationEmail($registration);

        return response()->json([
            'message' => 'Registration submitted successfully. Please check your email to verify your account.',
            'registration_id' => $registration->id,
        ], 201);
    }

    // Verify email with token
    public function verifyEmail(Request $request, $token)
    {
        $registration = OfficerRegistration::where('email_verification_token', $token)
            ->where('status', 'pending_verification')
            ->first();

        if (!$registration) {
            return response()->json(['message' => 'Invalid or expired verification link.'], 404);
        }

        $registration->update([
            'email_verified_at' => now(),
            'status' => 'pending_approval',
            'email_verification_token' => null,
        ]);

        return response()->json([
            'message' => 'Email verified successfully. Your registration is now pending admin approval.',
        ]);
    }

    // Resend verification email
    public function resendVerification(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
        ]);

        $registration = OfficerRegistration::where('email', $validated['email'])
            ->where('status', 'pending_verification')
            ->first();

        if (!$registration) {
            return response()->json(['message' => 'No pending registration found for this email.'], 404);
        }

        // Generate new token
        $registration->update([
            'email_verification_token' => Str::random(64),
        ]);

        $this->sendVerificationEmail($registration);

        return response()->json(['message' => 'Verification email resent successfully.']);
    }

    // Admin: Get all pending registrations
    public function getPendingRegistrations()
    {
        $registrations = OfficerRegistration::where('status', 'pending_approval')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($registrations);
    }

    // Admin: Get all registrations (with filters)
    public function getAllRegistrations(Request $request)
    {
        $query = OfficerRegistration::query()->with('reviewer');

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $registrations = $query->orderBy('created_at', 'desc')->get();

        return response()->json($registrations);
    }

    // Admin: Approve registration and create user account
    public function approve(Request $request, $id)
    {
        $validated = $request->validate([
            'role' => 'required|in:usg_officer,event_organizer,admin',
            'permissions' => 'nullable|array',
        ]);

        $registration = OfficerRegistration::findOrFail($id);

        if ($registration->status !== 'pending_approval') {
            return response()->json(['message' => 'This registration is not pending approval.'], 400);
        }

        // Create user account
        $user = User::create([
            'name' => $registration->full_name,
            'email' => $registration->email,
            'password' => $registration->password, // Already hashed
            'role' => $validated['role'],
            'permissions' => $validated['permissions'] ?? null,
            'usg_position' => $registration->usg_position,
            'email_verified_at' => now(), // Mark email as verified
        ]);

        // Update registration status
        $registration->update([
            'status' => 'approved',
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
            'permissions' => $validated['permissions'] ?? null,
        ]);

        // Send approval notification email
        $this->sendApprovalEmail($registration, $user);

        return response()->json([
            'message' => 'Registration approved successfully.',
            'user' => $user,
        ]);
    }

    // Admin: Reject registration
    public function reject(Request $request, $id)
    {
        $validated = $request->validate([
            'rejection_reason' => 'required|string|max:1000',
        ]);

        $registration = OfficerRegistration::findOrFail($id);

        if ($registration->status !== 'pending_approval') {
            return response()->json(['message' => 'This registration is not pending approval.'], 400);
        }

        $registration->update([
            'status' => 'rejected',
            'rejection_reason' => $validated['rejection_reason'],
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        // Send rejection notification email
        $this->sendRejectionEmail($registration);

        return response()->json(['message' => 'Registration rejected successfully.']);
    }

    // Helper: Send verification email
    private function sendVerificationEmail($registration)
    {
        $verificationUrl = config('app.frontend_url') . '/verify-email/' . $registration->email_verification_token;

        // TODO: Implement actual email sending
        // For now, log the verification URL
        \Log::info('Officer registration verification email', [
            'email' => $registration->email,
            'url' => $verificationUrl,
        ]);

        // Mail::to($registration->email)->send(new OfficerVerificationMail($registration, $verificationUrl));
    }

    // Helper: Send approval email
    private function sendApprovalEmail($registration, $user)
    {
        $loginUrl = config('app.frontend_url') . '/login';

        \Log::info('Officer registration approved', [
            'email' => $registration->email,
            'role' => $user->role,
        ]);

        // Mail::to($registration->email)->send(new OfficerApprovedMail($user, $loginUrl));
    }

    // Helper: Send rejection email
    private function sendRejectionEmail($registration)
    {
        \Log::info('Officer registration rejected', [
            'email' => $registration->email,
            'reason' => $registration->rejection_reason,
        ]);

        // Mail::to($registration->email)->send(new OfficerRejectedMail($registration));
    }
}
