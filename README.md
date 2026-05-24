# 🛰️ TIC-TAC-TOE: MISSION CONTROL 🌌

> **SYS-ALERT: CRITICAL CELESTIAL STANDOFF DETECTED. COMBAT OPERATORS EN ROUTE.**

Welcome to **Tic-Tac-Toe: Mission Control**, a premium, high-fidelity tactical grid combat interface. Powered by a GPU-optimized 3D WebGL space simulation, this real-time multiplayer application fuses deep space exploration with competitive arena matches, advanced minimax training models, and robust, load-balanced server clustering.

---

## 🌟 Support the Mission!
If you find this premium space-combat experience interesting, please **Star** and **Fork** this repository! Your support keeps our cosmic telemetry systems online and funded. 🚀

---

## ⚡ Operational Telemetry & Live Link

*   **Static Client Mesh**: Deployed on **Cloudflare Pages** for sub-millisecond global CDN edge delivery.
*   **Persistent Core Server**: Deployed on **Render** utilizing automated blueprint synchronization.
*   🚀 **Active Comm Link**: **[https://tic-tac-toe-space.pages.dev](https://tic-tac-toe-space.pages.dev)**

---

## 🚀 Core Systems & Features

*   **🌐 Real-Time Warp Link**: Join/create multiplayer sectors instantly via unique, ephemeral 4-character encryption keys (room codes).
*   **🔗 Local P2P Multiplayer (WebRTC)**: Play with another player on the same WiFi or via a close connection directly in the browser, peer-to-peer, with no server dependency!
*   **🤖 Operator Training AI**: Test grid formations against a Minimax AI agent with Alpha-Beta pruning, operating across three tactical difficulties (`easy`, `normal`, `hard`).
*   **🌌 3D Celestial Cartography**: Explore a fully interactive 3D WebGL solar system, procedurally textured nearby stars with twinkling coronas, shimmering constellation links, and GPU-drifting volumetric gas nebulae powered by custom shaders.
*   **🎵 Custom Acoustic Deck & AI Song Analyzer**: Upload your own orbital soundtrack! An algorithm judges and slices the audio to extract dynamic Sound Effects (SFX) and background loops to play while you command the grid.
*   **👾 Retro Space Shooter Mini-Game**: Enjoy a fully-playable, canvas-based retro space shooter mini-game that runs while your custom audio buffers are processing.
*   **⚡ Quantum Reconnection**: A 30-second handshake grace period prevents match termination during solar flares (network drops).
*   **🏆 Combat Badge Ledger**: 8 unlockable achievements with persistent local telemetry tracking.
*   **📱 Tactical Mobile HUD & Eased Transitions**: Eased cross-fade screens and modal transitions. Viewport locking, touch-safe tap targets (minimum 44x44px), and adaptive layouts for pocket and tablet devices with dynamic WebGL aspect ratio correction.

---

## 🌌 Visual Tour

| 👤 Entry Portal | 🚀 Tactical Grid Arena |
|:---:|:---:|
| ![Entry Portal](https://raw.githubusercontent.com/Raul909/Tic-Tac-Toe-Space/main/screenshots/auth-screen.png) | ![Tactical Grid Arena](https://raw.githubusercontent.com/Raul909/Tic-Tac-Toe-Space/main/screenshots/game-board.png) |
| *Log in using authorized credentials or establish a temporary Guest Call Sign to launch instantly.* | *Interact with zero latency. Active sectors glow with a volumetric solar corona.* |

| 🌌 Space Explorer | 🏆 Victory Telemetry |
|:---:|:---:|
| ![Space Explorer](https://raw.githubusercontent.com/Raul909/Tic-Tac-Toe-Space/main/screenshots/space-explorer.png) | ![Victory Telemetry](https://raw.githubusercontent.com/Raul909/Tic-Tac-Toe-Space/main/screenshots/victory-share.png) |
| *Navigate through Saturn's rings, nearby stars, and realistic, volumetric gas nebulae.* | *Achieve victory to view dynamic telemetry, score updates, and engaging space facts.* |

---

## 🛠️ Technology Specifications

*   **Frontend**: Alpine.js (State Machine), Tailwind CSS (Aesthetic Styling), Three.js (WebGL Engine)
*   **Backend**: Node.js, Express, Socket.IO (Real-time WebSockets), MongoDB (Persistent Ledger)
*   **Cache & Message Bus**: Redis (Session Store & Leaderboard), RabbitMQ (Async Write Buffering)
*   **Hosting**: Cloudflare Pages (Frontend), Render (Backend Service)

---

## 🚀 Local Launch Sequence

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/Raul909/Tic-Tac-Toe-Space.git
    cd Tic-Tac-Toe-Space/tictactoe
    ```

2.  **Provision Dependencies**:
    ```bash
    npm install
    ```

3.  **Initiate local server**:
    ```bash
    npm run dev
    ```
    Open `http://localhost:3000` in your web browser.

4.  **Execute Diagnostic Tests**:
    ```bash
    npm test
    ```



