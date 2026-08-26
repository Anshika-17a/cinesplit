const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pgClient = require('../config/postgres');

const signup = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Check if user exists
    const existingUser = await pgClient.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Email already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert user
    const result = await pgClient.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name, email, passwordHash]
    );

    const newUser = result.rows[0];

    return res.status(201).json(newUser);
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Internal server error' });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user
    const result = await pgClient.query('SELECT id, name, email, password_hash FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid credentials' });
    }

    // Issue JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Internal server error' });
  }
};

module.exports = {
  signup,
  login
};
