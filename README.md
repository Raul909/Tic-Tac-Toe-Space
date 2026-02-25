# 🎮 Tic Tac Toe - Mission Control

<div align="center">

**A stunning real-time multiplayer Tic Tac Toe game with 3D space visuals and NASA-inspired UI**

[![Live Demo](https://img.shields.io/badge/demo-live-success?style=for-the-badge)](https://tictactoe-multiplayer-kx9u.onrender.com/)
[![Node.js](https://img.shields.io/badge/node-%3E%3D16-brightgreen?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![Three.js](https://img.shields.io/badge/Three.js-3D-blue?style=for-the-badge)](https://threejs.org/)

[🚀 Live Demo](https://tictactoe-multiplayer-kx9u.onrender.com/)

</div>

---

## 📸 Screenshots

> **Note**: Screenshots are placeholders. To add real screenshots:
> 1. Visit https://tictactoe-multiplayer-kx9u.onrender.com/
> 2. Take screenshots using your OS screenshot tool
> 3. Save them in a `screenshots/` folder
> 4. Replace the placeholder URLs below with: `screenshots/filename.png`

### Authentication & 3D Background
![Login Screen](https://via.placeholder.com/800x500/000510/00d4ff?text=Login+Screen+with+3D+Space+Background)

### Gameplay
![Game Board](https://via.placeholder.com/800x500/000510/00d4ff?text=Game+Board+with+Real-time+Multiplayer)

### Victory Screen
![Victory](https://via.placeholder.com/800x500/000510/00d4ff?text=Victory+Screen+with+Social+Sharing)

### 3D Space Explorer
![Space Explorer](https://via.placeholder.com/800x500/000510/00d4ff?text=3D+Space+Explorer+with+Orbital+Controls)

---

## ✨ Features

### 🎮 Game Modes
- **Online Multiplayer** - Play with friends using 4-character room codes
- **AI Opponent** - Challenge an unbeatable minimax AI
- **Live Chat** - Real-time chat during multiplayer games
- **Rematch System** - Quick rematch with symbol swapping

### 🔐 Authentication
- Username/Password login
- Google OAuth
- Facebook OAuth
- Persistent stats (wins, losses, draws)

### 🌌 3D Space Experience
- **20,000+ Stars** with realistic colors
- **Complete Solar System** - All 8 planets + Moon
- **Cinematic Lighting** - Three-point lighting system
- **Real-Time Weather** - Rain, snow, clouds based on your location
- **Interactive Cursor** - Particle trail effects
- **Shooting Stars** - Realistic meteor trails

### 🌠 3D Space Explorer
- **Full 3D Controls** - Drag to rotate, scroll to zoom
- **Solar System** - All planets with realistic orbits
- **Nearby Stars** - 8 closest stars with data
- **Nebulae** - 6 famous nebulae as particle clouds
- **Your Location** - Earth reference point
- **Weather Sync** - Real-time weather effects

### 🎉 Social Sharing
- Share victories on Twitter, Facebook, WhatsApp
- Download victory screenshots
- Copy shareable links

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16 or higher
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/Raul909/Tic-Tac-Toe-.git
cd Tic-Tac-Toe-/tictactoe

# Install dependencies
npm install

# Start the server
npm start
```

Visit `http://localhost:3000` and start playing!

---

## 🌦️ Weather System

The app syncs with your real location to display weather effects:

- **Geolocation** - Requests browser location (optional)
- **Weather API** - Open-Meteo (free, no API key)
- **Visual Effects** - Rain, snow, clouds, or clear
- **Privacy** - Location not stored, works without permission

---

## 🎯 How to Play

### Multiplayer
1. **Login** with Google, Facebook, or username/password
2. **Create Room** - Click "LAUNCH ROOM" and share the code
3. **Join Room** - Click "DOCK" and enter the code
4. **Play** - Take turns, chat, and compete!

### AI Mode
1. Click "ENGAGE AI"
2. Challenge the unbeatable AI
3. Try to beat it!

### Space Explorer
1. Click 🌌 SPACE button
2. Explore Solar System, Stars, or Nebulae
3. Drag to rotate, scroll to zoom, click objects for info

---

## 🛠️ Tech Stack

**Backend**: Node.js, Express, Socket.IO, MongoDB  
**Frontend**: Alpine.js, Tailwind CSS, Three.js  
**Auth**: Google OAuth, Facebook OAuth, JWT  
**3D**: Three.js, OrbitControls, PBR materials

---

## 📦 Deployment

### Deploy to Render

1. Push to GitHub
2. Connect to [Render](https://render.com)
3. Render auto-detects `render.yaml`
4. Set environment variables (optional):
   - `MONGODB_URI` - MongoDB connection string
   - `GOOGLE_CLIENT_ID` - Google OAuth
   - `FACEBOOK_APP_ID` - Facebook OAuth
5. Deploy!

See [DEPLOYMENT.md](./DEPLOYMENT.md) for details.

---

## 🔐 Optional Setup

- **MongoDB**: [MONGODB_SETUP.md](./MONGODB_SETUP.md)
- **Google OAuth**: [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md)
- **Facebook OAuth**: [FACEBOOK_OAUTH_SETUP.md](./FACEBOOK_OAUTH_SETUP.md)

---

## 🎯 Roadmap

- [x] Real-time multiplayer
- [x] AI opponent
- [x] 3D space background (all 8 planets + Moon)
- [x] 3D Space Explorer with orbital controls
- [x] Real-time weather sync
- [x] Cinematic lighting
- [x] Interactive cursor effects
- [x] Social sharing
- [x] Google & Facebook OAuth
- [ ] Tournament mode
- [ ] Global leaderboard
- [ ] Sound effects
- [ ] Mobile app

---

## 📝 License

MIT License - see [LICENSE](LICENSE) file

---

## 🙏 Credits

- **3D Graphics**: Three.js
- **Fonts**: Google Fonts (Exo 2, Space Mono)
- **Weather**: Open-Meteo API
- **Astronomical Data**: NASA, ESA

---

<div align="center">

**Made with ❤️ and ☕**

[⬆ Back to Top](#-tic-tac-toe---mission-control)

</div>
