# CineSplit - Tech Stack & Features Guide

Use this document to help write your final project documentation or presentation. It covers all the advanced technologies and architectural decisions we implemented.

---

## 🛠️ Complete Tech Stack

### Frontend Architecture
- **Framework**: React 18 (bootstrapped with Vite for lightning-fast HMR and optimized builds)
- **Language**: TypeScript (ensures type safety across movie interfaces, API payloads, and state)
- **State Management**: Zustand (used for lightweight, global state management across the app, specifically for the `City Selector` and `Toast Notifications`)
- **Routing**: React Router DOM v6
- **Animations & UI**: Framer Motion (used for fluid page transitions, the glassmorphism city modal, and the chatbot animations)
- **Icons**: Lucide-React
- **API Client**: Axios (configured with interceptors for JWT injection)
- **Styling**: Vanilla CSS utilizing modern CSS Variables for a consistent Dark Mode / Glassmorphism aesthetic (`backdrop-filter: blur`).

### Backend Architecture
- **Runtime & Server**: Node.js with Express.js
- **Primary Database**: PostgreSQL (Handles relational integrity for Users, Movies, Cinemas, Screens, Shows, and Bookings. Uses `JSONB` columns for rich metadata like movie cast).
- **Caching & Concurrency Layer**: Redis (`ioredis`)
- **AI Integration**: Google Generative AI SDK (`gemini-flash-lite-latest`)
- **Payment Gateway**: Razorpay Node SDK
- **Security & Middleware**: `helmet`, `express-rate-limit`, `bcrypt` (password hashing), `jsonwebtoken` (stateless auth).

---

## ✨ Key Features & Technical Highlights

### 1. Gemini AI-Powered Chatbot
We replaced a rigid, keyword-based FAQ bot with a fully conversational AI powered by Google's **Gemini Flash Lite** model.
- **Context-Aware**: The backend caches a lightweight snapshot of the Postgres catalog in Redis and feeds it to the LLM, ensuring the AI only recommends movies that actually exist in your database.
- **Strict Guardrails**: The system prompt strictly prevents the AI from answering off-topic questions.
- **Interactive Flow**: If a user asks a vague question (e.g., "Recommend a movie"), the AI is programmed to ask clarifying questions first (e.g., "Are you looking for comedy or action?").
- **Inline UI Rendering**: The AI's backend output is parsed for movie IDs, allowing the frontend to dynamically render beautiful, clickable movie cards with "Book Now" buttons right inside the chat bubble.

### 2. Advanced Seat Locking & Concurrency Control
To prevent two users from booking the same seat at the exact same time (double-booking):
- **Redis Distributed Locks**: When a user selects seats and proceeds to payment, those specific seats are locked in Redis with a 5-minute Time-To-Live (TTL). 
- If User B tries to book the same seats, the backend blocks them immediately. If User A abandons the checkout, the Redis lock automatically expires and frees the seats.
- **Postgres Transactions**: Upon successful payment, the final booking is wrapped in a `BEGIN/COMMIT` SQL transaction with row-level locking (`FOR UPDATE`) to guarantee absolute data consistency.

### 3. Dynamic City Selection & Regional Filtering
- Implemented a premium **City Selector Modal** using Framer Motion and Zustand.
- The selected city is stored globally, meaning the Navbar and the Homepage instantly react to city changes without needing URL reloads or prop-drilling.
- Movies and Cinemas are strictly filtered by the selected city in real-time.

### 4. Realistic 7-Day Showtimes & "Fast Filling" Logic
- The backend features an advanced seeding script that generates a realistic 7-day schedule, cross-pollinating popular movies across multiple cinemas in the same city.
- **Dynamic Availability Indicators**: The UI pulls real-time available seat counts from a Redis cache for every single showtime. Shows with less than 25% availability automatically turn **Orange (Fast Filling)**, while the rest remain **Green (Available)**.

### 5. Rich Movie Profiles
- **Cast & Crew**: Leveraged PostgreSQL's `JSONB` column type to store complex, structured actor data (Name, Character, and Photo URL).
- **Horizontal Scroll UI**: Cast members are displayed in a sleek, horizontal-scrolling flex container using placeholder avatars.
- **Media Embeds**: High-quality posters and embedded YouTube trailers without ads/controls (`youtube-nocookie`).

### 6. End-to-End Razorpay Payments
- **Secure Architecture**: The frontend never sees the Razorpay API Secret. The backend generates a secure Order ID, and upon frontend payment completion, the backend verifies the cryptographic HMAC SHA-256 signature before finalizing the ticket.
- **Automated Refunds**: If a database error occurs *after* a successful payment, the system is designed to automatically trigger a refund via the Razorpay API.
