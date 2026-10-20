# Feature 7: One Barcode :: One Student

## Overview
This feature ensures strict barcode uniqueness across the system. Each student is assigned a **unique barcode** that cannot be duplicated or shared, preventing attendance fraud and maintaining data integrity.

## Key Principles

### 1. **Unique Barcode Constraint**
- Database-level unique constraint on `students.barcode` column
- No two students can have the same barcode
- Enforced at both application and database level

### 2. **One Check-in Per Event**
- Each student can only check in **once per event**
- Duplicate check-in attempts are blocked with detailed error messages
- Original check-in time and status are preserved

### 3. **Audit Logging**
- All check-in attempts (successful and failed) are logged
- Duplicate attempts are tracked for security monitoring
- Barcode regeneration events are recorded

## Implementation Details

### Database Schema
```sql
-- Unique constraint on barcode column
ALTER TABLE students ADD UNIQUE INDEX students_barcode_unique (barcode);
ALTER TABLE students ADD INDEX students_student_id_index (student_id);
```

### Barcode Format
```
MBC2023-{STUDENT_ID}
Example: MBC2023-2023-0001
```

For regenerated barcodes:
```
MBC2023-{STUDENT_ID}-{RANDOM_HASH}
Example: MBC2023-2023-0001-A4F2
```

## API Endpoints

### 1. Check Barcode Uniqueness
**POST** `/api/students/check-barcode`

Check if a barcode is already assigned to another student.

**Request:**
```json
{
  "barcode": "MBC2023-2023-0001",
  "exclude_student_id": 5  // optional: when updating existing student
}
```

**Response (Available):**
```json
{
  "available": true,
  "message": "Barcode is available."
}
```

**Response (Already Assigned):**
```json
{
  "available": false,
  "message": "This barcode is already assigned to another student.",
  "student": {
    "student_id": "2023-0001",
    "name": "Juan Dela Cruz",
    "course": "BSIT"
  }
}
```

### 2. Regenerate Barcode
**POST** `/api/students/{id}/regenerate-barcode`

Generate a new unique barcode for a student (e.g., if barcode is damaged or lost).

**Response:**
```json
{
  "message": "Barcode regenerated successfully.",
  "barcode": "MBC2023-2023-0001-A4F2",
  "student": {
    "id": 1,
    "student_id": "2023-0001",
    "first_name": "Juan",
    "last_name": "Dela Cruz",
    "barcode": "MBC2023-2023-0001-A4F2",
    ...
  }
}
```

### 3. Check-in Process
**POST** `/api/checkin`

Process student check-in with barcode validation.

**Request:**
```json
{
  "student_identifier": "MBC2023-2023-0001",  // can be student_id, barcode, or email
  "event_id": 5,
  "verification_method": "barcode",           // barcode, facial, or manual
  "location_lat": 12.34567,                   // optional
  "location_lng": 123.45678                   // optional
}
```

**Response (Success):**
```json
{
  "attendance": {
    "id": 123,
    "student_id": 1,
    "event_id": 5,
    "check_in_time": "2026-10-20T15:30:00.000000Z",
    "status": "present",
    "verification_method": "barcode",
    ...
  },
  "message": "Check-in successful.",
  "status": "present",
  "student_name": "Juan Dela Cruz",
  "student_id": "2023-0001",
  "course": "BSIT",
  "year_level": 3
}
```

**Response (Duplicate Check-in):**
```json
{
  "message": "You have already checked in for this event.",
  "error": "ALREADY_CHECKED_IN",
  "details": {
    "student_name": "Juan Dela Cruz",
    "event_name": "Campus Leadership Summit",
    "original_checkin_time": "Oct 20, 2026 03:15 PM",
    "status": "present"
  }
}
```

**Response (Student Not Found):**
```json
{
  "message": "Student not found. Please verify your ID or barcode.",
  "error": "STUDENT_NOT_FOUND"
}
```

**Response (Inactive Student):**
```json
{
  "message": "Student account is inactive. Please contact the administrator.",
  "error": "STUDENT_INACTIVE"
}
```

## Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `STUDENT_NOT_FOUND` | Student identifier doesn't match any record | 404 |
| `STUDENT_INACTIVE` | Student account is marked as inactive | 422 |
| `ALREADY_CHECKED_IN` | Student has already checked in for this event | 422 |
| `BARCODE_DUPLICATE` | Barcode is already assigned to another student | 422 |

