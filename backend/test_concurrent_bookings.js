require('dotenv').config();
const jwt = require('jsonwebtoken');

const testConcurrentBookings = async () => {
  const BASE_URL = 'http://localhost:5000/api';
  
  // Create two fake users with valid JWTs
  const token1 = jwt.sign({ userId: 1, email: 'user1@example.com' }, process.env.JWT_SECRET || 'super_secret_jwt_key');
  const token2 = jwt.sign({ userId: 2, email: 'user2@example.com' }, process.env.JWT_SECRET || 'super_secret_jwt_key');

  const showId = 3; // From our previous test
  
  // 1. Fetch available seats to pick one to fight over
  console.log(`--- Fetching seats for show ${showId} ---`);
  let res = await fetch(`${BASE_URL}/shows/${showId}/seats`);
  let seatData = await res.json();
  const availableSeatId = seatData.seats.find(s => s.status === 'available').show_seat_id;
  
  console.log(`Target Seat ID to book concurrently: ${availableSeatId}`);
  console.log(`Current Available Count from cache: ${seatData.availableCount}`);

  // 2. Fire two POST requests simultaneously
  console.log('\n--- Firing two concurrent booking requests for the same seat ---');
  
  const req1 = fetch(`${BASE_URL}/shows/${showId}/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token1}` },
    body: JSON.stringify({ seatIds: [availableSeatId] })
  }).then(async r => ({ user: 'User 1', status: r.status, data: await r.json() }));

  const req2 = fetch(`${BASE_URL}/shows/${showId}/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token2}` },
    body: JSON.stringify({ seatIds: [availableSeatId] })
  }).then(async r => ({ user: 'User 2', status: r.status, data: await r.json() }));

  // Wait for both to finish
  const results = await Promise.all([req1, req2]);
  
  console.log('\n--- Results ---');
  results.forEach(r => {
    console.log(`${r.user} -> Status: ${r.status}`);
    console.log(r.data);
  });

  // 3. Fetch available seats again to verify cache was invalidated and count decreased
  res = await fetch(`${BASE_URL}/shows/${showId}/seats`);
  seatData = await res.json();
  console.log(`\n--- After Booking ---`);
  console.log(`New Available Count from cache: ${seatData.availableCount}`);
};

testConcurrentBookings().catch(console.error);
