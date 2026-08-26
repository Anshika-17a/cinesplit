require('dotenv').config();
const jwt = require('jsonwebtoken');

const testRateLimit = async () => {
  const BASE_URL = 'http://localhost:5000/api';
  const showId = 3;
  const token = jwt.sign({ userId: 1, email: 'user1@example.com' }, process.env.JWT_SECRET || 'super_secret_jwt_key');
  
  // We'll just attempt to book a random seat ID that doesn't necessarily need to be available 
  // since the rate limiter triggers BEFORE the route logic. We just want to see the 429.
  const seatIds = [999]; // dummy

  console.log('--- Firing 6 rapid booking requests to test rate limit ---');

  const requests = [];
  for (let i = 1; i <= 6; i++) {
    const req = fetch(`${BASE_URL}/shows/${showId}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ seatIds })
    }).then(async r => ({ attempt: i, status: r.status, data: await r.json() }));
    
    requests.push(req);
  }

  const results = await Promise.all(requests);

  results.forEach(r => {
    console.log(`Attempt ${r.attempt} -> Status: ${r.status}`);
    if (r.status === 429) {
      console.log('RATE LIMIT HIT:', r.data);
    }
  });
};

testRateLimit().catch(console.error);
