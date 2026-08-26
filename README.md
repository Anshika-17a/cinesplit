# 🍿 CineSplit — Next-Gen Cinematic Ticketing Platform

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-15-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis&logoColor=white" />
  <img src="https://img.shields.io/badge/Google_Gemini-Flash--Lite-8E75B2?style=for-the-badge&logo=google&logoColor=white" />
  <img src="https://img.shields.io/badge/Razorpay-Integrated-02042B?style=for-the-badge&logo=razorpay&logoColor=3395FF" />
</p>

---

## 📽️ Project Demo Video

> 🎥 **Watch the Full Platform Walkthrough & Live Demo:**  
> 👉 **[Click Here to Watch the CineSplit Demo Video](https://drive.google.com/file/d/1UnaIxA570_x1SKLA54D9d6Ch6fIA0tv7/view?usp=sharing)**

---

## 📖 Overview

**CineSplit** is a full-stack, enterprise-grade movie ticketing platform built with a modern dark **glassmorphism** design and a **cinematic crimson** brand aesthetic. 

It solves real-world high-traffic concurrency problems using **distributed Redis seat locks** (`SET NX PX`), **PostgreSQL row-level locking** (`FOR UPDATE`), and features an integrated **Gemini AI chatbot**, **downloadable QR-code tickets**, and **optional snack add-ons** in a unified checkout.

---

## 🏛️ System Architecture

```mermaid
flowchart TB
    subgraph Client["Frontend (React 19 + TypeScript + Vite)"]
        UI[Cinematic Glassmorphism UI]
        Zustand[Zustand Global State / City Selector]
        SeatMap[Real-Time Seat Grid with 2.5s Polling]
        TicketCard[Downloadable PNG Ticket Generator]
        ChatbotUI[Gemini AI Chatbot Modal]
    end

    subgraph API["Backend API (Express.js / Node.js)"]
        AuthRoute["JWT Authentication & Rate Limiting"]
        ShowCtrl["Show & Real-Time Seat Controller"]
        BookCtrl["Booking & Concurrency Controller"]
        ChatCtrl["Gemini Flash-Lite Chat Controller"]
    end

    subgraph DataStore["Data & Caching Layer"]
        Redis[("Redis (ioredis)\n• Distributed Seat Locks (5m TTL)\n• Catalog Snapshot Cache\n• IP Rate Limiting")]
        Postgres[("PostgreSQL\n• ACID Transactions\n• Row-Level Locks (FOR UPDATE)\n• JSONB Snacks & Schema")]
    end

    subgraph ThirdParty["External Services"]
        GeminiSDK["Google Gemini Flash-Lite AI"]
        Razorpay["Razorpay Payment Gateway (HMAC SHA-256)"]
    end

    UI --> API
    ChatbotUI --> ChatCtrl
    ChatCtrl --> GeminiSDK
    ShowCtrl --> Redis
    ShowCtrl --> Postgres
    BookCtrl --> Redis
    BookCtrl --> Postgres
    BookCtrl --> Razorpay
```

---

## ⚡ Concurrency & Double-Booking Prevention

One of CineSplit's core engineering highlights is its **two-phase concurrency control**:

```
[User A Clicks Seat] ──> [Redis: SET lock:show:X:seat:Y NX PX 300000]
                                │
                 ┌──────────────┴──────────────┐
                 ▼                             ▼
        [Lock Acquired (True)]        [Lock Exists (False)]
                 │                             │
    • Seat becomes 'Locked'           • Returns HTTP 409 Conflict
    • 2.5s polling notifies User B    • User B's seat auto-deselected
                 │
  [Razorpay Payment Successful]
                 │
    • Postgres: BEGIN TRANSACTION
    • SELECT ... FOR UPDATE (Row Lock)
    • UPDATE show_seats SET status = 'booked'
    • INSERT INTO bookings (..., snacks)
    • RELEASE Redis Lock
    • COMMIT TRANSACTION
```

1. **Phase 1: Optimistic In-Memory Lock (Redis):** When User A initiates checkout, a distributed lock key `lock:show:{showId}:seat:{seatId}` is created with a 5-minute TTL.
2. **Phase 2: Real-Time Lock Aggregation:** `GET /shows/:showId/seats` checks all active Redis lock keys via high-performance `MGET`. Other users' screens instantly reflect locked seats and auto-deselect conflicts.
3. **Phase 3: Strict Transactional Commitment (Postgres):** On payment verification, Postgres locks rows with `FOR UPDATE` in a `BEGIN...COMMIT` block, updates seats to `booked`, releases Redis locks, and invalidates cache.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🎨 **Cinematic Crimson UI** | Sleek glassmorphism theme with crimson-to-rose glowing gradients, ambient lighting, and smooth Framer Motion transitions. |
| 🪑 **Interactive Seat Selection** | SVG seat icons with aisle-gapped seating blocks, screen glow arc, real-time ticket preview, and instant price updates. |
| 🔒 **Real-Time Concurrent Locking** | High-speed Redis locking prevents duplicate seat selections across multiple concurrent browser tabs. |
| 🤖 **Gemini AI Movie Assistant** | Powered by `gemini-flash-lite-latest` — handles natural language recommendations, interactive clarifying questions, and renders direct "Book Now" movie cards. |
| 🎟️ **Downloadable QR Tickets** | Generates high-res PNG tickets (`html-to-image`) with cryptographic JWT-signed QR codes for entry verification. |
| 🍿 **Lightweight Snack Add-Ons** | One-tap snacks (Popcorn, Cold Drink, Nachos, Combos) bundled directly into the single checkout payment. |
| 🏙️ **Multi-City Discovery** | Global city switcher (Bangalore, Mumbai, Delhi, Hyderabad, Chennai, etc.) with localized cinemas, shows, and language filters. |
| 🎬 **Embedded Trailer Player** | In-app expandable trailer player with autoplay support and rich horizontal cast carousels. |
| 💳 **Razorpay Test Integration** | Server-side HMAC SHA-256 signature verification with automated refund triggers on edge-case conflicts. |

---

## 🛠️ Complete Tech Stack

### **Frontend**
- **Core:** React 19, TypeScript, Vite 8
- **Styling:** Custom CSS Variables (Design Tokens), Glassmorphism, Responsive Grid
- **Animations:** Framer Motion
- **State Management:** Zustand
- **Icons & Media:** Lucide React, HTML-to-Image (PNG Ticket Generation)
- **HTTP Client:** Axios

### **Backend**
- **Runtime:** Node.js, Express.js
- **Primary Database:** PostgreSQL (pg pool, ACID transactions)
- **Cache & Locks:** Redis (`ioredis`, `redis`)
- **AI Engine:** Google Generative AI SDK (`@google/generative-ai`)
- **Security & Auth:** JWT (`jsonwebtoken`), bcrypt, Helmet, Express Rate Limit, Crypto (HMAC SHA-256)
- **QR Code:** `qrcode` (JWT-encoded payload)
- **Payments:** Razorpay Node.js SDK

---

## 🚀 Getting Started Locally

### Prerequisites
- **Node.js:** v18 or higher
- **Docker & Docker Compose** (for local PostgreSQL & Redis)
- **Git**

---

### 1. Clone the Repository
```bash
git clone https://github.com/Anshika-17a/cinesplit.git
cd cinesplit
```

---

### 2. Start PostgreSQL & Redis via Docker
From the project root, run:
```bash
docker-compose up -d
```
*This launches PostgreSQL on port `5433` and Redis on port `6379`.*

---

### 3. Backend Configuration & Setup
Navigate to the `backend` directory and install dependencies:
```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` folder:
```env
PORT=5000
POSTGRES_URI=postgresql://cinesplit_user:cinesplit_password@localhost:5433/cinesplit_db
REDIS_HOST=localhost
REDIS_PORT=6379
MONGO_URI=mongodb://admin:admin_password@localhost:27017/cinesplit_db?authSource=admin
JWT_SECRET=cinesplit_super_secret_jwt_key_2026
RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_HERE
RAZORPAY_KEY_SECRET=YOUR_SECRET_HERE
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
```

Seed the database with cinemas, screens, shows, local posters, and movies:
```bash
node seed_extended.js
```

Start the backend development server:
```bash
npm start
```
*Backend runs on `http://localhost:5000`.*

---

### 4. Frontend Configuration & Setup
Open a new terminal tab and navigate to `frontend/`:
```bash
cd frontend
npm install
```

Start the Vite development server:
```bash
npm run dev
```
*Frontend will be live at `http://localhost:5173`.*

---

## 💳 Simulating Payments (Razorpay Test Mode)

To test the end-to-end checkout without real money:
1. Select your seats and optional snacks, then click **Proceed to Pay**.
2. When the Razorpay modal opens, select **Netbanking** or **UPI**.
3. Choose any bank (e.g. **SBI** or **HDFC**).
4. In the Razorpay test simulator window, click **Success**.
5. You will immediately be redirected to the **Booking Confirmation** page where you can view and **Download your PNG Ticket** with its scannable QR code!

---

## 📁 Repository Structure

```
cinesplit/
├── backend/
│   ├── src/
│   │   ├── config/          # PostgreSQL & Redis connections
│   │   ├── controllers/     # Auth, Booking, Show, Movie, and Gemini Chatbot controllers
│   │   ├── middleware/      # JWT authentication, Rate limiters
│   │   ├── routes/          # Express route declarations
│   │   └── services/        # LockService (Redis), CacheService, ActivityLogService
│   ├── seed_extended.js     # Multi-city mock database seeder
│   └── server.js            # Express application entry point
├── frontend/
│   ├── public/
│   │   └── posters/         # Locally hosted high-res movie posters
│   ├── src/
│   │   ├── components/      # Glassmorphism UI, SeatIcon, Chatbot, CitySelector, Modal
│   │   ├── hooks/           # Zustand app state, Auth context, Toast store
│   │   ├── pages/           # Home, MovieShows, ShowDetail (Seat Selection), Confirmation, MyBookings
│   │   └── styles/          # Design tokens & global CSS (Crimson palette)
│   └── App.tsx              # React routes & layouts
├── docker-compose.yml       # Local Postgres & Redis container orchestration
└── README.md                # Project documentation
```

---

<p align="center">
  Built with ❤️ for an unparalleled movie ticketing experience.
</p>
