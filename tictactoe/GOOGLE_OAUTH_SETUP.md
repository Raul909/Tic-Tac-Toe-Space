# Google OAuth Setup Guide

## 🔐 How to Get Google OAuth Credentials

### Step 1: Go to Google Cloud Console
1. Visit: https://console.cloud.google.com/
2. Sign in with your Google account

### Step 2: Create a New Project
1. Click on the project dropdown (top left)
2. Click "NEW PROJECT"
3. Name it: "Tic Tac Toe Game"
4. Click "CREATE"

### Step 3: Enable Google Sign-In API
1. In the left sidebar, go to "APIs & Services" → "Library"
2. Search for "Google+ API" or "Google Identity"
3. Click on it and click "ENABLE"

### Step 4: Create OAuth Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "CREATE CREDENTIALS" → "OAuth client ID"
3. If prompted, configure the OAuth consent screen:
   - Choose "External"
   - Fill in:
     - App name: "Tic Tac Toe Mission Control"
     - User support email: your email
     - Developer contact: your email
   - Click "SAVE AND CONTINUE"
   - Skip scopes (click "SAVE AND CONTINUE")
   - Add test users if needed
   - Click "SAVE AND CONTINUE"

4. Back to "Create OAuth client ID":
   - Application type: "Web application"
   - Name: "Tic Tac Toe Web Client"
   - Authorized JavaScript origins:
     - http://localhost:3000
     - https://your-render-app.onrender.com (your production URL)
   - Authorized redirect URIs:
     - http://localhost:3000
     - https://your-render-app.onrender.com
   - Click "CREATE"

5. **COPY YOUR CREDENTIALS:**
   - Client ID: `123456789-abcdefg.apps.googleusercontent.com`
   - Client Secret: `GOCSPX-xxxxxxxxxxxxx`

### Step 5: Add Credentials to Your App

#### For Local Development:
1. Open: `/var/home/raul/Documents/Tic Tac Toe/tictactoe/public/app.js`
2. Find line with: `client_id: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com'`
3. Replace with your actual Client ID:
   ```javascript
   client_id: '123456789-abcdefg.apps.googleusercontent.com'
   ```

#### For Production (Render):
1. Go to your Render dashboard
2. Select your web service
3. Go to "Environment" tab
4. Add environment variable:
   - Key: `GOOGLE_CLIENT_ID`
   - Value: Your Client ID
5. Click "Save Changes"

6. Update `app.js` to use environment variable:
   ```javascript
   client_id: window.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com'
   ```

7. In `server.js`, add before serving static files:
   ```javascript
   app.get('/config.js', (req, res) => {
     res.type('application/javascript');
     res.send(`window.GOOGLE_CLIENT_ID = '${process.env.GOOGLE_CLIENT_ID}';`);
   });
   ```

8. In `index.html`, add before other scripts:
   ```html
   <script src="/config.js"></script>
   ```

### Step 6: Test It
1. Restart your server: `node server.js`
2. Go to: http://localhost:3000
3. Click "Continue with Google"
4. Sign in with your Google account
5. You should be logged in!

## 🔒 Security Notes

- **Never commit** your Client Secret to Git
- Add to `.gitignore`: `.env`
- Use environment variables for production
- Client ID is safe to expose (it's in frontend)
- Client Secret should ONLY be on server (not used in this implementation)

## 📝 Current Implementation

The current setup uses **Google Sign-In for Web** which:
- ✅ Only needs Client ID (no secret needed)
- ✅ Verifies tokens server-side
- ✅ Works with file-based or MongoDB storage
- ✅ Creates user automatically on first login
- ✅ Uses email as unique identifier

## 🚀 Production Deployment

When deploying to Render:

1. Add your production URL to Google Console:
   - Go to Credentials → Edit OAuth client
   - Add: `https://your-app.onrender.com`

2. Set environment variable in Render:
   - `GOOGLE_CLIENT_ID=your-client-id`

3. Update `app.js` to read from config:
   ```javascript
   client_id: window.GOOGLE_CLIENT_ID || 'fallback-client-id'
   ```

## ✅ What Users See

1. Auth screen shows "Continue with Google" button
2. Click → Google popup opens
3. User selects Google account
4. Popup closes → User is logged in
5. Username is their Google name
6. Stats are tracked like normal users

## 🎮 Features

- ✅ One-click sign in
- ✅ No password to remember
- ✅ Secure Google authentication
- ✅ Automatic account creation
- ✅ Works with existing game features
- ✅ Stats tracked per Google account

## 📧 Support

If you have issues:
1. Check browser console for errors
2. Verify Client ID is correct
3. Ensure URLs match in Google Console
4. Check that Google Sign-In script loaded
5. Try in incognito mode

---

**Current Status:** ✅ Code is ready, just add your Client ID!
