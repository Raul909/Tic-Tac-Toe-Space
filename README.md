# 🎮 Tic Tac Toe - Mission Control

**A real-time multiplayer Tic Tac Toe game with NASA-inspired UI and 3D space visuals**

[![Live Demo](https://img.shields.io/badge/demo-live-success)](https://tictactoe-multiplayer-kx9u.onrender.com/)

[🚀 Play Now](https://tictactoe-multiplayer-kx9u.onrender.com/)

---

## ✨ Features

- **🌐 Multiplayer** - Play with friends using 4-character room codes
- **🤖 AI Opponent** - Challenge an unbeatable minimax AI
- **🎮 Guest Login** - One-tap access with auto-generated IDs (PUBG/CODM style)
- **🌌 3D Space** - Realistic solar system with 8 planets, 20,000+ stars, and weather effects
- **🏆 Achievements** - 8 unlockable badges with progress tracking
- **🎵 Sound Packs** - 4 different audio themes (SciFi, Retro, Realistic, Minimal)
- **👤 Customization** - Avatars, symbols, themes, and accessibility options
- **📱 Mobile-First** - Fully responsive with touch-optimized controls
- **🔐 Auth** - Username/Password, Google OAuth, Facebook OAuth, or Guest mode

---

## 🚀 Quick Start

```bash
# Clone repository
git clone https://github.com/Raul909/Tic-Tac-Toe-.git
cd Tic-Tac-Toe-/tictactoe

# Install dependencies
npm install

# Start server
npm start
```

Visit `http://localhost:3000` and start playing!

---

## 🎯 How to Play

### Multiplayer
1. Click "🚀 LAUNCH MISSION" on home screen
2. Choose login method (Guest, Google, Facebook, or Username/Password)
3. Click "LAUNCH ROOM" and share the 4-character code with a friend
4. Or click "DOCK" and enter a friend's code to join

### AI Mode
1. Login (any method)
2. Select difficulty (Easy, Normal, Hard)
3. Click "ENGAGE AI"

### Space Explorer
1. Click "🌌 SPACE" button in lobby
2. Explore Solar System, Stars, or Nebulae
3. Drag to rotate, scroll to zoom, click objects for info

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express, Socket.IO, MongoDB
- **Frontend**: Alpine.js, Tailwind CSS, Three.js
- **Auth**: JWT, Google OAuth, Facebook OAuth
- **3D**: Three.js with OrbitControls and PBR materials

---

## 📦 Environment Variables

Create `.env` file in `tictactoe/` directory:

```env
MONGODB_URI=your_mongodb_connection_string
GOOGLE_CLIENT_ID=your_google_client_id
FACEBOOK_APP_ID=your_facebook_app_id
SESSION_SECRET=your_random_secret
```

**Note**: App works without MongoDB (uses file-based storage). OAuth is optional.

---

## 🚀 Deployment

### Render (Recommended)
1. Push to GitHub
2. Connect repository to Render
3. Add environment variables
4. Deploy automatically

### Manual
```bash
# Build (if needed)
npm install --production

# Start
NODE_ENV=production npm start
```

---

## 📱 Mobile Support

- Responsive design (320px - 4K)
- Touch-optimized controls
- 44px minimum tap targets
- No horizontal scrolling
- PWA-ready

---

## 🎨 Customization

- **5 Avatars**: Astronaut, Alien, Robot, Satellite, Comet
- **5 Symbols**: Default X/O, Star, Planet, Rocket, Galaxy
- **5 Themes**: Space, Mars, Moon, Jupiter, Nebula
- **4 Sound Packs**: SciFi, Retro, Realistic, Minimal
- **Accessibility**: High contrast, colorblind mode, keyboard navigation

---

## 📝 Scripts

```bash
npm start          # Start server
npm test           # Run tests
npm run dev        # Development mode
```

---

## 🤝 Contributing

Pull requests welcome! For major changes, open an issue first.

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file

---

## 🙏 Credits

- **3D Graphics**: Three.js
- **Fonts**: Google Fonts (Exo 2, Space Mono)
- **Weather**: Open-Meteo API
- **Astronomical Data**: NASA, ESA

---

**Made with ❤️ and ☕**

[⬆ Back to Top](#-tic-tac-toe---mission-control)
