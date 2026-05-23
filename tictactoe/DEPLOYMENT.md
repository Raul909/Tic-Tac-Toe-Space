# Tic-Tac-Toe Multiplayer - Render Deployment Guide

## Prerequisites
- GitHub account
- Render account (free tier)
- Git installed locally

## Step 1: Install Dependencies

```bash
cd "/var/home/raul/Documents/Tic Tac Toe/tictactoe"
npm install
```

## Step 2: Test Locally

```bash
npm start
```

Visit `http://localhost:3000` and test the game.

## Step 3: Initialize Git Repository

```bash
git init
git add .
git commit -m "Production-ready deployment"
```

## Step 4: Push to GitHub

```bash
# Create a new repository on GitHub
gh repo create tictactoe-multiplayer --public --source=. --remote=origin --push
```

Or manually:
1. Create a new repo at https://github.com/new
2. Run:
```bash
git remote add origin https://github.com/YOUR_USERNAME/tictactoe-multiplayer.git
git branch -M main
git push -u origin main
```

## Step 5: Deploy to Render

### Option A: Using Render Dashboard (Recommended)

1. Go to https://render.com and sign in
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `tictactoe-multiplayer`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`

5. Add Environment Variables:
   - `NODE_ENV` = `production`
   - `ALLOWED_ORIGINS` = `https://tictactoe-multiplayer.onrender.com` (use your actual URL)

6. Click **"Create Web Service"**

### Option B: Using render.yaml (Auto-deploy)

The `render.yaml` file is already configured. Render will auto-detect it.

1. Go to https://dashboard.render.com/select-repo
2. Select your repository
3. Render will use the `render.yaml` configuration
4. Add the `ALLOWED_ORIGINS` environment variable in the dashboard

## Step 6: Configure CORS

After deployment, update the environment variable:

1. Go to your service dashboard on Render
2. Navigate to **Environment** tab
3. Add/Update:
   - `ALLOWED_ORIGINS` = `https://your-app-name.onrender.com`

## Step 7: Test Your Deployment

1. Visit your Render URL (e.g., `https://tictactoe-multiplayer.onrender.com`)
2. Create an account (min 8 character password)
3. Test creating/joining rooms
4. Test AI mode

## Hybrid Deployment: Cloudflare Pages (Frontend) + Render (Backend)

For optimal, lag-free performance, it is highly recommended to host the static frontend on **Cloudflare Pages** and the Socket.io backend on **Render**. This leverages Cloudflare's ultra-fast global CDN for loading UI assets while keeping Render's persistent Node environment for game lobbies.

### Step 1: Deploy Backend to Render
1. Follow the **Deploy to Render** instructions above.
2. Once deployed, note down your Render Web Service URL (e.g., `https://tictactoe-multiplayer.onrender.com`).

### Step 2: Configure Backend CORS
1. Go to your Render Web Service Dashboard → **Environment**.
2. Set `ALLOWED_ORIGINS` = `https://your-project.pages.dev` (replace with your actual Cloudflare Pages URL once deployed).
3. If you want to test locally while connecting to the production backend, you can set `ALLOWED_ORIGINS` = `https://your-project.pages.dev,http://localhost:3000`.

### Step 3: Deploy Frontend to Cloudflare Pages
1. Sign in to your [Cloudflare Dashboard](https://dash.cloudflare.com/) and go to **Workers & Pages**.
2. Click **Create Application** → **Pages** → **Connect to Git**.
3. Select your GitHub repository.
4. Configure the build settings:
   - **Project Name**: `tictactoe-multiplayer` (this determines your `pages.dev` URL)
   - **Framework Preset**: `None` (Static HTML/JS app)
   - **Build Command**: Leave blank (no build step is needed for this static frontend)
   - **Build Output Directory**: `tictactoe/public` (points to the static public folder containing HTML, JS, and CSS)
5. Click **Save and Deploy**.

### Step 4: Verify Connection
1. Visit your Cloudflare Pages URL (e.g., `https://tictactoe-multiplayer.pages.dev`).
2. The frontend will dynamically connect to the Socket.io server running on Render.

## Important Notes

### Free Tier Limitations
- Service spins down after 15 minutes of inactivity
- First request after spin-down takes ~30 seconds
- 750 hours/month free (enough for one service)

### Data Persistence
- Current setup uses file storage (`data/users.json`)
- Files persist on Render's free tier
- For production, consider migrating to a database (MongoDB Atlas free tier)

### Security Features Implemented
✅ Rate limiting (5 auth attempts per 15 min)
✅ HttpOnly cookies (XSS protection)
✅ 8-character minimum passwords
✅ Input sanitization for chat
✅ CORS restricted to your domain
✅ Secure cookies in production

## Troubleshooting

### Build Fails
- Check Node version: Render uses Node 16+ (specified in package.json)
- Verify all dependencies are in package.json

### WebSocket Connection Issues
- Ensure CORS is configured with your Render URL
- Check browser console for errors
- Verify `withCredentials: true` in Socket.IO client

### Session Issues
- Clear browser cookies
- Check that cookies are being set (DevTools → Application → Cookies)
- Verify `secure: true` is only set in production

## Monitoring

View logs in Render dashboard:
1. Go to your service
2. Click **"Logs"** tab
3. Monitor for errors

## Updating Your App

```bash
git add .
git commit -m "Update description"
git push origin main
```

Render will automatically redeploy on push.

## Custom Domain (Optional)

1. In Render dashboard, go to **Settings** → **Custom Domain**
2. Add your domain
3. Update DNS records as instructed
4. Update `ALLOWED_ORIGINS` environment variable

## Next Steps for Production

- [ ] Migrate to MongoDB Atlas (free tier)
- [ ] Add email verification
- [ ] Implement password reset
- [ ] Add game history/statistics
- [ ] Set up monitoring (e.g., Sentry)
- [ ] Add automated backups
