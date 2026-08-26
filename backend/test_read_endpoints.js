const testReads = async () => {
  const BASE_URL = 'http://localhost:5000/api';

  console.log('--- 1. Testing GET /api/cinemas ---');
  let res = await fetch(`${BASE_URL}/cinemas`);
  console.log(`Status: ${res.status}`);
  let data = await res.json();
  console.log(data);

  if (data.length > 0) {
    const cinemaId = data[0].id;
    console.log(`\n--- 2. Testing GET /api/cinemas/${cinemaId}/shows ---`);
    res = await fetch(`${BASE_URL}/cinemas/${cinemaId}/shows`);
    console.log(`Status: ${res.status}`);
    data = await res.json();
    console.log(data);

    if (data.length > 0) {
      const showId = data[0].show_id;
      console.log(`\n--- 3. Testing GET /api/shows/${showId} ---`);
      res = await fetch(`${BASE_URL}/shows/${showId}`);
      console.log(`Status: ${res.status}`);
      console.log(await res.json());

      console.log(`\n--- 4. Testing GET /api/shows/${showId}/seats ---`);
      res = await fetch(`${BASE_URL}/shows/${showId}/seats`);
      console.log(`Status: ${res.status}`);
      let seatData = await res.json();
      // Only print summary and a few seats so it doesn't flood the console
      console.log({
        showId: seatData.showId,
        availableCount: seatData.availableCount,
        totalSeats: seatData.totalSeats,
        seatsSample: seatData.seats.slice(0, 3) // first 3 seats
      });
    }
  }
};

testReads();
