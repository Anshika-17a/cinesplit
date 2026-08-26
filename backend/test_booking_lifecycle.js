require('dotenv').config();
const jwt = require('jsonwebtoken');

const testLifecycle = async () => {
  const BASE_URL = 'http://localhost:5000/api';
  const showId = 3;
  
  // Use User 1 token
  const token = jwt.sign({ userId: 1, email: 'user1@example.com' }, process.env.JWT_SECRET || 'super_secret_jwt_key');
  
  console.log('--- 1. Fetching available seats ---');
  let res = await fetch(`${BASE_URL}/shows/${showId}/seats`);
  let seatData = await res.json();
  const availableSeatId = seatData.seats.find(s => s.status === 'available').show_seat_id;
  console.log(`Initial Available Count: ${seatData.availableCount}`);
  console.log(`Going to book seat ID: ${availableSeatId}`);

  console.log('\n--- 2. Booking the seat ---');
  res = await fetch(`${BASE_URL}/shows/${showId}/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ seatIds: [availableSeatId] })
  });
  const bookingData = await res.json();
  console.log(`Status: ${res.status}`);
  console.log(bookingData);
  const bookingId = bookingData.id;

  console.log('\n--- 3. Fetching Booking History ---');
  res = await fetch(`${BASE_URL}/bookings/me`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const historyData = await res.json();
  console.log(`Status: ${res.status}`);
  console.log(JSON.stringify(historyData, null, 2));

  console.log('\n--- 4. Cancelling the Booking ---');
  res = await fetch(`${BASE_URL}/bookings/${bookingId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log(`Status: ${res.status}`);
  console.log(await res.json());

  console.log('\n--- 5. Confirming Seat is Available Again ---');
  res = await fetch(`${BASE_URL}/shows/${showId}/seats`);
  seatData = await res.json();
  const seatObj = seatData.seats.find(s => s.show_seat_id === availableSeatId);
  console.log(`Restored Available Count: ${seatData.availableCount}`);
  console.log(`Seat ${availableSeatId} status: ${seatObj.status}`);
};

testLifecycle().catch(console.error);
