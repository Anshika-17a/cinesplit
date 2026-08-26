# Cinesplit

A full-stack application.

## Setup Instructions

1. **Start dependencies**  
   Make sure you have Docker installed. In the root directory, run:
   ```bash
   docker-compose up -d
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   # Create a .env file from .env.example
   cp .env.example .env
   npm start
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Test Payment Information
For testing Razorpay integrations, use the following test card details:
- **Card Number:** 4111 1111 1111 1111
- **Expiry Date:** Any future date (e.g., 12/26)
- **CVV:** Any 3 digits (e.g., 123)
- **OTP:** Any code

## Live Deployment
- **Frontend:** https://[YOUR_VERCEL_APP].vercel.app
- **Backend:** https://[YOUR_RENDER_APP].onrender.com
