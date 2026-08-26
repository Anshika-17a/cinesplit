require('dotenv').config();
const { acquireSeatLock, releaseSeatLock } = require('./src/services/lockService');

async function testLocks() {
  const showId = 1;
  const seatId = 42;

  console.log(`\n--- Testing Redis Locks for Show: ${showId}, Seat: ${seatId} ---`);

  // 1. Attempt to acquire lock first time
  const lock1 = await acquireSeatLock(showId, seatId, 10);
  console.log(`First lock acquisition (expect true): ${lock1}`);

  // 2. Attempt to acquire lock rapidly again while held
  const lock2 = await acquireSeatLock(showId, seatId, 10);
  console.log(`Second rapid lock acquisition (expect false): ${lock2}`);

  // 3. Release the lock
  console.log('Releasing lock...');
  await releaseSeatLock(showId, seatId);

  // 4. Attempt to acquire lock after release
  const lock3 = await acquireSeatLock(showId, seatId, 10);
  console.log(`Third lock acquisition after release (expect true): ${lock3}`);

  // Cleanup to not leave hanging lock
  await releaseSeatLock(showId, seatId);

  console.log('Test complete. Exiting...');
  process.exit(0);
}

testLocks().catch(console.error);
