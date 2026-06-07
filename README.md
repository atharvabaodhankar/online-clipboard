# ✦ OClip ✦

[![Vercel Deployment](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=flat-square&logo=vercel)](https://oclip.vercel.app)
[![Redis](https://img.shields.io/badge/Powered%20by-Upstash%20Redis-red?style=flat-square&logo=redis)](https://upstash.com)
[![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-blue?style=flat-square&logo=react)](https://react.dev)
[![TailwindCSS](https://img.shields.io/badge/Styling-Tailwind%20v4-38bdf8?style=flat-square&logo=tailwind-css)](https://tailwindcss.com)

**OClip** is a lightweight, zero-tracking, account-free temporary text and file-sharing platform styled with a retro neo-brutalist aesthetic. Designed to be fast and secure, it allows you to transfer snippets and files across different devices using simple 4-digit codes or dynamic QR codes.

🌐 **Live Demo:** [https://oclip.vercel.app](https://oclip.vercel.app)

---

## 💡 Why OClip? (The College Lab Use Case)

Public terminals (such as college computer labs, library systems, or office presentation decks) present a major security hazard. Logins, emails, and drive accounts are easily left active, and personal data can be exposed. 

**OClip solves this:**
- **Zero Logins:** Share code snippets or files without entering emails or passwords on public computers.
- **Hassle-Free Transfer:** Paste your text or drop your ZIP files from the lab terminal, grab a quick 4-digit code, go home, and download your items instantly on your personal system.
- **Self-Cleaning:** Strict expirations and "Burn After Read" features ensure your files disappear automatically from storage immediately after you retrieve them.

---

## 🏗️ System Architecture

![OClip System Architecture](./public/oclip_architecture.png)

OClip implements a secure, low-latency, dual-tier storage strategy to support massive file sharing at zero cost:
1. **Metadata Registry (Upstash Redis):** Stores session records (containing download counters, view limits, expiry timestamps, filenames, and download URLs) mapped to a unique 4-digit numeric code.
2. **Binary Storage (storage.to / Cloudflare R2):** Uploads raw file bytes directly from the client browser to Cloudflare R2 storage (brokered by storage.to). This completely bypasses Vercel’s serverless payload limits (4.5MB) and timeouts, supporting uploads up to 25GB.

---

## ✨ Features

- **Neo-Brutalist Design:** Styled with bold borders, contrasting palettes, a ticking retro system clock, and micro-animations.
- **Universal Dropzone:** Drag & drop any file (up to 25GB) or paste raw text clips to share immediately.
- **Dynamic Routing:** Direct links are mapped to client-side path routes `/t/:code` (text clip view) and `/f/:code` (file preview & download deck).
- **Responsive Previews:** Inline viewer for images (`png`, `jpg`/`jpeg`, `gif`, `webp`), raw text (`txt`), and documents (`pdf`). Unsupported files display a clean download prompt.
- **Burn-After-Read:** Destroy data instantly from the server database after the first retrieval.
- **Custom Expirations:** Select database-level TTL thresholds (1 Hour, 1 Day, or 7 Days).
- **QR Sharing:** Generates QR codes on-the-fly for direct mobile scans and downloads.
- **Real-Time DB Status:** Ticker indicating Redis connection state.

---

## 🛠️ Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS v4, Framer Motion, `react-dropzone`, `qrcode`.
- **Backend:** Vercel Serverless Functions.
- **Database:** Upstash Redis (Serverless key-value store).
- **File Host:** storage.to (Cloudflare R2-backed storage).

---

## 📂 Project Structure

```text
online-clipboard/
├── api/                  # Vercel Serverless API Functions
│   ├── db.js             # Upstash Redis client initialization
│   ├── share.js          # POST - Saves clip with unique 4-digit code + TTL
│   ├── fetch.js          # POST - Fetches clip content and deletes if maxViews reached
│   └── status.js         # GET - Database connectivity health check
├── public/               # Static assets
│   ├── oclip_architecture.png # Generated architecture diagram
│   └── vite.svg
├── src/                  # React Frontend Application
│   ├── components/       # UI Components
│   │   └── retroui/      # Retro-styled UI buttons
│   ├── App.jsx           # Main application interface and upload flows
│   ├── index.css         # Styling system containing neo-brutalist theme tokens
│   └── main.jsx          # Entrypoint for React 19
├── index.html            # HTML layout
├── vercel.json           # Vercel client-side routing rewrites
├── vite.config.ts        # Vite + Tailwind compiler configs
└── package.json          # Node dependencies & scripts
```

---

## 🚀 Getting Started

Follow these instructions to run OClip on your local machine:

### 1. Clone the Repository
```bash
git clone https://github.com/atharvabaodhankar/online-clipboard.git
cd online-clipboard
```

### 2. Configure Environment Variables
Create a `.env` (or `.env.local`) file in the root directory:

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
To run the frontend dev server along with Vercel serverless functions locally:

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
* **Request Body (Text):**
  ```json
  {
    "type": "text",
    "content": "Text to be saved",
    "expiresAt": "1d",
    "maxViews": 999
  }
  ```
* **Request Body (File):**
  ```json
  {
    "type": "file",
    "provider": "storage.to",
    "fileId": "FQxyz1234",
    "fileUrl": "https://storage.to/FQxyz1234",
    "rawUrl": "https://storage.to/r/FQxyz1234",
    "fileName": "resume.pdf",
    "size": "2.1MB",
    "expiresAt": "1d",
    "maxViews": 999
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
    "content": "Text content if type is text",
    "record": {
      "code": "4821",
      "type": "file",
      "provider": "storage.to",
      "fileId": "FQxyz1234",
      "fileUrl": "https://storage.to/FQxyz1234",
      "rawUrl": "https://storage.to/r/FQxyz1234",
      "fileName": "resume.pdf",
      "size": "2.1MB",
      "createdAt": 123456789,
      "expiresAt": 123999999,
      "views": 1,
      "maxViews": 999
    }
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
