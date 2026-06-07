# ✦ RetroClipboard ✦

[![Vercel Deployment](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=flat-square&logo=vercel)](https://online-clipboard-rm16.vercel.app)
[![Redis](https://img.shields.io/badge/Powered%20by-Upstash%20Redis-red?style=flat-square&logo=redis)](https://upstash.com)
[![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-blue?style=flat-square&logo=react)](https://react.dev)
[![TailwindCSS](https://img.shields.io/badge/Styling-Tailwind%20v4-38bdf8?style=flat-square&logo=tailwind-css)](https://tailwindcss.com)

**RetroClipboard** is a beautifully designed, neo-brutalist styled online clipboard for temporary text and link sharing. Built with speed, security, and simplicity in mind, it lets you share snippets across devices using lightweight 4-digit codes without requiring any registration or accounts.

🌐 **Live Demo:** [https://oclip.vercel.app](https://oclip.vercel.app)

---

## ✨ Features

- **Neo-Brutalist Aesthetic:** Vibrant contrast, bold borders, retro clock, and micro-interactions powered by Framer Motion.
- **Instant Sharing:** Paste your text, choose an expiration, and get a unique 4-digit sharing code or a direct link.
- **Fast Retrieval:** Retrieve any clip instantly using the 4-digit code.
- **Custom TTL Expiration:** Control how long your clipboard stays online (1 Hour, 1 Day, or 7 Days).
- **Light & Dark Modes:** A fully-responsive, retro-themed interface tailored for both dark and light preferences.
- **Real-Time DB Status:** Inline system health monitor checking Upstash Redis connection in real-time.
- **Zero Tracking:** Fully serverless backend with strict database-level expirations. No tracking cookies, no accounts.

---

## 🛠️ Tech Stack

- **Frontend:**
  - [React 19](https://react.dev/) + [Vite](https://vite.dev/)
  - [Tailwind CSS v4](https://tailwindcss.com/) (using `@tailwindcss/vite` integration)
  - [Framer Motion](https://www.framer.com/motion/) (for animations and modal states)
  - [Lucide React](https://lucide.dev/) (for iconography)
- **Backend (Serverless):**
  - [Vercel Serverless Functions](https://vercel.com/docs/functions) (JavaScript API routes under `/api`)
- **Database:**
  - [Upstash Redis](https://upstash.com/) (Serverless Redis for low-latency temporary key-value storage)

---

## 📂 Project Structure

```text
online-clipboard/
├── api/                  # Vercel Serverless API Functions
│   ├── db.js             # Upstash Redis client initialization
│   ├── share.js          # POST - Saves clip with unique 4-digit code + TTL
│   ├── fetch.js          # POST - Fetches clip content using the code
│   └── status.js         # GET - Database connectivity health check
├── src/                  # React Frontend Application
│   ├── assets/           # Static asset folders
│   ├── components/       # UI Components
│   │   └── retroui/      # Retro-styled UI buttons, widgets
│   ├── lib/              # Utility helpers
│   ├── App.jsx           # Main application interface and API hooks
│   ├── index.css         # Styling system containing neo-brutalist theme tokens
│   └── main.jsx          # Entrypoint for React 19
├── index.html            # HTML layout
├── vite.config.ts        # Vite + Tailwind compiler configs
└── package.json          # Node dependencies & project scripts
```

---

## 🚀 Getting Started

Follow these instructions to run RetroClipboard on your local machine:

### 1. Clone the Repository
```bash
git clone https://github.com/atharvabaodhankar/online-clipboard.git
cd online-clipboard
```

### 2. Configure Environment Variables
Create a `.env` (or `.env.local`) file in the root directory and configure the following variables:

```env
# Frontend API URL configuration
VITE_API_URL=http://localhost:3000

# Upstash Redis credentials
UPSTASH_REDIS_REST_URL="https://your-upstash-redis-url.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-upstash-redis-token"
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Run Locally
To run the frontend dev server along with Vercel serverless functions locally, install the [Vercel CLI](https://vercel.com/cli) and run:

```bash
# Start Vercel dev environment (spins up frontend and local api handler)
vercel dev
```

Alternatively, to run only the Vite frontend dev server (without serverless API features):
```bash
npm run dev
```

---

## 📡 API Reference

### 1. Save Clipboard
* **Endpoint:** `/api/share`
* **Method:** `POST`
* **Request Body:**
  ```json
  {
    "content": "Text to be saved",
    "expiresAt": "1d" // Optional: "1h" | "1d" | "7d" (defaults to "1d")
  }
  ```
* **Response:**
  ```json
  {
    "code": "4821"
  }
  ```

### 2. Fetch Clipboard
* **Endpoint:** `/api/fetch`
* **Method:** `POST`
* **Request Body:**
  ```json
  {
    "code": "4821"
  }
  ```
* **Response:**
  ```json
  {
    "content": "Text to be saved"
  }
  ```

### 3. System Status
* **Endpoint:** `/api/status`
* **Method:** `GET`
* **Response:**
  ```json
  {
    "status": "ok",
    "database": "connected",
    "timestamp": "2026-06-07T05:22:43.000Z"
  }
  ```

---

## 🛡️ License
This project is licensed under the MIT License. Feel free to use, modify, and distribute it.
