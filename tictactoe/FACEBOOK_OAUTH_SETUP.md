# Facebook OAuth Setup Guide

## 🔐 How to Get Facebook App ID

### Step 1: Go to Facebook Developers
1. Visit: https://developers.facebook.com/
2. Click "My Apps" (top right)
3. Click "Create App"

### Step 2: Create App
1. Choose "Consumer" as app type
2. Click "Next"
3. Fill in:
   - App Name: "Tic Tac Toe Mission Control"
   - App Contact Email: your email
4. Click "Create App"

### Step 3: Add Facebook Login
1. In your app dashboard, find "Facebook Login"
2. Click "Set Up"
3. Choose "Web" platform
4. Enter your Site URL:
   - Development: `http://localhost:3000`
   - Production: `https://your-app.onrender.com`
5. Click "Save" and "Continue"

### Step 4: Configure OAuth Settings
1. Go to "Facebook Login" → "Settings" (left sidebar)
2. Add Valid OAuth Redirect URIs:
   - `http://localhost:3000`
   - `https://your-app.onrender.com`
3. Enable "Login with the JavaScript SDK"
4. Click "Save Changes"

### Step 5: Get Your App ID
1. Go to "Settings" → "Basic" (left sidebar)
2. Copy your **App ID** (looks like: `1234567890123456`)
3. Copy your **App Secret** (click "Show" button)

### Step 6: Add App ID to Your Code

#### For Local Development:
1. Open: `public/app.js`
2. Find line with: `appId: 'YOUR_FACEBOOK_APP_ID'`
3. Replace with your actual App ID:
   ```javascript
   appId: '1234567890123456'
   ```

#### For Production (Render):
1. Go to Render dashboard
2. Select your web service
3. Go to "Environment" tab
4. Add environment variable:
   - Key: `FACEBOOK_APP_ID`
   - Value: Your App ID
5. Click "Save Changes"

6. Update `app.js` to use environment variable:
   ```javascript
   appId: window.FACEBOOK_APP_ID || 'YOUR_FACEBOOK_APP_ID'
   ```

### Step 7: Make App Public (Important!)
1. In Facebook App Dashboard, go to "Settings" → "Basic"
2. Scroll down to "App Mode"
3. Toggle from "Development" to "Live"
4. You may need to:
   - Add Privacy Policy URL
   - Add Terms of Service URL
   - Complete App Review (for public apps)

**For Testing:** Keep in "Development" mode and add test users:
1. Go to "Roles" → "Test Users"
2. Click "Add" to create test accounts
3. Use these to test Facebook login

### Step 8: Test It
1. Restart your server: `node server.js`
2. Go to: http://localhost:3000
3. Click "Continue with Facebook"
4. Log in with Facebook
5. You should be logged in!

## 📝 Current Implementation

The setup uses **Facebook Login for Web** which:
- ✅ Only needs App ID (frontend)
- ✅ Verifies tokens server-side
- ✅ Gets user name and email
- ✅ Creates user automatically
- ✅ Works with file-based or MongoDB storage

## 🔒 Security Notes

- **Never commit** App Secret to Git
- App ID is safe to expose (it's in frontend)
- App Secret should ONLY be on server (not used in this implementation)
- Use environment variables for production

## 🚀 Production Deployment

When deploying to Render:

1. **Add Production URL to Facebook:**
   - Go to Facebook App → Settings → Basic
   - Add App Domains: `your-app.onrender.com`
   - Go to Facebook Login → Settings
   - Add Valid OAuth Redirect URI: `https://your-app.onrender.com`

2. **Set Environment Variable in Render:**
   - `FACEBOOK_APP_ID=your-app-id`

3. **Update app.js:**
   ```javascript
   appId: window.FACEBOOK_APP_ID || 'fallback-app-id'
   ```

## ✅ What Users See

1. Auth screen shows "Continue with Facebook" button
2. Click → Facebook popup opens
3. User logs in with Facebook
4. Popup closes → User is logged in
5. Username is their Facebook name
6. Stats tracked like normal users

## 🎮 Permissions Requested

- `public_profile` - Get user's name
- `email` - Get user's email (optional)

## 📧 Troubleshooting

**"App Not Set Up" Error:**
- Make sure Facebook Login is added to your app
- Check that your domain is in App Domains
- Verify OAuth Redirect URIs are correct

**"This app is in development mode":**
- Add yourself as a test user, OR
- Make the app public (requires privacy policy)

**SDK Not Loading:**
- Check browser console for errors
- Verify App ID is correct
- Try in incognito mode

## 🆚 Google vs Facebook Login

| Feature | Google | Facebook |
|---------|--------|----------|
| Setup Complexity | Easy | Medium |
| Requires Review | No | Yes (for public) |
| Email Always Available | Yes | Sometimes |
| User Trust | High | Medium |
| Mobile Support | Excellent | Excellent |

## 📋 Quick Reference

**Files to Edit:**
- `public/app.js` - Add App ID (line ~15)
- `server.js` - Already configured ✅

**URLs Needed:**
- Development: `http://localhost:3000`
- Production: `https://your-app.onrender.com`

**Facebook Dashboard:**
- https://developers.facebook.com/apps/

---

**Current Status:** ✅ Code is ready, just add your App ID!
