# CineSplit 🍿

CineSplit is a premium, full-stack movie ticketing platform built with a modern tech stack. It features a sleek glassmorphism UI, real-time seat locking with Redis, robust PostgreSQL transactional guarantees, Razorpay payment gateway integration, and a **Gemini AI-powered conversational chatbot**.

## ✨ Features

- **Cinematic UI/UX:** Dark-mode glassmorphism design with a responsive layout, animated ambient backgrounds, and skeleton loading states.
- **Seat Mapping & Locking:** Interactive theater seat maps with real-time Redis caching. Seats are temporarily locked (5-minute TTL) during checkout to prevent double-booking.
- **Gemini AI Support Chatbot:** Integrated with Google Generative AI (`gemini-flash-lite-latest`) to provide blazing-fast, natural language movie recommendations and booking assistance. It dynamically renders clickable movie cards right inside the chat!
- **Payment Gateway:** Razorpay test-mode integration featuring server-side HMAC SHA-256 signature verification and automated rollback/refund logic.
- **Multi-City & Regional Support:** Global City Selection UI powered by Zustand. Region-based filtering (e.g., Bangalore, Mumbai) updates available cinemas, movies, and showtimes dynamically.
- **Robust Database Transactions:** Built on PostgreSQL using `FOR UPDATE` row-level locks and `BEGIN/COMMIT` transactional blocks to ensure data integrity during concurrent booking attempts.
- **Authentication:** Secure JWT-based user authentication and rate-limited endpoints.

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 18 with Vite
- **Language:** TypeScript
- **Styling:** Vanilla CSS (CSS Variables) with Framer Motion for animations
- **State & Data Fetching:** Zustand (Global State), React Hooks, Axios
- **Payment:** Razorpay Checkout V1

### Backend
- **Runtime:** Node.js (Express.js)
- **Primary Database:** PostgreSQL
- **Caching & Locking:** Redis (`ioredis`)
- **Secondary DB (Logs/Chat):** MongoDB Atlas (Mongoose)
- **AI Integration:** Google Generative AI SDK (`@google/generative-ai`)
- **Security:** Helmet, Express Rate Limit, bcrypt, JWT

## 🚀 Local Development Setup

### Prerequisites
- Node.js (v18+)
- Docker & Docker Compose (for local Postgres & Redis)
- MongoDB Atlas account (or local MongoDB)

### 1. Start Infrastructure
Run the following from the root directory to start PostgreSQL and Redis via Docker:
```bash
docker-compose up -d
```

### 2. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file in the `backend` directory:
```env
PORT=5000
POSTGRES_URI=postgresql://cinesplit_user:cinesplit_password@localhost:5433/cinesplit_db
REDIS_HOST=localhost
REDIS_PORT=6379
MONGO_URI=mongodb://admin:admin_password@localhost:27017/cinesplit_db?authSource=admin
JWT_SECRET=super_secret_jwt_key
RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_HERE
RAZORPAY_KEY_SECRET=YOUR_SECRET_HERE
GEMINI_API_KEY=YOUR_GEMINI_KEY_HERE
```
Run the extended database seed script to generate cinemas, movies, screens, and shows:
```bash
node seed_extended.js
```
Start the backend server:
```bash
npm start
```

### 3. Frontend Setup
Open a new terminal window:
```bash
cd frontend
npm install
```
Start the Vite development server:
```bash
npm run dev
```

## 💳 Testing Razorpay Payments

Because this application uses Razorpay in **Test Mode**, you can simulate payments without using real money. 

### Recommended Testing Method
To easily bypass any international card restrictions on new Razorpay accounts:
1. In the Razorpay Checkout modal, click **Netbanking** or **UPI**.
2. Select any bank (e.g., **SBI**).
3. When the test simulator window opens, click the **Success** button.

### Card Testing
If you wish to use a test card, you can use the following generic Visa test details:
- **Card Number:** `4111 1111 1111 1111`
- **Expiry Date:** Any future date (e.g., `12/26`)
- **CVV:** Any 3 digits (e.g., `123`)
- **OTP:** Any code

## 🔒 Security & Architecture Notes
- **Stateless Frontend Secrets:** The frontend does *not* contain the `VITE_RAZORPAY_KEY_ID`. The backend dynamically signs and injects the public key into the order payload to prevent bundle scraping.
- **Idempotency:** Payment verification is secured against replay attacks via strict order validation and Redis cache invalidation.
