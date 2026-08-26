const { Client } = require('pg');
require('dotenv').config();

const connectionString = process.env.POSTGRES_URI || process.env.DATABASE_URL;
const isRemote = connectionString && !connectionString.includes('localhost') && !connectionString.includes('127.0.0.1');

const pgClient = new Client({
  connectionString,
  ssl: isRemote ? { rejectUnauthorized: false } : false,
});

pgClient.connect()
  .then(() => console.log('Connected to PostgreSQL'))
  .catch(err => console.error('PostgreSQL connection error', err.stack));

module.exports = pgClient;
