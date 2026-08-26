const express = require('express');
const { z } = require('zod');
const { signup, login } = require('../controllers/authController');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

const signupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

router.post('/signup', validate(signupSchema), signup);
router.post('/login', validate(loginSchema), login);

// Dummy protected route
router.get('/protected', authenticate, (req, res) => {
  res.json({ message: 'You have accessed a protected route!', user: req.user });
});

module.exports = router;
