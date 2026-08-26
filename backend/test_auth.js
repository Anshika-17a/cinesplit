const testAuth = async () => {
  const BASE_URL = 'http://localhost:5000/api/auth';
  let token = '';

  console.log('--- 1. Testing Validation Error (Password too short) ---');
  let res = await fetch(`${BASE_URL}/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test', email: 'test@example.com', password: 'short' })
  });
  console.log(`Status: ${res.status}`);
  console.log(await res.json());

  console.log('\n--- 2. Testing Signup ---');
  res = await fetch(`${BASE_URL}/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test User', email: 'test@example.com', password: 'password123' })
  });
  console.log(`Status: ${res.status}`);
  console.log(await res.json());

  console.log('\n--- 3. Testing Login ---');
  res = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test@example.com', password: 'password123' })
  });
  console.log(`Status: ${res.status}`);
  const loginData = await res.json();
  console.log(loginData);
  token = loginData.token;

  console.log('\n--- 4. Testing Protected Route (No Token) ---');
  res = await fetch(`${BASE_URL}/protected`);
  console.log(`Status: ${res.status}`);
  console.log(await res.json());

  console.log('\n--- 5. Testing Protected Route (With Token) ---');
  res = await fetch(`${BASE_URL}/protected`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log(`Status: ${res.status}`);
  console.log(await res.json());
};

testAuth();
