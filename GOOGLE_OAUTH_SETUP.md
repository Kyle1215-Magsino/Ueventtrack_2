# Google OAuth Setup Guide for U-EventTrack

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a Project" → "New Project"
3. Name it: **U-EventTrack** (or any name you prefer)
4. Click "Create"

## Step 2: Enable Google+ API

1. In the Google Cloud Console, go to **APIs & Services** → **Library**
2. Search for "Google+ API"
3. Click on it and press **"Enable"**

## Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **External** (for testing) or **Internal** (if you have Google Workspace)
3. Click **Create**

### Fill in the form:
- **App name**: U-EventTrack
- **User support email**: Your email
- **App logo**: (Optional - upload your USG logo)
- **Application home page**: http://localhost:5173
- **Authorized domains**: 
  - `localhost` (for development)
  - Add your production domain later
- **Developer contact**: Your email
- Click **Save and Continue**

### Scopes:
- Click **Add or Remove Scopes**
- Select:
  - `../auth/userinfo.email`
  - `../auth/userinfo.profile`
  - `openid`
- Click **Update** → **Save and Continue**

### Test Users (if External):
- Add your test email addresses (e.g., kylemagsino12@gmail.com)
- Click **Save and Continue**

## Step 4: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Select **Application type**: **Web application**
4. Name it: **U-EventTrack Web Client**

### Authorized JavaScript origins:
```
http://localhost:5173
http://localhost:3000
http://localhost
```

### Authorized redirect URIs:
```
http://localhost:8000/api/auth/google/callback
http://localhost:5173/auth/google/callback
```

5. Click **Create**
6. **Copy the Client ID and Client Secret** - YOU NEED THESE!

## Step 5: Add Credentials to .env File

Open `backend/.env` and add these lines at the end:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/google/callback
```

**Replace:**
- `your-client-id-here` with your actual Client ID
- `your-client-secret-here` with your actual Client Secret

## Step 6: Update Frontend URL (if needed)

In `frontend/.env` (create if doesn't exist):

```env
VITE_API_URL=http://localhost:8000
```

## Step 7: Test the Integration

1. Restart your Laravel backend:
   ```bash
   cd backend
   php artisan serve
   ```

2. Restart your React frontend:
   ```bash
   cd frontend
   npm run dev
   ```

3. Click "Sign in with Google" button
4. Select your Google account
5. Allow permissions
6. You should be redirected back and logged in!

## Troubleshooting

### Error: "Access blocked: Authorization Error"
- Make sure you added your Google Client ID and Secret to `.env`
- Run `php artisan config:clear` to clear config cache
- Restart your Laravel server

### Error: "redirect_uri_mismatch"
- Check that the redirect URI in Google Console matches exactly:
  `http://localhost:8000/api/auth/google/callback`
- No trailing slashes!

### Error: "invalid_client"
- Your Client ID or Client Secret is wrong
- Double-check the values in `.env`

### Error: "unauthorized_domain"
- Only institutional emails are allowed
- Check the email domain validation in `GoogleAuthController.php`
- Current allowed domains: `mindoro.edu.ph`, `minsu.edu.ph`, `gmail.com`

## For Production

When deploying to production:

1. Update Authorized JavaScript origins:
   ```
   https://yourdomain.com
   ```

2. Update Authorized redirect URIs:
   ```
   https://yourdomain.com/api/auth/google/callback
   https://yourdomain.com/auth/google/callback
   ```

3. Update `.env` variables:
   ```env
   APP_URL=https://yourdomain.com
   GOOGLE_REDIRECT_URI=https://yourdomain.com/api/auth/google/callback
   ```

4. Change OAuth consent screen to **In Production** status

## Security Notes

- ⚠️ Never commit `.env` file to git
- ⚠️ Keep your Client Secret private
- ⚠️ Use environment variables for credentials
- ✅ Enable 2FA on your Google Cloud account
- ✅ Regularly review OAuth consent scopes
