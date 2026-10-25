<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Str;

class GoogleAuthController extends Controller
{
    /**
     * Redirect to Google OAuth
     */
    public function redirectToGoogle()
    {
        return Socialite::driver('google')->stateless()->redirect();
    }

    /**
     * Handle Google OAuth callback
     */
    public function handleGoogleCallback(Request $request)
    {
        try {
            $googleUser = Socialite::driver('google')->stateless()->user();

            // Check if user exists by Google ID
            $user = User::where('google_id', $googleUser->id)->first();

            if (!$user) {
                // Check if user exists by email
                $user = User::where('email', $googleUser->email)->first();

                if ($user) {
                    // Link existing account to Google
                    $user->update([
                        'google_id' => $googleUser->id,
                        'avatar' => $googleUser->avatar,
                    ]);

                    AuditLog::record('updated', "Linked Google account: {$user->email}", 'User', $user->id, $user->id, $request->ip());
                } else {
                    // Create new user
                    // Check if email domain is allowed (optional)
                    $emailDomain = substr(strrchr($googleUser->email, "@"), 1);
                    
                    // For student accounts, require specific domain
                    if (in_array($emailDomain, ['mindoro.edu.ph', 'minsu.edu.ph', 'gmail.com'])) {
                        $user = User::create([
                            'name' => $googleUser->name,
                            'email' => $googleUser->email,
                            'google_id' => $googleUser->id,
                            'avatar' => $googleUser->avatar,
                            'password' => Hash::make(Str::random(24)), // Random password for OAuth users
                            'role' => 'student', // Default role
                            'email_verified_at' => now(), // Google OAuth emails are verified
                        ]);

                        AuditLog::record('created', "New user registered via Google: {$user->email}", 'User', $user->id, $user->id, $request->ip());
                    } else {
                        return response()->json([
                            'error' => 'unauthorized_domain',
                            'message' => 'Only institutional email addresses are allowed.'
                        ], 403);
                    }
                }
            } else {
                // Update avatar if changed
                if ($user->avatar !== $googleUser->avatar) {
                    $user->update(['avatar' => $googleUser->avatar]);
                }
            }

            // Check if user is archived
            if ($user->archived) {
                return response()->json([
                    'error' => 'account_archived',
                    'message' => 'This account has been archived.'
                ], 403);
            }

            // Generate Sanctum token
            $token = $user->createToken('google-auth-token')->plainTextToken;

            // Return success with token and user data
            return response()->json([
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'profile_image' => $user->profile_image,
                    'avatar' => $user->avatar,
                    'usg_position' => $user->usg_position,
                ],
                'token' => $token,
                'message' => 'Successfully authenticated with Google'
            ]);

        } catch (\Exception $e) {
            \Log::error('Google OAuth Error: ' . $e->getMessage());
            
            return response()->json([
                'error' => 'oauth_failed',
                'message' => 'Failed to authenticate with Google. Please try again.'
            ], 500);
        }
    }

    /**
     * Handle Google OAuth for frontend (returns redirect URL)
     */
    public function getGoogleAuthUrl()
    {
        $url = Socialite::driver('google')
            ->stateless()
            ->redirect()
            ->getTargetUrl();

        return response()->json(['url' => $url]);
    }
}