## Security Features

### 1. Duplicate Prevention
- Database unique constraint prevents barcode duplication
- Application-level validation with detailed error messages
- Check-in deduplication at the event level

### 2. Audit Trail
All check-in operations are logged with:
- Student information (ID, name)
- Event details (ID, name)
- Timestamp
- Verification method
- Success/failure status
- Error reason (for failed attempts)

**Log Examples:**
```
[INFO] Check-in successful
{
  "student_id": "2023-0001",
  "student_name": "Juan Dela Cruz",
  "event_id": 5,
  "event_name": "Campus Leadership Summit",
  "status": "present",
  "verification_method": "barcode",
  "location_verified": true
}

[INFO] Check-in blocked: Duplicate attempt
{
  "student_id": "2023-0001",
  "student_name": "Juan Dela Cruz",
  "event_id": 5,
  "event_name": "Campus Leadership Summit",
  "original_checkin": "2026-10-20 15:15:00",
  "verification_method": "barcode"
}
```

### 3. Barcode Regeneration
- Only authorized officers/admins can regenerate barcodes
- New barcode is guaranteed to be unique
- Action is logged in audit trail
- Student receives new barcode immediately

## Validation Rules

### Student Creation/Update
```php
[
    'student_id' => 'required|string|max:255|unique:students,student_id',
    'barcode' => 'nullable|string|max:255|unique:students,barcode',
    'email' => 'required|email|max:255|unique:students,email',
    // ... other fields
]
```

### Barcode Uniqueness Check
```php
[
    'barcode' => 'required|string',
    'exclude_student_id' => 'nullable|integer',
]
```

## User Experience

### For Students
1. **Scan Barcode**: Student scans their unique barcode at event
2. **Instant Feedback**: System immediately confirms check-in or shows error
3. **Clear Messages**: If already checked in, shows original check-in time
4. **No Re-scanning**: Cannot check in twice for same event

### For Officers/Admins
1. **Barcode Validation**: System prevents duplicate barcode assignment
2. **Real-time Monitoring**: View all check-in attempts in audit logs
3. **Barcode Management**: Can regenerate barcodes if needed
4. **Security Alerts**: Duplicate attempt logs help identify potential fraud

## Testing

### Test Scenarios

1. **Unique Barcode Creation**
   - Create student with barcode → Success
   - Try to create another student with same barcode → Error

2. **Check-in Once Per Event**
   - Check in with barcode → Success
   - Try to check in again → Error with details
   - Check in to different event → Success

3. **Barcode Lookup**
   - Check in with student_id → Success
   - Check in with barcode → Success
   - Check in with email → Success

4. **Barcode Regeneration**
   - Regenerate barcode → New unique barcode created
   - Old barcode no longer works
   - New barcode works immediately

### Manual Testing
```bash
# Test 1: Check barcode uniqueness
curl -X POST http://localhost:8000/api/students/check-barcode \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{"barcode": "MBC2023-2023-0001"}'

# Test 2: Check in with barcode
curl -X POST http://localhost:8000/api/checkin \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "student_identifier": "MBC2023-2023-0001",
    "event_id": 1,
    "verification_method": "barcode"
  }'

# Test 3: Try duplicate check-in (should fail)
curl -X POST http://localhost:8000/api/checkin \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "student_identifier": "MBC2023-2023-0001",
    "event_id": 1,
    "verification_method": "barcode"
  }'

# Test 4: Regenerate barcode
curl -X POST http://localhost:8000/api/students/1/regenerate-barcode \
  -H "Authorization: Bearer {token}"
```

## Benefits

1. **Data Integrity**: Unique barcode constraint ensures one student = one barcode
2. **Fraud Prevention**: Cannot share or duplicate barcodes
3. **Accurate Attendance**: One check-in per event prevents double-counting
4. **Audit Trail**: Complete log of all check-in attempts
5. **Easy Management**: Officers can regenerate barcodes when needed
6. **Clear Feedback**: Users receive immediate, clear error messages

## Future Enhancements

1. **QR Code Generation**: Generate printable QR codes with embedded barcode data
2. **Barcode Expiry**: Add expiration dates for barcodes (e.g., per academic year)
3. **Barcode History**: Track all previous barcodes assigned to a student
4. **Batch Barcode Generation**: Generate unique barcodes for multiple students at once
5. **Barcode Analytics**: Report on barcode usage patterns and fraud attempts
