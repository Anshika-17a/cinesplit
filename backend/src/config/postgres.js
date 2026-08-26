const { Client } = require('pg');
require('dotenv').config();

const pgClient = new Client({
  connectionString: process.env.POSTGRES_URI,
});

pgClient.connect()
  .then(() => console.log('Connected to PostgreSQL'))
  .catch(err => console.error('PostgreSQL connection error', err.stack));

module.exports = pgClient;
