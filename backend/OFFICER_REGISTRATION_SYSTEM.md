# USG Officer Registration System

## Overview
This system implements a secure officer registration process with email verification and admin approval to prevent unauthorized access to officer accounts.

## System Flow

### 1. Officer Registration
**Route:** `POST /api/officer/register` (Public)

Officers submit their registration with:
- Full name
- Student ID (optional)
- Official school email
- USG position
- Reason for access (optional)
- Password

**Process:**
1. System validates email is unique
2. Creates registration record with status `pending_verification`
3. Generates email verification token
4. Sends verification email to officer
5. Returns success message

### 2. Email Verification
**Route:** `GET /api/officer/verify-email/{token}` (Public)

When officer clicks verification link:
1. System finds registration by token
2. Updates `email_verified_at` timestamp
3. Changes status to `pending_approval`
4. Clears verification token
5. Returns success message

**Resend Verification:**
**Route:** `POST /api/officer/resend-verification` (Public)
- Officer can request new verification email
- System generates new token
- Sends fresh verification email

### 3. Admin Review & Approval
**Routes:**
- `GET /api/officer-registrations` (Admin only) - Get all registrations
- `GET /api/officer-registrations/pending` (Admin only) - Get pending approvals
- `POST /api/officer-registrations/{id}/approve` (Admin only) - Approve registration
- `POST /api/officer-registrations/{id}/reject` (Admin only) - Reject registration

**Approval Process:**
1. Admin reviews registration details
2. Assigns role: `usg_officer`, `event_organizer`, or `admin`
3. Optionally assigns specific permissions
4. System creates User account
5. Marks registration as `approved`
6. Sends approval notification email

**Rejection Process:**
1. Admin provides rejection reason
2. System marks registration as `rejected`
3. Sends rejection notification email

### 4. Officer Login
**Route:** `POST /api/login` (Public)

After approval, officer can login with:
- Email (verified during registration)
- Password (set during registration)

## Database Schema

### officer_registrations Table
```sql
- id (bigint, primary key)
- full_name (string)
- student_id (string, nullable)
- email (string, unique)
- usg_position (string)
- reason (text, nullable)
- password (string, hashed)
- email_verification_token (string, nullable)
- email_verified_at (timestamp, nullable)
- status (enum: pending_verification, pending_approval, approved, rejected)
- rejection_reason (text, nullable)
- reviewed_by (foreign key to users)
- reviewed_at (timestamp, nullable)
- permissions (json, nullable)
- created_at (timestamp)
- updated_at (timestamp)
```

### users Table (Updated)
```sql
- ... existing fields ...
- permissions (json, nullable) - Officer-specific permissions
- usg_position (string, nullable) - USG position title
```

## Security Features

### 1. Email Verification
- Confirms officer controls the email address
- Uses secure random token (64 characters)
- Token is cleared after verification
- Prevents registration with fake/uncontrolled emails

### 2. Admin Approval
- Human review of each registration
- Verification of officer legitimacy
- Ability to reject suspicious requests
- Rejection reason tracked for transparency

### 3. Role-Based Permissions
- Admin assigns appropriate role on approval
- Permissions can be customized per officer
- Fine-grained access control

### 4. Password Security
- Minimum 8 characters required
- Password confirmation during registration
- Hashed using bcrypt (Laravel default)
- No password reset needed post-approval

## Role Permissions

### USG Officer
- View events
- Monitor assigned event attendance
- Generate reports for assigned events
- Cannot create/delete events (unless authorized)
- Cannot manage student accounts (unless authorized)
- Cannot assign admin role

### Event Organizer
- Create and manage events
- Monitor live attendance for their events
- Generate event reports
- Manage event announcements
- Cannot manage student accounts
- Cannot assign roles

### Admin
- Full system access
- Create/manage all events
- Manage student accounts
- Approve/reject officer registrations
- Assign roles and permissions
- View audit logs
- System configuration

## Frontend Components

### OfficerRegisterPage.jsx
- Public registration form
- School email validation
- Password strength requirements
- USG position selection
- Reason for access field

### OfficerRegisterSuccessPage.jsx
- Success message after registration
- Instructions for email verification
- Next steps outline

### OfficerRegistrationsPage.jsx (Admin)
- View all registrations
- Filter by status (pending, approved, rejected)
- Approve registrations with role assignment
- Reject registrations with reason
- View registration details

## API Endpoints

### Public Endpoints
```
POST /api/officer/register
GET  /api/officer/verify-email/{token}
POST /api/officer/resend-verification
POST /api/login
```

### Admin Endpoints
```
GET  /api/officer-registrations
GET  /api/officer-registrations/pending
POST /api/officer-registrations/{id}/approve
POST /api/officer-registrations/{id}/reject
```

## Email Templates (To Implement)

### 1. Verification Email
- Subject: "Verify Your USG Officer Account - U-EventTrack"
- Content: Verification link, instructions
- Call-to-action: "Verify Email Address" button

### 2. Approval Email
- Subject: "Your USG Officer Account is Activated - U-EventTrack"
- Content: Account approved, login instructions
- Call-to-action: "Sign In Now" button

### 3. Rejection Email
- Subject: "USG Officer Registration Update - U-EventTrack"
- Content: Registration rejected, reason, contact info
- Call-to-action: "Contact Administrator" button

## Configuration

### .env Variables
```
# Frontend URL for email links
APP_FRONTEND_URL=http://localhost:5173

# Email configuration
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=your_username
MAIL_PASSWORD=your_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@u-eventtrack.edu.ph
MAIL_FROM_NAME="U-EventTrack"
```

## Testing the System

### 1. Register as Officer
```bash
curl -X POST http://localhost:8000/api/officer/register \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Juan Dela Cruz",
    "student_id": "2023-001",
    "email": "juan.delacruz@mindoro.edu.ph",
    "usg_position": "President",
    "reason": "USG President for Academic Year 2023-2024",
    "password": "SecurePass123",
    "password_confirmation": "SecurePass123"
  }'
```

### 2. Check Logs for Verification URL
```bash
tail -f storage/logs/laravel.log | grep "Officer registration verification email"
```

### 3. Verify Email
Visit the URL from logs or:
```bash
curl http://localhost:8000/api/officer/verify-email/{token}
```

### 4. Admin Approves Registration
Login as admin, navigate to Officer Registrations page, approve the request.

### 5. Officer Logs In
Use email and password from registration to login.

## Advantages of This System

1. **Security**: Email verification + admin approval = two-factor authentication
2. **Accountability**: All registrations tracked with reviewer and timestamp
3. **Flexibility**: Admin can assign appropriate roles and permissions
4. **Transparency**: Rejection reasons documented
5. **User-Friendly**: Simple registration form, clear status updates
6. **Scalable**: Easy to add more roles or permissions
7. **Audit Trail**: Complete history of who approved/rejected requests

## Future Enhancements

1. Email notifications (currently using logs)
2. Batch approval/rejection
3. Registration expiration (auto-reject after X days)
4. Admin notes/comments on registrations
5. Officer profile images during registration
6. SMS verification as backup
7. Integration with school directory API
8. Automatic role assignment based on position
9. Permission templates for common roles
10. Registration analytics dashboard
